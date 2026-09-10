import { create } from "zustand";
import type { Profile, Role } from "./types";

/**
 * One shared `getMyProfile()` fetch for the whole app.
 *
 * `AuthSlot`, `/me` and `/teacher/*` all need the role; without a store they
 * would each fire their own request on every navigation. There is no
 * `QueryClientProvider` in this app, so this mirrors `src/lib/ui-store.ts`.
 *
 * `./api` is imported DYNAMICALLY on purpose. This store is reachable from the
 * root render path (`NavBar`), and a module that uses `authMiddleware` must not
 * be a static dependency of BOTH the root SSR chunk and a lazy route chunk —
 * the production bundle then emits a namespace object it never defines and the
 * built server dies with "Export 'ssr_exports' is not defined in module",
 * while `vite dev` looks perfectly fine.
 *
 * `profile === undefined` means "not fetched yet" and `null` means "signed in
 * but no role chosen" — the two must stay distinguishable or the role gate
 * bounces people to onboarding while it is still loading.
 */
type ProfileState = {
  profile: Profile | null | undefined;
  loading: boolean;
  error: string | null;
  /** Which user id the loaded profile belongs to, so a switch refetches. */
  loadedFor: string | null;
  load: (userId: string) => Promise<void>;
  chooseRole: (
    role: Role,
    teacherCode?: string,
  ) => Promise<{ profile: Profile; joinedClassroomIds: number[] }>;
  reset: () => void;
};

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: undefined,
  loading: false,
  error: null,
  loadedFor: null,

  load: async (userId) => {
    const state = get();
    if (state.loading) return;
    if (state.loadedFor === userId && state.profile !== undefined) return;
    set({ loading: true, error: null });
    try {
      const { getMyProfile } = await import("./server-fns");
      const { profile } = await getMyProfile();
      set({ profile, loadedFor: userId, loading: false });
    } catch {
      // Signed out mid-flight, or offline. Keep `undefined` so the gate shows
      // a skeleton instead of wrongly deciding "no role chosen".
      set({ loading: false, error: "未能讀取帳戶資料。" });
    }
  },

  chooseRole: async (role, teacherCode) => {
    const { setMyRole } = await import("./server-fns");
    const result = await setMyRole({ data: { role, teacherCode } });
    set({ profile: result.profile, loadedFor: result.profile.userId, error: null });
    return result;
  },

  reset: () => set({ profile: undefined, loading: false, error: null, loadedFor: null }),
}));
