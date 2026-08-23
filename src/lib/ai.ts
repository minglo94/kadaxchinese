import { createServerFn } from "@tanstack/react-start";
import {
  AI_TOKENS,
  explainMessages,
  generateQuizMessages,
  gradeMessages,
  parseGeneratedQuiz,
  tutorMessages,
} from "@/lib/ai-tasks";
import { completeGemini } from "@/lib/gemini";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type AiFail = { ok: false; error: string; needsKey?: boolean };
type AiOk = { ok: true; text: string };
type AiResult = AiOk | AiFail;

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

function envGeminiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    ""
  ).trim();
}

function resolveProvider(clientKey?: string): { provider: "gemini" | "xai"; key: string } | null {
  const gemini = (clientKey ?? "").trim() || envGeminiKey();
  if (gemini) return { provider: "gemini", key: gemini };
  const xai = (process.env.XAI_API_KEY ?? "").trim();
  if (xai) return { provider: "xai", key: xai };
  return null;
}

async function completeXai(apiKey: string, messages: ChatMessage[], maxTokens: number): Promise<AiResult> {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      messages,
      max_tokens: maxTokens,
      temperature: 0.35,
    }),
    signal: AbortSignal.timeout(maxTokens >= 800 ? 45000 : 28000),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      return {
        ok: false,
        error: "備用引擎未能連線。請在設定中貼上 Gemini API 金鑰。",
        needsKey: true,
      };
    }
    return { ok: false, error: "AI 服務忙碌，請稍後再試。" };
  }
  const body = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = body.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) return { ok: false, error: "AI 沒有回傳內容。" };
  return { ok: true, text };
}

async function complete(
  messages: ChatMessage[],
  maxTokens: number,
  clientKey?: string,
  json = false,
): Promise<AiResult> {
  const resolved = resolveProvider(clientKey);
  if (!resolved) {
    return {
      ok: false,
      error: "尚未設定 Gemini API 金鑰。請在助教面板貼上金鑰，或於網站後台加入 GEMINI_API_KEY。",
      needsKey: true,
    };
  }
  try {
    if (resolved.provider === "gemini") {
      return await completeGemini(resolved.key, messages, maxTokens, { json });
    }
    return await completeXai(resolved.key, messages, maxTokens);
  } catch {
    return { ok: false, error: "連線逾時，請稍後再試。" };
  }
}

export const aiStatus = createServerFn({ method: "GET" }).handler(async () => {
  return {
    geminiEnv: Boolean(envGeminiKey()),
    xaiEnv: Boolean((process.env.XAI_API_KEY ?? "").trim()),
  };
});

export const pingAi = createServerFn({ method: "POST" })
  .validator((input: Keyed) => input)
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
  .handler(async ({ data }) => {
    return complete(explainMessages(data), AI_TOKENS.explain, data.geminiKey);
  });

export const gradeDictation = createServerFn({ method: "POST" })
  .validator((input: GradeInput) => input)
  .handler(async ({ data }) => {
    return complete(gradeMessages(data), AI_TOKENS.grade, data.geminiKey);
  });

export const tutorChat = createServerFn({ method: "POST" })
  .validator((input: TutorInput) => input)
  .handler(async ({ data }) => {
    return complete(tutorMessages(data.articleId, data.messages), AI_TOKENS.tutor, data.geminiKey);
  });

export const generateQuiz = createServerFn({ method: "POST" })
  .validator((input: GenerateInput) => input)
  .handler(async ({ data }) => {
    const built = generateQuizMessages(data.articleId);
    if ("error" in built) return { ok: false as const, error: built.error };
    const result = await complete(built, AI_TOKENS.quiz, data.geminiKey, true);
    if (!result.ok) return result;
    return parseGeneratedQuiz(result.text);
  });
