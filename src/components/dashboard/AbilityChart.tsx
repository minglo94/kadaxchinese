import { useState } from "react";
import { MIN_SAMPLE, type AbilityDimension } from "@/lib/analytics/ability";
import { cn } from "@/lib/utils";

/**
 * 能力顯示。
 *
 * 預設是條形圖而不是雷達圖：六個維度要比較的是「大小」，條形圖的長度是最不容
 * 易誤讀的編碼；雷達圖的面積會被當成分數，而軸的排列順序又會改變圖形的形狀。
 * 雷達圖保留為切換選項，因為老師習慣看「能力雷達」的整體形狀。
 *
 * 配色用「強調」而不是分類色盤：主體一個色相（accent），對照組用灰。
 * 兩者都不是分類編碼，所以不需要 CVD 分類色盤驗證，深淺模式也自動跟著 token。
 */

export type AbilitySeries = {
  label: string;
  dimensions: AbilityDimension[];
};

export function AbilityChart({
  primary,
  compare,
  defaultMode = "bars",
}: {
  primary: AbilitySeries;
  /** 對照組（例如全班平均）。有對照組時會顯示圖例。 */
  compare?: AbilitySeries;
  defaultMode?: "bars" | "radar";
}) {
  const [mode, setMode] = useState<"bars" | "radar">(defaultMode);
  const anyData = primary.dimensions.some((d) => d.sample > 0);

  return (
    <section className="rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-lg font-bold text-accent">能力分析</h2>
          <p className="mt-0.5 text-xs text-muted">
            以答對率計算。樣本少於 {MIN_SAMPLE} 題的維度會標為資料不足。
          </p>
        </div>
        <div
          className="flex rounded-md border border-line p-0.5"
          role="tablist"
          aria-label="圖表形式"
        >
          {(["bars", "radar"] as const).map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "h-8 rounded-[6px] px-3 text-xs font-medium",
                mode === value ? "bg-accent text-accent-fg" : "text-ink-soft hover:bg-paper-deep",
              )}
            >
              {value === "bars" ? "條形圖" : "雷達圖"}
            </button>
          ))}
        </div>
      </header>

      {compare && (
        <ul className="mb-4 flex flex-wrap gap-4 text-xs text-ink-soft">
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-accent" />
            {primary.label}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm bg-muted/50" />
            {compare.label}
          </li>
        </ul>
      )}

      {!anyData ? (
        <p className="rounded-lg border border-line bg-paper-deep/60 p-4 text-sm text-ink-soft">
          還沒有足夠的練習紀錄。做一份測驗或一次默書之後，這裡就會出現各項能力。
        </p>
      ) : mode === "bars" ? (
        <AbilityBars primary={primary} compare={compare} />
      ) : (
        <AbilityRadar primary={primary} compare={compare} />
      )}
    </section>
  );
}

/* ---------------------------------------------------------------- bar form */

function AbilityBars({ primary, compare }: { primary: AbilitySeries; compare?: AbilitySeries }) {
  return (
    <ul className="space-y-3.5">
      {primary.dimensions.map((dimension) => {
        const other = compare?.dimensions.find((d) => d.key === dimension.key);
        return (
          <li key={dimension.key}>
            <div className="mb-1 flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-ink">{dimension.label}</span>
              <span className="text-sm font-bold tabular-nums text-ink-soft">
                {dimension.confident ? (
                  `${dimension.value}%`
                ) : (
                  <span className="text-xs font-medium text-muted">資料不足</span>
                )}
                {other?.confident && (
                  <span className="ml-2 text-xs font-medium text-muted">
                    （{compare?.label} {other.value}%）
                  </span>
                )}
              </span>
            </div>
            {/* 軌道用同一個 ramp 的淺步階；2px 間隙靠 border 讓兩條不相黏 */}
            <div className="relative h-2.5 overflow-hidden rounded-full bg-paper-deep">
              <div
                className={cn(
                  "h-full rounded-full transition-[width] duration-500",
                  dimension.confident ? "bg-accent" : "bg-line",
                )}
                style={{ width: `${Math.max(dimension.value, dimension.sample > 0 ? 2 : 0)}%` }}
              />
              {other?.confident && (
                // 對照組畫成刻度線，不是第二條 bar：避免兩條同長度互相遮蔽
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-full w-0.5 bg-ink/45"
                  style={{ left: `calc(${other.value}% - 1px)` }}
                />
              )}
            </div>
            {dimension.sample > 0 && (
              <span className="mt-1 block text-[11px] text-muted">
                {dimension.key === "speed" ? "已玩限時生存戰" : `${dimension.sample} 題`}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* -------------------------------------------------------------- radar form */

const RADAR_SIZE = 260;
const RADAR_R = 96;
const CENTER = RADAR_SIZE / 2;

function polar(index: number, count: number, radius: number) {
  // 由正上方開始，順時針。
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * radius, y: CENTER + Math.sin(angle) * radius };
}

function polygon(values: number[]) {
  return values
    .map((value, index) => {
      const { x, y } = polar(index, values.length, (Math.max(value, 0) / 100) * RADAR_R);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function AbilityRadar({ primary, compare }: { primary: AbilitySeries; compare?: AbilitySeries }) {
  const count = primary.dimensions.length;
  const values = primary.dimensions.map((d) => (d.confident ? d.value : 0));
  const compareValues = compare
    ? primary.dimensions.map((d) => {
        const other = compare.dimensions.find((o) => o.key === d.key);
        return other?.confident ? other.value : 0;
      })
    : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
      <svg
        viewBox={`0 0 ${RADAR_SIZE} ${RADAR_SIZE}`}
        className="h-auto w-full max-w-[260px] shrink-0"
        role="img"
        aria-label={`能力雷達圖：${primary.dimensions.map((d) => `${d.label} ${d.confident ? `${d.value}%` : "資料不足"}`).join("、")}`}
      >
        {/* 網格：刻意低調 */}
        {[25, 50, 75, 100].map((ring) => (
          <polygon
            key={ring}
            points={polygon(Array.from({ length: count }, () => ring))}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth={1}
          />
        ))}
        {primary.dimensions.map((dimension, index) => {
          const { x, y } = polar(index, count, RADAR_R);
          return (
            <line
              key={dimension.key}
              x1={CENTER}
              y1={CENTER}
              x2={x}
              y2={y}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          );
        })}

        {compareValues && (
          <polygon
            points={polygon(compareValues)}
            fill="var(--color-muted)"
            fillOpacity={0.14}
            stroke="var(--color-muted)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
        )}
        <polygon
          points={polygon(values)}
          fill="var(--color-accent)"
          fillOpacity={0.22}
          stroke="var(--color-accent)"
          strokeWidth={2}
        />
        {values.map((value, index) => {
          const { x, y } = polar(index, count, (value / 100) * RADAR_R);
          return (
            <circle
              key={primary.dimensions[index].key}
              cx={x}
              cy={y}
              r={4}
              fill="var(--color-accent)"
              stroke="var(--color-paper-card)"
              strokeWidth={2}
            />
          );
        })}
      </svg>

      {/* 軸標籤放在圖旁邊而不是圖上：中文標籤在小尺寸雷達圖上一定會互相碰撞 */}
      <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-1">
        {primary.dimensions.map((dimension) => (
          <li key={dimension.key} className="flex items-baseline justify-between gap-2">
            <span className="text-ink-soft">{dimension.label}</span>
            <span className="font-bold tabular-nums text-ink">
              {dimension.confident ? (
                `${dimension.value}%`
              ) : (
                <span className="text-xs font-medium text-muted">—</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
