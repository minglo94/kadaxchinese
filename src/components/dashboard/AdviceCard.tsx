import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { AdviceResult } from "@/lib/classroom/server-fns";
import { withGeminiKey } from "@/lib/gemini-key";

/**
 * AI 學習建議。
 *
 * 統計數字全部在伺服器算（見 `server-fns.ts`），這裡只負責觸發與顯示，
 * 所以不可能對一份偽造的成績表產生評語。
 * 「重新產生」才會真的再收費；同一份數據會命中 24 小時快取。
 */
export function AdviceCard({
  title,
  hint,
  cached,
  request,
}: {
  title: string;
  hint: string;
  /** 伺服器已有的舊建議，先顯示出來，不用等 AI。 */
  cached?: { content: string; generatedAtMs: number } | null;
  request: (input: { refresh?: boolean; geminiKey?: string }) => Promise<AdviceResult>;
}) {
  const [advice, setAdvice] = useState<string | null>(cached?.content ?? null);
  const [generatedAtMs, setGeneratedAtMs] = useState<number | null>(cached?.generatedAtMs ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (refresh: boolean) => {
    setBusy(true);
    setError(null);
    try {
      const result = await request(withGeminiKey({ refresh }));
      if (result.ok) {
        setAdvice(result.advice);
        setGeneratedAtMs(result.generatedAtMs);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(
        err instanceof Error && err.message === "Unauthorized"
          ? "登入狀態已過期，請重新登入。"
          : "產生建議時出錯，請稍後再試。",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-serif text-lg font-bold text-accent">
            <Sparkles className="size-4" />
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-muted">{hint}</p>
        </div>
        {advice !== null && (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void run(true)}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            重新產生
          </Button>
        )}
      </header>

      {advice === null ? (
        <div className="mt-4">
          <Button disabled={busy} onClick={() => void run(false)}>
            {busy && <Loader2 className="size-4 animate-spin" />}
            產生建議
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {advice}
          </div>
          {generatedAtMs !== null && (
            <p className="mt-3 text-[11px] text-muted">
              產生於 {new Date(generatedAtMs).toLocaleString("zh-HK")}
            </p>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-seal">
          {error}
        </p>
      )}
    </section>
  );
}
