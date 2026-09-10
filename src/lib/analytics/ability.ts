import { articles } from "@/data/articles";
import type { GameId } from "@/data/games";
import type { ArticleProgress, SkillTag } from "@/data/types";
import { skillsForArticle } from "./skill-tags";

/**
 * 能力分析 —— 一個純函式，學生端（餵 localStorage）與老師端（餵 SQL 列）
 * 共用同一份實作，所以兩邊永遠不會給出不同的數字。
 *
 * 每個維度都帶 `sample`：樣本少於 MIN_SAMPLE 就標為「資料不足」，
 * 而不是顯示一個會誤導老師的 0 分或 100 分。
 */

export type AbilityKey = "content" | "vocab" | "rhetoric" | "theme" | "dictation" | "speed";

export const ABILITY_LABELS: Record<AbilityKey, string> = {
  content: "內容理解",
  vocab: "字詞掌握",
  rhetoric: "修辭手法",
  theme: "主旨情感",
  dictation: "默寫準確",
  speed: "反應速度",
};

export const ABILITY_ORDER: AbilityKey[] = [
  "content",
  "vocab",
  "rhetoric",
  "theme",
  "dictation",
  "speed",
];

/** 少於三題／三次的維度不足以下判斷。 */
export const MIN_SAMPLE = 3;

export type AbilityDimension = {
  key: AbilityKey;
  label: string;
  /** 0-100。`confident === false` 時只作參考。 */
  value: number;
  sample: number;
  confident: boolean;
};

export type AbilityInput = {
  progress: Record<string, ArticleProgress | undefined>;
  /** 逐題結果。老師端餵的是 first_try_ok，學生端本機餵的是曾否答對。 */
  answers: Record<string, Record<number, boolean> | undefined>;
  scores: Partial<Record<GameId, number>>;
};

export type AbilityReport = {
  dimensions: AbilityDimension[];
  completion: {
    startedArticles: number;
    totalArticles: number;
    /** 已作答的題數（測驗＋默書） */
    attempted: number;
    /** 全部可作答題數 */
    attemptable: number;
    percent: number;
  };
  weakArticles: Array<{ id: string; title: string; percent: number }>;
  strongArticles: Array<{ id: string; title: string; percent: number }>;
  /** 整體答對率 0-100 */
  overallPercent: number;
};

/** 每個遊戲「滿分」的參考值，用來把分數正規化成 0-100。 */
const GAME_CEILING: Record<GameId, number> = {
  snake: 30,
  time: 2500,
  match: 1200,
  sort: 900,
  hangman: 600,
};

function normalizeGame(gameId: GameId, score: number | undefined): number | null {
  if (!score || score <= 0) return null;
  return Math.min(100, Math.round((score / GAME_CEILING[gameId]) * 100));
}

/** 每篇文章逐題能力標籤，只算一次。 */
const SKILLS_BY_ARTICLE: Record<string, SkillTag[]> = Object.fromEntries(
  articles.map((article) => [article.id, skillsForArticle(article)]),
);

const ATTEMPTABLE = articles.reduce(
  (sum, article) => sum + article.q.length + article.dictation.length,
  0,
);

function dimension(
  key: AbilityKey,
  correct: number,
  sample: number,
  blend?: { value: number; weight: number },
): AbilityDimension {
  let value = sample > 0 ? Math.round((correct / sample) * 100) : 0;
  if (blend && sample > 0) {
    value = Math.round(value * (1 - blend.weight) + blend.value * blend.weight);
  } else if (blend && sample === 0) {
    value = blend.value;
  }
  return {
    key,
    label: ABILITY_LABELS[key],
    value: Math.min(100, Math.max(0, value)),
    sample,
    confident: sample >= MIN_SAMPLE || (blend != null && sample === 0 && blend.value > 0),
  };
}

