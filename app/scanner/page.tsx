"use client";

import { useMemo, useState, type FormEvent } from "react";

import { ErrorBanner } from "@/components/error-banner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { ScannerOfflineIndicator } from "@/components/scanner-offline-indicator";
import { StageChip } from "@/components/stage-chip";
import { StatusChip } from "@/components/status-chip";
import { useToast } from "@/hooks/use-toast";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { cacheBundle, getCachedBundle } from "@/offline/db";
import { advanceBundle, getBundle } from "@/services/api-client";
import type { Bundle } from "@/types/bundle";
import { getNextStage, stageLabels } from "@/utils/stages";

export default function ScannerPage() {
  const { online, offlineMode, pendingCount, syncing, addPendingScan } = useOfflineSync();
  const { showToast } = useToast();
  const [bundleId, setBundleId] = useState("");
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [storedLocally, setStoredLocally] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const deviceId = useMemo(() => {
    const storedDeviceId = window.localStorage.getItem("bundle-tracker-device-id");
    if (storedDeviceId) {
      return storedDeviceId;
    }

    const generatedDeviceId = `web-scanner-${crypto.randomUUID()}`;
    window.localStorage.setItem("bundle-tracker-device-id", generatedDeviceId);
    return generatedDeviceId;
  }, []);
  const nextStage = bundle ? getNextStage(bundle.currentStage) : null;

  async function findBundle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const id = bundleId.trim();
    if (!id) {
      setError("Enter a bundle ID.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (offlineMode) {
        const cachedBundle = await getCachedBundle(id);
        if (!cachedBundle) {
          setError("Bundle not available offline. Load it while online first.");
          return;
        }
        setBundle(cachedBundle);
        return;
      }

      const loadedBundle = await getBundle(id);
      setBundle(loadedBundle);
      await cacheBundle(loadedBundle);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to find this bundle.");
    } finally {
      setLoading(false);
    }
  }

  async function advance() {
    if (!bundle || !nextStage) return;
    setAdvancing(true);
    setError(null);
    setSuccess(null);
    setStoredLocally(false);

    try {
      if (offlineMode) {
        const clientId = crypto.randomUUID();
        await addPendingScan({
          clientId,
          bundleId: bundle.id,
          stage: nextStage,
          scannedAt: new Date().toISOString(),
          deviceId,
        });
        const message = `${bundle.id} stored locally and will sync once reconnecting.`;
        setSuccess(message);
        setStoredLocally(true);
        showToast(message);
        const updatedBundle = { ...bundle, currentStage: nextStage };
        setBundle(updatedBundle);
        await cacheBundle(updatedBundle);
      } else {
        await advanceBundle(bundle.id, nextStage, deviceId);
        const refreshed = await getBundle(bundle.id);
        setBundle(refreshed);
        const message = `${refreshed.id} advanced to ${stageLabels[refreshed.currentStage]}.`;
        setSuccess(message);
        showToast(message);
        window.dispatchEvent(new CustomEvent("bundle-updated"));
      }
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : "Unable to advance bundle.";
      setError(message);
      showToast(message, "error");
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Production movement</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Bundle Scanner</h1>
        <p className="mt-1 text-sm text-slate-600">Locate a bundle and record its next production stage.</p>
      </div>
      <ScannerOfflineIndicator offline={offlineMode} />
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Connectivity</p>
          <p className="mt-2 font-semibold text-slate-950">{online ? "Online" : "Offline"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pending queue</p>
          <p className="mt-2 font-semibold text-slate-950">{pendingCount}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sync status</p>
          <p className="mt-2 font-semibold text-slate-950">{syncing ? "Syncing…" : "Idle"}</p>
        </div>
      </div>

      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <form onSubmit={findBundle}>
          <label htmlFor="bundle-id" className="text-sm font-semibold text-slate-800">
            Bundle ID
          </label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <input
              id="bundle-id"
              value={bundleId}
              onChange={(event) => setBundleId(event.target.value)}
              autoComplete="off"
              autoFocus
              placeholder="Scan or enter bundle ID"
              className="h-14 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 font-mono text-lg font-semibold uppercase text-slate-950 outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-14 rounded-lg bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Looking up…" : "Find bundle"}
            </button>
          </div>
        </form>

        {loading ? <LoadingSpinner label="Finding bundle" /> : null}
        {!loading && error ? <div className="mt-5"><ErrorBanner message={error} /></div> : null}
        {!loading && success ? (
          <div
            role="status"
            className={`mt-5 rounded-lg border px-4 py-3 text-sm font-medium ${
              storedLocally
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            {storedLocally ? "Stored locally" : "Synced successfully"}: {success}
          </div>
        ) : null}

        {!loading && bundle ? (
          <div className="mt-7 border-t border-slate-200 pt-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm font-semibold text-slate-500">{bundle.id}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">{bundle.style}</h2>
                <p className="mt-1 text-sm text-slate-600">Order {bundle.orderId} · Size {bundle.size} · Qty {bundle.quantity}</p>
              </div>
              <StatusChip status={bundle.status} />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current stage</p>
                <div className="mt-3"><StageChip stage={bundle.currentStage} /></div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Next stage</p>
                <p className="mt-3 text-lg font-bold text-blue-950">
                  {nextStage ? stageLabels[nextStage] : "Production complete"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void advance()}
              disabled={!nextStage || advancing}
              className="mt-6 h-12 w-full rounded-lg bg-blue-700 px-5 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 sm:w-auto"
            >
              {advancing ? "Recording scan…" : nextStage ? `Advance to ${stageLabels[nextStage]}` : "No further stage"}
            </button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
