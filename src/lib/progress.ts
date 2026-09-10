import { articles } from "@/data/articles";
import type { ArticleProgress } from "@/data/types";
import { toArticleProgress, type ProgressBase } from "@/lib/analytics/progress-shape";
import { ANSWERS_KEY, PROGRESS_KEY, readLocal, writeLocal } from "@/lib/local-store";
import { queueAnswer, queueDictation, queueProgress } from "@/lib/progress-sync";

/**
 * 學習進度 —— 本機 `localStorage` 仍然是唯一的寫入路徑，API 全部保持同步。
 *
 * 每個寫入函式尾端多一行 `queue…()`，把同一份資料交給 `progress-sync` 在背景
 * 推上帳戶。這樣測驗、默書、遊戲那 11 個呼叫點一行都不用改，離線也照樣運作。
 */

export type ProgressMap = Record<string, ArticleProgress>;
export type AnswerMap = Record<string, Record<number, boolean>>;

function emptyProgress(): ArticleProgress {
  return toArticleProgress({ quizScore: 0, quizTotal: 0, dictScore: 0, dictTotal: 0 });
}

function baseOf(row: ArticleProgress): ProgressBase {
  return {
    quizScore: row.quizScore,
    quizTotal: row.quizTotal,
    dictScore: row.dictScore,
    dictTotal: row.dictTotal,
  };
}

export function loadProgress(): ProgressMap {
  return readLocal<ProgressMap>(PROGRESS_KEY, {});
}

export function saveQuizResult(articleId: string, score: number, total: number) {
  const progress = loadProgress();
  const current = progress[articleId] ?? emptyProgress();
  const next = toArticleProgress({
    ...baseOf(current),
    quizScore: score,
    quizTotal: total,
  });
  progress[articleId] = next;
  writeLocal(PROGRESS_KEY, progress);
  queueProgress(articleId, baseOf(next));
  return next;
}

export function saveDictationResult(articleId: string, score: number, total: number) {
  const progress = loadProgress();
  const current = progress[articleId] ?? emptyProgress();
  const next = toArticleProgress({
    ...baseOf(current),
    dictScore: score,
    dictTotal: total,
  });
  progress[articleId] = next;
  writeLocal(PROGRESS_KEY, progress);
  queueProgress(articleId, baseOf(next));
  queueDictation(articleId, score, total);
  return next;
}

export function recordQuizAnswer(articleId: string, index: number, correct: boolean) {
  const answers = readLocal<AnswerMap>(ANSWERS_KEY, {});
  if (!answers[articleId]) answers[articleId] = {};
  // Whether this index has been answered before decides `first_try_ok` server
  // side — a retry must never be able to upgrade a wrong first answer.
  const isFirstTry = answers[articleId][index] === undefined;
  answers[articleId][index] = correct;
  writeLocal(ANSWERS_KEY, answers);

  const record = answers[articleId];
  const article = articles.find((item) => item.id === articleId);
  const total = article?.q.length ?? 0;
  const score = Object.values(record).filter(Boolean).length;
  saveQuizResult(articleId, score, total);
  queueAnswer(articleId, index, correct, isFirstTry);
}

export function loadAnswers(articleId: string): Record<number, boolean> {
  return readLocal<AnswerMap>(ANSWERS_KEY, {})[articleId] ?? {};
}

/**
 * 清掉本機的逐題紀錄，讓「再測一次」從頭開始。
 *
 * 刻意不同步這個動作：帳戶那邊保留的是「最好一次」，重測不應該把已有的成績
 * 抹掉。所以這只是本機 UI 狀態的重設。
 */
export function clearAnswers(articleId: string) {
  const answers = readLocal<AnswerMap>(ANSWERS_KEY, {});
  delete answers[articleId];
  writeLocal(ANSWERS_KEY, answers);
}

export function countStarted(progress: ProgressMap) {
  return articles.filter((item) => {
    const row = progress[item.id];
    return row && (row.quizTotal > 0 || row.dictTotal > 0);
  }).length;
}
