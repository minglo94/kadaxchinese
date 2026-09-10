/**
 * 進度雲端同步 —— 瀏覽器專用，離線優先。
 *
 * 設計取捨：本機 `localStorage` 仍然是唯一的寫入路徑，同步是「事後追上」。
 * 這樣 `progress.ts` / `scores.ts` 的 API 不用變成 async，11 個呼叫點
 * （測驗、默書、5 個遊戲…）一行都不用改，而且網絡失敗永遠不會卡住學習流程。
 *
 * SSR 安全：`AppShell` 會在伺服器渲染，所以沒有 `window` 時每一個 export
 * 都必須是 no-op。
 */
import type { ArticleProgress } from "@/data/types";
import type { GameId } from "@/data/games";
import { mergeBase, toArticleProgress, type ProgressBase } from "@/lib/analytics/progress-shape";
import {
  ANSWERS_KEY,
  MERGED_KEY,
  PROGRESS_KEY,
  SCORES_KEY,
  readLocal,
  writeLocal,
} from "@/lib/local-store";
import type { ProgressPush } from "@/lib/classroom/types";

/** Fired after a pull+merge so open views can re-read localStorage. */
export const PROGRESS_SYNCED_EVENT = "dse:progress-synced";

export type SyncStatus = "off" | "idle" | "syncing" | "error";
export type SyncState = { status: SyncStatus; lastSyncedAtMs: number | null };

type LocalProgressMap = Record<string, ArticleProgress>;
type LocalAnswerMap = Record<string, Record<number, boolean>>;
type LocalScores = Partial<Record<GameId, number>>;

type Pending = {
  articles: Map<string, ProgressBase>;
  answers: Map<string, ProgressPush["answers"][number]>;
  scores: Map<GameId, number>;
  events: ProgressPush["events"];
};

function emptyPending(): Pending {
  return { articles: new Map(), answers: new Map(), scores: new Map(), events: [] };
}

const state: {
  userId: string | null;
  status: SyncStatus;
  lastSyncedAtMs: number | null;
  pending: Pending;
  timer: ReturnType<typeof setTimeout> | null;
  inFlight: boolean;
  listeners: Set<() => void>;
  unloadBound: boolean;
} = {
  userId: null,
  status: "off",
  lastSyncedAtMs: null,
  pending: emptyPending(),
  timer: null,
  inFlight: false,
  listeners: new Set(),
  unloadBound: false,
};

const browser = () => typeof window !== "undefined";

/**
 * The server-fn module is imported DYNAMICALLY on purpose. This file is
 * reachable from the root render path (`AppShell` → `progress.ts`), and a
 * module that uses `authMiddleware` must not be a static dependency of the root
 * SSR chunk while other route chunks also use it — the production bundle then
 * emits a namespace object it never defines and the built server dies with
 * "Export 'ssr_exports' is not defined in module", while `vite dev` is fine.
 */
const progressApi = () => import("@/lib/classroom/server-fns");

function setStatus(status: SyncStatus) {
  if (state.status === status) return;
  state.status = status;
  state.listeners.forEach((fn) => fn());
}

export function getSyncState(): SyncState {
  return { status: state.status, lastSyncedAtMs: state.lastSyncedAtMs };
}

export function subscribeSync(listener: () => void): () => void {
  state.listeners.add(listener);
  return () => state.listeners.delete(listener);
}

/* ------------------------------------------------------------------ queueing */

const DEBOUNCE_MS = 800;

function schedule() {
  if (!state.userId || state.timer) return;
  state.timer = setTimeout(() => {
    state.timer = null;
    void flushNow();
  }, DEBOUNCE_MS);
}

function hasPending(): boolean {
  const p = state.pending;
  return p.articles.size > 0 || p.answers.size > 0 || p.scores.size > 0 || p.events.length > 0;
}

export function queueProgress(articleId: string, progress: ProgressBase): void {
  if (!browser() || !state.userId) return;
  const prev = state.pending.articles.get(articleId);
  state.pending.articles.set(articleId, prev ? mergeBase(prev, progress) : { ...progress });
  schedule();
}

