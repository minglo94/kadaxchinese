import { Loader2, LogOut, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { joinByCode, leaveClassroom } from "@/lib/classroom/server-fns";
import type { ClassroomSummary } from "@/lib/classroom/types";

/** 學生端：我的班別 + 用代碼加入。 */
export function JoinClassCard({
  classrooms,
  onChanged,
}: {
  classrooms: ClassroomSummary[];
  onChanged: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);

  const submit = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const result = await joinByCode({ data: { code } });
      if (result.ok) {
        setCode("");
        setMessage({ tone: "ok", text: `已加入「${result.classroom.name}」。` });
        onChanged();
      } else {
        setMessage({ tone: "bad", text: result.error });
      }
    } catch {
      setMessage({ tone: "bad", text: "加入失敗，請稍後再試。" });
    } finally {
      setBusy(false);
    }
  };

  const leave = async (classroomId: number, name: string) => {
    if (!window.confirm(`確定退出「${name}」？老師之後不會再看到你的新進度。`)) return;
    setBusy(true);
    try {
      await leaveClassroom({ data: { classroomId } });
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
        <Users className="size-4" />
        我的班別
      </h2>

      {classrooms.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">
          還未加入任何班房。輸入老師給你的 6 位代碼即可加入。
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {classrooms.map((classroom) => (
            <li
              key={classroom.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper-deep/60 px-3 py-2.5"
            >
              <div className="min-w-0">
                <strong className="block truncate font-serif text-base text-ink">
                  {classroom.name}
                </strong>
                <span className="text-xs text-muted">
                  {classroom.ownerName ? `${classroom.ownerName}老師` : "老師"} ·{" "}
                  {classroom.studentCount} 人
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => void leave(classroom.id, classroom.name)}
                aria-label={`退出 ${classroom.name}`}
              >
                <LogOut className="size-4" />
                退出
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="join-code">
          班房代碼
        </label>
        <input
          id="join-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 6))}
          placeholder="班房代碼"
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-36 rounded-md border border-line bg-paper px-3 font-mono text-base tracking-[0.2em] text-ink outline-none focus:border-accent"
        />
        <Button disabled={busy || code.trim().length !== 6} onClick={() => void submit()}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          加入班房
        </Button>
      </div>

      {message && (
        <p role={message.tone === "bad" ? "alert" : "status"} className={cnTone(message.tone)}>
          {message.text}
        </p>
      )}

      {classrooms.length > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          你的進度、能力分析與練習紀錄會與上述班房的老師分享。退出後老師不會再看到你的新進度。
        </p>
      )}
    </section>
  );
}

function cnTone(tone: "ok" | "bad") {
  return tone === "bad" ? "mt-3 text-sm font-medium text-seal" : "mt-3 text-sm font-medium text-ok";
}
