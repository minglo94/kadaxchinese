export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiResult = { ok: true; text: string } | { ok: false; error: string; needsKey?: boolean };
export type GeminiOptions = { json?: boolean };

const MODELS = [
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-flash-latest",
  "gemini-3-flash-preview",
  "gemini-3.5-flash-lite",
];

let cachedModel: string | null = null;

export function sanitizeGeminiKey(raw: string): string {
  return raw
    .trim()
    .replace(/^['"`]+|['"`]+$/g, "")
    .replace(/^Bearer\s+/i, "")
    .replace(/^(?:GEMINI_API_KEY|GOOGLE_API_KEY|API_KEY)\s*=\s*/i, "")
    .trim();
}

export function isGeminiAuthKey(key: string): boolean {
  return /^AQ[\w.\-]/i.test(sanitizeGeminiKey(key));
}

export function cleanModelText(raw: string): string {
  let text = raw.replace(/\r/g, "");
  text = text.replace(
    /\b(?:Drafting the response|Thinking(?: process)?|Thought process|Internal monologue|Scratchpad|Conclusion)\b\s*:?/gi,
    "",
  );
  text = text.replace(/^\s*結論\s*[:：]\s*/gm, "");
  text = text.replace(/\*\*([^*\n]+)\*\*/g, "$1");
  text = text.replace(/\*+/g, "");
  text = text.replace(/^[ \t]*[:：]+[ \t]*$/gm, "");
  text = text.replace(/^[\s*:：]+/, "");
  text = text.replace(/[ \t]{2,}/g, " ");
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}

function googleMessage(json: unknown): string {
  if (Array.isArray(json) && json[0] && typeof json[0] === "object") {
    const err = (json[0] as { error?: { message?: string } }).error;
    if (typeof err?.message === "string") return err.message.replace(/\s+/g, " ").trim();
  }
  if (json && typeof json === "object") {
    const err = (json as { error?: { message?: string } }).error;
    if (typeof err?.message === "string") return err.message.replace(/\s+/g, " ").trim();
  }
  return "";
}

function googleErrorStatus(json: unknown): string {
  const pick = (value: unknown): string => {
    if (!value || typeof value !== "object") return "";
    const err = (value as { error?: { status?: string; code?: number } }).error;
    return typeof err?.status === "string" ? err.status : "";
  };
  if (Array.isArray(json) && json[0]) return pick(json[0]);
  return pick(json);
}

function isInvalidKey(status: number, message: string, json?: unknown): boolean {
  const gStatus = json ? googleErrorStatus(json) : "";
  if (gStatus === "UNAUTHENTICATED" || gStatus === "PERMISSION_DENIED") return true;
  if (status === 401 || status === 403) return true;
  return /api[_ ]key|invalid api key|permission|unregistered|caller|not valid|invalid authentication/i.test(
    message,
  );
}

function invalidKeyResult(): AiResult {
  return {
    ok: false,
    error:
      "Gemini API 金鑰無效。請到 Google AI Studio 重新複製完整金鑰（AIza 或 AQ. 開頭皆可）。",
    needsKey: true,
  };
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

type Attempt = { status: number; json: unknown; network?: boolean };

type NativeConfig = {
  auth: "query" | "header";
  json?: boolean;
  thinking?: boolean;
};

function timeoutMs(maxTokens: number): number {
  return maxTokens >= 800 ? 45000 : 28000;
}

async function tryOpenAI(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<Attempt> {
  try {
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.max(512, maxTokens),
        temperature: 0.35,
      }),
      signal: AbortSignal.timeout(timeoutMs(maxTokens)),
    });
    return { status: res.status, json: await readJson(res) };
  } catch {
    return { status: 0, json: null, network: true };
  }
}

function toNativeContents(messages: ChatMessage[]): {
  system: string;
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
} {
  const system = messages
    .filter((item) => item.role === "system")
    .map((item) => item.content)
    .join("\n");
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];
  for (const item of messages) {
    if (item.role === "system") continue;
    const role = item.role === "assistant" ? "model" : "user";
    const last = contents[contents.length - 1];
    if (last && last.role === role) last.parts[0].text += `\n${item.content}`;
    else contents.push({ role, parts: [{ text: item.content }] });
  }
  if (contents.length === 0) contents.push({ role: "user", parts: [{ text: "請開始。" }] });
  else if (contents[0].role === "model") contents.unshift({ role: "user", parts: [{ text: "請開始。" }] });
  return { system, contents };
}

async function tryNative(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  maxTokens: number,
  config: NativeConfig,
): Promise<Attempt> {
  const { system, contents } = toNativeContents(messages);
  const base = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const url = config.auth === "query" ? `${base}?key=${encodeURIComponent(apiKey)}` : base;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (config.auth === "header") headers["x-goog-api-key"] = apiKey;
  const generationConfig: Record<string, unknown> = {
    maxOutputTokens: Math.max(512, maxTokens),
    temperature: 0.35,
  };
  if (config.json) generationConfig.responseMimeType = "application/json";
  if (config.thinking !== false) {
    generationConfig.thinkingConfig = { thinkingBudget: 0, includeThoughts: false };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        contents,
        generationConfig,
        ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      }),
      signal: AbortSignal.timeout(timeoutMs(maxTokens)),
    });
    return { status: res.status, json: await readJson(res) };
  } catch {
    return { status: 0, json: null, network: true };
  }
}