export function queueAnswer(
  articleId: string,
  questionIndex: number,
  correct: boolean,
  isFirstTry: boolean,
): void {
  if (!browser() || !state.userId) return;
  const key = `${articleId}#${questionIndex}`;
  const prev = state.pending.answers.get(key);
  state.pending.answers.set(key, {
    articleId,
    questionIndex,
    correct: correct || prev?.correct === true,
    // Only a genuine first attempt may set this; a retry can never upgrade it.
    firstTryOk: prev?.firstTryOk === true ? true : isFirstTry && correct,
  });
  state.pending.events.push({ kind: "quiz", articleId, score: correct ? 1 : 0, total: 1 });
  schedule();
}

export function queueGameScore(gameId: GameId, score: number): void {
  if (!browser() || !state.userId) return;
  const prev = state.pending.scores.get(gameId) ?? 0;
  state.pending.scores.set(gameId, Math.max(prev, score));
  state.pending.events.push({ kind: "game", gameId, score });
  schedule();
}

export function queueDictation(articleId: string, score: number, total: number): void {
  if (!browser() || !state.userId) return;
  state.pending.events.push({ kind: "dictation", articleId, score, total });
  schedule();
}

/* ------------------------------------------------------------------ flushing */

function takePending(): ProgressPush {
  const p = state.pending;
  state.pending = emptyPending();
  return {
    articles: [...p.articles].map(([articleId, base]) => ({ articleId, ...base })),
    answers: [...p.answers.values()],
    scores: [...p.scores].map(([gameId, highScore]) => ({ gameId, highScore })),
    events: p.events,
  };
}

function mergeBackIn(batch: ProgressPush) {
  // Failed push: fold the batch back so nothing is silently dropped.
  for (const row of batch.articles) {
    const { articleId, ...base } = row;
    const prev = state.pending.articles.get(articleId);
    state.pending.articles.set(articleId, prev ? mergeBase(prev, base) : base);
  }
  for (const answer of batch.answers) {
    const key = `${answer.articleId}#${answer.questionIndex}`;
    if (!state.pending.answers.has(key)) state.pending.answers.set(key, answer);
  }
  for (const score of batch.scores) {
    const prev = state.pending.scores.get(score.gameId) ?? 0;
    state.pending.scores.set(score.gameId, Math.max(prev, score.highScore));
  }
  state.pending.events.unshift(...batch.events);
}

export async function flushNow(): Promise<void> {
  if (!browser() || !state.userId || state.inFlight || !hasPending()) return;
  state.inFlight = true;
  setStatus("syncing");
  const batch = takePending();
  try {
    const { pushMyProgress } = await progressApi();
    await pushMyProgress({ data: batch });
    state.lastSyncedAtMs = Date.now();
    setStatus("idle");
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      // Session gone. Stop trying — a retry storm would just log 401s.
      disableSync();
      return;
    }
    mergeBackIn(batch);
    setStatus("error");
  } finally {
    state.inFlight = false;
  }
  if (hasPending()) schedule();
}

/* ------------------------------------------------------------ merge on login */

function localSnapshot() {
  return {
    progress: readLocal<LocalProgressMap>(PROGRESS_KEY, {}),
    answers: readLocal<LocalAnswerMap>(ANSWERS_KEY, {}),
    scores: readLocal<LocalScores>(SCORES_KEY, {}),
  };
}

function mergedFlags(): Record<string, boolean> {
  return readLocal<Record<string, boolean>>(MERGED_KEY, {});
}

/** True when this device's guest progress has already been adopted by `userId`. */
export function hasAdopted(userId: string): boolean {
  return mergedFlags()[userId] === true;
}

/**
 * Pull the account's progress, merge it with whatever is on this device, write
 * the result back locally AND push it up, so both sides converge.
 *
 * This is also the migration path for people who used the app before accounts
 * existed: their localStorage rows are adopted by the first account that signs
 * in on the device — ONCE, tracked in `MERGED_KEY`. On a shared school
 * computer that would otherwise donate one student's work to the next.
 */
