"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cacheBundles, db, type PendingScan } from "@/offline/db";
import { syncPendingScans } from "@/offline/sync";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getAllBundles } from "@/services/api-client";

type OfflineSyncContextValue = {
  online: boolean;
  forceOffline: boolean;
  offlineMode: boolean;
  pendingCount: number;
  syncing: boolean;
  lastSync: string | null;
  syncError: string | null;
  addPendingScan: (scan: Omit<PendingScan, "createdAt">) => Promise<void>;
  refreshPending: () => Promise<void>;
  toggleOfflineMode: () => void;
};

const OfflineSyncContext = createContext<OfflineSyncContextValue | null>(null);

function useOfflineSyncState(): OfflineSyncContextValue {
  const online = useOnlineStatus();
  const [forceOffline, setForceOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const offlineMode = forceOffline || !online;

  const refreshPending = useCallback(async () => {
    if (!db) {
      setPendingCount(0);
      return;
    }
    setPendingCount(await db.pendingScans.count());
  }, []);

  const refreshBundleCache = useCallback(async () => {
    if (!online || !db) return;
    try {
      const bundles = await getAllBundles();
      await cacheBundles(bundles);
    } catch (error: unknown) {
      console.error("Unable to refresh bundle cache.", error);
    }
  }, [online]);

  const synchronize = useCallback(async () => {
    if (!online || !db) return;
    setSyncing(true);
    setSyncError(null);
    try {
      const result = await syncPendingScans();
      if (result.success) {
        setLastSync(new Date().toISOString());
        setSyncError(null);
      } else {
        setSyncError(result.error ?? "Sync failed.");
      }
    } catch (error: unknown) {
      setSyncError(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setSyncing(false);
      await refreshPending();
    }
  }, [online, refreshPending]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    void refreshBundleCache();
  }, [refreshBundleCache]);

  useEffect(() => {
    if (offlineMode) return;
    void refreshBundleCache();
    void synchronize();
  }, [offlineMode, refreshBundleCache, synchronize]);

  useEffect(() => {
    const handleBundleUpdated = () => {
      if (!offlineMode) {
        void refreshBundleCache();
      }
    };

    window.addEventListener("bundle-updated", handleBundleUpdated);
    return () => window.removeEventListener("bundle-updated", handleBundleUpdated);
  }, [offlineMode, refreshBundleCache]);

  useEffect(() => {
    const handlePendingUpdate = () => {
      void refreshPending();
    };

    window.addEventListener("pending-scan-updated", handlePendingUpdate);
    return () => window.removeEventListener("pending-scan-updated", handlePendingUpdate);
  }, [refreshPending]);

  const addPendingScan = useCallback(
    async (scan: Omit<PendingScan, "createdAt">) => {
      if (!db) throw new Error("Offline storage unavailable.");
      await db.pendingScans.add({ ...scan, createdAt: new Date().toISOString() });
      window.dispatchEvent(new CustomEvent("pending-scan-updated"));
      await refreshPending();
    },
    [refreshPending],
  );

  const toggleOfflineMode = useCallback(() => {
    setForceOffline((current) => !current);
  }, []);

  return useMemo(
    () => ({
      online,
      forceOffline,
      offlineMode,
      pendingCount,
      syncing,
      lastSync,
      syncError,
      addPendingScan,
      refreshPending,
      toggleOfflineMode,
    }),
    [
      online,
      forceOffline,
      offlineMode,
      pendingCount,
      syncing,
      lastSync,
      syncError,
      addPendingScan,
      refreshPending,
      toggleOfflineMode,
    ],
  );
}

export function OfflineSyncProvider({ children }: { children: ReactNode }) {
  const state = useOfflineSyncState();
  return <OfflineSyncContext.Provider value={state}>{children}</OfflineSyncContext.Provider>;
}

export function useOfflineSync() {
  const context = useContext(OfflineSyncContext);
  if (!context) throw new Error("useOfflineSync must be used within OfflineSyncProvider.");
  return context;
}
