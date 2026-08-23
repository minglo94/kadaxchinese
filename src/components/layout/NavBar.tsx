import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart2, BookOpen, Edit3, Gamepad2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "總覽" },
  { to: "/games", label: "趣味闖關" },
  { to: "/quiz", label: "深度測驗" },
  { to: "/dictation", label: "默書練習" },
] as const;

export function NavBar({
  dark,
  onToggleTheme,
  onOpenProgress,
}: {
  dark: boolean;
  onToggleTheme: () => void;
  onOpenProgress: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-serif text-lg font-bold text-accent">
          <BookOpen className="size-5 shrink-0" />
          <span className="truncate">
            範文十二式
            <span className="ml-2 align-middle rounded-full bg-seal/12 px-2 py-0.5 text-[10px] font-sans font-bold tracking-wide text-seal">
              水墨版
            </span>
          </span>
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
                  active ? "bg-accent-mist text-accent" : "text-ink-soft hover:bg-paper-deep hover:text-ink",
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
          <Button variant="ghost" size="sm" onClick={onOpenProgress} className="text-accent">
            <BarChart2 className="size-4" />
            <span className="hidden sm:inline">學習進度</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="切換深色模式">
            {dark ? <Sun className="size-4 text-accent" /> : <Moon className="size-4 text-accent" />}
          </Button>
        </nav>
      </div>
    </header>
  );
}
