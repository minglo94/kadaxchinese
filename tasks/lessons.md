# Lessons

## 2026-09-10 — TanStack Start：server function 模組不要拆多個檔案

**症狀**：`vite dev` 完全正常、`npm run build` 成功，但 `npm run preview`（生產產物）
每個請求都 500，log 是 `SyntaxError: Export 'ssr_exports' is not defined in module`。

**根因**：baseline 的 SSR entry 是單一 `_ssr/ssr.mjs`，自己定義 `var ssr_exports = __exportAll({...})`。
我把 server functions 拆成五個模組（`api` / `progress-api` / `report-api` / `advice-api` / `school-api`），
TanStack Start 的 server runtime 於是被多個 chunk 共用，rolldown 把 SSR entry 拆成
`ssr.mjs` + `ssr2.mjs`，並在拆分時弄丟了 entry 自己的 namespace ——
`ssr.mjs` 匯出 `ssr_exports as s`，卻只 import 了 `server_default as s`。

**修法**：把全部 server functions 合併成單一 `src/lib/classroom/server-fns.ts`。
`ssr2.mjs` 不再產生，preview 回到 200。

**教訓**
1. **`npm run build` 通過不等於生產可用。** 一定要跑 `npm run preview` 並真的發一個請求；
   這個 bug 只有那一步抓得到。
2. 出現「dev 正常、built 壞掉」時，先比對 baseline 的 build 產物結構
   （這個 repo 的 `.vercel/output` 有 commit，`git show HEAD:...` 就能對照），
   比憑猜測二分搜尋快得多。我在猜「是不是 authMiddleware」上白花了六七輪 build。
3. **不要把 module namespace 存進變數**再用：
   `const guards = () => import("./x"); (await guards()).fn()` 會誘發同一類 namespace 缺陷。
   一律把 `import()` 寫在呼叫點上：`(await import("./x")).fn()`。

## 2026-09-10 — placeholder 文字也會被打包進瀏覽器

把教師碼的回退值寫進 `<input placeholder="例如 KADAX-TEACHER">`，
結果 `grep -rl "KADAX-" .vercel/output/static/` 直接命中 —— 等於把碼公開給每一個學生。
**教訓**：任何「機密」字串，連範例、placeholder、註解都不要放在會進客戶端的檔案；
建置完成後養成習慣 grep 一次產物（順手也 grep `pg` / `pglite` 有沒有洩漏進前端）。

## 2026-09-10 — SSR 與首次 client render 必須渲染同一個分支

`useCurrentUserState()` 在伺服器與 hydration 前後給出不同的 `isPending`，
所有 auth gate 因此在 SSR 與首屏挑了不同分支，React 報 hydration mismatch
（`browser-smoke.mjs` 以 console 無錯誤為通過條件，所以這會直接讓驗證失敗）。
**修法**：`useHydrated()` —— 在 mount 之前一律渲染 skeleton，之後才切到真實分支。
連 `disabled={...isPending}` 這種 attribute 都要一起關進同一個閘門。
