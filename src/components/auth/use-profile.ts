import { useEffect } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { useHydrated } from "@/lib/use-hydrated";
import { useProfileStore } from "@/lib/classroom/profile-store";
import type { Profile } from "@/lib/classroom/types";

/**
 * Loads the caller's profile once the session is known, from the shared store.
 *
 * `profile === undefined` means "still fetching" and `null` means "signed in
 * but no role chosen" — the two must stay distinguishable, or the role gate
 * bounces people to onboarding while it is still loading.
 *
 * Lives in its own file so `RoleGate.tsx` only exports components (React
 * Fast Refresh requirement).
 */
export function useProfile(): {
  profile: Profile | null | undefined;
  /** True during SSR/first paint too, so guards never branch before hydration. */
  isPending: boolean;
  signedOut: boolean;
} {
  const { user, isPending: sessionPending } = useCurrentUserState();
  const hydrated = useHydrated();
  const isPending = sessionPending || !hydrated;
  const profile = useProfileStore((s) => s.profile);
  const load = useProfileStore((s) => s.load);
  const reset = useProfileStore((s) => s.reset);

  useEffect(() => {
    if (isPending) return;
    if (!user) {
      reset();
      return;
    }
    void load(user.id);
  }, [isPending, user, load, reset]);

  return { profile, isPending, signedOut: !isPending && !user };
}
