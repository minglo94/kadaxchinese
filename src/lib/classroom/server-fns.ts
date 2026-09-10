/**
 * 班房系統的**全部** server functions —— 刻意集中在同一個模組。
 *
 * ⚠️ 不要把這些拆回多個檔案。TanStack Start 的 server runtime 一旦被兩個以上
 * 的 chunk 共用，rolldown 就會把 SSR entry 拆成 `ssr.mjs` + `ssr2.mjs`，並在
 * 拆分時弄丟 entry 自己的 namespace，生產版伺服器啟動後每個請求都回
 * "Export 'ssr_exports' is not defined in module" —— 而 `vite dev` 完全正常，
 * 所以只有 `npm run preview` 抓得到。整合成單一模組就不會觸發。
 *
 * 內容分區：
 *   1. 身分 profile（角色、教師碼／科主任碼）
 *   2. 班房 CRUD、班房代碼
 *   3. 成員與電郵名單
 *   4. 進度同步（pull / push，含伺服器端驗證）
 *   5. 學習報告（個人、班房、學生）
 *   6. AI 學習建議（授權 → 伺服器算 stats → 指紋快取 → 頻率上限）
 *   7. 全校總覽（科主任唯讀）
 *   8. 登入模式（唯一一個公開的 —— 登入頁在未登入時就要問）
 *
 * 共同規則：除了 `authMode`，每個 server function 都掛 `authMiddleware`，
 * 所有 query 都以驗證過的 `context.userId` 收斂；授權判斷全部委派
 * `guards.server.ts`；時間一律以毫秒整數回傳
 * （`src/lib/db.ts` 不 normalize timestamptz）。
 *
 * 所有 server-only 依賴都用**寫在呼叫點上**的 dynamic import：這個模組會被客戶端
 * import，靜態 `import "@/lib/db"` 會把 `pg` 與 PGLite WASM 拉進瀏覽器 bundle；
 * 而把 module namespace 存進變數（`const guards = () => import(...)`）同樣會觸發
 * 上面那個 SSR 拆分缺陷。
 */
import { createHash } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { articles } from "@/data/articles";
import { GAME_META, type GameId } from "@/data/games";
import {
  AI_TOKENS,
  adviceMessages,
  classAdviceMessages,
  teacherAdviceMessages,
  type AdviceStats,
} from "@/lib/ai-tasks";
import { averageAbility, weakestLabel, type AbilityDimension } from "@/lib/analytics/ability";
import { toArticleProgress } from "@/lib/analytics/progress-shape";
import { authMiddleware } from "@/lib/auth/middleware";
import { ForbiddenError, NotFoundError } from "./errors";
import type {
  ClassroomSummary,
  PendingInvite,
  Profile,
  ProgressPush,
  ProgressSnapshot,
  Role,
  StudentRow,
} from "./types";

/* ------------------------------------------------- server-only shared deps */

type Guards = typeof import("./guards.server");
type Reports = typeof import("./report.server");

const getSql = async () => (await import("@/lib/db")).getSql();

const getProfile: Guards["getProfile"] = async (...a) =>
  (await import("./guards.server")).getProfile(...a);
const requireProfile: Guards["requireProfile"] = async (...a) =>
  (await import("./guards.server")).requireProfile(...a);
const requireAdmin: Guards["requireAdmin"] = async (...a) =>
  (await import("./guards.server")).requireAdmin(...a);
const ensureProfile: Guards["ensureProfile"] = async (...a) =>
  (await import("./guards.server")).ensureProfile(...a);
const loadIdentity: Guards["loadIdentity"] = async (...a) =>
  (await import("./guards.server")).loadIdentity(...a);
/** READ access to a classroom: its teacher, or a 科主任. */
const requireTeacherOfClass: Guards["requireTeacherOfClass"] = async (...a) =>
  (await import("./guards.server")).requireTeacherOfClass(...a);
/** WRITE access: only this classroom's own teacher. 科主任 must not pass here. */
const requireClassOwner: Guards["requireClassOwner"] = async (...a) =>
  (await import("./guards.server")).requireClassOwner(...a);
const requireStudentInClass: Guards["requireStudentInClass"] = async (...a) =>
  (await import("./guards.server")).requireStudentInClass(...a);
const acceptPendingInvites: Guards["acceptPendingInvites"] = async (...a) =>
  (await import("./guards.server")).acceptPendingInvites(...a);
const buildLearnerReport: Reports["buildLearnerReport"] = async (...a) =>
  (await import("./report.server")).buildLearnerReport(...a);
const buildStudentRows: Reports["buildStudentRows"] = async (...a) =>
  (await import("./report.server")).buildStudentRows(...a);
const aiComplete = async (
  ...args: Parameters<typeof import("@/lib/ai-provider.server").aiComplete>
) => (await import("@/lib/ai-provider.server")).aiComplete(...args);

export type LearnerReportPayload = Awaited<ReturnType<Reports["buildLearnerReport"]>>;

/** Classroom ids come from the URL, so they arrive as untrusted strings. */
function cleanClassroomId(raw: unknown): number {
  const id = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();
  return id;
}

/* ==================== 身分、班房、名單、入班 ==================== */

/* ------------------------------------------------------------------ helpers */

