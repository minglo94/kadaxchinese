import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useProfile } from "@/components/auth/use-profile";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { ROLE_LABELS, roleHome, type Profile, type Role } from "@/lib/classroom/types";

/**
 * Route guards.
 *
 * The check ORDER matters and is the same in all three:
 *   1. `isPending` → skeleton. Never redirect while the session is resolving,
 *      or every hard reload bounces a signed-in visitor to /login.
 *   2. no user → `<RedirectToSignIn/>` (TanStack `<Navigate>`, not a reload).
 *   3. `profile === undefined` → skeleton (still fetching).
 *   4. `profile === null` → onboarding.
 *   5. wrong role → a friendly panel, NOT a redirect (a redirect between two
 *      role-guarded routes can loop).
 */

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="載入中">
      <div className="h-8 w-48 animate-pulse rounded-md bg-paper-deep" />
      <div className="h-40 animate-pulse rounded-xl bg-paper-deep" />
      <div className="h-24 animate-pulse rounded-xl bg-paper-deep" />
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isPending, signedOut } = useProfile();
  if (isPending) return <PageSkeleton />;
  if (signedOut) return <RedirectToSignIn />;
  return <>{children}</>;
}

export function RequireProfile({ children }: { children: (profile: Profile) => ReactNode }) {
  const { profile, isPending, signedOut } = useProfile();
  if (isPending) return <PageSkeleton />;
  if (signedOut) return <RedirectToSignIn />;
  if (profile === undefined) return <PageSkeleton />;
  if (profile === null) return <Navigate to="/onboarding" />;
  return <>{children(profile)}</>;
}

export function RequireRole({
  role,
  children,
}: {
  role: Role;
  children: (profile: Profile) => ReactNode;
}) {
  return (
    <RequireProfile>
      {(profile) =>
        profile.role === role ? (
          children(profile)
        ) : (
          <WrongRolePanel want={role} has={profile.role} />
        )
      }
    </RequireProfile>
  );
}

/** 老師或科主任都可以進的頁面（班房總覽、學生報告）。科主任是唯讀。 */
export function RequireStaff({ children }: { children: (profile: Profile) => ReactNode }) {
  return (
    <RequireProfile>
      {(profile) =>
        profile.role === "teacher" || profile.role === "admin" ? (
          children(profile)
        ) : (
          <WrongRolePanel want="teacher" has={profile.role} />
        )
      }
    </RequireProfile>
  );
}

function WrongRolePanel({ want, has }: { want: Role; has: Role }) {
  const wantLabel = ROLE_LABELS[want];
  const hasLabel = ROLE_LABELS[has];
  const home = roleHome(has);
  return (
    <div className="mx-auto max-w-md rounded-xl border border-line bg-paper-card p-6 text-center shadow-page">
      <h2 className="font-serif text-xl font-bold text-accent">這頁是{wantLabel}專用</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">你目前的身分是「{hasLabel}」。</p>
      <a
        href={home}
        className="mt-5 inline-flex h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-fg hover:bg-accent-deep"
      >
        回到我的{hasLabel}主頁
      </a>
    </div>
  );
}
