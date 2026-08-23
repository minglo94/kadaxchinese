import type { GameId } from "@/data/games";

const KEY = "dse_game_scores_v1";

export type ScoreBoard = Record<GameId, number>;

const EMPTY: ScoreBoard = {
  snake: 0,
  time: 0,
  match: 0,
  sort: 0,
  hangman: 0,
};

function read(): ScoreBoard {
  if (typeof window === "undefined") return { ...EMPTY };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY };
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<ScoreBoard>) };
  } catch {
    return { ...EMPTY };
  }
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
    localStorage.setItem(KEY, JSON.stringify(board));
  }
  return { high: Math.max(prev, score), isNew };
}
