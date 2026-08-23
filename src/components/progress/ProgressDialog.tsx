import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { articles } from "@/data/articles";
import { GAME_META } from "@/data/games";
import { countStarted, type ProgressMap } from "@/lib/progress";
import { loadScores } from "@/lib/scores";
import { cn } from "@/lib/utils";

export function ProgressDialog({
  open,
  progress,
  onClose,
}: {
  open: boolean;
  progress: ProgressMap;
  onClose: () => void;
}) {
  const started = useMemo(() => countStarted(progress), [progress]);
  const overall = Math.round((started / articles.length) * 100) || 0;
  const [scores, setScores] = useState(loadScores);

  useEffect(() => {
    if (open) setScores(loadScores());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="progress-title"
        className="relative max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-paper-card p-6 shadow-page"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-md p-2 text-muted hover:bg-paper-deep hover:text-ink"
          aria-label="關閉"
        >
          <X className="size-5" />
        </button>

        <h2 id="progress-title" className="font-serif text-2xl font-bold text-accent">
          學習進度報告
        </h2>

        <div className="mt-5 rounded-lg bg-paper-deep/80 p-4">
          <div className="mb-2 flex items-end justify-between gap-3">
            <strong className="text-ink">全站測驗與默書總進度</strong>
            <span className="text-sm font-bold tabular-nums text-accent">
              已學習 {started} / {articles.length} 篇（{overall}%）
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-accent-mist">
            <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${overall}%` }} />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {GAME_META.map((game) => (
            <div key={game.id} className="rounded-lg border border-line bg-paper-deep/70 px-3 py-2">
              <div className="text-[11px] text-muted">{game.title}</div>
              <div className="font-serif text-lg font-bold tabular-nums text-ink">{scores[game.id] ?? 0}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {articles.map((item) => {
            const row = progress[item.id];
            const percent = row?.percent ?? 0;
            const startedItem = row && (row.quizTotal > 0 || row.dictTotal > 0);
            const tone =
              !startedItem ? "bg-line" : percent >= 80 ? "bg-ok" : percent >= 50 ? "bg-accent" : "bg-seal";
            const label =
              startedItem && row ? `${row.score}/${row.total} 題（${percent}%）` : "尚未開始";
            return (
              <div key={item.id}>
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="font-serif font-bold text-ink">{item.title}</span>
                  <span className={cn("text-sm font-bold tabular-nums", startedItem ? "text-ink-soft" : "text-muted")}>
                    {label}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-paper-deep">
                  <div className={cn("h-2 rounded-full transition-[width] duration-500", tone)} style={{ width: `${percent}%` }} />
                </div>
                {startedItem && row ? (
                  <div className="mt-1 flex gap-4 text-xs text-muted">
                    <span>選擇題：{row.quizTotal > 0 ? `${row.quizScore}/${row.quizTotal}` : "未測驗"}</span>
                    <span>默書：{row.dictTotal > 0 ? `${row.dictScore}/${row.dictTotal}` : "未測驗"}</span>
                  </div>
                ) : (
                  <span className="mt-1 block text-xs text-muted">尚未開始學習</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
