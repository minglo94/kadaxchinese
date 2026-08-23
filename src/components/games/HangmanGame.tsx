import { Heart, Play } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticlePicker } from "@/components/games/article-picker";
import { GameChrome, HudStat } from "@/components/games/GameChrome";
import { Button } from "@/components/ui/button";
import { getBlankPuzzles, parseBlanks, type BlankPuzzle } from "@/data/games";
import { getHighScore, submitScore } from "@/lib/scores";
import { sfx, unlockSfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

export function HangmanGame({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId ?? "all");
  const puzzles = useMemo(() => getBlankPuzzles(articleId), [articleId]);
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [index, setIndex] = useState(0);
  const [values, setValues] = useState<string[]>([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);
  const [shake, setShake] = useState(false);
  const [high, setHigh] = useState(0);
  const scoreRef = useRef(0);

  const puzzle: BlankPuzzle | undefined = puzzles[index];
  const parsed = useMemo(() => parseBlanks(puzzle?.text ?? ""), [puzzle]);
  const blanks = parsed.filter((part) => part.type === "blank");

  useEffect(() => {
    setHigh(getHighScore("hangman"));
  }, []);

  function load(i: number, keepLives = true) {
    const item = puzzles[i];
    if (!item) return;
    const parts = parseBlanks(item.text);
    setIndex(i);
    setValues(Array.from({ length: parts.filter((p) => p.type === "blank").length }, () => ""));
    setChecked(false);
    setOk(false);
    if (!keepLives) setLives(3);
  }

  function start() {
    unlockSfx();
    scoreRef.current = 0;
    setScore(0);
    setSolved(0);
    setLives(3);
    setPhase("play");
    load(0, false);
  }

  function submit() {
    if (!puzzle || checked) return;
    const all = blanks.every((blank) => (values[blank.index] ?? "").trim() === blank.answer);
    if (all) {
      setChecked(true);
      setOk(true);
      const gain = 80 + lives * 20;
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setSolved((n) => n + 1);
      sfx.ok();
      return;
    }
    const nextLives = lives - 1;
    setLives(nextLives);
    setShake(true);
    sfx.bad();
    window.setTimeout(() => setShake(false), 450);
    if (nextLives <= 0) {
      setChecked(true);
      setOk(false);
      setPhase("over");
      const result = submitScore("hangman", scoreRef.current);
      setHigh(result.high);
    }
  }

  function next() {
    if (index >= puzzles.length - 1) {
      setPhase("over");
      const result = submitScore("hangman", scoreRef.current);
      setHigh(result.high);
      sfx.win();
      return;
    }
    load(index + 1);
  }

  const hp = (lives / 3) * 100;

  return (
    <GameChrome
      title="名句填字謎"
      kicker="三命解謎"
      blurb="語譯作提示，在空格填入原文。全對才過關；寫錯一次扣一格血，三條命用盡即結束。"
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
        phase === "ready" ? undefined : (
          <div className="grid grid-cols-4 gap-2">
            <HudStat label="分數" value={score} />
            <HudStat label="過關" value={solved} />
            <HudStat label="最高" value={high} />
            <div className="rounded-lg border border-line bg-paper-deep/80 px-3 py-2">
              <div className="text-[11px] font-semibold tracking-wide text-muted">血量</div>
              <div className="mt-1 flex gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart key={i} className={cn("size-5", i < lives ? "fill-seal text-seal" : "text-line")} />
                ))}
              </div>
            </div>
          </div>
        )
      }
    >
      {phase !== "ready" ? (
        <div className="h-3 overflow-hidden rounded-full bg-paper-deep">
          <div
            className={cn("h-full rounded-full transition-[width] duration-300", lives === 1 ? "bg-seal" : "bg-accent")}
            style={{ width: `${hp}%` }}
          />
        </div>
      ) : null}

      {phase === "ready" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">三條命，解名句</p>
          <p className="mt-2 text-sm text-ink-soft">題庫 {puzzles.length} 句，寫錯會扣血但不立即公布答案。</p>
          <Button className="mt-6" onClick={start} disabled={puzzles.length === 0}>
            <Play className="size-4" /> 開始解謎
          </Button>
        </div>
      ) : null}

      {phase === "over" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">{lives <= 0 ? "墨盡了" : "全部解開"}</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-accent">{score}</p>
          <p className="mt-1 text-sm text-muted">解開 {solved} 句</p>
          {puzzle && lives <= 0 ? (
            <p className="mt-4 font-serif text-sm text-ink-soft">
              正解：{puzzle.text.replace(/[{}]/g, "")}
            </p>
          ) : null}
          <Button className="mt-6" onClick={start}>
            再解一局
          </Button>
        </div>
      ) : null}

      {phase === "play" && puzzle ? (
        <section
          className={cn(
            "space-y-5 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-7",
            shake && "error-shake",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-accent-mist px-3 py-1 text-xs font-bold text-accent">
              {puzzle.title} · {index + 1}/{puzzles.length}
            </span>
          </div>
          <p className="rounded-lg border-l-4 border-accent bg-paper-deep p-3 text-sm leading-relaxed text-ink-soft">
            語譯提示：{puzzle.hint}
          </p>
          <div className="classic-text flex min-h-[88px] flex-wrap items-center gap-2 text-lg sm:text-xl">
            {parsed.map((part, i) =>
              part.type === "text" ? (
                <span key={i}>{part.value}</span>
              ) : (
                <input
                  key={`${puzzle.id}-${part.index}`}
                  value={
                    checked && ok
                      ? part.answer
                      : (values[part.index] ?? "")
                  }
                  disabled={checked && ok}
                  onChange={(event) => {
                    const next = [...values];
                    next[part.index] = event.target.value;
                    setValues(next);
                  }}
                  placeholder={`${part.answer.length} 字`}
                  className="min-w-[5.5rem] border-b-2 border-accent bg-transparent px-2 py-1 text-center font-bold text-accent outline-none"
                />
              ),
            )}
          </div>
          <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
            {checked && ok ? (
              <Button onClick={next}>{index >= puzzles.length - 1 ? "完成" : "下一句"}</Button>
            ) : (
              <Button onClick={submit}>核對</Button>
            )}
          </div>
        </section>
      ) : null}
    </GameChrome>
  );
}
