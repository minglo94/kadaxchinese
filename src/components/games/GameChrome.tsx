import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function GameChrome({
  title,
  kicker,
  blurb,
  picker,
  hud,
  children,
}: {
  title: string;
  kicker: string;
  blurb: string;
  picker?: ReactNode;
  hud?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-32">
      <Link to="/games" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
        <ArrowLeft className="size-4" /> 返回闖關
      </Link>
      <header className="rounded-xl border border-line bg-paper-card/95 p-5 shadow-page sm:p-6">
        <p className="text-xs font-bold tracking-[0.22em] text-accent">{kicker}</p>
        <h1 className="mt-1 font-serif text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{blurb}</p>
        {picker ? <div className="mt-4">{picker}</div> : null}
      </header>
      {hud}
      {children}
    </div>
  );
}

export function HudStat({ label, value, warn }: { label: string; value: string | number; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-paper-deep/80 px-3 py-2">
      <div className="text-[11px] font-semibold tracking-wide text-muted">{label}</div>
      <div className={`mt-0.5 font-serif text-xl font-bold tabular-nums ${warn ? "text-seal" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}
