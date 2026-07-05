"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { StageChip } from "@/components/stage-chip";
import { StatusChip } from "@/components/status-chip";
import { Timeline } from "@/components/timeline";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { cacheBundle, getCachedBundle } from "@/offline/db";
import { getBundle } from "@/services/api-client";
import type { Bundle } from "@/types/bundle";
import { formatDateTime } from "@/utils/format";

export default function BundleDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const online = useOnlineStatus();

  const loadBundle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!online) {
        const cached = await getCachedBundle(id);
        if (!cached) {
          throw new Error("Bundle not available offline. Load it while online first.");
        }
        setBundle(cached);
        return;
      }

      const fetched = await getBundle(id);
      setBundle(fetched);
      await cacheBundle(fetched);
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load bundle details.");
    } finally {
      setLoading(false);
    }
  }, [id, online]);

  const scanLogs = useMemo(
    () =>
      bundle
        ? [...bundle.scanLogs].sort(
            (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime(),
          )
        : [],
    [bundle],
  );

  useEffect(() => {
    void loadBundle();
  }, [loadBundle]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">← Back to dashboard</Link>

      {loading ? <LoadingSpinner label="Loading bundle audit trail" /> : null}
      {!loading && error ? <div className="mt-6"><ErrorBanner message={error} onRetry={() => void loadBundle()} /></div> : null}

      {!loading && bundle ? (
        <>
          <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Bundle details</p>
              <h1 className="mt-1 font-mono text-2xl font-bold tracking-tight text-slate-950">{bundle.id}</h1>
              <p className="mt-1 text-sm text-slate-600">Order {bundle.orderId}</p>
            </div>
            <div className="flex items-center gap-2">
              <StageChip stage={bundle.currentStage} />
              <StatusChip status={bundle.status} />
            </div>
          </div>

          <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <section className="h-fit rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold text-slate-950">Bundle information</h2>
              <dl className="mt-5 divide-y divide-slate-100 text-sm">
                {[
                  ["Order", bundle.orderId],
                  ["Style", bundle.style],
                  ["Size", bundle.size],
                  ["Quantity", String(bundle.quantity)],
                  ["Created", formatDateTime(bundle.createdAt)],
                  ["Last projection update", formatDateTime(bundle.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[8rem_1fr] gap-4 py-3 first:pt-0 last:pb-0">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
              {bundle.status === "FLAGGED" ? (
                <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
                  <p className="font-semibold">Bundle requires review</p>
                  <p className="mt-1 text-red-800">The timeline contains an invalid backward movement. The scan has been preserved.</p>
                </div>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-slate-50 p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="font-semibold text-slate-950">Immutable scan history</h2>
                <p className="mt-1 text-sm text-slate-600">
                  The audit trail is append-only. Stage and status are derived from these records.
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  Timeline displayed in chronological scan order.
                </p>
              </div>
              {scanLogs.length ? (
                <Timeline scans={scanLogs} />
              ) : (
                <EmptyState title="No scan history" description="This bundle has no recorded production scans." />
              )}
            </section>
          </div>
        </>
      ) : null}
    </main>
  );
}