export async function adopt(userId: string): Promise<{ adoptedLocal: boolean }> {
  if (!browser()) return { adoptedLocal: false };
  setStatus("syncing");
  let server: Awaited<
    ReturnType<(typeof import("@/lib/classroom/server-fns"))["pullMyProgress"]>
  >;
  try {
    const { pullMyProgress } = await progressApi();
    server = await pullMyProgress();
  } catch {
    setStatus("error");
    return { adoptedLocal: false };
  }

  const local = localSnapshot();
  const firstAdoption = !hasAdopted(userId);

  // --- articles -----------------------------------------------------------
  const mergedProgress: LocalProgressMap = {};
  const articleIds = new Set<string>([
    ...Object.keys(local.progress),
    ...server.articles.map((row) => row.articleId),
  ]);
  const pushArticles: ProgressPush["articles"] = [];
  for (const articleId of articleIds) {
    const localRow = local.progress[articleId];
    const serverRow = server.articles.find((row) => row.articleId === articleId);
    const localBase: ProgressBase = localRow
      ? {
          quizScore: localRow.quizScore ?? 0,
          quizTotal: localRow.quizTotal ?? 0,
          dictScore: localRow.dictScore ?? 0,
          dictTotal: localRow.dictTotal ?? 0,
        }
      : { quizScore: 0, quizTotal: 0, dictScore: 0, dictTotal: 0 };
    const serverBase: ProgressBase = serverRow
      ? {
          quizScore: serverRow.quizScore,
          quizTotal: serverRow.quizTotal,
          dictScore: serverRow.dictScore,
          dictTotal: serverRow.dictTotal,
        }
      : { quizScore: 0, quizTotal: 0, dictScore: 0, dictTotal: 0 };
    // A device that has already been adopted must not re-donate its local rows.
    const base = firstAdoption ? mergeBase(localBase, serverBase) : serverBase;
    mergedProgress[articleId] = toArticleProgress(base);
    if (firstAdoption && localRow) pushArticles.push({ articleId, ...base });
  }

  // --- answers ------------------------------------------------------------
  const mergedAnswers: LocalAnswerMap = {};
  for (const row of server.answers) {
    mergedAnswers[row.articleId] ??= {};
    mergedAnswers[row.articleId][row.questionIndex] = row.correct;
  }
  const pushAnswers: ProgressPush["answers"] = [];
  if (firstAdoption) {
    for (const [articleId, byIndex] of Object.entries(local.answers)) {
      for (const [indexText, correct] of Object.entries(byIndex)) {
        const questionIndex = Number(indexText);
        mergedAnswers[articleId] ??= {};
        mergedAnswers[articleId][questionIndex] =
          mergedAnswers[articleId][questionIndex] === true || correct === true;
        pushAnswers.push({
          articleId,
          questionIndex,
          correct: correct === true,
          // Unknown for pre-account data — never claim a first-try success.
          firstTryOk: false,
        });
      }
    }
  }

  // --- game scores --------------------------------------------------------
  const mergedScores: LocalScores = {};
  for (const row of server.scores) mergedScores[row.gameId] = row.highScore;
  const pushScores: ProgressPush["scores"] = [];
  if (firstAdoption) {
    for (const [gameId, score] of Object.entries(local.scores) as Array<[GameId, number]>) {
      const best = Math.max(mergedScores[gameId] ?? 0, score ?? 0);
      mergedScores[gameId] = best;
      if ((score ?? 0) > 0) pushScores.push({ gameId, highScore: best });
    }
  }

  writeLocal(PROGRESS_KEY, mergedProgress);
  writeLocal(ANSWERS_KEY, mergedAnswers);
  writeLocal(SCORES_KEY, mergedScores);
  writeLocal(MERGED_KEY, { ...mergedFlags(), [userId]: true });

  const donated = pushArticles.length + pushAnswers.length + pushScores.length > 0;
  if (donated) {
    try {
      const { pushMyProgress } = await progressApi();
      await pushMyProgress({
        data: { articles: pushArticles, answers: pushAnswers, scores: pushScores, events: [] },
      });
    } catch {
      // The local copy is already correct; the next queued write retries.
    }
  }

  state.lastSyncedAtMs = Date.now();
  setStatus("idle");
  window.dispatchEvent(new Event(PROGRESS_SYNCED_EVENT));
  return { adoptedLocal: firstAdoption && donated };
}

/* ------------------------------------------------------------ enable/disable */

export function enableSync(userId: string): void {
  if (!browser() || state.userId === userId) return;
  state.userId = userId;
  setStatus("idle");
  if (!state.unloadBound) {
    state.unloadBound = true;
    // Best effort: get the last few answers out before the tab goes away.
    window.addEventListener("pagehide", () => void flushNow());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") void flushNow();
    });
  }
  void adopt(userId);
}

export function disableSync(): void {
  state.userId = null;
  state.pending = emptyPending();
  if (state.timer) {
    clearTimeout(state.timer);
    state.timer = null;
  }
  setStatus("off");
}
