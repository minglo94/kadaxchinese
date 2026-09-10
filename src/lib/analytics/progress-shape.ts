import type { ArticleProgress } from "@/data/types";

/** The four columns that are actually stored; everything else is derived. */
export type ProgressBase = {
  quizScore: number;
  quizTotal: number;
  dictScore: number;
  dictTotal: number;
};

export const EMPTY_BASE: ProgressBase = {
  quizScore: 0,
  quizTotal: 0,
  dictScore: 0,
  dictTotal: 0,
};

/**
 * Derive `score` / `total` / `percent` from the stored base fields.
 *
 * The DB stores only the four base columns on purpose — this is the one place
 * the derivation lives, so localStorage, the student dashboard and the
 * teacher's table can never disagree about what a percentage means.
 */
export function toArticleProgress(base: ProgressBase): ArticleProgress {
  const score = base.quizScore + base.dictScore;
  const total = base.quizTotal + base.dictTotal;
  return {
    ...base,
    score,
    total,
    percent: total > 0 ? Math.round((score / total) * 100) : 0,
  };
}

/**
 * Max-wins merge, used both on the client (localStorage ⇄ server) and in SQL.
 *
 * Commutative and idempotent, which is what offline-first sync needs: there is
 * no persisted client clock, so last-write-wins would be a coin toss. Totals
 * are content-derived constants (10 quiz / 5 dictation per article), so `max`
 * on a total is always the truth; scores are clamped to the merged total.
 */
export function mergeBase(a: ProgressBase, b: ProgressBase): ProgressBase {
  const quizTotal = Math.max(a.quizTotal, b.quizTotal);
  const dictTotal = Math.max(a.dictTotal, b.dictTotal);
  return {
    quizTotal,
    dictTotal,
    quizScore: Math.min(Math.max(a.quizScore, b.quizScore), quizTotal),
    dictScore: Math.min(Math.max(a.dictScore, b.dictScore), dictTotal),
  };
}
