# 部署

這個 app 預設是為 Grok 平台（Vercel + Grok auth broker）建置的。要部署到別的地方，
主要差別有兩個：**build 產物格式**與 **Google 登入怎麼接**。

---

## 一、Build 產物：`NITRO_PRESET`

`vite.config.ts` 的 nitro preset 由 `NITRO_PRESET` 決定，未設定時是 `vercel`
（所以 Grok 平台的建置完全不變）。

| 平台 | `NITRO_PRESET` | 產物 | 啟動方式 |
|---|---|---|---|
| Vercel／Grok | 不設（預設） | `.vercel/output/` | 平台自動偵測 |
| **Zeabur** | `zeabur` | `.zeabur/output/` | 平台自動偵測，**不需要 start command** |

可用的 preset 就是 `node_modules/nitro/dist/presets/` 底下的目錄名
（node、bun、cloudflare、netlify、deno、aws-lambda…）。

---

## 二、Google 登入：兩條路，選一條

### A. Grok 平台上（預設，不用做任何事）

登入聯邦到 Grok 的 auth broker（`auth.grok.me`），憑證由 Grok deployer 注入。

### B. 自架環境（Zeabur、Fly、VPS…）—— **必須改用自己的 Google OAuth client**

broker 的 client 只接受它認得的 host：Grok deployer 發的 per-app client，
或僅限 `*.grok-sandbox.com` 的共用 preview client。**在 `*.zeabur.app` 上兩者都不成立**，
broker 會拒絕 redirect_uri。

所以要在 Google Cloud Console 開一個自己的 OAuth client：

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**，
   Application type 選 **Web application**
2. **Authorized redirect URIs** 加入（一個都不能少，含最後那段路徑）：
   ```
   https://<你的網域>/api/auth/callback/google
   ```
   例如 `https://kadaxchinese.zeabur.app/api/auth/callback/google`
3. 把 client ID / secret 設成環境變數 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

設了這兩個變數之後，app 會自動改用直連 Google（`src/lib/auth/server.ts` 的
`nativeGoogleConfigured`），登入頁也會自動只顯示 Google 按鈕
（X 登入只有 broker 那條路才有，自架環境用不了）。
兩個變數留空 = 完全照舊走 broker，Grok 的部署不受影響。

> 綁自訂網域之後，記得同時更新 Google 的 redirect URI 與 `BETTER_AUTH_URL`。

---

## 三、環境變數

| 變數 | 必要性 | 說明 |
|---|---|---|
| `DATABASE_URL` | **必要** | Postgres 連線字串。**build 階段也要有** —— 見下面第四節 |
| `BETTER_AUTH_SECRET` | **必要** | `openssl rand -hex 32`。不設的話每個 process 自己 mint 隨機 secret，重啟或多開一個 instance 就全部登出 |
| `BETTER_AUTH_URL` | **必要** | 公開 origin，例如 `https://xxx.zeabur.app`。它同時是唯一的 trusted origin，**必須與實際網址完全一致**（含 `https://`、不含尾斜線），否則登入 POST 會被擋成 `Invalid origin` |
| `GOOGLE_CLIENT_ID` | 自架環境**必要** | 見第二節 B |
| `GOOGLE_CLIENT_SECRET` | 自架環境**必要** | 同上 |
| `NITRO_PRESET` | 非 Vercel 時必要 | 例如 `zeabur` |
| `ADMIN_CODE` | **強烈建議** | 科主任註冊碼。repo 內的回退值是公開的，而科主任看得到**全校**成績 |
| `TEACHER_CODE` | 建議 | 教師註冊碼 |
| `GEMINI_API_KEY` | 選用 | AI 助教／學習建議。不設的話使用者仍可自己貼金鑰 |
| `XAI_API_KEY` | 選用 | Gemini 的備援 |
| `VITE_PUBLIC_HOSTNAME` | 選用 | **build 階段**用來產生分享卡的絕對 URL |
| `VITE_AUTH_ENABLED` | 不用設 | 只有等於字串 `"false"` 才關閉登入；不設就是開啟 |

`GROK_AUTH_*`、`GROK_PROJECT_ID`、`GROK_GATE_ORIGIN`、`GROK_CONNECTOR_*`
都是 Grok 平台專屬，自架環境不用設，設了也不會生效。

---

## 四、Migration：`DATABASE_URL` 必須在 build 階段就有

`src/lib/db.ts` 的 `ensureDbReady()` 在有 `DATABASE_URL` 時**直接 return** ——
自動套用 migration 只發生在 PGLite（本機 / 沙盒預覽）那條路。接了真 Postgres 之後，
`migrations/*.sql` 只由 `npm run build` 裡的 `npm run db:migrate` 套用。

所以：

- 如果平台的 build 與 runtime 共用同一組環境變數（Zeabur 預設如此）→ 不用額外做甚麼
- 如果分開 → 要在啟動前另外跑一次 `npm run db:migrate`，否則資料表不存在，
  登入後第一個查詢就會失敗

`_migrations` 以檔名記錄且永不重跑，所以重複執行是安全的。

---

## 五、其他

- **必須 HTTPS。** session cookie 是 `__Host-` 前綴 + `Secure`，HTTP 網域下瀏覽器
  會直接拒收，症狀是「登入好像成功了但其實沒登入」。
- 本機 `npm run preview` 若沒有 `DATABASE_URL`，會走 PGLite 而 build 產物裡沒有
  `pglite.data`／`pglite.wasm`，伺服器會以 `ENOENT` 崩潰。要在本機驗證生產產物，
  把 `node_modules/@electric-sql/pglite/dist/{pglite.data,pglite.wasm,initdb.wasm}`
  複製到 `<output>/functions/*/_libs/` 即可。部署環境有 `DATABASE_URL`，用不到 PGLite。
- `.grok/app-env.json` 的 `deploy.database` 只是給 Grok deployer 看的訊號，
  其他平台要自己開 Postgres。
