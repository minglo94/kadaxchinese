import { explainQuiz, generateQuiz, gradeDictation, pingAi, tutorChat } from "@/lib/ai";
import {
  AI_TOKENS,
  explainMessages,
  generateQuizMessages,
  gradeMessages,
  parseGeneratedQuiz,
  tutorMessages,
} from "@/lib/ai-tasks";
import { completeGemini } from "@/lib/gemini";
import { getGeminiKey, withGeminiKey } from "@/lib/gemini-key";

function localKey(): string {
  return getGeminiKey();
}

export async function pingAssistant(geminiKey?: string) {
  const key = (geminiKey ?? localKey()).trim();
  if (key) return completeGemini(key, [
    { role: "system", content: "只回兩個字：就緒" },
    { role: "user", content: "測試連線" },
  ], AI_TOKENS.ping);
  return pingAi({ data: {} });
}

export async function askTutor(input: {
  articleId?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const key = localKey();
  if (!key) return tutorChat({ data: withGeminiKey(input) });
  return completeGemini(key, tutorMessages(input.articleId, input.messages), AI_TOKENS.tutor);
}

export async function askExplain(input: {
  articleTitle: string;
  question: string;
  options: string[];
  correctIndex: number;
  pickedIndex: number;
}) {
  const key = localKey();
  if (!key) return explainQuiz({ data: withGeminiKey(input) });
  return completeGemini(key, explainMessages(input), AI_TOKENS.explain);
}

export async function askGrade(input: {
  articleTitle: string;
  sentence: string;
  expected: string[];
  given: string[];
}) {
  const key = localKey();
  if (!key) return gradeDictation({ data: withGeminiKey(input) });
  return completeGemini(key, gradeMessages(input), AI_TOKENS.grade);
}

export async function askGenerateQuiz(articleId: string) {
  const key = localKey();
  if (!key) return generateQuiz({ data: withGeminiKey({ articleId }) });

  const built = generateQuizMessages(articleId);
  if ("error" in built) return { ok: false as const, error: built.error };

  const result = await completeGemini(key, built, AI_TOKENS.quiz, { json: true });
  if (!result.ok) return result;
  return parseGeneratedQuiz(result.text);
}
