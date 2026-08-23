import { sanitizeGeminiKey } from "@/lib/gemini";

const STORAGE = "dse_gemini_api_key";

export function getGeminiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return sanitizeGeminiKey(localStorage.getItem(STORAGE) ?? "");
  } catch {
    return "";
  }
}

export function setGeminiKey(key: string) {
  const trimmed = sanitizeGeminiKey(key);
  if (!trimmed) {
    clearGeminiKey();
    return;
  }
  localStorage.setItem(STORAGE, trimmed);
}

export function clearGeminiKey() {
  try {
    localStorage.removeItem(STORAGE);
  } catch {
    /* ignore */
  }
}

export function withGeminiKey<T extends object>(data: T): T & { geminiKey?: string } {
  const geminiKey = getGeminiKey();
  return geminiKey ? { ...data, geminiKey } : data;
}
