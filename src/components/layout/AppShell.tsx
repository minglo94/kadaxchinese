import { useRouterState } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { TutorDock } from "@/components/ai/TutorDock";
import { InkStage } from "@/components/ink/InkStage";
import { NavBar } from "@/components/layout/NavBar";
import { ProgressDialog } from "@/components/progress/ProgressDialog";
import { loadProgress, type ProgressMap } from "@/lib/progress";
import { applyTheme, readStoredTheme } from "@/lib/theme";
import { useUiStore } from "@/lib/ui-store";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState<ProgressMap>({});
  const tutorOpen = useUiStore((s) => s.tutorOpen);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const inGame = pathname.startsWith("/games/");

  useEffect(() => {
    setDark(readStoredTheme() === "dark");
  }, []);

  const refreshProgress = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  useEffect(() => {
    if (progressOpen) refreshProgress();
  }, [progressOpen, refreshProgress]);

  return (
    <div className="paper-grain relative min-h-screen bg-paper text-ink">
      <InkStage paused={progressOpen || tutorOpen || inGame} />
      <div className="relative z-10">
        <NavBar
          dark={dark}
          onToggleTheme={() => {
            const next = dark ? "light" : "dark";
            applyTheme(next);
            setDark(next === "dark");
          }}
          onOpenProgress={() => setProgressOpen(true)}
        />
        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-10 lg:px-6">{children}</main>
      </div>
      <TutorDock />
      <ProgressDialog open={progressOpen} progress={progress} onClose={() => setProgressOpen(false)} />
    </div>
  );
}