export function computeAbility(input: AbilityInput): AbilityReport {
  // --- 逐題：按能力標籤分桶 ------------------------------------------------
  const buckets: Record<SkillTag, { correct: number; total: number }> = {
    content: { correct: 0, total: 0 },
    vocab: { correct: 0, total: 0 },
    rhetoric: { correct: 0, total: 0 },
    theme: { correct: 0, total: 0 },
  };
  for (const [articleId, byIndex] of Object.entries(input.answers)) {
    const skills = SKILLS_BY_ARTICLE[articleId];
    if (!skills || !byIndex) continue;
    for (const [indexText, correct] of Object.entries(byIndex)) {
      const skill = skills[Number(indexText)];
      if (!skill) continue;
      buckets[skill].total += 1;
      if (correct) buckets[skill].correct += 1;
    }
  }

  // --- 默書與完成度 --------------------------------------------------------
  let dictScore = 0;
  let dictTotal = 0;
  let allScore = 0;
  let allTotal = 0;
  let startedArticles = 0;
  const perArticle: Array<{ id: string; title: string; percent: number }> = [];
  for (const article of articles) {
    const row = input.progress[article.id];
    if (!row) continue;
    const started = (row.quizTotal ?? 0) > 0 || (row.dictTotal ?? 0) > 0;
    if (!started) continue;
    startedArticles += 1;
    dictScore += row.dictScore ?? 0;
    dictTotal += row.dictTotal ?? 0;
    allScore += row.score ?? 0;
    allTotal += row.total ?? 0;
    perArticle.push({ id: article.id, title: article.title, percent: row.percent ?? 0 });
  }

  const sorted = [...perArticle].sort((a, b) => a.percent - b.percent);

  // --- 遊戲：字詞與默寫的輔助訊號 ------------------------------------------
  const vocabGames = [
    normalizeGame("match", input.scores.match),
    normalizeGame("snake", input.scores.snake),
  ].filter((v): v is number => v !== null);
  const recallGames = [
    normalizeGame("sort", input.scores.sort),
    normalizeGame("hangman", input.scores.hangman),
  ].filter((v): v is number => v !== null);
  const speed = normalizeGame("time", input.scores.time);

  const avg = (values: number[]) =>
    values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

  const vocabGameAvg = avg(vocabGames);
  const recallGameAvg = avg(recallGames);

  const dimensions: AbilityDimension[] = [
    dimension("content", buckets.content.correct, buckets.content.total),
    dimension(
      "vocab",
      buckets.vocab.correct,
      buckets.vocab.total,
      vocabGameAvg === null ? undefined : { value: vocabGameAvg, weight: 0.3 },
    ),
    dimension("rhetoric", buckets.rhetoric.correct, buckets.rhetoric.total),
    dimension("theme", buckets.theme.correct, buckets.theme.total),
    dimension(
      "dictation",
      dictScore,
      dictTotal,
      recallGameAvg === null ? undefined : { value: recallGameAvg, weight: 0.25 },
    ),
    {
      key: "speed",
      label: ABILITY_LABELS.speed,
      value: speed ?? 0,
      // 限時生存戰玩過一次就有意義，不套 MIN_SAMPLE。
      sample: speed === null ? 0 : 1,
      confident: speed !== null,
    },
  ];

  return {
    dimensions,
    completion: {
      startedArticles,
      totalArticles: articles.length,
      attempted: allTotal,
      attemptable: ATTEMPTABLE,
      percent: ATTEMPTABLE > 0 ? Math.round((allTotal / ATTEMPTABLE) * 100) : 0,
    },
    weakArticles: sorted.slice(0, 3),
    strongArticles: [...sorted].reverse().slice(0, 3),
    overallPercent: allTotal > 0 ? Math.round((allScore / allTotal) * 100) : 0,
  };
}

/** 班房平均：只把有把握的維度平均進去，避免一堆「資料不足」拉低全班。 */
export function averageAbility(reports: AbilityReport[]): AbilityDimension[] {
  return ABILITY_ORDER.map((key) => {
    const usable = reports
      .map((report) => report.dimensions.find((d) => d.key === key))
      .filter((d): d is AbilityDimension => d != null && d.confident);
    const value =
      usable.length > 0
        ? Math.round(usable.reduce((sum, d) => sum + d.value, 0) / usable.length)
        : 0;
    return {
      key,
      label: ABILITY_LABELS[key],
      value,
      sample: usable.length,
      confident: usable.length > 0,
    };
  });
}

/** 最弱維度的標籤，資料不足時回 null（不要拿沒把握的數字去指導老師）。 */
export function weakestLabel(dimensions: AbilityDimension[]): string | null {
  const usable = dimensions.filter((d) => d.confident);
  if (usable.length === 0) return null;
  return usable.reduce((worst, d) => (d.value < worst.value ? d : worst)).label;
}
