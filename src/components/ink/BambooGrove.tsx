import { useMemo } from "react";

type Leaf = {
  x: number;
  y: number;
  rot: number;
  len: number;
  wide: number;
  dark: number;
};

type Stalk = {
  id: number;
  x: number;
  lean: number;
  height: number;
  thick: number;
  segs: number;
  layer: 0 | 1 | 2;
  growAt: number;
  leaves: Leaf[];
};

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeStalks(count: number): Stalk[] {
  const rand = mulberry32(20260823);
  const stalks: Stalk[] = [];
  for (let i = 0; i < count; i++) {
    const left = i < count / 2;
    const slot = left ? i : i - Math.floor(count / 2);
    const slots = Math.ceil(count / 2);
    const xBase = left
      ? 0.9 + (slot / Math.max(slots - 1, 1)) * 9.5
      : 89.4 + (slot / Math.max(slots - 1, 1)) * 9.5;
    const x = xBase + (rand() - 0.5) * 1.4;
    const segs = 3 + Math.floor(rand() * 3);
    const height = 42 + rand() * 52;
    const thick = 0.55 + rand() * 0.85;
    const leaves: Leaf[] = [];
    for (let s = 1; s <= segs; s++) {
      const y = 100 - (s / segs) * height + (rand() - 0.5) * 2;
      const n = 3 + Math.floor(rand() * 3);
      for (let k = 0; k < n; k++) {
        const dir = k % 2 === 0 ? -1 : 1;
        leaves.push({
          x: x + dir * (0.4 + rand() * 1.1),
          y: y + (rand() - 0.5) * 2.2,
          rot: dir * (18 + rand() * 52) + (rand() - 0.5) * 8,
          len: 4.2 + rand() * 5.5,
          wide: 0.7 + rand() * 0.7,
          dark: 0.55 + rand() * 0.4,
        });
      }
    }
    stalks.push({
      id: i,
      x,
      lean: (left ? 1 : -1) * (1.5 + rand() * 6) + (rand() - 0.5) * 2,
      height,
      thick,
      segs,
      layer: (i % 3) as 0 | 1 | 2,
      growAt: rand() * 0.22,
      leaves,
    });
  }
  return stalks;
}

function easeOut(t: number) {
  return 1 - (1 - t) ** 3;
}

function clamp(n: number, a = 0, b = 1) {
  return Math.min(b, Math.max(a, n));
}

function culmRibbon(stalk: Stalk) {
  const top = 100 - stalk.height;
  const left: string[] = [];
  const right: string[] = [];
  const steps = stalk.segs * 5;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 102 - t * (102 - top);
    const wobble = Math.sin(t * 5.2 + stalk.id) * 0.42;
    const x = stalk.x + wobble;
    const w = stalk.thick * (1.2 - t * 0.55);
    left.push(`${x - w} ${y}`);
    right.unshift(`${x + w} ${y}`);
  }
  return `M ${left.join(" L ")} L ${right.join(" L ")} Z`;
}

export function BambooGrove({
  progress,
  reduced,
  compact,
}: {
  progress: number;
  reduced: boolean;
  compact: boolean;
}) {
  const stalks = useMemo(() => makeStalks(compact ? 8 : 12), [compact]);
  const p = reduced ? 0.7 : progress;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="mist" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y="78" width="100" height="22" fill="url(#mist)" className="text-ink" />

      {stalks.map((stalk) => {
        const local = Math.max(0.2, easeOut(clamp((p - stalk.growAt) / 0.7)));
        const leafT = easeOut(clamp((local - 0.22) / 0.6));
        const opacity = [0.58, 0.82, 1][stalk.layer];
        const yShift = (1 - local) * stalk.height;
        return (
          <g key={stalk.id} transform={`translate(0 ${yShift})`} opacity={local * opacity}>
            <g transform={`rotate(${stalk.lean} ${stalk.x} 100)`}>
              <path d={culmRibbon(stalk)} fill="currentColor" />
              {Array.from({ length: stalk.segs }).map((_, i) => {
                const t = (i + 1) / stalk.segs;
                const y = 102 - t * stalk.height;
                return (
                  <ellipse
                    key={i}
                    cx={stalk.x}
                    cy={y}
                    rx={stalk.thick * 1.35}
                    ry={0.38}
                    fill="currentColor"
                    opacity={0.85}
                  />
                );
              })}
              {stalk.leaves.map((leaf, i) => (
                <g
                  key={i}
                  transform={`translate(${leaf.x} ${leaf.y}) rotate(${leaf.rot})`}
                  opacity={leafT * leaf.dark}
                >
                  <path
                    d={`M 0 0 Q ${leaf.len * 0.42} ${-leaf.wide} ${leaf.len} 0 Q ${leaf.len * 0.42} ${leaf.wide * 0.72} 0 0`}
                    fill="currentColor"
                  />
                </g>
              ))}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
