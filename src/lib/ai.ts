import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import {
  AI_TOKENS,
  explainMessages,
  generateQuizMessages,
  gradeMessages,
  parseGeneratedQuiz,
  tutorMessages,
} from "@/lib/ai-tasks";

type Keyed = { geminiKey?: string };

type ExplainInput = Keyed & {
  articleTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  pickedIndex: number;
};

type GradeInput = Keyed & {
  articleTitle: string;
  sentence: string;
  expected: string[];
  given: string[];
};

type TutorInput = Keyed & {
  articleId?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

type GenerateInput = Keyed & {
  articleId: string;
};

/**
 * 供應商解析是 server-only（讀 process.env），所以用動態 import：
 * 這個模組會被客戶端的 `ask-ai.ts` import。
 *
 * import 一定要寫在呼叫點上 —— 把 module namespace 存進變數會讓生產 SSR
 * bundle 產生一個它自己沒有定義的 namespace 物件。
 */
const complete = async (
  ...args: Parameters<typeof import("@/lib/ai-provider.server").aiComplete>
) => (await import("@/lib/ai-provider.server")).aiComplete(...args);

export const aiStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    return (await import("@/lib/ai-provider.server")).hasEnvProvider();
  });

export const pingAi = createServerFn({ method: "POST" })
  .validator((input: Keyed) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return complete(
      [
        { role: "system", content: "只回兩個字：就緒" },
        { role: "user", content: "測試連線" },
      ],
      AI_TOKENS.ping,
      data.geminiKey,
    );
  });

export const explainQuiz = createServerFn({ method: "POST" })
  .validator((input: ExplainInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return complete(explainMessages(data), AI_TOKENS.explain, data.geminiKey);
  });

export const gradeDictation = createServerFn({ method: "POST" })
  .validator((input: GradeInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return complete(gradeMessages(data), AI_TOKENS.grade, data.geminiKey);
  });

export const tutorChat = createServerFn({ method: "POST" })
  .validator((input: TutorInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    return complete(tutorMessages(data.articleId, data.messages), AI_TOKENS.tutor, data.geminiKey);
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .validator((input: GenerateInput) => input)
  .middleware([authMiddleware])
  .handler(async ({ data }) => {
    const built = generateQuizMessages(data.articleId);
    if ("error" in built) return { ok: false as const, error: built.error };
    const result = await complete(built, AI_TOKENS.quiz, data.geminiKey, true);
    if (!result.ok) return result;
    return parseGeneratedQuiz(result.text);
  });
