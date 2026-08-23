import { Check, GripVertical, Play, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArticlePicker } from "@/components/games/article-picker";
import { GameChrome, HudStat } from "@/components/games/GameChrome";
import { Button } from "@/components/ui/button";
import { getSortPuzzles, shuffle, type SortPuzzle } from "@/data/games";
import { getHighScore, submitScore } from "@/lib/scores";
import { sfx, unlockSfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

function scramble(chunks: string[]): string[] {
  let next = shuffle(chunks);
  let guard = 0;
  while (next.join("|") === chunks.join("|") && chunks.length > 1 && guard < 8) {
    next = shuffle(chunks);
    guard += 1;
  }
  return next;
}

export function SentenceSort({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId ?? "all");
  const puzzles = useMemo(() => getSortPuzzles(articleId), [articleId]);
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [index, setIndex] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [ok, setOk] = useState(false);
  const [score, setScore] = useState(0);
  const [solved, setSolved] = useState(0);
  const [high, setHigh] = useState(0);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const scoreRef = useRef(0);

  const puzzle: SortPuzzle | undefined = puzzles[index];

  useEffect(() => {
    setHigh(getHighScore("sort"));
  }, []);

  function load(i: number) {
    const item = puzzles[i];
    if (!item) return;
    setIndex(i);
    setOrder(scramble(item.chunks));
    setChecked(false);
    setOk(false);
  }

  function start() {
    unlockSfx();
    scoreRef.current = 0;
    setScore(0);
    setSolved(0);
    setPhase("play");
    load(0);
  }

  function move(from: number, to: number) {
    if (checked || from === to || from < 0 || to < 0) return;
    setOrder((list) => {
      const next = [...list];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function check() {
    if (!puzzle) return;
    const match = order.join("|") === puzzle.chunks.join("|");
    setChecked(true);
    setOk(match);
    if (match) {
      const gain = 120 + Math.max(0, 6 - puzzle.chunks.length) * 10;
      scoreRef.current += gain;
      setScore(scoreRef.current);
      setSolved((n) => n + 1);
      sfx.ok();
    } else {
      sfx.bad();
    }
  }

  function next() {
    if (index >= puzzles.length - 1) {
      setPhase("over");
      const result = submitScore("sort", scoreRef.current);
      setHigh(result.high);
      sfx.win();
      return;
    }
    load(index + 1);
  }

  return (
    <GameChrome
      title="課文重組"
      kicker="脈絡默書"
      blurb="長段按句子打散。按住左側拖曳，或用上下鍵微調。排回原文順序即過關。"
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
            <HudStat label="已解" value={`${solved}/${puzzles.length}`} />
            <HudStat label="句數" value={puzzle?.chunks.length ?? 0} />
            <HudStat label="最高" value={high} />
          </div>
        )
      }
    >
      {phase === "ready" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">重組 {puzzles.length} 段</p>
          <p className="mt-2 text-sm text-ink-soft">建議先從《出師表》《岳陽樓記》《勸學》入手。</p>
          <Button className="mt-6" onClick={start} disabled={puzzles.length === 0}>
            <Play className="size-4" /> 開始排序
          </Button>
        </div>
      ) : null}

      {phase === "over" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">全部排完</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-accent">{score}</p>
          <Button className="mt-6" onClick={start}>
            再排一次
          </Button>
        </div>
      ) : null}

      {phase === "play" && puzzle ? (
        <section className="space-y-4 rounded-xl border border-line bg-paper-card p-5 shadow-page sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-serif text-sm font-bold text-accent">{puzzle.title}</p>
            <p className="text-xs text-muted">
              {index + 1} / {puzzles.length}
            </p>
          </div>
          <p className="rounded-lg border-l-4 border-accent bg-paper-deep p-3 text-sm leading-relaxed text-ink-soft">
            語譯提示：{puzzle.hint}
          </p>
          <ol className="space-y-2">
            {order.map((chunk, i) => {
              const correctHere = checked && chunk === puzzle.chunks[i];
              const wrongHere = checked && chunk !== puzzle.chunks[i];
              return (
                <li
                  key={`${chunk}-${i}`}
                  draggable={!checked}
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (dragFrom !== null) move(dragFrom, i);
                    setDragFrom(null);
                  }}
                  className={cn(
                    "flex items-stretch gap-2 rounded-lg border-2 bg-paper-deep/60",
                    !checked && "border-line",
                    correctHere && "border-ok bg-ok/10",
                    wrongHere && "border-bad/50 bg-bad/5",
                  )}
                >
                  <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-1 border-r border-line text-muted">
                    <GripVertical className="size-4" />
                    <span className="text-[11px] font-bold tabular-nums">{i + 1}</span>
                  </div>
                  <p className="flex-1 py-3 pr-2 font-serif text-base leading-relaxed">{chunk}</p>
                  {!checked ? (
                    <div className="flex flex-col justify-center gap-1 p-1">
                      <button
                        type="button"
                        aria-label="上移"
                        disabled={i === 0}
                        onClick={() => move(i, i - 1)}
                        className="size-8 rounded-md text-xs font-bold text-muted hover:bg-paper-card disabled:opacity-30"
                      >
                        上
                      </button>
                      <button
                        type="button"
                        aria-label="下移"
                        disabled={i === order.length - 1}
                        onClick={() => move(i, i + 1)}
                        className="size-8 rounded-md text-xs font-bold text-muted hover:bg-paper-card disabled:opacity-30"
                      >
                        下
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            {checked ? (
              <p className={cn("text-sm font-bold", ok ? "text-ok" : "text-bad")}>
                {ok ? "順序正確" : "尚未還原，對照語譯再調一次。"}
              </p>
            ) : (
              <span className="text-xs text-muted">可拖曳或按上／下微調</span>
            )}
            <div className="flex gap-2">
              {checked && !ok ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setChecked(false);
                    setOk(false);
                  }}
                >
                  <RotateCcw className="size-4" /> 繼續調
                </Button>
              ) : null}
              {checked && ok ? (
                <Button onClick={next}>{index >= puzzles.length - 1 ? "完成" : "下一段"}</Button>
              ) : (
                <Button onClick={check} disabled={checked && ok}>
                  <Check className="size-4" /> 檢查順序
                </Button>
              )}
            </div>
          </div>
        </section>
      ) : null}
    </GameChrome>
  );
}
