import type { ArticleProgress } from "@/data/types";
import { cn } from "@/lib/utils";

/**
 * 逐篇進度。沿用 `ProgressDialog` 的進度條語言（同一組 token、同一個
 * 80/50 分界），所以快速一覽與完整報告不會給出兩種印象。
 */
export function ArticleProgressList({
  rows,
  title = "逐篇進度",
}: {
  rows: Array<{ id: string; title: string; progress: ArticleProgress | null }>;
  title?: string;
}) {
  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <h2 className="font-serif text-lg font-bold text-accent">{title}</h2>
      <ul className="mt-4 space-y-4">
        {rows.map((row) => {
          const percent = row.progress?.percent ?? 0;
          const started =
            row.progress != null && (row.progress.quizTotal > 0 || row.progress.dictTotal > 0);
          const tone = !started
            ? "bg-line"
            : percent >= 80
              ? "bg-ok"
              : percent >= 50
                ? "bg-accent"
                : "bg-seal";
          return (
            <li key={row.id}>
              <div className="mb-1 flex items-baseline justify-between gap-3">
                <span className="font-serif font-bold text-ink">{row.title}</span>
                <span
                  className={cn(
                    "text-sm font-bold tabular-nums",
                    started ? "text-ink-soft" : "text-muted",
                  )}
                >
                  {started && row.progress
                    ? `${row.progress.score}/${row.progress.total} 題（${percent}%）`
                    : "尚未開始"}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
                <div
                  className={cn("h-2 rounded-full transition-[width] duration-500", tone)}
                  style={{ width: `${percent}%` }}
                />
              </div>
              {started && row.progress && (
                <div className="mt-1 flex gap-4 text-xs text-muted">
                  <span>
                    選擇題：
                    {row.progress.quizTotal > 0
                      ? `${row.progress.quizScore}/${row.progress.quizTotal}`
                      : "未測驗"}
                  </span>
                  <span>
                    默書：
                    {row.progress.dictTotal > 0
                      ? `${row.progress.dictScore}/${row.progress.dictTotal}`
                      : "未測驗"}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
