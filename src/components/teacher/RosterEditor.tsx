import { Loader2, Mail, UserMinus, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { addRosterEmails, removeStudent, revokeInvite } from "@/lib/classroom/server-fns";
import type { PendingInvite, StudentRow } from "@/lib/classroom/types";

/** 老師端：貼上電郵名單、移除學生、撤回未接受的邀請。 */
export function RosterEditor({
  classroomId,
  students,
  pendingInvites,
  onChanged,
}: {
  classroomId: number;
  students: StudentRow[];
  pendingInvites: PendingInvite[];
  onChanged: () => void;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [rejected, setRejected] = useState<string[]>([]);

  const add = async () => {
    setBusy(true);
    setMessage(null);
    setRejected([]);
    try {
      const result = await addRosterEmails({ data: { classroomId, emails: text } });
      setText("");
      setRejected(result.rejected);
      setMessage(
        `已加入 ${result.added} 個電郵` +
          (result.alreadyJoined > 0 ? `，${result.alreadyJoined} 個已在名單中` : "") +
          "。未登入的學生一旦用該電郵登入，就會自動入班。",
      );
      onChanged();
    } catch {
      setMessage("加入名單時出錯，請稍後再試。");
    } finally {
      setBusy(false);
    }
  };

  const drop = async (student: StudentRow) => {
    const label = student.displayName ?? student.email ?? "這位學生";
    if (!window.confirm(`確定把 ${label} 移出班房？其進度紀錄會保留，但你不會再看到。`)) return;
    setBusy(true);
    try {
      await removeStudent({ data: { classroomId, studentUserId: student.userId } });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (email: string) => {
    setBusy(true);
    try {
      await revokeInvite({ data: { classroomId, email } });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
        <Mail className="size-4" />
        學生名單
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        一行一個電郵（也接受逗號分隔），一次最多 200 個。
        加入名單即表示你會看到該學生的姓名、電郵與練習成績。
      </p>

      <label className="sr-only" htmlFor="roster-emails">
        學生電郵
      </label>
      <textarea
        id="roster-emails"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        spellCheck={false}
        placeholder={"student1@gmail.com\nstudent2@gmail.com"}
        className="mt-3 w-full rounded-md border border-line bg-paper p-3 font-mono text-sm text-ink outline-none focus:border-accent"
      />
      <Button className="mt-2" disabled={busy || text.trim() === ""} onClick={() => void add()}>
        {busy && <Loader2 className="size-4 animate-spin" />}
        加入名單
      </Button>

      {message && (
        <p role="status" className="mt-3 text-sm text-ink-soft">
          {message}
        </p>
      )}
      {rejected.length > 0 && (
        <p className="mt-2 text-sm text-seal">
          以下不像電郵地址，已略過：{rejected.slice(0, 5).join("、")}
          {rejected.length > 5 && ` 等 ${rejected.length} 個`}
        </p>
      )}

      {pendingInvites.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ink">等待登入（{pendingInvites.length}）</h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pendingInvites.map((invite) => (
              <li
                key={invite.email}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-deep px-3 py-1 text-xs text-ink-soft"
              >
                {invite.email}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void revoke(invite.email)}
                  aria-label={`撤回 ${invite.email} 的邀請`}
                  className="text-muted hover:text-seal"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {students.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-ink">已入班（{students.length}）</h3>
          <ul className="mt-2 space-y-1.5">
            {students.map((student) => (
              <li
                key={student.userId}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-deep/50 px-3 py-2 text-sm"
              >
                <span className="min-w-0 truncate">
                  <strong className="text-ink">{student.displayName ?? "（未命名）"}</strong>
                  {student.email && (
                    <span className="ml-2 text-xs text-muted">{student.email}</span>
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void drop(student)}
                  aria-label={`移出 ${student.displayName ?? student.email ?? "學生"}`}
                  className="shrink-0 text-muted hover:text-seal"
                >
                  <UserMinus className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
