import { Link } from "@tanstack/react-router";
import { Apple, ArrowRight, Layers, ListOrdered, PenLine, Sparkles, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { HeroAuthCta } from "@/components/home/HeroAuthCta";
import { articles, categories } from "@/data/articles";
import { GAME_META, type GameId } from "@/data/games";
import { cn } from "@/lib/utils";

const ICONS: Record<GameId, typeof Apple> = {
  snake: Apple,
  time: Timer,
  match: Layers,
  sort: ListOrdered,
  hangman: PenLine,
};

export function HomePage() {
  const [cat, setCat] = useState<(typeof categories)[number]>("全部");
  const list = useMemo(
    () => (cat === "全部" ? articles : articles.filter((item) => item.cat === cat)),
    [cat],
  );

  return (
    <div className="space-y-8 pb-24">
      <section className="relative overflow-hidden rounded-xl border border-line bg-paper-card/90 p-7 shadow-page sm:p-10">
        <p className="text-xs font-bold tracking-[0.28em] text-accent">HKDSE 中文科指定範文</p>
        <h1 className="mt-3 font-serif text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
          十二篇範文
          <span className="mt-2 block text-2xl font-bold text-accent sm:text-3xl">
            宣紙上的溫習書齋
          </span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft sm:text-base">
          完整原文、必考詞解、閃卡與仿真測驗、名句默書。現加趣味闖關與 AI
          助教：吃錯詞義會扣心，答錯選擇題可即時解析。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/games"
            className="inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            進入趣味闖關
          </Link>
          <Link
            to="/quiz"
            className="inline-flex h-11 items-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep"
          >
            先做測驗
          </Link>
          <HeroAuthCta />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          登入後成績會存到帳戶，換手機、換電腦都接得上；老師可以開班房查看全班進度。
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-serif text-xl font-bold">五種闖關</h2>
          <Link to="/games" className="text-sm font-medium text-accent hover:underline">
            看全部
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GAME_META.map((game) => {
            const Icon = ICONS[game.id];
            return (
              <Link
                key={game.id}
                to={game.to}
                className="rounded-xl border border-line bg-paper-card/95 p-4 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent"
              >
                <Icon className="size-4 text-accent" />
                <p className="mt-3 font-serif text-base font-bold">{game.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{game.kicker}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex items-start gap-3 rounded-xl border border-line bg-paper-card/90 p-5 shadow-page">
        <Sparkles className="mt-0.5 size-5 shrink-0 text-accent" />
        <div>
          <h2 className="font-serif text-lg font-bold">AI 書齋助教</h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            右下角隨時提問語譯與手法。公開網站請在助教齒輪圖示貼上免費 Gemini API
            金鑰；測驗答錯可生成解析，默書可彈性評分，亦可按篇章出新題。
          </p>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCat(item)}
            className={cn(
              "h-10 rounded-full px-4 text-sm font-medium transition-colors duration-150",
              cat === item
                ? "bg-ink text-paper"
                : "border border-line bg-paper-card text-ink-soft hover:text-ink",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {list.map((article) => (
          <Link
            key={article.id}
            to="/read/$id"
            params={{ id: article.id }}
            className="group flex min-h-[200px] flex-col justify-between rounded-xl border border-line bg-paper-card/95 p-6 shadow-page transition-[transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-accent"
          >
            <div>
              <span className="inline-block rounded-full bg-paper-deep px-3 py-1 text-[11px] font-bold tracking-wide text-muted">
                {article.cat}
              </span>
              <h2 className="mt-4 font-serif text-2xl font-bold leading-snug text-ink group-hover:text-accent">
                {article.title}
              </h2>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
              <p className="text-sm text-muted">作者：{article.author}</p>
              <ArrowRight className="size-5 text-line transition-colors group-hover:text-accent" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
