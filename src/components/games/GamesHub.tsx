import { Link } from "@tanstack/react-router";
import { Apple, ArrowRight, Layers, ListOrdered, PenLine, Timer } from "lucide-react";
import { GAME_META, type GameId } from "@/data/games";
import { loadScores } from "@/lib/scores";
import { useEffect, useState } from "react";

const ICONS: Record<GameId, typeof Apple> = {
  snake: Apple,
  time: Timer,
  match: Layers,
  sort: ListOrdered,
  hangman: PenLine,
};

export function GamesHub() {
  const [scores, setScores] = useState<Record<GameId, number>>({
    snake: 0,
    time: 0,
    match: 0,
    sort: 0,
    hangman: 0,
  });

  useEffect(() => {
    setScores(loadScores());
  }, []);

  return (
    <div className="space-y-8 pb-24">
      <section className="relative overflow-hidden rounded-xl border border-line bg-paper-card/90 p-7 shadow-page sm:p-10">
        <p className="text-xs font-bold tracking-[0.28em] text-accent">趣味闖關</p>
        <h1 className="mt-3 font-serif text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
          把範文變成一場局
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          五種節奏不同的練習：刷詞義、搶秒數、翻牌、重組課文、名句填空。分數存在這部裝置，可隨時再破。
        </p>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {GAME_META.map((game) => {
          const Icon = ICONS[game.id];
          const high = scores[game.id] ?? 0;
          return (
            <Link
              key={game.id}
              to={game.to}
              className="group flex min-h-[200px] flex-col justify-between rounded-xl border border-line bg-paper-card/95 p-6 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-paper-deep px-3 py-1 text-[11px] font-bold tracking-wide text-muted">
                    <Icon className="size-3.5" />
                    {game.kicker}
                  </span>
                  <span className="text-xs font-bold tabular-nums text-accent">最高 {high}</span>
                </div>
                <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-ink group-hover:text-accent">
                  {game.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{game.blurb}</p>
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm text-muted">開始這一局</span>
                <ArrowRight className="size-5 text-line transition-colors group-hover:text-accent" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
