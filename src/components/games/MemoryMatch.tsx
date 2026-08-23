import { Play } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArticlePicker } from "@/components/games/article-picker";
import { GameChrome, HudStat } from "@/components/games/GameChrome";
import { Button } from "@/components/ui/button";
import { getFlashPairs, shuffle } from "@/data/games";
import { getHighScore, submitScore } from "@/lib/scores";
import { sfx, unlockSfx } from "@/lib/sfx";
import { cn } from "@/lib/utils";

type Card = {
  id: string;
  pair: string;
  text: string;
  kind: "word" | "meaning";
};

function deal(articleId: string): Card[] {
  const pairs = getFlashPairs(articleId).slice(0, 8);
  const cards: Card[] = [];
  pairs.forEach((item, i) => {
    const pair = `${item.articleId}-${i}-${item.front}`;
    cards.push({ id: `${pair}-w`, pair, text: item.front, kind: "word" });
    cards.push({ id: `${pair}-m`, pair, text: item.back, kind: "meaning" });
  });
  return shuffle(cards);
}

export function MemoryMatch({ initialId }: { initialId?: string }) {
  const [articleId, setArticleId] = useState(initialId ?? "all");
  const [phase, setPhase] = useState<"ready" | "play" | "over">("ready");
  const [cards, setCards] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [lock, setLock] = useState(false);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [high, setHigh] = useState(0);

  const remaining = useMemo(
    () => cards.filter((card) => !matched.includes(card.pair)).length / 2,
    [cards, matched],
  );

  useEffect(() => {
    setHigh(getHighScore("match"));
  }, []);

  useEffect(() => {
    if (phase !== "play") return;
    const t = window.setInterval(() => setElapsed((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  function start() {
    unlockSfx();
    setCards(deal(articleId));
    setFlipped([]);
    setMatched([]);
    setLock(false);
    setMoves(0);
    setElapsed(0);
    setPhase("play");
  }

  function flip(card: Card) {
    if (phase !== "play" || lock) return;
    if (matched.includes(card.pair) || flipped.includes(card.id)) return;
    sfx.flip();
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length < 2) return;
    setMoves((n) => n + 1);
    const [aId, bId] = next;
    const a = cards.find((item) => item.id === aId);
    const b = cards.find((item) => item.id === bId);
    if (!a || !b) return;
    if (a.pair === b.pair && a.id !== b.id) {
      sfx.ok();
      const nextMatched = [...matched, a.pair];
      setMatched(nextMatched);
      setFlipped([]);
      if (nextMatched.length === cards.length / 2) {
        const score = Math.max(50, 800 - (moves + 1) * 12 - elapsed * 4);
        const result = submitScore("match", score);
        setHigh(result.high);
        setPhase("over");
        sfx.win();
      }
    } else {
      setLock(true);
      sfx.bad();
      window.setTimeout(() => {
        setFlipped([]);
        setLock(false);
      }, 700);
    }
  }

  const scoreNow = Math.max(50, 800 - moves * 12 - elapsed * 4);

  return (
    <GameChrome
      title="字義翻牌"
      kicker="配對記憶"
      blurb="一組文言重點字、一組白話語譯。一次翻兩張，配對正確即消去。步數與時間都會影響分數。"
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
            <HudStat label="步數" value={moves} />
            <HudStat label="剩餘對" value={remaining} />
            <HudStat label="秒數" value={elapsed} />
            <HudStat label="最高" value={high} />
          </div>
        )
      }
    >
      {phase === "ready" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">八對詞義</p>
          <p className="mt-2 text-sm text-ink-soft">記住位置，配對字詞與解釋。</p>
          <Button className="mt-6" onClick={start}>
            <Play className="size-4" /> 開始翻牌
          </Button>
        </div>
      ) : null}

      {phase === "over" ? (
        <div className="rounded-xl border border-line bg-paper-card p-8 text-center shadow-page">
          <p className="font-serif text-2xl font-bold">全部配對</p>
          <p className="mt-3 text-3xl font-extrabold tabular-nums text-accent">{scoreNow}</p>
          <p className="mt-1 text-sm text-muted">
            {moves} 步 · {elapsed} 秒
          </p>
          <Button className="mt-6" onClick={start}>
            再配一局
          </Button>
        </div>
      ) : null}

      {phase === "play" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {cards.map((card) => {
            const open = flipped.includes(card.id) || matched.includes(card.pair);
            const done = matched.includes(card.pair);
            return (
              <button
                key={card.id}
                type="button"
                disabled={open || lock}
                onClick={() => flip(card)}
                className={cn(
                  "relative min-h-[92px] rounded-lg border-2 p-3 text-center transition-[transform,background-color,border-color] duration-200",
                  done && "border-ok/40 bg-ok/10",
                  open && !done && "border-accent bg-paper-card",
                  !open && "border-line bg-accent text-accent-fg hover:bg-accent-deep",
                )}
              >
                {open ? (
                  <span
                    className={cn(
                      "block font-medium leading-snug",
                      card.kind === "word" ? "font-serif text-lg font-bold text-accent" : "text-sm text-ink-soft",
                    )}
                  >
                    {card.text}
                  </span>
                ) : (
                  <span className="font-serif text-lg font-bold">文</span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}
    </GameChrome>
  );
}