/** 6 碼班房代碼；去掉 0/O/1/I/L 等易混字元，方便老師唸給全班抄。 */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomJoinCode(): string {
  let code = "";
  for (let i = 0; i < 6; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

function cleanName(raw: unknown): string {
  const name = typeof raw === "string" ? raw.trim() : "";
  if (name.length < 1 || name.length > 60) {
    throw new Error("班房名稱請填 1 至 60 個字。");
  }
  return name;
}

function cleanSubject(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const subject = raw.trim();
  if (!subject) return null;
  return subject.slice(0, 40);
}

/** Deliberately loose: we only need "could plausibly be a Google address". */
const EMAIL_RE = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;

function normalizeEmails(raw: unknown): { valid: string[]; rejected: string[] } {
  const text = typeof raw === "string" ? raw : Array.isArray(raw) ? raw.join("\n") : "";
  const parts = text
    .split(/[\s,;]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const valid: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (!EMAIL_RE.test(part) || part.length > 200) {
      rejected.push(part);
      continue;
    }
    if (seen.has(part)) continue;
    seen.add(part);
    valid.push(part);
    if (valid.length >= 200) break; // 一次最多 200 個，防止有人貼整校名單
  }
  return { valid, rejected };
}

const SUMMARY_COLUMNS = `
  c.id,
  c.name,
  c.subject,
  c.join_code as "joinCode",
  c.join_open as "joinOpen",
  (extract(epoch from c.created_at) * 1000)::bigint as "createdAtMs",
  p.display_name as "ownerName",
  (select count(*) from classroom_members m2
    where m2.classroom_id = c.id and m2.role = 'student')::int as "studentCount"
`;

/* ----------------------------------------------------------------- profiles */

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ profile: Profile | null }> => {
    return { profile: await getProfile(context.userId) };
  });

export const setMyRole = createServerFn({ method: "POST" })
  .validator((input: { role: Role; teacherCode?: string }) => input)
  .middleware([authMiddleware])
  .handler(
    async ({ context, data }): Promise<{ profile: Profile; joinedClassroomIds: number[] }> => {
      if (data.role !== "teacher" && data.role !== "student" && data.role !== "admin") {
        throw new Error("請選擇身分。");
      }
      if (data.role === "teacher" || data.role === "admin") {
        // Server-side only — the codes never reach the browser bundle.
        const { isValidAdminCode, isValidTeacherCode } = await import("./teacher-code.server");
        const ok =
          data.role === "teacher"
            ? isValidTeacherCode(data.teacherCode)
            : isValidAdminCode(data.teacherCode);
        if (!ok) {
          throw new Error(
            data.role === "teacher"
              ? "教師碼不正確。請向學校負責老師索取。"
              : "科主任碼不正確。請向學校管理層索取。",
          );
        }
      }
      const profile = await ensureProfile(context.userId, data.role);
      // A student whose email is already on a roster should land in the class
      // immediately, without hunting for a code.
      const joinedClassroomIds =
        data.role === "student" ? await acceptPendingInvites(context.userId, profile.email) : [];
      return { profile, joinedClassroomIds };
    },
  );

/* --------------------------------------------------------------- classrooms */

export const myClassrooms = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ClassroomSummary[]> => {
    const sql = await getSql();
    const profile = await getProfile(context.userId);
    // 科主任沒有 membership，但看得到全校每一個班房。
    if (profile?.role === "admin") {
      return sql.query<ClassroomSummary>(
        `select ${SUMMARY_COLUMNS}
         from classrooms c
         left join profiles p on p.user_id = c.owner_user_id
         where c.archived_at is null
         order by c.created_at desc`,
      );
    }
    return sql.query<ClassroomSummary>(
      `select ${SUMMARY_COLUMNS}
       from classrooms c
       join classroom_members m on m.classroom_id = c.id and m.user_id = $1
       left join profiles p on p.user_id = c.owner_user_id
       where c.archived_at is null
       order by c.created_at desc`,
      [context.userId],
    );
  });

export const createClassroom = createServerFn({ method: "POST" })
  .validator((input: { name: string; subject?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<ClassroomSummary> => {
    const profile = await requireProfile(context.userId);
    if (profile.role !== "teacher") throw new ForbiddenError();
    const name = cleanName(data.name);
    const subject = cleanSubject(data.subject);
    const sql = await getSql();

    // Retry on the (unlikely) unique collision rather than trusting one draw.
    let classroomId: number | null = null;
    for (let attempt = 0; attempt < 8 && classroomId === null; attempt += 1) {
      const code = randomJoinCode();
      const rows = await sql<{ id: number }>`
        insert into classrooms (owner_user_id, name, subject, join_code)
        values (${context.userId}, ${name}, ${subject}, ${code})
        on conflict (join_code) do nothing
        returning id
      `;
      classroomId = rows[0]?.id ?? null;
    }
    if (classroomId === null) throw new Error("班房代碼產生失敗，請再試一次。");

    // INVARIANT: the owner is always a role='teacher' member — every
    // authorization check in guards.server.ts relies on this row existing.
    await sql`
      insert into classroom_members (classroom_id, user_id, role)
      values (${classroomId}, ${context.userId}, 'teacher')
      on conflict (classroom_id, user_id) do nothing
    `;

    const created = await sql.query<ClassroomSummary>(
      `select ${SUMMARY_COLUMNS}
       from classrooms c
       left join profiles p on p.user_id = c.owner_user_id
       where c.id = $1`,
      [classroomId],
    );
    return created[0];
  });

export const renameClassroom = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; name: string; subject?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const name = cleanName(data.name);
    const subject = cleanSubject(data.subject);
    const sql = await getSql();
    await sql`
      update classrooms set name = ${name}, subject = ${subject} where id = ${classroomId}
    `;
    return { ok: true };
  });

