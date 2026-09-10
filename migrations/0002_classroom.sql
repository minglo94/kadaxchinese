-- 班房、角色、雲端進度鏡像、能力分析原始數據、AI 學習建議快取。
--
-- 授權不由資料庫執行（沒有 RLS）：以下全部只是完整性約束，真正的邊界在
-- src/lib/classroom/guards.server.ts，一律以 authMiddleware 驗證過的
-- context.userId 為準。任何 user_id 都是 TEXT（Better Auth 用 text id；
-- 關閉 auth 時的 dev user 是字串 'dev-user'）。
--
-- 刻意不對 Better Auth 的 "user" 表建立外鍵：那張表屬於
-- migrations/auth/0001_auth.sql，而外鍵會讓 'dev-user' 路徑硬性失敗。
--
-- 時間欄位一律以 (extract(epoch from x) * 1000)::bigint 讀出成毫秒整數：
-- src/lib/db.ts 只 normalize 了 int8/date/interval，timestamptz 會變成 Date
-- 物件，而 server function 的回傳必須可序列化。
--
-- ⚠️ _migrations 以 basename 記錄且永不重跑 —— 此檔一旦套用過就不要再改，
--    要改請新增 0003_*.sql。

-- 1) 角色 profile ------------------------------------------------------------
-- 'student' / 'teacher' 的 role 只是「偏好／落地頁」，不是權限：可否管理某班、
-- 可否讀某學生，一律看 classroom_members。
--
-- 'admin'（科主任）是唯一的例外 —— 它本身就是全校讀取權限，所以它的授權關卡
-- 在註冊那一刻（科主任碼），之後 guards 會讓它繞過 membership 檢查。
-- 它是 READ-ONLY 的：admin 不會被寫進 classroom_members，也不能改別人的班房。
create table if not exists profiles (
  user_id      text primary key,
  role         text not null check (role in ('teacher','student','admin')),
  display_name text,
  email        text,                        -- 由伺服器從 "user" 表複製，永遠小寫
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists profiles_email_idx on profiles (email);

-- 2) 班房 -------------------------------------------------------------------
create table if not exists classrooms (
  id            bigserial primary key,
  owner_user_id text not null,
  name          text not null check (length(btrim(name)) between 1 and 60),
  subject       text,
  join_code     text not null unique,       -- 6 碼，A-Z2-9 去掉易混字元
  join_open     boolean not null default true,
  created_at    timestamptz not null default now(),
  archived_at   timestamptz
);
create index if not exists classrooms_owner_idx on classrooms (owner_user_id);

-- 3) 成員：班房授權的唯一來源。開班時必須同時插入老師自己為 'teacher'。
create table if not exists classroom_members (
  classroom_id bigint not null references classrooms (id) on delete cascade,
  user_id      text   not null,
  role         text   not null default 'student' check (role in ('teacher','student')),
  joined_at    timestamptz not null default now(),
  primary key (classroom_id, user_id)
);
create index if not exists classroom_members_user_idx on classroom_members (user_id);

-- 4) 電郵名單／邀請 ---------------------------------------------------------
create table if not exists classroom_invites (
  id               bigserial primary key,
  classroom_id     bigint not null references classrooms (id) on delete cascade,
  email            text   not null,         -- 一律 lower(btrim(...))
  status           text   not null default 'pending'
                     check (status in ('pending','joined','revoked')),
  invited_by       text   not null,
  accepted_user_id text,
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  unique (classroom_id, email)
);
create index if not exists classroom_invites_email_idx on classroom_invites (email);

-- 5) 每人每篇進度 -----------------------------------------------------------
-- 只存四個基礎欄位；score/total/percent 是它們的純函數，在 TS 一處推導
-- （toArticleProgress），不做第二個真相來源。
create table if not exists article_progress (
  user_id    text not null,
  article_id text not null,
  quiz_score integer not null default 0 check (quiz_score >= 0),
  quiz_total integer not null default 0 check (quiz_total >= 0),
  dict_score integer not null default 0 check (dict_score >= 0),
  dict_total integer not null default 0 check (dict_total >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id),
  check (quiz_score <= quiz_total),
  check (dict_score <= dict_total)
);
create index if not exists article_progress_user_idx on article_progress (user_id);

-- 6) 逐題答案（能力分析的原始資料）-----------------------------------------
-- correct 是 max-wins（曾經答對），只給測驗 UI 的重玩狀態用。
-- 能力分析一律用 first_try_ok：insert 後永不更新，否則重複作答會把
-- 「內容理解」推到接近 100%，變成騙老師的數字。
create table if not exists quiz_answers (
  user_id        text not null,
  article_id     text not null,
  question_index integer not null check (question_index >= 0 and question_index < 100),
  correct        boolean not null,
  first_try_ok   boolean not null,
  attempts       integer not null default 1,
  updated_at     timestamptz not null default now(),
  primary key (user_id, article_id, question_index)
);
create index if not exists quiz_answers_user_idx on quiz_answers (user_id);

-- 7) 練習事件流（趨勢、反應速度、老師的「最近活動」）-----------------------
create table if not exists practice_events (
  id             bigserial primary key,
  user_id        text not null,
  kind           text not null check (kind in ('quiz','dictation','game')),
  article_id     text,
  game_id        text check (game_id in ('snake','time','match','sort','hangman')),
  question_index integer,
  correct        boolean,
  score          integer,
  total          integer,
  duration_ms    integer check (duration_ms is null or duration_ms between 0 and 600000),
  created_at     timestamptz not null default now()
);
create index if not exists practice_events_user_created_idx
  on practice_events (user_id, created_at desc);
create index if not exists practice_events_user_kind_idx
  on practice_events (user_id, kind, created_at desc);

-- 8) 遊戲最高分 -------------------------------------------------------------
create table if not exists game_scores (
  user_id    text not null,
  game_id    text not null check (game_id in ('snake','time','match','sort','hangman')),
  high_score integer not null default 0 check (high_score >= 0),
  plays      integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

-- 9) AI 學習建議快取 --------------------------------------------------------
-- stats_fingerprint = sha256(取整到 5 的 stats)，資料沒變就不重新收費。
create table if not exists ai_advice (
  id                bigserial primary key,
  scope_key         text not null,          -- 'student:<userId>' | 'class:<classroomId>'
  subject_user_id   text,                   -- class 級別為 null
  classroom_id      bigint references classrooms (id) on delete cascade,
  audience          text not null check (audience in ('student','teacher')),
  stats_fingerprint text not null,
  advice            text not null,
  -- 產生者（老師或本人）。頻率上限就是數這一欄。
  generated_by      text not null,
  model             text,
  created_at        timestamptz not null default now()
);
create unique index if not exists ai_advice_scope_fp_idx
  on ai_advice (scope_key, audience, stats_fingerprint);
create index if not exists ai_advice_scope_recent_idx
  on ai_advice (scope_key, created_at desc);
create index if not exists ai_advice_generated_by_idx
  on ai_advice (generated_by, created_at desc);
