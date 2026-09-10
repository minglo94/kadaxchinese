import { Link } from "@tanstack/react-router";
import { GraduationCap, LogIn } from "lucide-react";
import { useProfile } from "@/components/auth/use-profile";
import { ROLE_HOME_LABELS, roleHome } from "@/lib/classroom/types";

/**
 * 首頁 hero 的登入入口。
 *
 * 未登入 → 「老師／學生登入」；已登入 → 直接指向自己的落地頁
 * （我的進度／我的班房／全校總覽），不然對已登入的人來說「登入」是廢話。
 *
 * `useProfile()` 的 `isPending` 已經把 `!hydrated` 折進去，所以 SSR 與
 * hydration 前的第一次 client render 都會落在同一個分支（登入版），
 * 不會出現 hydration mismatch —— 之後才切換成落地頁，那是正常的狀態更新。
 */
export function HeroAuthCta() {
  const { profile, isPending } = useProfile();

  if (!isPending && profile) {
    return (
      <Link
        to={roleHome(profile.role)}
        className="inline-flex h-11 items-center gap-2 rounded-md border border-accent/40 bg-accent-mist px-4 text-sm font-medium text-accent hover:border-accent"
      >
        <GraduationCap className="size-4" />
        {ROLE_HOME_LABELS[profile.role]}
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="inline-flex h-11 items-center gap-2 rounded-md border border-accent/40 bg-accent-mist px-4 text-sm font-medium text-accent hover:border-accent"
    >
      <LogIn className="size-4" />
      老師／學生登入
    </Link>
  );
}