export const setJoinOpen = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; open: boolean }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ joinOpen: boolean }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const open = data.open === true;
    const sql = await getSql();
    await sql`update classrooms set join_open = ${open} where id = ${classroomId}`;
    return { joinOpen: open };
  });

export const rotateJoinCode = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ joinCode: string }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const sql = await getSql();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const code = randomJoinCode();
      const rows = await sql<{ joinCode: string }>`
        update classrooms set join_code = ${code}
        where id = ${classroomId}
          and not exists (select 1 from classrooms other where other.join_code = ${code})
        returning join_code as "joinCode"
      `;
      if (rows[0]) return rows[0];
    }
    throw new Error("班房代碼產生失敗，請再試一次。");
  });

export const archiveClassroom = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const sql = await getSql();
    await sql`update classrooms set archived_at = now() where id = ${classroomId}`;
    return { ok: true };
  });

/* -------------------------------------------------------------- membership */

export const joinByCode = createServerFn({ method: "POST" })
  .validator((input: { code: string }) => input)
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }): Promise<{ ok: true; classroom: ClassroomSummary } | { ok: false; error: string }> => {
      const profile = await requireProfile(context.userId);
      const code = (data.code ?? "").trim().toUpperCase();
      if (code.length !== 6) return { ok: false, error: "班房代碼是 6 個字元。" };

      const sql = await getSql();
      const found = await sql<{ id: number; joinOpen: boolean }>`
        select id, join_open as "joinOpen" from classrooms
        where join_code = ${code} and archived_at is null
      `;
      const classroom = found[0];
      // One generic message for "no such code" and "closed", so codes can't be
      // enumerated by telling the two apart.
      if (!classroom || !classroom.joinOpen) {
        return { ok: false, error: "找不到這個班房代碼，或該班房已停止收人。" };
      }
      if (profile.role === "teacher") {
        return { ok: false, error: "老師帳戶不需要用代碼入班。" };
      }

      await sql`
        insert into classroom_members (classroom_id, user_id, role)
        values (${classroom.id}, ${context.userId}, 'student')
        on conflict (classroom_id, user_id) do nothing
      `;
      // If the teacher had pre-listed this email, close that invite too.
      if (profile.email) {
        await sql`
          update classroom_invites
          set status = 'joined', accepted_user_id = ${context.userId}, accepted_at = now()
          where classroom_id = ${classroom.id} and email = ${profile.email} and status = 'pending'
        `;
      }

      const summary = await sql.query<ClassroomSummary>(
        `select ${SUMMARY_COLUMNS}
         from classrooms c
         left join profiles p on p.user_id = c.owner_user_id
         where c.id = $1`,
        [classroom.id],
      );
      return { ok: true, classroom: summary[0] };
    },
  );

export const leaveClassroom = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    const sql = await getSql();
    // Only ever removes the caller's own membership, and never the owner's.
    await sql`
      delete from classroom_members
      where classroom_id = ${classroomId} and user_id = ${context.userId} and role = 'student'
    `;
    return { ok: true };
  });

/* ------------------------------------------------------------------ roster */

export const addRosterEmails = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; emails: string | string[] }) => input)
  .middleware([authMiddleware])
  .handler(
    async ({
      context,
      data,
    }): Promise<{ added: number; alreadyJoined: number; rejected: string[] }> => {
      const classroomId = cleanClassroomId(data.classroomId);
      await requireClassOwner(context.userId, classroomId);
      const { valid, rejected } = normalizeEmails(data.emails);
      if (valid.length === 0) return { added: 0, alreadyJoined: 0, rejected };

      const sql = await getSql();
      let added = 0;
      let alreadyJoined = 0;
      for (const email of valid) {
        // Already-signed-in students can be enrolled straight away.
        const existing = await sql<{ userId: string }>`
          select user_id as "userId" from profiles
          where email = ${email} and role = 'student'
        `;
        const studentId = existing[0]?.userId ?? null;
        if (studentId) {
          const inserted = await sql<{ one: number }>`
            insert into classroom_members (classroom_id, user_id, role)
            values (${classroomId}, ${studentId}, 'student')
            on conflict (classroom_id, user_id) do nothing
            returning 1 as one
          `;
          if (inserted[0]) added += 1;
          else alreadyJoined += 1;
          await sql`
            insert into classroom_invites (classroom_id, email, status, invited_by, accepted_user_id, accepted_at)
            values (${classroomId}, ${email}, 'joined', ${context.userId}, ${studentId}, now())
            on conflict (classroom_id, email) do update set
              status = 'joined', accepted_user_id = excluded.accepted_user_id, accepted_at = now()
          `;
          continue;
        }
        // Not signed in yet — park a pending invite that `acceptPendingInvites`
        // will redeem the moment they pick the student role.
        const inserted = await sql<{ one: number }>`
          insert into classroom_invites (classroom_id, email, status, invited_by)
          values (${classroomId}, ${email}, 'pending', ${context.userId})
          on conflict (classroom_id, email) do update set
            status = case when classroom_invites.status = 'revoked' then 'pending'
                          else classroom_invites.status end
          returning 1 as one
        `;
        if (inserted[0]) added += 1;
      }
      return { added, alreadyJoined, rejected };
    },
  );

export const listPendingInvites = createServerFn({ method: "GET" })
  .validator((input: { classroomId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<PendingInvite[]> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireTeacherOfClass(context.userId, classroomId);
    const sql = await getSql();
    return sql<PendingInvite>`
      select email, (extract(epoch from created_at) * 1000)::bigint as "invitedAtMs"
      from classroom_invites
      where classroom_id = ${classroomId} and status = 'pending'
      order by created_at
    `;
  });

export const revokeInvite = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; email: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const email = (data.email ?? "").trim().toLowerCase();
    const sql = await getSql();
    await sql`
      update classroom_invites set status = 'revoked'
      where classroom_id = ${classroomId} and email = ${email}
    `;
    return { ok: true };
  });

