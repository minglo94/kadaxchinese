import { authClient } from "./client";

/**
 * 直連 Google 的登入（自架環境用）。
 *
 * `./client` 的 `signIn()` 走的是 broker 那條路（`authClient.signIn.oauth2`
 * 加 `providerId: "grok-google"`），只有 broker 認得的 host 才成立：Grok
 * deployer 注入的 per-app client，或僅限 `*.grok-sandbox.com` 的共用 preview
 * client。放到 Zeabur、Fly 或自己的 VPS 上兩者都不適用。
 *
 * 這裡改用 Better Auth 原生的 social provider（`authClient.signIn.social`），
 * 對應伺服器端 `socialProviders.google`，callback 落在
 * `/api/auth/callback/google` —— 已存在的 `/api/auth/$` catch-all 就會接住。
 *
 * 刻意放在獨立檔案而不是改 `./client`：那個檔案是模板預先接好的
 * （popup、bearer token、sign-out 順序都在裡面），沒有理由為了多一條登入路徑
 * 去動它。要用哪一條由 `authMode` server function 決定。
 */
export async function signInWithGoogleDirect(
  opts: { callbackURL?: string; errorCallbackURL?: string } = {},
): Promise<void> {
  const callbackURL = opts.callbackURL ?? "/";
  const errorCallbackURL = opts.errorCallbackURL ?? callbackURL;

  // 先清掉舊 session，否則換帳號登入會沿用上一個人的身分 ——
  // 學校共用電腦上這一步是必須的（與 `./client` 的 signIn 一致）。
  try {
    await authClient.signOut();
  } catch {
    // 沒有 session 可清就算了，不能因此擋住登入。
  }

  const { data, error } = await authClient.signIn.social({
    provider: "google",
    callbackURL,
    errorCallbackURL,
  });
  if (error) throw new Error(error.message ?? "Google 登入失敗");
  // Better Auth 回傳要跳轉的 Google 授權網址。
  if (data?.url) window.location.href = data.url;
}
