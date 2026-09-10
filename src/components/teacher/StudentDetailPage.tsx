import { Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { PageSkeleton, RequireStaff } from "@/components/auth/RoleGate";
import { AbilityChart } from "@/components/dashboard/AbilityChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { ArticleProgressList } from "@/components/dashboard/ArticleProgressList";
import { CompletionMeter } from "@/components/dashboard/CompletionMeter";
import { GAME_META } from "@/data/games";
import { studentAdvice } from "@/lib/classroom/server-fns";
import {
  classroomDetail,
  studentDetail,
  type LearnerReportPayload,
} from "@/lib/classroom/server-fns";
import type { AbilityDimension } from "@/lib/analytics/ability";

export function StudentDetailPage({ classId, studentId }: { classId: string; studentId: string }) {
  return (
    <RequireStaff>{() => <StudentBody classId={classId} studentId={studentId} />}</RequireStaff>
  );
}

function StudentBody({ classId, studentId }: { classId: string; studentId: string }) {
  const classroomId = Number(classId);
  const [report, setReport] = useState<LearnerReportPayload | null>(null);
  const [classAbility, setClassAbility] = useState<AbilityDimension[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    studentDetail({ data: { classroomId, studentUserId: studentId } })
      .then(setReport)
      .catch((err: unknown) => {
        setError(
          err instanceof Error && err.message === "Forbidden"
            ? "你沒有查看這位學生的權限。"
            : "未能讀取學生報告。",
        );
      });
    // 全班平均只用來當對照線，取不到就照樣顯示學生自己的數據。
    classroomDetail({ data: { classroomId } })
      .then((detail) => setClassAbility(detail.classAbility))
      .catch(() => setClassAbility(null));
  }, [classroomId, studentId]);

  const back = (
    <Link
      to="/teacher/class/$classId"
      params={{ classId }}
      className="inline-flex items-center gap-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
    >
      <ChevronLeft className="size-4" />
      返回班房
    </Link>
  );

  if (error) {
    return (
      <div className="space-y-4">
        {back}
        <p
          role="alert"
          className="rounded-lg border border-line bg-paper-card p-4 text-sm text-seal"
        >
          {error}
        </p>
      </div>
    );
  }
  if (!report) return <PageSkeleton />;

  const empty = report.ability.completion.attempted === 0;

  return (
    <div className="space-y-6">
      {back}

      <header>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
          {report.displayName ?? "（未命名）"}
        </h1>
        {report.email && <p className="mt-1 text-sm text-muted">{report.email}</p>}
      </header>

      {empty ? (
        <p className="rounded-xl border border-line bg-paper-card p-6 text-center text-sm text-ink-soft shadow-page">
          這位學生還沒有練習紀錄。
        </p>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <CompletionMeter
              completion={report.ability.completion}
              overallPercent={report.ability.overallPercent}
            />
            <AbilityChart
              primary={{ label: "這位學生", dimensions: report.ability.dimensions }}
              compare={classAbility ? { label: "全班平均", dimensions: classAbility } : undefined}
            />
          </div>

          <AdviceCard
            title="教師診斷與課堂建議"
            hint="根據這位學生的實際數據生成；同一份數據會沿用快取。"
            cached={report.advice}
            request={(input) =>
              studentAdvice({ data: { ...input, classroomId, studentUserId: studentId } })
            }
          />

          <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
            <h2 className="font-serif text-lg font-bold text-accent">闖關最高分</h2>
            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {GAME_META.map((game) => (
                <div
                  key={game.id}
                  className="rounded-lg border border-line bg-paper-deep/60 px-3 py-2"
                >
                  <dt className="text-[11px] text-muted">{game.title}</dt>
                  <dd className="font-serif text-lg font-bold tabular-nums text-ink">
                    {report.scores[game.id] ?? 0}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <ArticleProgressList rows={report.articles} />

          {report.recent.length > 0 && (
            <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
              <h2 className="font-serif text-lg font-bold text-accent">最近活動</h2>
              <ul className="mt-3 space-y-1.5 text-sm">
                {report.recent.slice(0, 10).map((event, index) => (
                  <li key={index} className="flex items-baseline justify-between gap-3">
                    <span className="text-ink-soft">
                      {event.kind === "quiz"
                        ? "測驗"
                        : event.kind === "dictation"
                          ? "默書"
                          : "闖關"}
                      {event.score != null && event.total != null && (
                        <span className="ml-2 tabular-nums text-muted">
                          {event.score}/{event.total}
                        </span>
                      )}
                      {event.kind === "game" && event.score != null && event.total == null && (
                        <span className="ml-2 tabular-nums text-muted">{event.score} 分</span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {new Date(event.createdAtMs).toLocaleString("zh-HK")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
