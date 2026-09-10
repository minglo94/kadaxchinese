/**
 * 本機儲存的單一入口。
 *
 * 抽出來的原因有兩個：`progress.ts` 與 `scores.ts` 各自有一份 SSR-safe 的
 * read/write；而同步層要讀寫同樣的鍵，若直接 import `progress.ts` 就會形成
 * `progress.ts ⇄ progress-sync.ts` 的執行期循環。
 */
export const PROGRESS_KEY = "dse_progress";
export const ANSWERS_KEY = "dse_quiz_answers";
export const SCORES_KEY = "dse_game_scores_v1";
/** Marks that this device's guest progress has been adopted by an account. */
export const MERGED_KEY = "dse_sync_merged_v1";

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota exhausted — losing a cache write must not break the
    // lesson the student is in the middle of.
  }
}
