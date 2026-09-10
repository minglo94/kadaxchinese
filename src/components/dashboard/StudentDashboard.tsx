import { Link } from "@tanstack/react-router";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PageSkeleton, RequireRole } from "@/components/auth/RoleGate";
import { JoinClassCard } from "@/components/classroom/JoinClassCard";
import { AbilityChart } from "@/components/dashboard/AbilityChart";
import { AdviceCard } from "@/components/dashboard/AdviceCard";
import { ArticleProgressList } from "@/components/dashboard/ArticleProgressList";
import { CompletionMeter } from "@/components/dashboard/CompletionMeter";
import { myClassrooms } from "@/lib/classroom/server-fns";
import { studentAdvice } from "@/lib/classroom/server-fns";
import { myReport, type LearnerReportPayload } from "@/lib/classroom/server-fns";
import type { ClassroomSummary } from "@/lib/classroom/types";

export function StudentDashboard({ joined }: { joined?: boolean }) {
  return <RequireRole role="student">{() => <StudentBody joined={joined} />}</RequireRole>;
}

function StudentBody({ joined }: { joined?: boolean }) {
  const [report, setReport] = useState<LearnerReportPayload | null>(null);
  const [classrooms, setClassrooms] = useState<ClassroomSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadClassrooms = useCallback(() => {
    myClassrooms()
      .then(setClassrooms)
      .catch(() => setClassrooms([]));
  }, []);

  useEffect(() => {
    myReport()
      .then(setReport)
      .catch(() => setError("未能讀取學習報告，請重新載入頁面。"));
    loadClassrooms();
  }, [loadClassrooms]);

  if (error) {
    return (
      <p role="alert" className="rounded-lg border border-line bg-paper-card p-4 text-sm text-seal">
        {error}
      </p>
    );
  }
  if (!report) return <PageSkeleton />;

  const empty = report.ability.completion.attempted === 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-ink sm:text-3xl">
          {report.displayName ? `${report.displayName}的學習報告` : "我的學習報告"}
        </h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <CheckCircle2 className="size-4 text-ok" />
          進度已存到你的帳戶，換裝置也接得上。
        </p>
      </header>

      {joined && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg border border-ok/40 bg-ok/10 p-4 text-sm text-ink"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-ok" />
          老師已把你的電郵加入名單，已自動幫你入班。
        </p>
      )}

      {empty ? (
        <section className="rounded-xl border border-line bg-paper-card p-6 text-center shadow-page">
          <AlertCircle className="mx-auto size-6 text-accent" />
          <h2 className="mt-3 font-serif text-lg font-bold text-ink">還沒有練習紀錄</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            做一份測驗或一次默書，這裡就會出現完成度、能力分析與個人建議。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/quiz"
              className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-deep"
            >
              開始深度測驗
            </Link>
            <Link
              to="/dictation"
              className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep"
            >
              練習默書
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <CompletionMeter
            completion={report.ability.completion}
            overallPercent={report.ability.overallPercent}
          />
          <AbilityChart primary={{ label: "我", dimensions: report.ability.dimensions }} />
        </div>
      )}

      <JoinClassCard classrooms={classrooms ?? []} onChanged={loadClassrooms} />

      {!empty && (
        <>
          <AdviceCard
            title="個人學習建議"
            hint="根據你的答對率與最弱範文，由 AI 依實際數據生成。"
            cached={report.advice}
            request={(input) => studentAdvice({ data: input })}
          />
          <ArticleProgressList rows={report.articles} />
        </>
      )}
    </div>
  );
}
