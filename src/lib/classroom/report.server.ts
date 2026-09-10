/**
 * 報告組裝 —— server-only。
 *
 * 這裡只做「讀 SQL → 餵給 `computeAbility`」。能力公式本身在
 * `src/lib/analytics/ability.ts`，客戶端與伺服器共用同一份，所以學生看到的
 * 雷達圖與老師看到的永遠一致。
 *
 * 注意：餵給能力分析的逐題資料用 `first_try_ok`，不是 `correct`。
 * `correct` 是 max-wins（曾經答對），拿它算能力會被重複作答推到接近 100%。
 */
import { articles } from "@/data/articles";
import type { GameId } from "@/data/games";
import type { ArticleProgress } from "@/data/types";
import { computeAbility, weakestLabel, type AbilityReport } from "@/lib/analytics/ability";
import { toArticleProgress } from "@/lib/analytics/progress-shape";
import { getSql } from "@/lib/db";
import type { PracticeEvent, StudentRow } from "./types";

export type LearnerReport = {
  userId: string;
  displayName: string | null;
  email: string | null;
  ability: AbilityReport;
  /** 逐篇進度，順序與 `articles` 一致。 */
  articles: Array<{ id: string; title: string; progress: ArticleProgress | null }>;
  scores: Partial<Record<GameId, number>>;
  recent: PracticeEvent[];
  lastActiveAtMs: number | null;
  advice: { content: string; generatedAtMs: number } | null;
};

async function loadRaw(userId: string) {
  const sql = await getSql();
  const [progressRows, answerRows, scoreRows, eventRows, adviceRows] = await Promise.all([
    sql<{
      articleId: string;
      quizScore: number;
      quizTotal: number;
      dictScore: number;
      dictTotal: number;
    }>`
      select article_id as "articleId",
             quiz_score as "quizScore", quiz_total as "quizTotal",
             dict_score as "dictScore", dict_total as "dictTotal"
      from article_progress where user_id = ${userId}
    `,
    sql<{ articleId: string; questionIndex: number; firstTryOk: boolean }>`
      select article_id as "articleId", question_index as "questionIndex",
             first_try_ok as "firstTryOk"
      from quiz_answers where user_id = ${userId}
    `,
    sql<{ gameId: GameId; highScore: number }>`
      select game_id as "gameId", high_score as "highScore"
      from game_scores where user_id = ${userId}
    `,
    sql<PracticeEvent>`
      select kind, article_id as "articleId", game_id as "gameId",
             score, total, duration_ms as "durationMs",
             (extract(epoch from created_at) * 1000)::bigint as "createdAtMs"
      from practice_events where user_id = ${userId}
      order by created_at desc limit 20
    `,
    sql<{ content: string; generatedAtMs: number }>`
      select advice as content,
             (extract(epoch from created_at) * 1000)::bigint as "generatedAtMs"
      from ai_advice
      where scope_key = ${`student:${userId}`}
      order by created_at desc limit 1
    `,
  ]);
  return { progressRows, answerRows, scoreRows, eventRows, adviceRows };
}

export async function buildLearnerReport(
  userId: string,
  identity: { displayName: string | null; email: string | null },
): Promise<LearnerReport> {
  const { progressRows, answerRows, scoreRows, eventRows, adviceRows } = await loadRaw(userId);

  const progress: Record<string, ArticleProgress> = {};
  for (const { articleId, ...base } of progressRows) {
    progress[articleId] = toArticleProgress(base);
  }

  const answers: Record<string, Record<number, boolean>> = {};
  for (const row of answerRows) {
    answers[row.articleId] ??= {};
    answers[row.articleId][row.questionIndex] = row.firstTryOk;
  }

  const scores: Partial<Record<GameId, number>> = {};
  for (const row of scoreRows) scores[row.gameId] = row.highScore;

  return {
    userId,
    displayName: identity.displayName,
    email: identity.email,
    ability: computeAbility({ progress, answers, scores }),
    articles: articles.map((article) => ({
      id: article.id,
      title: article.title,
      progress: progress[article.id] ?? null,
    })),
    scores,
    recent: eventRows,
    lastActiveAtMs: eventRows[0]?.createdAtMs ?? null,
    advice: adviceRows[0] ?? null,
  };
}

/** 老師名單那張表的一行。刻意只回摘要，不回逐篇明細。 */
export async function buildStudentRows(classroomId: number): Promise<StudentRow[]> {
  const sql = await getSql();
  const members = await sql<{
    userId: string;
    displayName: string | null;
    email: string | null;
    joinedAtMs: number;
  }>`
    select m.user_id as "userId",
           coalesce(p.display_name, u."name") as "displayName",
           coalesce(p.email, lower(u."email")) as "email",
           (extract(epoch from m.joined_at) * 1000)::bigint as "joinedAtMs"
    from classroom_members m
    left join profiles p on p.user_id = m.user_id
    left join "user" u on u."id" = m.user_id
    where m.classroom_id = ${classroomId} and m.role = 'student'
    order by m.joined_at
  `;

  const rows: StudentRow[] = [];
  for (const member of members) {
    const report = await buildLearnerReport(member.userId, {
      displayName: member.displayName,
      email: member.email,
    });
    rows.push({
      userId: member.userId,
      displayName: member.displayName,
      email: member.email,
      joinedAtMs: member.joinedAtMs,
      startedArticles: report.ability.completion.startedArticles,
      overallPercent: report.ability.overallPercent,
      weakestLabel: weakestLabel(report.ability.dimensions),
      lastActiveAtMs: report.lastActiveAtMs,
    });
  }
  return rows;
}
