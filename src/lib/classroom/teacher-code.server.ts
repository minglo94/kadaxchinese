/**
 * 身分註冊碼 —— server-only。
 *
 * ⚠️ 這只是「防手快」：回退值 commit 在 repo 內，任何看過原始碼的人都拿得到。
 * 對老師而言真正的隔離來自 `guards.server.ts`：老師只讀得到自己是
 * `classroom_members` 內 role='teacher' 的那些班房。
 *
 * 科主任（admin）不同 —— 它就是全校讀取權限，沒有第二道 membership 關卡，
 * 所以部署時**務必**在平台注入 `ADMIN_CODE`，不要靠回退值。
 *
 * 兩個變數都絕不加 `VITE_` 前綴 —— 那會把它們送進瀏覽器 bundle。
 */
const FALLBACK_TEACHER_CODE = "KADAX-TEACHER";
const FALLBACK_ADMIN_CODE = "KADAX-PANEL-HEAD";

function expected(kind: "teacher" | "admin"): string {
  const injected = kind === "teacher" ? process.env.TEACHER_CODE : process.env.ADMIN_CODE;
  const fallback = kind === "teacher" ? FALLBACK_TEACHER_CODE : FALLBACK_ADMIN_CODE;
  return (injected ?? "").trim() || fallback;
}

/** Case-insensitive, whitespace-tolerant comparison. */
function matches(kind: "teacher" | "admin", code: string | undefined): boolean {
  const given = (code ?? "").trim();
  if (!given) return false;
  return given.toUpperCase() === expected(kind).toUpperCase();
}

export function isValidTeacherCode(code: string | undefined): boolean {
  return matches("teacher", code);
}

export function isValidAdminCode(code: string | undefined): boolean {
  return matches("admin", code);
}
