"use client";

import { useOfflineSync } from "@/hooks/use-offline-sync";

export function OnlineStatus() {
  const { offlineMode, toggleOfflineMode } = useOfflineSync();
  return (
    <button
      type="button"
      onClick={toggleOfflineMode}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold shadow-sm transition-colors ${
        offlineMode ? "border-red-400 bg-red-50 text-red-700" : "border-emerald-400 bg-emerald-50 text-emerald-700"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${offlineMode ? "bg-red-500" : "bg-emerald-500"}`} />
      <span>{offlineMode ? "Offline" : "Online"}</span>
    </button>
  );
}
