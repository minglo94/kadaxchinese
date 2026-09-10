/**
 * Shared classroom types — NO server imports, so client components can use
 * these freely. Server-only helpers live in `guards.server.ts` / `api.ts`.
 */
import type { ArticleProgress } from "@/data/types";
import type { GameId } from "@/data/games";

/**
 * 'admin' = 科主任：全校唯讀。它是唯一一個不靠 classroom_members 就有讀取權
 * 的角色，所以註冊時要科主任碼。
 */
export type Role = "teacher" | "student" | "admin";

export const ROLE_LABELS: Record<Role, string> = {
  teacher: "老師",
  student: "學生",
  admin: "科主任",
};

/** 每個角色登入後的落地頁。 */
export function roleHome(role: Role): "/teacher" | "/me" | "/admin" {
  if (role === "teacher") return "/teacher";
  if (role === "admin") return "/admin";
  return "/me";
}

/** 落地頁的稱呼。導覽列與首頁入口共用，避免兩處寫法不一致。 */
export const ROLE_HOME_LABELS: Record<Role, string> = {
  teacher: "我的班房",
  student: "我的進度",
  admin: "全校總覽",
};

export type Profile = {
  userId: string;
  role: Role;
  displayName: string | null;
  email: string | null;
};

export type ClassroomSummary = {
  id: number;
  name: string;
  subject: string | null;
  joinCode: string;
  joinOpen: boolean;
  ownerName: string | null;
  createdAtMs: number;
  studentCount: number;
};

/** One row of the teacher's roster table. */
export type StudentRow = {
  userId: string;
  displayName: string | null;
  email: string | null;
  joinedAtMs: number;
  /** 已開始的範文數 / 12 */
  startedArticles: number;
  /** 整體答對率 0-100 */
  overallPercent: number;
  /** 最弱的能力維度標籤，資料不足時為 null */
  weakestLabel: string | null;
  lastActiveAtMs: number | null;
};

/** A roster entry that was invited by email but has not signed in yet. */
export type PendingInvite = {
  email: string;
  invitedAtMs: number;
};

export type PracticeEvent = {
  kind: "quiz" | "dictation" | "game";
  articleId: string | null;
  gameId: GameId | null;
  score: number | null;
  total: number | null;
  durationMs: number | null;
  createdAtMs: number;
};

/** What the sync layer pulls down (derived fields included, ready to render). */
export type ProgressSnapshot = {
  articles: Array<{ articleId: string } & ArticleProgress>;
  answers: Array<{
    articleId: string;
    questionIndex: number;
    correct: boolean;
    firstTryOk: boolean;
  }>;
  scores: Array<{ gameId: GameId; highScore: number }>;
};

/**
 * What the sync layer pushes up. Only the stored base fields — derived
 * numbers are never trusted from a client, and every field is re-validated
 * server-side against the real article before it is written.
 */
export type ProgressPush = {
  articles: Array<{
    articleId: string;
    quizScore: number;
    quizTotal: number;
    dictScore: number;
    dictTotal: number;
  }>;
  answers: Array<{
    articleId: string;
    questionIndex: number;
    correct: boolean;
    firstTryOk: boolean;
  }>;
  scores: Array<{ gameId: GameId; highScore: number }>;
  events: Array<{
    kind: "quiz" | "dictation" | "game";
    articleId?: string | null;
    gameId?: GameId | null;
    score?: number | null;
    total?: number | null;
    durationMs?: number | null;
  }>;
};

/** Errors the client matches on by message (same contract as UnauthorizedError). */
export const PROFILE_REQUIRED = "ProfileRequired";
export const FORBIDDEN = "Forbidden";
export const NOT_FOUND = "NotFound";
