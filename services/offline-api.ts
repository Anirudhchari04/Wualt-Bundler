import { db, type PendingScan } from "@/offline/db";
import { syncPendingScans } from "@/offline/sync";

export async function storeOfflineScan(scan: Omit<PendingScan, "createdAt">) {
  if (!db) throw new Error("Offline storage unavailable.");
  await db.pendingScans.add({ ...scan, createdAt: new Date().toISOString() });
}

export async function syncOfflineScans() {
  return syncPendingScans();
}
