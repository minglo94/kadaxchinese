import { Heart, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArticlePicker } from "@/components/games/article-picker";
import { GameChrome, HudStat } from "@/components/games/GameChrome";
import { Button } from "@/components/ui/button";
import { getVocabChallenges, type VocabChallenge } from "@/data/games";
import { getHighScore, submitScore } from "@/lib/scores";
import { sfx, unlockSfx } from "@/lib/sfx";
import { useUiStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

type Point = { x: number; y: number };
type Dir = Point;
type Food = Point & { meaning: string; correct: boolean; color: string };

const COLS = 16;
const ROWS = 14;
const STEP = 1 / 6.2;
const FOOD_COLORS = ["#2f5d56", "#9c3b32", "#4a453c"];

function opposite(a: Dir, b: Dir) {
  return a.x + b.x === 0 && a.y + b.y === 0 && (a.x !== 0 || a.y !== 0);
}

function randCell(occupied: Point[]): Point {
  for (let i = 0; i < 80; i++) {
    const p = { x: 1 + Math.floor(Math.random() * (COLS - 2)), y: 1 + Math.floor(Math.random() * (ROWS - 2)) };
    if (!occupied.some((o) => o.x === p.x && o.y === p.y)) return p;
  }
  return { x: 2, y: 2 };
}

function wrap(n: number, max: number) {
  return (n + max) % max;
}

export function SnakeGame({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId ?? "all");
  const challenges = useMemo(() => getVocabChallenges(articleId), [articleId]);
  const tutorOpen = useUiStore((s) => s.tutorOpen);

  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [high, setHigh] = useState(0);
  const [challenge, setChallenge] = useState<VocabChallenge | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [flash, setFlash] = useState<"ok" | "bad" | null>(null);
  const [paused, setPaused] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sim = useRef({
    snake: [{ x: 8, y: 7 }] as Point[],
    dir: { x: 1, y: 0 } as Dir,
    queued: { x: 1, y: 0 } as Dir,
    acc: 0,
    foods: [] as Food[],
    challenge: null as VocabChallenge | null,
    index: 0,
    lives: 3,
    score: 0,
    combo: 0,
    running: false,
    shake: 0,
  });
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    setHigh(getHighScore("snake"));
  }, []);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (canvas.width !== Math.floor(cssW * dpr) || canvas.height !== Math.floor(cssH * dpr)) {
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cell = Math.min(cssW / COLS, cssH / ROWS);
    const ox = (cssW - cell * COLS) / 2;
    const oy = (cssH - cell * ROWS) / 2;
    const s = sim.current;
    const shakeX = s.shake > 0 ? (Math.random() - 0.5) * s.shake * 10 : 0;
    const shakeY = s.shake > 0 ? (Math.random() - 0.5) * s.shake * 10 : 0;

    ctx.clearRect(0, 0, cssW, cssH);
    ctx.save();
    ctx.translate(ox + shakeX, oy + shakeY);

    ctx.fillStyle = "rgba(28,25,21,0.04)";
    ctx.fillRect(0, 0, cell * COLS, cell * ROWS);
    ctx.strokeStyle = "rgba(28,25,21,0.06)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cell, 0);
      ctx.lineTo(x * cell, ROWS * cell);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cell);
      ctx.lineTo(COLS * cell, y * cell);
      ctx.stroke();
    }

    for (const food of s.foods) {
      const pad = cell * 0.16;
      ctx.fillStyle = food.color;
      roundRect(ctx, food.x * cell + pad, food.y * cell + pad, cell - pad * 2, cell - pad * 2, 6);
      ctx.fill();
    }

    s.snake.forEach((seg, i) => {
      const t = i / Math.max(s.snake.length - 1, 1);
      ctx.fillStyle = `rgba(47,93,86,${0.45 + (1 - t) * 0.55})`;
      const pad = i === 0 ? cell * 0.08 : cell * 0.18;
      roundRect(ctx, seg.x * cell + pad, seg.y * cell + pad, cell - pad * 2, cell - pad * 2, i === 0 ? 7 : 4);
      ctx.fill();
      if (i === 0) {
        ctx.fillStyle = "#f4efe4";
        const ex = s.dir.x !== 0 ? 0.22 : 0.32;
        const ey = s.dir.y !== 0 ? 0.22 : 0.32;
        ctx.beginPath();
        ctx.arc(seg.x * cell + cell * (0.5 - ex), seg.y * cell + cell * (0.5 - ey), cell * 0.08, 0, Math.PI * 2);
        ctx.arc(seg.x * cell + cell * (0.5 + ex * 0.2), seg.y * cell + cell * (0.5 - ey), cell * 0.08, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }, []);

  const spawnQuestion = useCallback(() => {
    const s = sim.current;
    if (challenges.length === 0) return;
    const item = challenges[s.index % challenges.length];
    s.index += 1;
    s.challenge = item;
    const occupied = [...s.snake];
    const meanings = shuffleStable([item.meaning, ...item.distractors]).slice(0, 3);
    s.foods = meanings.map((meaning, i) => {
      const pos = randCell(occupied);
      occupied.push(pos);
      return {
        ...pos,
        meaning,
        correct: meaning === item.meaning,
        color: FOOD_COLORS[i % FOOD_COLORS.length],
      };
    });
    setChallenge(item);
    setFoods(s.foods);
  }, [challenges]);

  const endGame = useCallback(() => {
    const s = sim.current;
    s.running = false;
    setPhase("over");
    const result = submitScore("snake", s.score);
    setHigh(result.high);
    sfx.bad();
  }, []);

  const hurt = useCallback(
    (kind: "wrong" | "self") => {
      const s = sim.current;
      s.lives -= 1;
      s.combo = 0;
      s.shake = 1;
      setLives(s.lives);
      setCombo(0);
      setFlash("bad");
      sfx.bad();
      if (kind === "wrong" && s.snake.length > 3) s.snake.pop();
      if (s.lives <= 0) {
        endGame();
        return;
      }
      spawnQuestion();
    },
    [endGame, spawnQuestion],
  );

  const start = useCallback(() => {
    unlockSfx();
    const s = sim.current;
    s.snake = [
      { x: 8, y: 7 },
      { x: 7, y: 7 },
      { x: 6, y: 7 },
    ];
    s.dir = { x: 1, y: 0 };
    s.queued = { x: 1, y: 0 };
    s.acc = 0;
    s.index = 0;
    s.lives = 3;
    s.score = 0;
    s.combo = 0;
    s.running = true;
    s.shake = 0;
    setScore(0);
    setLives(3);
    setCombo(0);
    setFlash(null);
    setPaused(false);
    setPhase("play");
    spawnQuestion();
  }, [spawnQuestion]);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const s = sim.current;
      if (!s.running || paused || tutorOpen) {
        paint();
        return;
      }
      s.shake = Math.max(0, s.shake - dt * 3);
      s.acc += dt;
      const interval = Math.max(0.09, STEP - s.combo * 0.006);
      while (s.acc >= interval) {
        s.acc -= interval;
        if (!opposite(s.dir, s.queued)) s.dir = s.queued;
        const head = s.snake[0];
        const next = {
          x: wrap(head.x + s.dir.x, COLS),
          y: wrap(head.y + s.dir.y, ROWS),
        };
        if (s.snake.some((seg) => seg.x === next.x && seg.y === next.y)) {
          hurt("self");
          break;
        }
        s.snake.unshift(next);
        const eaten = s.foods.find((food) => food.x === next.x && food.y === next.y);
        if (eaten) {
          if (eaten.correct) {
            s.combo += 1;
            s.score += 10 + Math.min(s.combo, 8) * 2;
            setScore(s.score);
            setCombo(s.combo);
            setFlash("ok");
            if (s.combo >= 3) sfx.combo();
            else sfx.ok();
            spawnQuestion();
          } else {
            s.snake.shift();
            hurt("wrong");
            break;
          }
        } else {
          s.snake.pop();
        }
      }
      paint();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused, tutorOpen, paint, hurt, spawnQuestion]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (phaseRef.current !== "play") return;
      const map: Record<string, Dir> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        KeyW: { x: 0, y: -1 },
        KeyS: { x: 0, y: 1 },
        KeyA: { x: -1, y: 0 },
        KeyD: { x: 1, y: 0 },
      };
      const next = map[event.code];
      if (!next) return;
      event.preventDefault();
      if (!opposite(sim.current.dir, next)) sim.current.queued = next;
    };
    const onBlur = () => {
      sim.current.queued = sim.current.dir;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    let sx = 0;
    let sy = 0;
    const down = (e: PointerEvent) => {
      sx = e.clientX;
      sy = e.clientY;
    };
    const up = (e: PointerEvent) => {
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (Math.hypot(dx, dy) < 28) return;
      const next = Math.abs(dx) > Math.abs(dy) ? { x: dx > 0 ? 1 : -1, y: 0 } : { x: 0, y: dy > 0 ? 1 : -1 };
      if (!opposite(sim.current.dir, next)) sim.current.queued = next;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointerup", up);
    };
  }, []);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 420);
    return () => window.clearTimeout(t);
  }, [flash]);

  function steer(next: Dir) {
    if (!opposite(sim.current.dir, next)) sim.current.queued = next;
  }

  return (
    <GameChrome
      title="詞解貪食蛇"
      kicker="直覺反應"
      blurb="畫面中央是重點字。地圖上同時出現兩到三個解釋，只吃正確的那一個。方向鍵或 WASD，手機可滑動或用下方十字。"
      picker={
        <ArticlePicker
          value={articleId}
          onChange={(id) => {
            setArticleId(id);
            setPhase("ready");
            sim.current.running = false;
          }}
        />
      }
      hud={
        <div className="grid grid-cols-4 gap-2">
          <HudStat label="分數" value={score} />
          <HudStat label="連擊" value={combo} />
          <HudStat label="最高" value={high} />
          <div className="rounded-lg border border-line bg-paper-deep/80 px-3 py-2">
            <div className="text-[11px] font-semibold tracking-wide text-muted">生命</div>
            <div className="mt-1 flex gap-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Heart
                  key={i}
                  className={cn("size-5", i < lives ? "fill-seal text-seal" : "text-line")}
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <section className="overflow-hidden rounded-xl border border-line bg-paper-card shadow-page">
        <div className="border-b border-line px-4 py-3 text-center">
          {challenge ? (
            <>
              <p className="font-serif text-3xl font-extrabold text-accent">{challenge.word}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{challenge.quote}</p>
            </>
          ) : (
            <p className="font-serif text-lg text-muted">準備吞噬正確詞義</p>
          )}
        </div>
        <div ref={wrapRef} className="relative" style={{ touchAction: "none" }}>
          <canvas ref={canvasRef} className="block h-[300px] w-full bg-paper-deep/40 sm:h-[min(52vw,420px)]" />
          {phase !== "play" ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-paper/80 p-6 text-center backdrop-blur-[2px]">
              {phase === "over" ? (
                <>
                  <p className="font-serif text-2xl font-bold">墨盡了</p>
                  <p className="text-sm text-ink-soft">
                    本局 {score} 分{high === score && score > 0 ? " · 新高分" : ""}
                  </p>
                  <Button onClick={start}>再來一局</Button>
                </>
              ) : (
                <>
                  <p className="font-serif text-2xl font-bold">點擊開始</p>
                  <p className="max-w-sm text-sm text-ink-soft">吃對變長加分，吃錯或咬到自己扣一顆心。</p>
                  <Button onClick={start}>
                    <Play className="size-4" /> 開始
                  </Button>
                </>
              )}
            </div>
          ) : null}
          {flash ? (
            <div
              className={cn(
                "pointer-events-none absolute inset-0 mix-blend-multiply",
                flash === "ok" ? "bg-ok/15" : "bg-seal/20",
              )}
            />
          ) : null}
        </div>
        {foods.length > 0 && phase === "play" ? (
          <ul className="grid grid-cols-1 gap-2 border-t border-line p-3 sm:grid-cols-3">
            {foods.map((food) => (
              <li key={food.meaning} className="flex items-center gap-2 rounded-md bg-paper-deep px-3 py-2 text-sm">
                <span className="size-3 shrink-0 rounded-sm" style={{ background: food.color }} />
                <span className="leading-snug text-ink-soft">{food.meaning}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" onClick={() => setPaused((v) => !v)} disabled={phase !== "play"}>
          {paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          {paused ? "繼續" : "暫停"}
        </Button>
        <div className="grid grid-cols-3 gap-1 sm:hidden">
          <span />
          <Pad onPress={() => steer({ x: 0, y: -1 })}>上</Pad>
          <span />
          <Pad onPress={() => steer({ x: -1, y: 0 })}>左</Pad>
          <Pad onPress={() => steer({ x: 0, y: 1 })}>下</Pad>
          <Pad onPress={() => steer({ x: 1, y: 0 })}>右</Pad>
        </div>
        <p className="hidden text-xs text-muted sm:block">方向鍵／WASD · 邊界會穿越</p>
      </div>
    </GameChrome>
  );
}

function Pad({ children, onPress }: { children: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onPointerDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      className="flex size-12 items-center justify-center rounded-md border border-line bg-paper-card text-sm font-bold text-ink"
    >
      {children}
    </button>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function shuffleStable<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}
