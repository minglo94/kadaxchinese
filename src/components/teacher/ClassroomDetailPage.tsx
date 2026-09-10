import { Link } from "@tanstack/react-router";
import { ChevronLeft, Loader2, RefreshCw, Lock, Unlock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageSkeleton, RequireStaff } from "@/components/auth/RoleGate";
import { AbilityChart } from "@/components/dashboard/AbilityChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { RosterEditor } from "@/components/teacher/RosterEditor";
import { JoinCodePill } from "@/components/teacher/TeacherHome";
import { Button } from "@/components/ui/button";
import { rotateJoinCode, setJoinOpen } from "@/lib/classroom/server-fns";
import { classAdvice } from "@/lib/classroom/server-fns";
import { classroomDetail, type ClassroomDetail } from "@/lib/classroom/server-fns";
import type { StudentRow } from "@/lib/classroom/types";
import { cn } from "@/lib/utils";

export function ClassroomDetailPage({ classId }: { classId: string }) {
  return (
    <RequireStaff>
      {(profile) => <ClassroomBody classId={classId} readOnly={profile.role === "admin"} />}
    </RequireStaff>
  );
}

function ClassroomBody({ classId, readOnly }: { classId: string; readOnly: boolean }) {
  const classroomId = Number(classId);
  const [detail, setDetail] = useState<ClassroomDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    classroomDetail({ data: { classroomId } })
      .then((next) => {
        setDetail(next);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error && err.message === "Forbidden"
            ? "你沒有這個班房的權限。"
            : "未能讀取班房資料。",
        );
      });
  }, [classroomId]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p
          role="alert"
          className="rounded-lg border border-line bg-paper-card p-4 text-sm text-seal"
        >
          {error}
        </p>
      </div>
    );
  }
  if (!detail) return <PageSkeleton />;

  const { classroom, students, pendingInvites, classAbility, weakArticles } = detail;

  return (
    <div className="space-y-6">
      <BackLink />

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">{classroom.name}</h1>
          <p className="mt-1.5 text-sm text-muted">
            {students.length} 位學生
            {pendingInvites.length > 0 && ` · ${pendingInvites.length} 個等待登入`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {readOnly && (
            <span className="rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent">
              科主任檢視（唯讀）
            </span>
          )}
          <JoinCodePill code={classroom.joinCode} />
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || readOnly}
            hidden={readOnly}
            onClick={() => {
              setBusy(true);
              void rotateJoinCode({ data: { classroomId } })
                .then(load)
                .finally(() => setBusy(false));
            }}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            換代碼
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy || readOnly}
            hidden={readOnly}
            onClick={() => {
              setBusy(true);
              void setJoinOpen({ data: { classroomId, open: !classroom.joinOpen } })
                .then(load)
                .finally(() => setBusy(false));
            }}
          >
            {classroom.joinOpen ? <Lock className="size-4" /> : <Unlock className="size-4" />}
            {classroom.joinOpen ? "停止收人" : "重新開放"}
          </Button>
        </div>
      </header>

      <StudentTable classroomId={classroomId} students={students} />

      <div className="grid gap-6 lg:grid-cols-2">
        <AbilityChart
          primary={{ label: "全班平均", dimensions: classAbility }}
          defaultMode="bars"
        />
        <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
          <h2 className="font-serif text-lg font-bold text-accent">全班最弱的範文</h2>
          <p className="mt-0.5 text-xs text-muted">以有作答紀錄的學生的平均答對率排序。</p>
          {weakArticles.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">還沒有足夠的作答紀錄。</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {weakArticles.map((article) => (
                <li key={article.id}>
                  <div className="mb-1 flex items-baseline justify-between gap-3">
                    <span className="font-serif font-bold text-ink">{article.title}</span>
                    <span className="text-sm font-bold tabular-nums text-ink-soft">
                      {article.percent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        article.percent >= 80
                          ? "bg-ok"
                          : article.percent >= 50
                            ? "bg-accent"
                            : "bg-seal",
                      )}
                      style={{ width: `${article.percent}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <AdviceCard
        title="全班教學建議"
        hint="根據全班平均能力與最弱範文，由 AI 依實際數據生成。"
        request={(input) => classAdvice({ data: { ...input, classroomId } })}
      />

      {readOnly ? (
        <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
          <h2 className="font-serif text-lg font-bold text-accent">學生名單</h2>
          <p className="mt-1 text-xs text-muted">科主任為唯讀檢視；名單只有該班的老師可以更改。</p>
          <ul className="mt-3 space-y-1.5">
            {students.map((student) => (
              <li
                key={student.userId}
                className="rounded-lg border border-line bg-paper-deep/50 px-3 py-2 text-sm"
              >
                <strong className="text-ink">{student.displayName ?? "（未命名）"}</strong>
                {student.email && <span className="ml-2 text-xs text-muted">{student.email}</span>}
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <RosterEditor
          classroomId={classroomId}
          students={students}
          pendingInvites={pendingInvites}
          onChanged={load}
        />
      )}
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/teacher"
      className="inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
    >
      <ChevronLeft className="size-4" />
      我的班房
    </Link>
  );
}

/** 名單總覽。可按完成度／答對率／最近活躍排序，找落後的學生最快。 */
function StudentTable({ classroomId, students }: { classroomId: number; students: StudentRow[] }) {
  type SortKey = "name" | "started" | "percent" | "active";
  const [sort, setSort] = useState<SortKey>("percent");

  const sorted = [...students].sort((a, b) => {
    switch (sort) {
      case "name":
        return (a.displayName ?? "").localeCompare(b.displayName ?? "", "zh-HK");
      case "started":
        return b.startedArticles - a.startedArticles;
      case "active":
        return (b.lastActiveAtMs ?? 0) - (a.lastActiveAtMs ?? 0);
      default:
        return a.overallPercent - b.overallPercent;
    }
  });

  if (students.length === 0) {
    return (
      <p className="rounded-xl border border-line bg-paper-card p-6 text-center text-sm text-ink-soft shadow-page">
        還沒有學生入班。把下面的代碼給學生，或在「學生名單」貼上他們的電郵。
      </p>
    );
  }

  const headers: Array<{ key: SortKey; label: string; className?: string }> = [
    { key: "name", label: "學生" },
    { key: "started", label: "完成度", className: "text-right" },
    { key: "percent", label: "答對率", className: "text-right" },
    { key: "name", label: "最弱能力" },
    { key: "active", label: "最近活躍", className: "text-right" },
  ];

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <h2 className="font-serif text-lg font-bold text-accent">學生進度</h2>
      <p className="mt-0.5 text-xs text-muted">按欄標題可排序；預設由答對率最低排起。</p>
      {/* 表格是唯一允許橫向滾動的元素 */}
      <div className="mt-4 -mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              {headers.map((header, index) => (
                <th key={index} scope="col" className={cn("py-2 font-medium", header.className)}>
                  <button
                    type="button"
                    onClick={() => setSort(header.key)}
                    className={cn("hover:text-ink", sort === header.key && "font-bold text-accent")}
                  >
                    {header.label}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <tr key={student.userId} className="border-b border-line/60 last:border-0">
                <td className="py-2.5">
                  <Link
                    to="/teacher/class/$classId/student/$studentId"
                    params={{ classId: String(classroomId), studentId: student.userId }}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {student.displayName ?? student.email ?? "（未命名）"}
                  </Link>
                  {student.email && (
                    <span className="block text-[11px] text-muted">{student.email}</span>
                  )}
                </td>
                <td className="py-2.5 text-right tabular-nums text-ink-soft">
                  {student.startedArticles} / 12
                </td>
                <td
                  className={cn(
                    "py-2.5 text-right font-bold tabular-nums",
                    student.startedArticles === 0
                      ? "text-muted"
                      : student.overallPercent >= 80
                        ? "text-ok"
                        : student.overallPercent >= 50
                          ? "text-ink"
                          : "text-seal",
                  )}
                >
                  {student.startedArticles === 0 ? "—" : `${student.overallPercent}%`}
                </td>
                <td className="py-2.5 text-ink-soft">
                  {student.weakestLabel ?? <span className="text-muted">資料不足</span>}
                </td>
                <td className="py-2.5 text-right text-xs text-muted">
                  {student.lastActiveAtMs
                    ? new Date(student.lastActiveAtMs).toLocaleDateString("zh-HK")
                    : "未開始"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
