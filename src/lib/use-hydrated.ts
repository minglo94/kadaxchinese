import { useEffect, useState } from "react";

/**
 * False during SSR and on the first client render, true after mount.
 *
 * The auth guards branch on session state, and the server has no session to
 * resolve — so without this the server HTML and the first client render pick
 * different branches and React reports a hydration mismatch. Gating on this
 * makes both sides render the same skeleton, then the real branch takes over
 * after hydration.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