export const removeStudent = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; studentUserId: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const classroomId = cleanClassroomId(data.classroomId);
    await requireClassOwner(context.userId, classroomId);
    const studentUserId = (data.studentUserId ?? "").trim();
    if (!studentUserId) throw new NotFoundError();
    const sql = await getSql();
    // Scoped to this class and to students — a teacher cannot delete a peer
    // teacher, and cannot touch another class.
    await sql`
      delete from classroom_members
      where classroom_id = ${classroomId} and user_id = ${studentUserId} and role = 'student'
    `;
    const identity = await loadIdentity(studentUserId);
    const email = identity.email?.trim().toLowerCase() ?? null;
    if (email) {
      await sql`
        update classroom_invites set status = 'revoked'
        where classroom_id = ${classroomId} and email = ${email}
      `;
    }
    return { ok: true };
  });

/* ==================== 進度同步 ==================== */

const ARTICLE_BY_ID = new Map(articles.map((article) => [article.id, article]));
const GAME_IDS = new Set<string>(GAME_META.map((game) => game.id));

const MAX_ARTICLES = 40;
const MAX_ANSWERS = 400;
const MAX_SCORES = 10;
const MAX_EVENTS = 100;

function clampInt(value: unknown, min: number, max: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export const pullMyProgress = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<ProgressSnapshot> => {
    const sql = await getSql();
    const [rows, answers, scores] = await Promise.all([
      sql<{
        articleId: string;
        quizScore: number;
        quizTotal: number;
        dictScore: number;
        dictTotal: number;
      }>`
        select article_id as "articleId",
               quiz_score as "quizScore", quiz_total as "quizTotal",
               dict_score as "dictScore", dict_total as "dictTotal"
        from article_progress where user_id = ${context.userId}
      `,
      sql<{
        articleId: string;
        questionIndex: number;
        correct: boolean;
        firstTryOk: boolean;
      }>`
        select article_id as "articleId", question_index as "questionIndex",
               correct, first_try_ok as "firstTryOk"
        from quiz_answers where user_id = ${context.userId}
      `,
      sql<{ gameId: GameId; highScore: number }>`
        select game_id as "gameId", high_score as "highScore"
        from game_scores where user_id = ${context.userId}
      `,
    ]);

    return {
      articles: rows.map(({ articleId, ...base }) => ({
        articleId,
        ...toArticleProgress(base),
      })),
      answers,
      scores,
    };
  });

export const pushMyProgress = createServerFn({ method: "POST" })
  .validator((input: ProgressPush) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const sql = await getSql();
    const userId = context.userId;

    for (const row of (data.articles ?? []).slice(0, MAX_ARTICLES)) {
      const article = ARTICLE_BY_ID.get(row.articleId);
      if (!article) continue; // 不存在的範文一律丟棄
      const quizTotal = clampInt(row.quizTotal, 0, article.q.length);
      const dictTotal = clampInt(row.dictTotal, 0, article.dictation.length);
      const quizScore = clampInt(row.quizScore, 0, quizTotal);
      const dictScore = clampInt(row.dictScore, 0, dictTotal);
      if (quizTotal === 0 && dictTotal === 0) continue;
      await sql`
        insert into article_progress
          (user_id, article_id, quiz_score, quiz_total, dict_score, dict_total)
        values (${userId}, ${row.articleId}, ${quizScore}, ${quizTotal}, ${dictScore}, ${dictTotal})
        on conflict (user_id, article_id) do update set
          quiz_total = greatest(article_progress.quiz_total, excluded.quiz_total),
          dict_total = greatest(article_progress.dict_total, excluded.dict_total),
          quiz_score = least(
            greatest(article_progress.quiz_score, excluded.quiz_score),
            greatest(article_progress.quiz_total, excluded.quiz_total)
          ),
          dict_score = least(
            greatest(article_progress.dict_score, excluded.dict_score),
            greatest(article_progress.dict_total, excluded.dict_total)
          ),
          updated_at = now()
      `;
    }

    for (const row of (data.answers ?? []).slice(0, MAX_ANSWERS)) {
      const article = ARTICLE_BY_ID.get(row.articleId);
      if (!article) continue;
      const index = clampInt(row.questionIndex, 0, 99);
      if (index >= article.q.length) continue;
      const correct = row.correct === true;
      const firstTryOk = row.firstTryOk === true;
      await sql`
        insert into quiz_answers
          (user_id, article_id, question_index, correct, first_try_ok, attempts)
        values (${userId}, ${row.articleId}, ${index}, ${correct}, ${firstTryOk}, 1)
        on conflict (user_id, article_id, question_index) do update set
          correct = quiz_answers.correct or excluded.correct,
          -- first_try_ok is insert-only: a later attempt must never be able to
          -- turn a wrong first answer into a right one.
          attempts = quiz_answers.attempts + 1,
          updated_at = now()
      `;
    }

    for (const row of (data.scores ?? []).slice(0, MAX_SCORES)) {
      if (!GAME_IDS.has(row.gameId)) continue;
      const highScore = clampInt(row.highScore, 0, 10_000_000);
      await sql`
        insert into game_scores (user_id, game_id, high_score, plays)
        values (${userId}, ${row.gameId}, ${highScore}, 1)
        on conflict (user_id, game_id) do update set
          high_score = greatest(game_scores.high_score, excluded.high_score),
          plays = game_scores.plays + 1,
          updated_at = now()
      `;
    }

    for (const event of (data.events ?? []).slice(0, MAX_EVENTS)) {
      if (event.kind !== "quiz" && event.kind !== "dictation" && event.kind !== "game") continue;
      const articleId =
        event.articleId && ARTICLE_BY_ID.has(event.articleId) ? event.articleId : null;
      const gameId = event.gameId && GAME_IDS.has(event.gameId) ? event.gameId : null;
      const score = event.score == null ? null : clampInt(event.score, 0, 10_000_000);
      const total = event.total == null ? null : clampInt(event.total, 0, 10_000_000);
      const durationMs = event.durationMs == null ? null : clampInt(event.durationMs, 0, 600_000);
      await sql`
        insert into practice_events
          (user_id, kind, article_id, game_id, score, total, duration_ms)
        values (${userId}, ${event.kind}, ${articleId}, ${gameId}, ${score}, ${total}, ${durationMs})
      `;
    }

    return { ok: true };
  });

