import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import type { Article } from "@/data/types";
import { cn } from "@/lib/utils";

export function ReadingPage({ article }: { article: Article }) {
  const [notes, setNotes] = useState(true);

  return (
    <div className="space-y-6 pb-24">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
        <ArrowLeft className="size-4" /> 返回總覽
      </Link>

      <header className="border-b border-line pb-6">
        <h1 className="font-serif text-3xl font-extrabold text-ink">{article.title}</h1>
        <p className="mt-2 text-sm font-medium text-muted">
          體裁：{article.cat} ｜ 作者：{article.author}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-paper-card/95 p-6 shadow-page md:p-8 lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <h2 className="font-serif text-xl font-bold">完整原文</h2>
            <div className="flex rounded-md bg-paper-deep p-1 text-xs">
              <button
                type="button"
                onClick={() => setNotes(true)}
                className={cn("rounded-[8px] px-3 py-1.5 font-medium", notes ? "bg-accent text-accent-fg" : "text-ink-soft")}
              >
                顯示註釋
              </button>
              <button
                type="button"
                onClick={() => setNotes(false)}
                className={cn("rounded-[8px] px-3 py-1.5 font-medium", !notes ? "bg-accent text-accent-fg" : "text-ink-soft")}
              >
                隱藏註釋
              </button>
            </div>
          </div>
          <div className="space-y-6">
            {article.p.map((para, index) => {
              const show = notes && para.h;
              return (
                <div key={index} className="space-y-2 border-b border-dashed border-line pb-5 last:border-0">
                  <p className={cn("classic-text rounded-lg p-3 text-lg", show && "bg-accent-mist/60")}>{para.t}</p>
                  {show ? (
                    <p className="ml-3 rounded-lg border-l-4 border-accent bg-paper-deep p-3 font-sans text-sm leading-relaxed text-ink-soft">
                      <strong className="text-accent">段落點評：</strong>
                      {para.h}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-xl border border-line bg-paper-card/95 p-6 shadow-page">
            <h3 className="mb-4 border-b border-line pb-2 font-serif text-lg font-bold text-accent">必考詞解</h3>
            <div className="space-y-3">
              {article.v.map((item) => (
                <div key={item.w} className="flex flex-col rounded-lg border border-line bg-paper-deep/50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="mb-1 w-24 shrink-0 font-bold text-accent sm:mb-0">{item.w}</span>
                  <span className="flex-1 text-ink-soft">{item.m}</span>
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-xl border border-seal/25 bg-seal/5 p-6">
            <h3 className="mb-4 border-b border-seal/20 pb-2 font-serif text-lg font-bold text-seal">核心論點</h3>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
              {article.c.map((arg) => (
                <li key={arg}>{arg}</li>
              ))}
            </ul>
          </section>
          <div className="flex flex-col gap-2">
            <Link
              to="/quiz"
              search={{ id: article.id }}
              className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg"
            >
              練習此篇測驗
            </Link>
            <Link
              to="/dictation"
              search={{ id: article.id }}
              className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep"
            >
              默此篇名句
            </Link>
            <Link
              to="/games/snake"
              search={{ id: article.id }}
              className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep"
            >
              用此篇玩貪食蛇
            </Link>
            <Link
              to="/games/sort"
              search={{ id: article.id }}
              className="inline-flex h-11 items-center justify-center rounded-md border border-line px-4 text-sm font-medium text-ink hover:bg-paper-deep"
            >
              重組此篇課文
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
