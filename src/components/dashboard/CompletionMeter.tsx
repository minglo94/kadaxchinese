import type { AbilityReport } from "@/lib/analytics/ability";

/**
 * 完成度 —— 單一比例對上限，所以用 meter（同一 ramp 的軌道），不是兩片的圓餅圖。
 * 「已學習 N / 12 篇」沿用 `ProgressDialog` 既有的定義，兩處數字不會打架。
 */
export function CompletionMeter({
  completion,
  overallPercent,
}: {
  completion: AbilityReport["completion"];
  overallPercent: number;
}) {
  const { startedArticles, totalArticles, attempted, attemptable, percent } = completion;
  const articlePercent = Math.round((startedArticles / totalArticles) * 100);

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <h2 className="font-serif text-lg font-bold text-accent">完成度</h2>

      <div className="mt-4 flex items-center gap-5">
        <Ring percent={articlePercent} />
        <div className="min-w-0">
          {/* Hero figure：儀表板要先讓人看到的一個數字 */}
          <div className="font-serif text-4xl font-bold tabular-nums leading-none text-ink">
            {startedArticles}
            <span className="ml-1 text-base font-normal text-muted">/ {totalArticles} 篇</span>
          </div>
          <p className="mt-1.5 text-sm text-ink-soft">已開始學習的範文</p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3">
        <Stat label="已作答題數" value={`${attempted}`} note={`共 ${attemptable} 題`} />
        <Stat
          label="整體答對率"
          value={attempted > 0 ? `${overallPercent}%` : "—"}
          note="測驗＋默書"
        />
      </dl>

      <div className="mt-4">
        <div className="mb-1 flex items-baseline justify-between text-xs">
          <span className="text-muted">題目覆蓋率</span>
          <span className="font-bold tabular-nums text-ink-soft">{percent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper-deep/60 px-3 py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-serif text-xl font-bold tabular-nums text-ink">{value}</dd>
      <dd className="text-[11px] text-muted">{note}</dd>
    </div>
  );
}

function Ring({ percent }: { percent: number }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(100, Math.max(0, percent)) / 100) * circumference;
  return (
    <svg
      viewBox="0 0 80 80"
      className="size-20 shrink-0"
      role="img"
      aria-label={`完成度 ${percent}%`}
    >
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="var(--color-paper-deep)"
        strokeWidth={8}
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        transform="rotate(-90 40 40)"
      />
      <text
        x="40"
        y="40"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-ink text-[15px] font-bold tabular-nums"
      >
        {percent}%
      </text>
    </svg>
  );
}
