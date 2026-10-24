import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { subscribe as subscribeProgress } from "@/lib/progress";
import { subscribeDiary } from "@/features/diary/storage";
import { readLocalSnapshot, writeLocalSnapshot } from "./snapshot";
import { mergeDiary, mergeState } from "./merge";
import { fetchRemote, pushRemote } from "./remote";
import { importLegacyDomains } from "@/features/recovery/legacyDomains";
import { toast } from "sonner";

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

interface SyncValue {
  session: Session | null;
  email: string | null;
  status: SyncStatus;
  lastSyncedAt: number | null;
  skippedImages: number;
  syncNow: () => void;
  signOut: () => Promise<void>;
}

const SyncCtx = createContext<SyncValue>({
  session: null,
  email: null,
  status: "idle",
  lastSyncedAt: null,
  skippedImages: 0,
  syncNow: () => {},
  signOut: async () => {},
});

export function useSync() {
  return useContext(SyncCtx);
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [skippedImages, setSkippedImages] = useState(0);

  const userIdRef = useRef<string | null>(null);
  const runningRef = useRef(false);
  const pendingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const mergedRef = useRef(false);

  const runSync = useCallback(async () => {
    const userId = userIdRef.current;
    if (!userId) return;
    if (runningRef.current) {
      pendingRef.current = true;
      return;
    }
    runningRef.current = true;
    setStatus("syncing");
    try {
      const local = readLocalSnapshot();
      const remote = await fetchRemote(userId);
      const merged = {
        state: mergeState(local.state, remote.state),
        diary: mergeDiary(local.diary, remote.diary),
      };
      writeLocalSnapshot(merged);
      const skipped = await pushRemote(userId, merged);
      setSkippedImages(skipped);
      setLastSyncedAt(Date.now());
      setStatus("synced");
      mergedRef.current = true;
    } catch {
      setStatus("error");
    } finally {
      runningRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        void runSync();
      }
    }
  }, []);

  const schedule = useCallback(() => {
    if (!userIdRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      void runSync();
    }, 2000);
  }, [runSync]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      const nextId = next?.user?.id ?? null;
      const changed = nextId !== userIdRef.current;
      userIdRef.current = nextId;
      if (nextId && changed) {
        mergedRef.current = false;
        setTimeout(() => void runSync(), 0);
      }
      if (!nextId) {
        setStatus("idle");
        setLastSyncedAt(null);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      const id = data.session?.user?.id ?? null;
      if (id && id !== userIdRef.current) {
        userIdRef.current = id;
        void runSync();
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [runSync]);

  // One-time recovery of progress saved under the app's older web addresses.
  useEffect(() => {
    let cancelled = false;
    void importLegacyDomains().then((recovered) => {
      if (cancelled || !recovered) return;
      toast("Welcome back — we restored the progress from your earlier visits.");
      if (userIdRef.current) void runSync();
    });
    return () => {
      cancelled = true;
    };
  }, [runSync]);

  // Push local changes (practice answers, diary edits) in the background.
  useEffect(() => {
    const unsubProgress = subscribeProgress(() => {
      if (mergedRef.current) schedule();
    });
    const unsubDiary = subscribeDiary(() => {
      if (mergedRef.current) schedule();
    });
    const onHide = () => {
      if (document.visibilityState === "hidden" && mergedRef.current) void runSync();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      unsubProgress();
      unsubDiary();
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [schedule, runSync]);

  const signOut = useCallback(async () => {
    if (userIdRef.current && mergedRef.current) {
      try {
        await runSync();
      } catch {
        /* ignore */
      }
    }
    await supabase.auth.signOut();
    userIdRef.current = null;
    mergedRef.current = false;
    setSession(null);
    setStatus("idle");
  }, [runSync]);

  return (
    <SyncCtx.Provider
      value={{
        session,
        email: session?.user?.email ?? null,
        status,
        lastSyncedAt,
        skippedImages,
        syncNow: () => void runSync(),
        signOut,
      }}
    >
      {children}
    </SyncCtx.Provider>
  );
}
