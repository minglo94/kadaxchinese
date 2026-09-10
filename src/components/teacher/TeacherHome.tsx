import { Link } from "@tanstack/react-router";
import { Copy, Loader2, Plus, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageSkeleton, RequireRole } from "@/components/auth/RoleGate";
import { Button } from "@/components/ui/button";
import { createClassroom, myClassrooms } from "@/lib/classroom/server-fns";
import type { ClassroomSummary } from "@/lib/classroom/types";

export function TeacherHome() {
  return <RequireRole role="teacher">{() => <TeacherHomeBody />}</RequireRole>;
}

function TeacherHomeBody() {
  const [classrooms, setClassrooms] = useState<ClassroomSummary[] | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    myClassrooms()
      .then(setClassrooms)
      .catch(() => setClassrooms([]));
  }, []);

  useEffect(load, [load]);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await createClassroom({ data: { name } });
      setName("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "未能開班房，請再試一次。");
    } finally {
      setBusy(false);
    }
  };

  if (!classrooms) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">我的班房</h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          開班房後把 6 位代碼給學生，或直接貼上他們的電郵名單。
        </p>
      </header>

      <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
        <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
          <Plus className="size-4" />
          開新班房
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="class-name">
            班房名稱
          </label>
          <input
            id="class-name"
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 60))}
            placeholder="例如 中六甲 中文"
            className="h-11 min-w-0 flex-1 rounded-md border border-line bg-paper px-3 text-sm text-ink outline-none focus:border-accent sm:flex-none sm:w-64"
          />
          <Button disabled={busy || name.trim() === ""} onClick={() => void create()}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            開班房
          </Button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium text-seal">
            {error}
          </p>
        )}
      </section>

      {classrooms.length === 0 ? (
        <p className="rounded-xl border border-line bg-paper-card p-6 text-center text-sm text-ink-soft shadow-page">
          還沒有班房。開一個之後就可以加入學生、查看全班進度。
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {classrooms.map((classroom) => (
            <li
              key={classroom.id}
              className="rounded-xl border border-line bg-paper-card p-5 shadow-page"
            >
              <Link
                to="/teacher/class/$classId"
                params={{ classId: String(classroom.id) }}
                className="font-serif text-lg font-bold text-ink hover:text-accent"
              >
                {classroom.name}
              </Link>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                <Users className="size-3.5" />
                {classroom.studentCount} 位學生
                {!classroom.joinOpen && " · 已停止收人"}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <JoinCodePill code={classroom.joinCode} />
                <Link
                  to="/teacher/class/$classId"
                  params={{ classId: String(classroom.id) }}
                  className="ml-auto text-sm font-medium text-accent underline-offset-4 hover:underline"
                >
                  查看班房
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** 代碼要唸給全班抄，所以字距放大、可一鍵複製。 */
export function JoinCodePill({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          ?.writeText(code)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => setCopied(false));
      }}
      className="inline-flex items-center gap-2 rounded-md border border-line bg-paper-deep px-3 py-2 font-mono text-base font-bold tracking-[0.22em] text-accent hover:border-accent"
      aria-label={`複製班房代碼 ${code}`}
    >
      {code}
      <Copy className="size-3.5" />
      {copied && <span className="font-sans text-[11px] tracking-normal text-ok">已複製</span>}
    </button>
  );
}
