import { db } from "@/offline/db";
import { request } from "@/services/api-client";

export type SyncResult = {
  success: boolean;
  syncedCount: number;
  error?: string;
};

export async function syncPendingScans(): Promise<SyncResult> {
  if (!db) return { success: false, syncedCount: 0, error: "IndexedDB unavailable." };
  const scans = await db.pendingScans.toArray();
  if (scans.length === 0) {
    return { success: true, syncedCount: 0 };
  }

  try {
    await request<{
      data: { created: number; duplicates: number; flagged: number; bundles: unknown[] };
    }>("/api/sync", {
      method: "POST",
      body: JSON.stringify({ scans }),
    });

    const syncedIds = scans.map((scan) => scan.clientId);
    await db.pendingScans.where("clientId").anyOf(syncedIds).delete();
    window.dispatchEvent(new CustomEvent("pending-scan-updated"));
    window.dispatchEvent(new CustomEvent("bundle-updated"));

    return { success: true, syncedCount: scans.length };
  } catch (error: unknown) {
    return {
      success: false,
      syncedCount: 0,
      error: error instanceof Error ? error.message : "Sync failed.",
    };
  }
}
