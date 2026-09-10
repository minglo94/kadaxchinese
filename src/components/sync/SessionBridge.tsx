import { useEffect, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { setSignedIn } from "@/lib/auth/session-flag";
import {
  disableSync,
  enableSync,
  getSyncState,
  subscribeSync,
  type SyncState,
} from "@/lib/progress-sync";

/**
 * 把登入狀態接到兩件事上：
 *   1. `session-flag` —— 讓非 React 模組（`ask-ai.ts`）知道能不能呼叫需要
 *      驗證的 server function。
 *   2. `progress-sync` —— 登入時啟動同步並收編這部裝置的本機進度。
 *
 * 不渲染任何東西。掛在 `AppShell` 一次就夠。
 */
export function useSessionBridge(): SyncState {
  const { user, isPending } = useCurrentUserState();
  const [syncState, setSyncState] = useState<SyncState>(() => getSyncState());

  useEffect(() => subscribeSync(() => setSyncState(getSyncState())), []);

  useEffect(() => {
    if (isPending) return;
    setSignedIn(Boolean(user));
    if (user) enableSync(user.id);
    else disableSync();
  }, [isPending, user]);

  return syncState;
}
