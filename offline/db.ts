import Dexie, { type Table } from "dexie";
import type { Bundle, ProductionStage } from "@/types/bundle";

export type PendingScan = {
  clientId: string;
  bundleId: string;
  stage: ProductionStage;
  scannedAt: string;
  deviceId: string;
  createdAt: string;
};

class OfflineDB extends Dexie {
  public pendingScans!: Table<PendingScan, string>;
  public bundles!: Table<Bundle, string>;

  constructor() {
    super("BundleTrackerOffline");
    this.version(1).stores({
      pendingScans: "clientId,bundleId,scannedAt",
    });
    this.version(2).stores({
      pendingScans: "clientId,bundleId,scannedAt",
      bundles: "id,orderId,currentStage,status",
    });
  }
}

export const db = typeof window === "undefined" ? null : new OfflineDB();

export async function cacheBundles(bundles: Bundle[]) {
  if (!db) return;
  await db.bundles.bulkPut(bundles);
}

export async function cacheBundle(bundle: Bundle) {
  if (!db) return;
  await db.bundles.put(bundle);
}

export async function getCachedBundle(id: string) {
  if (!db) return null;

  const exact = await db.bundles.get(id);
  if (exact) return exact;

  const normalized = id.trim().toLowerCase();
  return db.bundles.filter((bundle) => bundle.id.toLowerCase() === normalized).first();
}

export async function getCachedBundles() {
  if (!db) return [];
  return db.bundles.toArray();
}
