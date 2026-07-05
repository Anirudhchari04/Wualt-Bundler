"use client";

export function ScannerOfflineIndicator({ offline }: { offline: boolean }) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${offline ? "bg-red-500" : "bg-emerald-500"}`} />
        <span className="font-semibold text-slate-900">{offline ? "Offline mode enabled" : "Online mode"}</span>
      </div>
    </div>
  );
}