/* ==================== 學習報告 ==================== */

/**
 * Server-only dependencies are pulled in DYNAMICALLY, inside each wrapper.
 *
 * The import MUST be written inline at the call site. Holding the module
 * namespace in a variable (`const guards = () => import("./guards.server")`)
 * makes the production SSR bundle emit a namespace object it never defines —
 * the built server then dies with "Export 'ssr_exports' is not defined in
 * module" while `vite dev` looks perfectly fine.
 */

/** 自己的報告。學生與老師都可以看自己的。 */
export const myReport = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<LearnerReportPayload> => {
    const profile = await requireProfile(context.userId);
    return buildLearnerReport(context.userId, {
      displayName: profile.displayName,
      email: profile.email,
    });
  });

export type ClassroomDetail = {
  classroom: ClassroomSummary;
  students: StudentRow[];
  pendingInvites: PendingInvite[];
  classAbility: AbilityDimension[];
  weakArticles: Array<{ id: string; title: string; percent: number }>;
};

export const classroomDetail = createServerFn({ method: "GET" })
  .validator((input: { classroomId: number }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<ClassroomDetail> => {
    const classroomId = cleanClassroomId(data.classroomId);
    const { classroom } = await requireTeacherOfClass(context.userId, classroomId);

    const [students, extras] = await Promise.all([
      buildStudentRows(classroomId),
      (async () => {
        const [{ getSql }, r] = await Promise.all([import("@/lib/db"), import("./report.server")]);
        const sql = await getSql();
        const invites = await sql<PendingInvite>`
          select email, (extract(epoch from created_at) * 1000)::bigint as "invitedAtMs"
          from classroom_invites
          where classroom_id = ${classroomId} and status = 'pending'
          order by created_at
        `;
        const owner = await sql<{ ownerName: string | null }>`
          select coalesce(p.display_name, u."name") as "ownerName"
          from classrooms c
          left join profiles p on p.user_id = c.owner_user_id
          left join "user" u on u."id" = c.owner_user_id
          where c.id = ${classroomId}
        `;
        return {
          invites,
          ownerName: owner[0]?.ownerName ?? null,
          buildLearnerReport: r.buildLearnerReport,
        };
      })(),
    ]);

    // 全班平均能力：逐個學生算一次，再把有把握的維度平均起來。
    const perStudent = await Promise.all(
      students.map((student) =>
        extras.buildLearnerReport(student.userId, {
          displayName: student.displayName,
          email: student.email,
        }),
      ),
    );
    const classAbility = averageAbility(perStudent.map((report) => report.ability));

    // 全班最弱的範文：把每個學生的逐篇百分比平均。
    const totals = new Map<string, { title: string; sum: number; count: number }>();
    for (const report of perStudent) {
      for (const row of report.articles) {
        if (!row.progress || row.progress.total === 0) continue;
        const entry = totals.get(row.id) ?? { title: row.title, sum: 0, count: 0 };
        entry.sum += row.progress.percent;
        entry.count += 1;
        totals.set(row.id, entry);
      }
    }
    const weakArticles = [...totals.entries()]
      .map(([id, entry]) => ({
        id,
        title: entry.title,
        percent: Math.round(entry.sum / entry.count),
      }))
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 5);

    return {
      classroom: {
        id: classroom.id,
        name: classroom.name,
        subject: classroom.subject,
        joinCode: classroom.joinCode,
        joinOpen: classroom.joinOpen,
        ownerName: extras.ownerName,
        createdAtMs: classroom.createdAtMs,
        studentCount: students.length,
      },
      students,
      pendingInvites: extras.invites,
      classAbility,
      weakArticles,
    };
  });

