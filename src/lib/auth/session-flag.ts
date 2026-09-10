/**
 * 「現在有沒有登入」的極簡客戶端旗標。
 *
 * `useCurrentUserState()` 是 hook，非 React 模組（例如 `ask-ai.ts`）用不了。
 * 而 AI 的 server function 全部掛了 `authMiddleware`，未登入呼叫會回 401，
 * 在 console 留下錯誤 —— 而 `scripts/browser-smoke.mjs` 以 console 無錯誤為
 * 通過條件。所以未登入時要在發出請求之前就擋住。
 *
 * 由 `<SessionBridge/>` 在 `AppShell` 內設定；SSR 時是 false，而所有讀取都
 * 發生在事件處理器裡，不影響首屏。
 */
let signedIn = false;

export function setSignedIn(value: boolean): void {
  signedIn = value;
}

export function isSignedIn(): boolean {
  return signedIn;
}

/** 統一的擋 UI 文案，讓五個 AI 入口說同一句話。 */
export const AI_SIGN_IN_HINT = "AI 助教需要登入，或在助教面板貼上自己的 Gemini 金鑰。";
