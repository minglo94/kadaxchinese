# Google 登入 + 老師／學生／科主任班房系統

計劃全文：`/root/.claude/plans/google-dynamic-hare.md`

## Phase 1 — 開啟 Google 登入 ✅
- [x] `.grok/app-env.json`：移除 `VITE_AUTH_ENABLED`、`deploy.database` 改 true
- [x] `cp migrations/auth/0001_auth.sql migrations/0001_auth.sql`
- [x] `src/routes/api/auth/$.ts`（照抄樣板）
- [x] `src/routes/login.tsx` + `src/components/auth/LoginPage.tsx`（水墨風，Google 為主按鈕）
- [x] `src/components/auth/AuthSlot.tsx`（包 `<UserButton/>`，未改 `gates.tsx`）
- [x] NavBar 掛 `AuthSlot` + 角色入口
- [x] `npm run check:auth` → dev 與 build 一致

## Phase 2 — 角色 ✅
- [x] `migrations/0002_classroom.sql`（9 張表，含 admin 角色）
- [x] `src/lib/classroom/types.ts`、`errors.ts`
- [x] `guards.server.ts`：membership 為授權來源；`requireTeacherOfClass`（讀）／`requireClassOwner`（寫）分離
- [x] `teacher-code.server.ts`：教師碼 + 科主任碼
- [x] `getMyProfile` / `setMyRole`
- [x] `profile-store.ts`（zustand，動態 import server-fns）
- [x] `RoleGate.tsx`：`isPending` → skeleton，防閃爍與 hydration 不一致
- [x] `/onboarding` 三張身分卡

## Phase 3 — 進度同步 ✅
- [x] `local-store.ts`（SSR-safe read/write）
- [x] `progress-sync.ts`（800ms debounce、fire-and-forget、max-wins 合併、pagehide flush）
- [x] `pullMyProgress` / `pushMyProgress`（**伺服器端逐欄驗證** + `greatest()` 幂等 upsert）
- [x] `progress.ts` / `scores.ts` 內部掛鉤 —— 11 個元件呼叫點零改動
- [x] `AppShell` 掛 `SessionBridge` + `PROGRESS_SYNCED_EVENT`
- [x] 共用電腦只收編一次（`dse_sync_merged_v1`）

## Phase 4 — 學生儀表板 ✅
- [x] `QuizItem.skill` 欄位 + `articles.json` 逐題標註（120 題：content 38／theme 31／rhetoric 26／vocab 25）
- [x] `skill-tags.ts`（人手標籤優先，關鍵字 fallback 給 AI 出的題）
- [x] `ability.ts`（6 維度純函式，client/server 共用；`sample < 3` 標「資料不足」）
- [x] `/me`：完成度 meter、能力圖、逐篇進度、AI 建議、我的班別

## Phase 5 — 老師端 ✅
- [x] 班房 CRUD、6 位代碼（複製／換碼／停止收人）
- [x] email 名單 + 自動接受邀請 + 撤回 + 移出學生
- [x] `/teacher`、`/teacher/class/$classId`、`/teacher/class/$classId/student/$studentId`
- [x] 全班平均能力、全班最弱範文、可排序學生表

## Phase 6 — AI 學習建議 ✅
- [x] `ai-provider.server.ts`（把讀 env 的 helper 搬離客戶端可 import 的模組）
- [x] `adviceMessages` / `teacherAdviceMessages` / `classAdviceMessages`
- [x] `studentAdvice` / `classAdvice`：授權 → 伺服器算 stats → 指紋快取 24h → 每小時上限 10 次
- [x] 既有 5 個 AI server fn 加 `authMiddleware`；未登入且無本機金鑰時在前端擋住（避免 401 汙染 console）

## Phase 7 — 科主任／admin ✅
- [x] `profiles.role` 加 `'admin'`；註冊需科主任碼（`ADMIN_CODE`）
- [x] `isAdmin` / `requireAdmin`；`requireTeacherOfClass` 放行 admin（唯讀），寫入走 `requireClassOwner`
- [x] `schoolOverview`：全校 KPI、各班進度、全校平均能力、全校最弱範文、跨班最需要跟進
- [x] `/admin` 全校總覽；admin 可開任何班房與學生報告，介面標示「唯讀」

## Phase 8 — 驗證 ✅
- [x] `npm run typecheck`、`npm run lint`（與改動前完全同一基線：3 error 2 warning，全部是既有問題）
- [x] `npm run check:auth` → dev 與 build 一致
- [x] `node scripts/browser-smoke.mjs`（dev 與 built 兩次，桌面＋手機，pageErrors 為空、無橫向溢出）
- [x] `npm run build` + `npm run preview` 生產產物實際渲染
- [x] bundle 洩漏檢查：`pg`／PGLite、教師碼／科主任碼、server-only 模組都不在瀏覽器 bundle 內
- [x] 端到端 54 項全過：5 個真帳號跑完 老師→名單→學生入班→做測驗→進度上雲→換裝置→老師看報告→科主任看全校
- [x] 越權負面測試：其他老師讀不到別人的班房、學生打不開老師頁與 `/admin`、老師打不開 `/admin`、錯誤代碼與錯誤身分碼被拒

## Review

**做了什麼**：把一個只有 localStorage 的自學 app，變成有帳號、班房與三種角色的課堂系統。
Google 登入用的是 repo 內原本就接好但關掉的 Better Auth（`GROK_PROVIDERS` 本來就有 Google），
所以這次不是寫一套 auth，而是開旗標 + 建 schema + 建三個介面。

**幾個關鍵取捨**：

1. **同步接縫放在 `progress.ts` / `scores.ts` 內部**，不是 11 個元件裡。
   所有寫入本來就只發生在這兩個模組，所以加 6 行就完成，元件零改動，API 也不用變 async，離線照舊。
2. **max-wins 是刻意的語意改變**：原本存「最新一次」，現在存「最好一次」。
   最好一次才是老師報告要看的，也是離線同步唯一可交換、幂等的規則（沒有持久化的客戶端時鐘）。
   每次嘗試的歷史記在 `practice_events`，沒有遺失。
3. **能力分析用 `first_try_ok` 而不是 `correct`**。
   `correct` 是 max-wins，拿它算能力會被重複作答推到接近 100%，變成騙老師的數字。
4. **能力預設用條形圖，雷達圖是切換選項**。
   六個具名維度要比較的是大小，條形圖的長度最不容易誤讀；雷達圖的面積會被當成分數、
   軸序又是任意的。雷達圖保留，因為老師習慣看整體形狀。
5. **`profiles.role` 只是偏好，不是權限**。學生把自己改成 teacher 只換到「可以開自己的班房」，
   讀不到任何別人的資料 —— 真正的權限看 `classroom_members`。
   科主任是唯一例外（它就是全校讀取權），所以它的關卡在註冊那一刻，而且**只有讀**。

**未做／需要你決定的**：
- 部署時要在平台注入 `TEACHER_CODE` 與 `ADMIN_CODE`。repo 內的回退值只是「防手快」，
  科主任那個尤其要換掉（它看得到全校成績）。
- `public/og.jpg` 分享卡仍是平台預設（browser-smoke 的 BRAND WARNING）。這是改動前就有的狀態，
  屬於品牌素材工作，不在這次範圍。
