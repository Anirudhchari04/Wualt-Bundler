"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";

export function SyncStatus() {
  const { online, pendingCount, syncing, lastSync, syncError } = useOfflineSync();

  return (
    <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:grid-cols-4">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connectivity</p>
        <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
          online ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
        }`}>
          {online ? "Online" : "Offline"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending queue</p>
        <p className="mt-2 font-semibold text-slate-950">{pendingCount}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sync status</p>
        <p className="mt-2 font-semibold text-slate-950">
          {syncing ? "Syncing…" : syncError ? "Sync failed" : "Synced"}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Last sync</p>
        <p className="mt-2 font-semibold text-slate-950">{lastSync ? new Date(lastSync).toLocaleString() : "Never"}</p>
      </div>
    </div>
  );
}
