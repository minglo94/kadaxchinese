import type { GameId } from "@/data/games";
import { SCORES_KEY, readLocal, writeLocal } from "@/lib/local-store";
import { queueGameScore } from "@/lib/progress-sync";

const EMPTY: ScoreBoard = {
  snake: 0,
  time: 0,
  match: 0,
  sort: 0,
  hangman: 0,
};

export type ScoreBoard = Record<GameId, number>;

function read(): ScoreBoard {
  return { ...EMPTY, ...readLocal<Partial<ScoreBoard>>(SCORES_KEY, {}) };
}

export function loadScores(): ScoreBoard {
  return read();
}

export function getHighScore(id: GameId): number {
  return read()[id] ?? 0;
}

export function submitScore(id: GameId, score: number): { high: number; isNew: boolean } {
  const board = read();
  const prev = board[id] ?? 0;
  const isNew = score > prev;
  if (isNew) {
    board[id] = score;
    writeLocal(SCORES_KEY, board);
  }
  // Queued on every run, not only on a new best: the server counts `plays`
  // and the event stream feeds 反應速度 / 最近活動.
  queueGameScore(id, score);
  return { high: Math.max(prev, score), isNew };
}
