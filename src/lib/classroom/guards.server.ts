/**
 * 班房授權 — server-only。這個檔案就是安全邊界。
 *
 * 兩層模型，實作時不要混淆：
 *
 *   profiles.role         → 只是「偏好／落地頁」。學生把自己改成 teacher，
 *                           只換到「可以開自己的班房」，讀不到任何別人的資料。
 *   classroom_members     → 才是權限。「我可否管理 X 班／可否讀學生 S」
 *                           一律看這張表 role='teacher' 的那一行。
 *
 * 老師端每次讀學生都要兩重檢查：
 *   requireTeacherOfClass(userId, classroomId)  然後
 *   requireStudentInClass(classroomId, studentUserId)
 * 少了第二步，A 班老師就能傳入 B 班學生的 id 偷讀。
 *
 * 姓名與電郵一律從 Better Auth 自己的 "user" 表讀（同一個資料庫），
 * 永不接受客戶端傳來的 email。
 */
import { getSql } from "@/lib/db";
import { ForbiddenError, ProfileRequiredError } from "./errors";
import type { Profile, Role } from "./types";

export type ClassroomRow = {
  id: number;
  ownerUserId: string;
  name: string;
  subject: string | null;
  joinCode: string;
  joinOpen: boolean;
  createdAtMs: number;
};

const CLASSROOM_COLUMNS = `
  c.id,
  c.owner_user_id as "ownerUserId",
  c.name,
  c.subject,
  c.join_code as "joinCode",
  c.join_open as "joinOpen",
  (extract(epoch from c.created_at) * 1000)::bigint as "createdAtMs"
`;

/** Verified identity straight from Better Auth's own table. */
export async function loadIdentity(
  userId: string,
): Promise<{ email: string | null; name: string | null }> {
  const sql = await getSql();
  const rows = await sql<{ email: string | null; name: string | null }>`
    select "email", "name" from "user" where "id" = ${userId}
  `;
  // No row for the auth-disabled dev user — that path has no identity to copy.
  return rows[0] ?? { email: null, name: null };
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const sql = await getSql();
  const rows = await sql<Profile>`
    select user_id as "userId", role, display_name as "displayName", email
    from profiles where user_id = ${userId}
  `;
  return rows[0] ?? null;
}

/**
 * 科主任（全校唯讀）。這是唯一不經 `classroom_members` 的讀取權，所以每一處
 * 放行 admin 的地方都必須是「讀」，不可以是「寫」。
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const profile = await getProfile(userId);
  return profile?.role === "admin";
}

export async function requireAdmin(userId: string): Promise<Profile> {
  const profile = await requireProfile(userId);
  if (profile.role !== "admin") throw new ForbiddenError();
  return profile;
}

export async function requireProfile(userId: string): Promise<Profile> {
  const profile = await getProfile(userId);
  if (!profile) throw new ProfileRequiredError();
  return profile;
}

/**
 * Create or update the caller's OWN profile row, copying the verified name and
 * email out of Better Auth. Never takes an identity from the request body.
 */
export async function ensureProfile(userId: string, role: Role): Promise<Profile> {
  const sql = await getSql();
  const identity = await loadIdentity(userId);
  const email = identity.email?.trim().toLowerCase() || null;
  const rows = await sql<Profile>`
    insert into profiles (user_id, role, display_name, email)
    values (${userId}, ${role}, ${identity.name}, ${email})
    on conflict (user_id) do update set
      role = excluded.role,
      display_name = coalesce(excluded.display_name, profiles.display_name),
      email = coalesce(excluded.email, profiles.email),
      updated_at = now()
    returning user_id as "userId", role, display_name as "displayName", email
  `;
  return rows[0];
}