export const studentDetail = createServerFn({ method: "GET" })
  .validator((input: { classroomId: number; studentUserId: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<LearnerReportPayload> => {
    const classroomId = cleanClassroomId(data.classroomId);
    const studentUserId = (data.studentUserId ?? "").trim();
    if (!studentUserId) throw new NotFoundError();
    // Two checks, in this order. The first proves the caller teaches THIS
    // class; the second proves the student belongs to it.
    await requireTeacherOfClass(context.userId, classroomId);
    await requireStudentInClass(classroomId, studentUserId);

    const identity = await loadIdentity(studentUserId);
    return buildLearnerReport(studentUserId, {
      displayName: identity.name,
      email: identity.email?.toLowerCase() ?? null,
    });
  });

/* ==================== AI 學習建議 ==================== */

/**
 * Server-only dependencies are pulled in DYNAMICALLY, inside each wrapper.
 *
 * The import MUST be written inline at the call site. Holding the module
 * namespace in a variable (`const guards = () => import("./guards.server")`)
 * makes the production SSR bundle emit a namespace object it never defines —
 * the built server then dies with "Export 'ssr_exports' is not defined in
 * module" while `vite dev` looks perfectly fine.
 */

export type AdviceResult =
  | { ok: true; advice: string; cached: boolean; generatedAtMs: number }
  | { ok: false; error: string; needsKey?: boolean };

/** 每位呼叫者每小時最多產生這麼多份建議。 */
const HOURLY_CAP = 10;
/** 指紋相同且未過期就直接回快取。 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** 取整到 5 再做指紋：分數動一兩個百分點不值得重新收費。 */
function fingerprint(stats: unknown): string {
  const rounded = JSON.stringify(stats, (_key, value) =>
    typeof value === "number" ? Math.round(value / 5) * 5 : value,
  );
  return createHash("sha256").update(rounded).digest("hex").slice(0, 32);
}

async function overCap(callerId: string): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql<{ n: number }>`
    select count(*)::int as n from ai_advice
    where generated_by = ${callerId} and created_at > now() - interval '1 hour'
  `.catch(() => [{ n: 0 }]);
  return (rows[0]?.n ?? 0) >= HOURLY_CAP;
}

async function readCache(
  scopeKey: string,
  audience: "student" | "teacher",
  fp: string,
): Promise<{ advice: string; generatedAtMs: number } | null> {
  const sql = await getSql();
  const rows = await sql<{ advice: string; generatedAtMs: number }>`
    select advice, (extract(epoch from created_at) * 1000)::bigint as "generatedAtMs"
    from ai_advice
    where scope_key = ${scopeKey} and audience = ${audience} and stats_fingerprint = ${fp}
    order by created_at desc limit 1
  `;
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - row.generatedAtMs > CACHE_TTL_MS) return null;
  return row;
}

async function writeCache(params: {
  scopeKey: string;
  audience: "student" | "teacher";
  fp: string;
  advice: string;
  subjectUserId: string | null;
  classroomId: number | null;
  generatedBy: string;
}): Promise<number> {
  const sql = await getSql();
  const rows = await sql<{ generatedAtMs: number }>`
    insert into ai_advice
      (scope_key, subject_user_id, classroom_id, audience, stats_fingerprint, advice, generated_by)
    values (${params.scopeKey}, ${params.subjectUserId}, ${params.classroomId},
            ${params.audience}, ${params.fp}, ${params.advice}, ${params.generatedBy})
    on conflict (scope_key, audience, stats_fingerprint) do update set
      advice = excluded.advice, created_at = now(), generated_by = excluded.generated_by
    returning (extract(epoch from created_at) * 1000)::bigint as "generatedAtMs"
  `;
  return rows[0]?.generatedAtMs ?? Date.now();
}

function statsFrom(
  report: Awaited<ReturnType<Reports["buildLearnerReport"]>>,
  audience: "student" | "teacher",
): AdviceStats {
  return {
    audience,
    learnerName: report.displayName,
    completion: {
      startedArticles: report.ability.completion.startedArticles,
      totalArticles: report.ability.completion.totalArticles,
      percent: report.ability.completion.percent,
    },
    overallPercent: report.ability.overallPercent,
    dimensions: report.ability.dimensions.map((d) => ({
      label: d.label,
      value: d.value,
      sample: d.sample,
      confident: d.confident,
    })),
    weakArticles: report.ability.weakArticles.map((a) => ({ title: a.title, percent: a.percent })),
    strongArticles: report.ability.strongArticles.map((a) => ({
      title: a.title,
      percent: a.percent,
    })),
  };
}

export const studentAdvice = createServerFn({ method: "POST" })
  .validator(
    (input: {
      classroomId?: number;
      studentUserId?: string;
      refresh?: boolean;
      geminiKey?: string;
    }) => input,
  )
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AdviceResult> => {
    const subject = (data.studentUserId ?? "").trim() || context.userId;
    let audience: "student" | "teacher" = "student";
    let identity: { displayName: string | null; email: string | null };

    if (subject === context.userId) {
      const profile = await requireProfile(context.userId);
      identity = { displayName: profile.displayName, email: profile.email };
    } else {
      const classroomId =
        typeof data.classroomId === "number" ? data.classroomId : Number(data.classroomId);
      if (!Number.isInteger(classroomId) || classroomId <= 0) throw new NotFoundError();
      await requireTeacherOfClass(context.userId, classroomId);
      await requireStudentInClass(classroomId, subject);
      audience = "teacher";
      const raw = await loadIdentity(subject);
      identity = { displayName: raw.name, email: raw.email?.toLowerCase() ?? null };
    }

    // Stats are computed here, from the database — never taken from the request.
    const report = await buildLearnerReport(subject, identity);
    if (report.ability.completion.attempted === 0) {
      return { ok: false, error: "還沒有練習紀錄，先做一份測驗或默書再產生建議。" };
    }

    const stats = statsFrom(report, audience);
    const scopeKey = `student:${subject}`;
    const fp = fingerprint(stats);

    if (data.refresh !== true) {
      const cached = await readCache(scopeKey, audience, fp);
      if (cached) {
        return {
          ok: true,
          advice: cached.advice,
          cached: true,
          generatedAtMs: cached.generatedAtMs,
        };
      }
    }
    if (await overCap(context.userId)) {
      return { ok: false, error: `每小時最多產生 ${HOURLY_CAP} 份建議，請稍後再試。` };
    }

    const messages = audience === "teacher" ? teacherAdviceMessages(stats) : adviceMessages(stats);
    const result = await aiComplete(messages, AI_TOKENS.advice, data.geminiKey);
    if (!result.ok) return result;

    const generatedAtMs = await writeCache({
      scopeKey,
      audience,
      fp,
      advice: result.text,
      subjectUserId: subject,
      classroomId: audience === "teacher" ? Number(data.classroomId) : null,
      generatedBy: context.userId,
    });
    return { ok: true, advice: result.text, cached: false, generatedAtMs };
  });

