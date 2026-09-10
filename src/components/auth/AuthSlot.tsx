import { Link } from "@tanstack/react-router";
import { LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

/**
 * The only auth consumer in the nav.
 *
 * Wraps the prewired `<UserButton />` (which owns `signOut()` and its pending
 * state) instead of editing `src/lib/auth/gates.tsx`, which is off-limits.
 *
 * While the session resolves we render a SAME-SIZED skeleton rather than
 * `null` — a slot that appears out of nowhere shifts the whole header.
 */
export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  const [open, setOpen] = useState(false);
  // The server has no session to resolve, so it would render the signed-out
  // link while the client's first paint is still pending — a hydration
  // mismatch. Render the skeleton until mounted so both agree.
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-paper-deep" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        to="/login"
        className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[10px] border border-line px-2.5 text-sm font-medium text-ink hover:bg-paper-deep sm:px-3"
      >
        <LogIn className="size-4 shrink-0 text-accent" />
        {/* 文字在手機版也要顯示 —— 只有一個箭頭圖示時，學生找不到登入在哪。 */}
        登入
      </Link>
    );
  }

  const label = user.displayName ?? user.primaryEmail ?? "帳戶";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-line bg-paper-deep text-sm font-bold text-accent hover:border-accent"
        aria-label="帳戶選單"
      >
        {user.profileImageUrl ? (
          <img src={user.profileImageUrl} alt="" className="size-full object-cover" />
        ) : (
          label.charAt(0).toUpperCase()
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-60 rounded-lg border border-line bg-paper-card p-3 shadow-page"
        >
          <UserButton />
        </div>
      )}
    </div>
  );
}
