/**
 * AI 供應商解析與呼叫 —— server-only。
 *
 * 從 `src/lib/ai.ts` 搬出來的原因：`ai.ts` 被客戶端的 `src/lib/ask-ai.ts`
 * import，而一個讀 `process.env` 的非 server-fn helper 若 export 自那個模組，
 * 就會被打包進瀏覽器。`.server.ts` 讓這件事不可能發生。
 */
import { completeGemini, type ChatMessage, type AiResult } from "@/lib/gemini";

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

async function completeXai(
  apiKey: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<AiResult> {
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

export { complete as aiComplete };
export function hasEnvProvider(): { geminiEnv: boolean; xaiEnv: boolean } {
  return {
    geminiEnv: Boolean(envGeminiKey()),
    xaiEnv: Boolean((process.env.XAI_API_KEY ?? "").trim()),
  };
}