/** Any member (teacher or student) of a live classroom. */
export async function requireMemberOfClass(
  userId: string,
  classroomId: number,
): Promise<{ classroom: ClassroomRow; role: Role }> {
  const sql = await getSql();
  const found = await sql.query<ClassroomRow & { memberRole: Role }>(
    `select ${CLASSROOM_COLUMNS}, m.role as "memberRole"
     from classrooms c
     join classroom_members m on m.classroom_id = c.id and m.user_id = $1
     where c.id = $2 and c.archived_at is null`,
    [userId, classroomId],
  );
  const row = found[0];
  if (row) {
    const { memberRole, ...classroom } = row;
    return { classroom, role: memberRole };
  }
  // 科主任不是任何班房的成員，但讀得到全校。
  if (await isAdmin(userId)) {
    const asAdmin = await sql.query<ClassroomRow>(
      `select ${CLASSROOM_COLUMNS} from classrooms c where c.id = $1 and c.archived_at is null`,
      [classroomId],
    );
    if (asAdmin[0]) return { classroom: asAdmin[0], role: "teacher" };
  }
  throw new ForbiddenError();
}

async function classroomIfTeacher(
  userId: string,
  classroomId: number,
): Promise<ClassroomRow | null> {
  const sql = await getSql();
  const rows = await sql.query<ClassroomRow>(
    `select ${CLASSROOM_COLUMNS}
     from classrooms c
     join classroom_members m
       on m.classroom_id = c.id and m.user_id = $1 and m.role = 'teacher'
     where c.id = $2 and c.archived_at is null`,
    [userId, classroomId],
  );
  return rows[0] ?? null;
}

/**
 * READ access to a classroom: the caller teaches it, or is a 科主任.
 *
 * Creation always inserts the owner as a `role='teacher'` member, so
 * membership alone settles the teacher case — keep that invariant whenever a
 * classroom is created.
 *
 * Use this for reads only. Anything that MUTATES a classroom must call
 * `requireClassOwner` instead, so a read-only 科主任 cannot rename a class,
 * rotate its code, or remove someone else's students.
 */
export async function requireTeacherOfClass(
  userId: string,
  classroomId: number,
): Promise<{ classroom: ClassroomRow; viaAdmin: boolean }> {
  const own = await classroomIfTeacher(userId, classroomId);
  if (own) return { classroom: own, viaAdmin: false };
  if (await isAdmin(userId)) {
    const sql = await getSql();
    const rows = await sql.query<ClassroomRow>(
      `select ${CLASSROOM_COLUMNS} from classrooms c where c.id = $1 and c.archived_at is null`,
      [classroomId],
    );
    if (rows[0]) return { classroom: rows[0], viaAdmin: true };
  }
  throw new ForbiddenError();
}

/** WRITE access: only a teacher of this very classroom. 科主任 is read-only. */
export async function requireClassOwner(
  userId: string,
  classroomId: number,
): Promise<{ classroom: ClassroomRow }> {
  const own = await classroomIfTeacher(userId, classroomId);
  if (!own) throw new ForbiddenError();
  return { classroom: own };
}

/** The second half of every teacher-reads-student check. */
export async function requireStudentInClass(
  classroomId: number,
  studentUserId: string,
): Promise<void> {
  const sql = await getSql();
  const rows = await sql<{ one: number }>`
    select 1 as one from classroom_members
    where classroom_id = ${classroomId} and user_id = ${studentUserId} and role = 'student'
  `;
  if (!rows[0]) throw new ForbiddenError();
}

/**
 * Attach every pending email invite that matches the caller's verified address.
 * Returns the classroom ids joined, so the UI can say which classes appeared.
 */
export async function acceptPendingInvites(
  userId: string,
  email: string | null,
): Promise<number[]> {
  if (!email) return [];
  const sql = await getSql();
  const invites = await sql<{ classroomId: number }>`
    select classroom_id as "classroomId" from classroom_invites
    where email = ${email} and status = 'pending'
  `;
  const joined: number[] = [];
  for (const { classroomId } of invites) {
    // A revoked classroom (archived) should not silently pull the student in.
    const live = await sql<{ one: number }>`
      select 1 as one from classrooms where id = ${classroomId} and archived_at is null
    `;
    if (!live[0]) continue;
    await sql`
      insert into classroom_members (classroom_id, user_id, role)
      values (${classroomId}, ${userId}, 'student')
      on conflict (classroom_id, user_id) do nothing
    `;
    await sql`
      update classroom_invites
      set status = 'joined', accepted_user_id = ${userId}, accepted_at = now()
      where classroom_id = ${classroomId} and email = ${email}
    `;
    joined.push(classroomId);
  }
  return joined;
}
