import { articles } from "@/data/articles";
import type { ArticleProgress } from "@/data/types";

const PROGRESS_KEY = "dse_progress";
const ANSWERS_KEY = "dse_quiz_answers";

export type ProgressMap = Record<string, ArticleProgress>;
export type AnswerMap = Record<string, Record<number, boolean>>;

function emptyProgress(): ArticleProgress {
  return {
    quizScore: 0,
    quizTotal: 0,
    dictScore: 0,
    dictTotal: 0,
    score: 0,
    total: 0,
    percent: 0,
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function set(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadProgress(): ProgressMap {
  return read(PROGRESS_KEY, {});
}

export function saveQuizResult(articleId: string, score: number, total: number) {
  const progress = loadProgress();
  const current = progress[articleId] ?? emptyProgress();
  current.quizScore = score;
  current.quizTotal = total;
  current.score = current.quizScore + current.dictScore;
  current.total = current.quizTotal + current.dictTotal;
  current.percent = current.total > 0 ? Math.round((current.score / current.total) * 100) : 0;
  progress[articleId] = current;
  set(PROGRESS_KEY, progress);
  return current;
}

export function saveDictationResult(articleId: string, score: number, total: number) {
  const progress = loadProgress();
  const current = progress[articleId] ?? emptyProgress();
  current.dictScore = score;
  current.dictTotal = total;
  current.score = current.quizScore + current.dictScore;
  current.total = current.quizTotal + current.dictTotal;
  current.percent = current.total > 0 ? Math.round((current.score / current.total) * 100) : 0;
  progress[articleId] = current;
  set(PROGRESS_KEY, progress);
  return current;
}

export function recordQuizAnswer(articleId: string, index: number, correct: boolean) {
  const answers = read<AnswerMap>(ANSWERS_KEY, {});
  if (!answers[articleId]) answers[articleId] = {};
  answers[articleId][index] = correct;
  set(ANSWERS_KEY, answers);
  const record = answers[articleId];
  const article = articles.find((item) => item.id === articleId);
  const total = article?.q.length ?? 0;
  const score = Object.values(record).filter(Boolean).length;
  saveQuizResult(articleId, score, total);
}

export function loadAnswers(articleId: string): Record<number, boolean> {
  return read<AnswerMap>(ANSWERS_KEY, {})[articleId] ?? {};
}

export function clearAnswers(articleId: string) {
  const answers = read<AnswerMap>(ANSWERS_KEY, {});
  delete answers[articleId];
  set(ANSWERS_KEY, answers);
}

export function countStarted(progress: ProgressMap) {
  return articles.filter((item) => {
    const row = progress[item.id];
    return row && (row.quizTotal > 0 || row.dictTotal > 0);
  }).length;
}
