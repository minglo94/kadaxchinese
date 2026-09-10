import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart2,
  BookOpen,
  Cloud,
  CloudOff,
  Edit3,
  Gamepad2,
  GraduationCap,
  Moon,
  School,
  Sun,
  Users,
} from "lucide-react";
import { AuthSlot } from "@/components/auth/AuthSlot";
import { useProfile } from "@/components/auth/use-profile";
import { Button } from "@/components/ui/button";
import { ROLE_HOME_LABELS, roleHome } from "@/lib/classroom/types";
import type { SyncStatus } from "@/lib/progress-sync";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "總覽" },
  { to: "/games", label: "趣味闖關" },
  { to: "/quiz", label: "深度測驗" },
  { to: "/dictation", label: "默書練習" },
] as const;

const SYNC_LABEL: Record<SyncStatus, string> = {
  off: "未登入，進度只存在這部裝置",
  idle: "進度已同步到帳戶",
  syncing: "正在同步進度…",
  error: "同步暫時失敗，稍後自動重試",
};

export function NavBar({
  dark,
  onToggleTheme,
  onOpenProgress,
  syncStatus = "off",
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onOpenProgress: () => void;
  syncStatus?: SyncStatus;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { profile } = useProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          // 手機版只剩圖示，所以要自己撐出 44px 的觸控區；桌面版有文字，
          // 靠文字本身就夠大，不需要這個下限。
          className="-ml-2 flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md font-serif text-lg font-bold text-accent sm:ml-0 sm:min-h-0 sm:min-w-0 sm:justify-start"
        >
          <BookOpen className="size-5 shrink-0" />
          {/*
            390px 寬塞不下「7 個控制項 + 5 個字的站名 + 登入二字」。既然「登入」
            要讓學生找得到，就讓站名在手機版明確退成書本圖示（仍然是回首頁的連結，
            手機上很常見的做法），而不是靠 truncate 壓成 0 寬度的破版。
          */}
          <span className="hidden truncate sm:inline">
            範文十二式
            <span className="ml-2 align-middle rounded-full bg-seal/12 px-2 py-0.5 text-[10px] font-sans font-bold tracking-wide text-seal">
              水墨版
            </span>
          </span>
          <span className="sr-only sm:hidden">範文十二式 首頁</span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((link) => {
            const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "hidden h-10 items-center rounded-md px-3 text-sm font-medium transition-colors duration-150 lg:inline-flex",
                  active
                    ? "bg-accent-mist text-accent"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/games"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden"
            aria-label="趣味闖關"
          >
            <Gamepad2 className="size-4" />
          </Link>
          <Link
            to="/quiz"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden"
            aria-label="深度測驗"
          >
            <BookOpen className="size-4" />
          </Link>
          <Link
            to="/dictation"
            className="inline-flex size-10 items-center justify-center rounded-md text-ink-soft hover:bg-paper-deep lg:hidden"
            aria-label="默書練習"
          >
            <Edit3 className="size-4" />
          </Link>
          {/* 角色入口。載入中先佔位，避免 header 抖動。 */}
          <span className="inline-flex justify-center lg:min-w-10">
            {profile ? (
              <Link
                to={roleHome(profile.role)}
                className={cn(
                  "inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-sm font-medium sm:px-3",
                  pathname.startsWith(roleHome(profile.role))
                    ? "bg-accent-mist text-accent"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink",
                )}
              >
                {profile.role === "teacher" ? (
                  <Users className="size-4" />
                ) : profile.role === "admin" ? (
                  <School className="size-4" />
                ) : (
                  <GraduationCap className="size-4" />
                )}
                <span className="hidden lg:inline">{ROLE_HOME_LABELS[profile.role]}</span>
              </Link>
            ) : null}
          </span>

          <Button variant="ghost" size="sm" onClick={onOpenProgress} className="text-accent">
            <BarChart2 className="size-4" />
            <span className="hidden sm:inline">學習進度</span>
            {syncStatus !== "off" && (
              <span
                title={SYNC_LABEL[syncStatus]}
                aria-label={SYNC_LABEL[syncStatus]}
                className="inline-flex"
              >
                {syncStatus === "error" ? (
                  <CloudOff className="size-3.5 text-seal" />
                ) : (
                  <Cloud
                    className={cn(
                      "size-3.5 text-accent",
                      syncStatus === "syncing" && "animate-pulse",
                    )}
                  />
                )}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="切換深色模式">
            {dark ? (
              <Sun className="size-4 text-accent" />
            ) : (
              <Moon className="size-4 text-accent" />
            )}
          </Button>
          <AuthSlot />
        </nav>
      </div>
    </header>
  );
}