function readOpenAIText(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const content = (json as { choices?: Array<{ message?: { content?: unknown } }> }).choices?.[0]?.message
    ?.content;
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
          return (part as { text: string }).text;
        }
        return "";
      })
      .join("")
      .trim();
  }
  return "";
}

function readNativeText(json: unknown): string {
  if (!json || typeof json !== "object") return "";
  const candidates = (
    json as {
      candidates?: Array<{
        finishReason?: string;
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    }
  ).candidates;
  const first = candidates?.[0];
  if (!first || first.finishReason === "SAFETY") return "";
  const parts = first.content?.parts ?? [];
  return parts
    .filter((part) => part && !part.thought && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
}

function shouldDropThinking(status: number, message: string): boolean {
  return status === 400 && /thinking|includeThoughts|unknown name/i.test(message);
}

function shouldDropJson(status: number, message: string): boolean {
  return status === 400 && /mime|responseMimeType|application\/json/i.test(message);
}

export async function completeGemini(
  apiKey: string,
  messages: ChatMessage[],
  maxTokens: number,
  options: GeminiOptions = {},
): Promise<AiResult> {
  const key = sanitizeGeminiKey(apiKey);
  if (!key) {
    return { ok: false, error: "尚未貼上 Gemini API 金鑰。", needsKey: true };
  }

  const authKey = isGeminiAuthKey(key);
  const nativeModes: Array<"query" | "header"> = authKey ? ["header", "query"] : ["query", "header"];
  const models = [...new Set([cachedModel, ...MODELS].filter((item): item is string => Boolean(item)))];
  let lastMessage = "";
  let lastStatus = 0;
  let nativeRejectedKey = false;

  const finish = (text: string): AiResult => {
    const cleaned = options.json ? text.trim() : cleanModelText(text);
    if (!cleaned) return { ok: false, error: "AI 沒有回傳內容。" };
    return { ok: true, text: cleaned };
  };

  try {
    for (const model of models) {
      if (!authKey) {
        const openai = await tryOpenAI(key, model, messages, maxTokens);
        if (!openai.network) {
          lastStatus = openai.status;
          lastMessage = googleMessage(openai.json);
          if (openai.status === 429) return { ok: false, error: "Gemini 用量已滿，請稍後再試。" };
          if (openai.status >= 200 && openai.status < 300) {
            const text = readOpenAIText(openai.json);
            if (text) {
              cachedModel = model;
              return finish(text);
            }
          }
        }
      }

      let modelKeyRejected = true;
      let modelHadAttempt = false;
      for (const mode of nativeModes) {
        let native = await tryNative(key, model, messages, maxTokens, {
          auth: mode,
          json: options.json,
          thinking: true,
        });
        if (!native.network && shouldDropThinking(native.status, googleMessage(native.json))) {
          native = await tryNative(key, model, messages, maxTokens, {
            auth: mode,
            json: options.json,
            thinking: false,
          });
        }
        if (
          !native.network &&
          options.json &&
          shouldDropJson(native.status, googleMessage(native.json))
        ) {
          native = await tryNative(key, model, messages, maxTokens, {
            auth: mode,
            json: false,
            thinking: false,
          });
        }
        if (native.network) continue;
        modelHadAttempt = true;
        lastStatus = native.status;
        lastMessage = googleMessage(native.json);
        if (native.status === 429) return { ok: false, error: "Gemini 用量已滿，請稍後再試。" };
        if (native.status >= 200 && native.status < 300) {
          const text = readNativeText(native.json);
          if (text) {
            cachedModel = model;
            return finish(text);
          }
          return { ok: false, error: "AI 沒有回傳內容。" };
        }
        if (!isInvalidKey(native.status, lastMessage, native.json)) {
          modelKeyRejected = false;
        }
      }
      nativeRejectedKey = modelHadAttempt && modelKeyRejected;
      if (nativeRejectedKey) break;
    }

    if (nativeRejectedKey) return invalidKeyResult();

    return {
      ok: false,
      error: lastMessage
        ? `Gemini 連線失敗（${lastStatus}）：${lastMessage.slice(0, 180)}`
        : "無法連上 Gemini。請確認金鑰來自 aistudio.google.com/apikey（AIza 或 AQ. 開頭皆可）。",
      needsKey: lastStatus === 404 || lastStatus === 400,
    };
  } catch {
    return { ok: false, error: "連線逾時或被瀏覽器攔截，請再試一次。" };
  }
}

export async function pingGemini(apiKey: string): Promise<AiResult> {
  return completeGemini(
    apiKey,
    [
      { role: "system", content: "只回兩個字：就緒" },
      { role: "user", content: "測試連線" },
    ],
    32,
  );
}