export const classAdvice = createServerFn({ method: "POST" })
  .validator((input: { classroomId: number; refresh?: boolean; geminiKey?: string }) => input)
  .middleware([authMiddleware])
  .handler(async ({ context, data }): Promise<AdviceResult> => {
    const classroomId =
      typeof data.classroomId === "number" ? data.classroomId : Number(data.classroomId);
    if (!Number.isInteger(classroomId) || classroomId <= 0) throw new NotFoundError();
    const { classroom } = await requireTeacherOfClass(context.userId, classroomId);

    const students = await buildStudentRows(classroomId);
    if (students.length === 0) {
      return { ok: false, error: "這個班房還沒有學生。" };
    }
    const perStudent = await Promise.all(
      students.map((student) =>
        buildLearnerReport(student.userId, {
          displayName: student.displayName,
          email: student.email,
        }),
      ),
    );
    if (perStudent.every((report) => report.ability.completion.attempted === 0)) {
      return { ok: false, error: "全班還沒有練習紀錄，等學生做過測驗再產生建議。" };
    }

    const dimensions = averageAbility(perStudent.map((report) => report.ability)).map((d) => ({
      label: d.label,
      value: d.value,
      sample: d.sample,
      confident: d.confident,
    }));

    const totals = new Map<string, { title: string; sum: number; count: number }>();
    for (const report of perStudent) {
      for (const row of report.articles) {
        if (!row.progress || row.progress.total === 0) continue;
        const entry = totals.get(row.id) ?? { title: row.title, sum: 0, count: 0 };
        entry.sum += row.progress.percent;
        entry.count += 1;
        totals.set(row.id, entry);
      }
    }
    const weakArticles = [...totals.values()]
      .map((entry) => ({ title: entry.title, percent: Math.round(entry.sum / entry.count) }))
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 4);

    const strugglingStudents = students
      .filter((student) => student.startedArticles > 0 && student.overallPercent < 60)
      .sort((a, b) => a.overallPercent - b.overallPercent)
      .slice(0, 4)
      .map((student) => ({
        name: student.displayName ?? student.email ?? "（未命名）",
        percent: student.overallPercent,
      }));

    const payload = {
      className: classroom.name,
      studentCount: students.length,
      dimensions,
      weakArticles,
      strugglingStudents,
    };
    const scopeKey = `class:${classroomId}`;
    const fp = fingerprint(payload);

    if (data.refresh !== true) {
      const cached = await readCache(scopeKey, "teacher", fp);
      if (cached) {
        return {
          ok: true,
          advice: cached.advice,
          cached: true,
          generatedAtMs: cached.generatedAtMs,
        };
      }
    }
    if (await overCap(context.userId)) {
      return { ok: false, error: `每小時最多產生 ${HOURLY_CAP} 份建議，請稍後再試。` };
    }

    const result = await aiComplete(classAdviceMessages(payload), AI_TOKENS.advice, data.geminiKey);
    if (!result.ok) return result;

    const generatedAtMs = await writeCache({
      scopeKey,
      audience: "teacher",
      fp,
      advice: result.text,
      subjectUserId: null,
      classroomId,
      generatedBy: context.userId,
    });
    return { ok: true, advice: result.text, cached: false, generatedAtMs };
  });

/* ==================== 全校總覽（科主任） ==================== */

/**
 * Server-only dependencies are pulled in DYNAMICALLY, inside each wrapper.
 *
 * The import MUST be written inline at the call site. Holding the module
 * namespace in a variable (`const guards = () => import("./guards.server")`)
 * makes the production SSR bundle emit a namespace object it never defines —
 * the built server then dies with "Export 'ssr_exports' is not defined in
 * module" while `vite dev` looks perfectly fine.
 */

export type SchoolClassRow = {
  id: number;
  name: string;
  subject: string | null;
  teacherName: string | null;
  teacherEmail: string | null;
  studentCount: number;
  activeCount: number;
  /** 全班平均答對率，無資料時 null */
  avgPercent: number | null;
  createdAtMs: number;
};

export type SchoolOverview = {
  totals: {
    classrooms: number;
    teachers: number;
    students: number;
    /** 有練習紀錄的學生數 */
    activeStudents: number;
    /** 全校平均答對率，無資料時 null */
    avgPercent: number | null;
  };
  classes: SchoolClassRow[];
  ability: AbilityDimension[];
  weakArticles: Array<{ id: string; title: string; percent: number; sampleStudents: number }>;
  /** 最需要跟進的學生（有紀錄但答對率最低），跨班。 */
  attention: Array<StudentRow & { classroomId: number; className: string }>;
};

