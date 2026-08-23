import { CheckCircle2, Play, XCircle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticlePicker } from "@/components/games/article-picker";
import { GameChrome, HudStat } from "@/components/games/GameChrome";
import { Button } from "@/components/ui/button";
import { getQuizPool } from "@/data/games";
import { getHighScore, submitScore } from "@/lib/scores";
import { sfx, unlockSfx } from "@/lib/sfx";
import { useUiStore } from "@/lib/ui-store";
import { cn } from "@/lib/utils";

const START_TIME = 60;

export function TimeAttack({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId ?? "all");
  const pool = useMemo(() => getQuizPool(articleId), [articleId]);
  const tutorOpen = useUiStore((s) => s.tutorOpen);

  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(START_TIME);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [high, setHigh] = useState(0);
  const [pop, setPop] = useState<string | null>(null);

  const remainRef = useRef(START_TIME);
  const endedRef = useRef(false);
  const pausedRef = useRef(false);
  pausedRef.current = tutorOpen || picked !== null || phase !== "play";

  const question = pool[index % Math.max(pool.length, 1)];

  useEffect(() => {
    setHigh(getHighScore("time"));
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (pausedRef.current) return;
      remainRef.current -= dt;
      if (remainRef.current <= 0) {
        remainRef.current = 0;
        setTimeLeft(0);
        if (!endedRef.current) finish();
        return;
      }
      setTimeLeft(remainRef.current);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // score/correct captured at finish via refs would be nicer; we read latest via finish args on timeout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const scoreRef = useRef(score);
  const correctRef = useRef(correct);
  scoreRef.current = score;
  correctRef.current = correct;

  function finish(finalScore = scoreRef.current) {
    if (endedRef.current) return;
    endedRef.current = true;
    setPhase("over");
    const result = submitScore("time", finalScore);
    setHigh(result.high);
    sfx.win();
  }

  function start() {
    unlockSfx();
    endedRef.current = false;
    remainRef.current = START_TIME;
    setTimeLeft(START_TIME);
    setScore(0);
    setCombo(0);
    setCorrect(0);
    setIndex(0);
    setPicked(null);
    setPop(null);
    setPhase("play");
  }

  function choose(i: number) {
    if (picked !== null || phase !== "play") return;
    const ok = i === question.a;
    setPicked(i);
    if (ok) {
      const nextCombo = combo + 1;
      const gain = 100 + Math.min(nextCombo, 10) * 20;
      setCombo(nextCombo);
      setScore((n) => n + gain);
      setCorrect((n) => n + 1);
      remainRef.current = Math.min(90, remainRef.current + 3);
      setPop(`+3 秒 · +${gain}`);
      if (nextCombo >= 3) sfx.combo();
      else sfx.ok();
    } else {
      setCombo(0);
      remainRef.current = Math.max(0.2, remainRef.current - 5);
      setPop("-5 秒");
      sfx.bad();
    }
    window.setTimeout(() => {
      if (remainRef.current <= 0) {
        finish();
        return;
      }
      setPicked(null);
      setPop(null);
      setIndex((n) => n + 1);
    }, 620);
  }

  const danger = timeLeft < 8;

  return (
    <GameChrome
      title="限時生存戰"
      kicker="瘋狂刷題"
      blurb="六十秒開始。答對加三秒並累積連擊；答錯扣五秒、連擊歸零。時間歸零即結算。"
      picker={
        <ArticlePicker
          value={articleId}
          onChange={(id) => {
            setArticleId(id);
            setPhase("ready");
          }}
        />
      }
      hud={
        <div className="grid grid-cols-4 gap-2">
          <HudStat label="剩餘秒" value={timeLeft.toFixed(1)} warn={danger} />
          <HudStat label="分數" value={score} />
          <HudStat label="連擊" value={combo} />
          <HudStat label="最高" value={high} />
        </div>
      }
    >
      <div className="h-2 overflow-hidden rounded-full bg-paper-deep">
        <div
          className={cn("h-full rounded-full transition-[width,background-color] duration-150", danger ? "bg-seal" : "bg-accent")}
          style={{ width: `${Math.max(0, Math.min(100, (timeLeft / 90) * 100))}%` }}
        />
      </div>

      {phase === "ready" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">準備搶秒</p>
          <p className="mt-2 text-sm text-ink-soft">題庫 {pool.length} 題，可混合十二篇或鎖定單篇。</p>
          <Button className="mt-6" onClick={start}>
            <Play className="size-4" /> 開始 60 秒
          </Button>
        </div>
      ) : null}

      {phase === "over" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">時間到</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-accent">{score}</p>
          <p className="mt-1 text-sm text-muted">
            答對 {correct} 題{high === score && score > 0 ? " · 新高分" : ` · 最高 ${high}`}
          </p>
          <Button className="mt-6" onClick={start}>
            再戰一局
          </Button>
        </div>
      ) : null}

      {phase === "play" && question ? (
        <section className="relative space-y-5 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-8">
          {pop ? (
            <div className="combo-pop pointer-events-none absolute right-4 top-4 rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">
              {pop}
              {combo >= 2 ? ` · COMBO ×${combo}` : ""}
            </div>
          ) : null}
          <p className="text-xs font-bold text-muted">
            {question.title} · 第 {index + 1} 題
          </p>
          <h2 className="font-serif text-xl font-bold leading-relaxed sm:text-2xl">{question.q}</h2>
          <div className="grid grid-cols-1 gap-3">
            {question.o.map((opt, i) => {
              const revealed = picked !== null;
              const isCorrect = i === question.a;
              const isWrong = revealed && i === picked && !isCorrect;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  onClick={() => choose(i)}
                  className={cn(
                    "min-h-12 w-full rounded-lg border-2 p-4 text-left text-base font-medium transition-colors",
                    !revealed && "border-line hover:border-accent hover:bg-accent-mist/40",
                    revealed && isCorrect && "border-ok bg-ok/10 font-bold text-ok",
                    isWrong && "border-bad bg-bad/10 text-bad",
                    revealed && !isCorrect && !isWrong && "border-line opacity-55",
                  )}
                >
                  {i + 1}. {opt}
                </button>
              );
            })}
          </div>
          {picked !== null ? (
            <p className={cn("flex items-center gap-2 text-sm font-bold", picked === question.a ? "text-ok" : "text-bad")}>
              {picked === question.a ? (
                <>
                  <CheckCircle2 className="size-4" /> 正確
                </>
              ) : (
                <>
                  <XCircle className="size-4" /> 正解是選項 {question.a + 1}
                </>
              )}
            </p>
          ) : null}
        </section>
      ) : null}
    </GameChrome>
  );
}