export const schoolOverview = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SchoolOverview> => {
    await requireAdmin(context.userId);
    const sql = await getSql();

    const [classes, counts, members] = await Promise.all([
      sql<{
        id: number;
        name: string;
        subject: string | null;
        teacherName: string | null;
        teacherEmail: string | null;
        createdAtMs: number;
      }>`
        select c.id, c.name, c.subject,
               coalesce(p.display_name, u."name") as "teacherName",
               coalesce(p.email, lower(u."email")) as "teacherEmail",
               (extract(epoch from c.created_at) * 1000)::bigint as "createdAtMs"
        from classrooms c
        left join profiles p on p.user_id = c.owner_user_id
        left join "user" u on u."id" = c.owner_user_id
        where c.archived_at is null
        order by c.created_at
      `,
      sql<{ teachers: number; students: number }>`
        select
          (select count(*) from profiles where role = 'teacher')::int as teachers,
          (select count(*) from profiles where role = 'student')::int as students
      `,
      sql<{
        classroomId: number;
        className: string;
        userId: string;
        displayName: string | null;
        email: string | null;
        joinedAtMs: number;
      }>`
        select m.classroom_id as "classroomId",
               c.name as "className",
               m.user_id as "userId",
               coalesce(p.display_name, u."name") as "displayName",
               coalesce(p.email, lower(u."email")) as "email",
               (extract(epoch from m.joined_at) * 1000)::bigint as "joinedAtMs"
        from classroom_members m
        join classrooms c on c.id = m.classroom_id and c.archived_at is null
        left join profiles p on p.user_id = m.user_id
        left join "user" u on u."id" = m.user_id
        where m.role = 'student'
        order by c.name, m.joined_at
      `,
    ]);

    // 一個學生可以在多個班房，報告只算一次。
    const reportCache = new Map<string, Awaited<ReturnType<Reports["buildLearnerReport"]>>>();
    for (const member of members) {
      if (reportCache.has(member.userId)) continue;
      reportCache.set(
        member.userId,
        await buildLearnerReport(member.userId, {
          displayName: member.displayName,
          email: member.email,
        }),
      );
    }
    const allReports = [...reportCache.values()];
    const withData = allReports.filter((r) => r.ability.completion.attempted > 0);

    const classRows: SchoolClassRow[] = classes.map((classroom) => {
      const roster = members.filter((m) => m.classroomId === classroom.id);
      const reports = roster
        .map((m) => reportCache.get(m.userId))
        .filter((r): r is NonNullable<typeof r> => r != null);
      const active = reports.filter((r) => r.ability.completion.attempted > 0);
      return {
        ...classroom,
        studentCount: roster.length,
        activeCount: active.length,
        avgPercent:
          active.length > 0
            ? Math.round(
                active.reduce((sum, r) => sum + r.ability.overallPercent, 0) / active.length,
              )
            : null,
      };
    });

    // 全校最弱的範文：每個有紀錄的學生逐篇平均。
    const totals = new Map<string, { title: string; sum: number; count: number }>();
    for (const report of withData) {
      for (const row of report.articles) {
        if (!row.progress || row.progress.total === 0) continue;
        const entry = totals.get(row.id) ?? { title: row.title, sum: 0, count: 0 };
        entry.sum += row.progress.percent;
        entry.count += 1;
        totals.set(row.id, entry);
      }
    }
    const weakArticles = [...totals.entries()]
      .map(([id, entry]) => ({
        id,
        title: entry.title,
        percent: Math.round(entry.sum / entry.count),
        sampleStudents: entry.count,
      }))
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 6);

    const attention = members
      .map((member) => {
        const report = reportCache.get(member.userId);
        if (!report || report.ability.completion.attempted === 0) return null;
        return {
          classroomId: member.classroomId,
          className: member.className,
          userId: member.userId,
          displayName: member.displayName,
          email: member.email,
          joinedAtMs: member.joinedAtMs,
          startedArticles: report.ability.completion.startedArticles,
          overallPercent: report.ability.overallPercent,
          weakestLabel: weakestLabel(report.ability.dimensions),
          lastActiveAtMs: report.lastActiveAtMs,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row != null)
      .sort((a, b) => a.overallPercent - b.overallPercent)
      .slice(0, 10);

    return {
      totals: {
        classrooms: classes.length,
        teachers: counts[0]?.teachers ?? 0,
        students: counts[0]?.students ?? 0,
        activeStudents: withData.length,
        avgPercent:
          withData.length > 0
            ? Math.round(
                withData.reduce((sum, r) => sum + r.ability.overallPercent, 0) / withData.length,
              )
            : null,
      },
      classes: classRows,
      ability: averageAbility(withData.map((r) => r.ability)),
      weakArticles,
      attention,
    };
  });

/* ==================== 登入模式 ==================== */

/**
 * 這個 app 的 Google 登入走哪一條路。
 *
 * `"native-google"` = 用營運者自己的 Google OAuth client 直連 Google
 * （設了 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`，Zeabur 等自架環境）。
 * `"broker"` = 聯邦到 Grok 的 auth broker（Grok 平台上的預設）。
 *
 * **刻意不掛 `authMiddleware`** —— 登入頁在還沒有 session 的時候就要問這件事。
 * 回傳的只有「哪一種登入流程」，沒有任何機密：client id / secret 都留在伺服器。
 *
 * 為甚麼放在這個檔案：見檔頭。第三個 server-fn 模組會再次觸發那個 SSR 拆分缺陷，
 * 所以新的 server function 一律加在這裡。
 */
export const authMode = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ mode: "native-google" | "broker" }> => {
    const { nativeGoogleConfigured } = await import("@/lib/auth/server");
    return { mode: nativeGoogleConfigured ? "native-google" : "broker" };
  },
);
