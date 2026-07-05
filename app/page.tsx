"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { DataTable, type DataTableColumn } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorBanner } from "@/components/error-banner";
import { LoadingSpinner } from "@/components/loading-spinner";
import { SearchBar } from "@/components/search-bar";
import { StageChip } from "@/components/stage-chip";
import { StatusChip } from "@/components/status-chip";
import { SyncStatus } from "@/components/sync-status";
import { useBundles } from "@/hooks/use-bundles";
import { useOnlineStatus } from "@/hooks/use-online-status";
import type { Bundle } from "@/types/bundle";

export default function DashboardPage() {
  const router = useRouter();
  const { bundles, loading, error, refresh } = useBundles();
  const [query, setQuery] = useState("");

  const filteredBundles = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return bundles;
    return bundles.filter((bundle) =>
      [bundle.id, bundle.orderId, bundle.style, bundle.size, bundle.currentStage, bundle.status]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [bundles, query]);

  const online = useOnlineStatus();

  const stats = useMemo(
    () => [
      { label: "Total bundles", value: bundles.length, accent: "border-slate-300" },
      {
        label: "Active",
        value: bundles.filter((bundle) => bundle.status === "ACTIVE").length,
        accent: "border-blue-500",
      },
      {
        label: "Flagged",
        value: bundles.filter((bundle) => bundle.status === "FLAGGED").length,
        accent: "border-red-500",
      },
      {
        label: "Completed",
        value: bundles.filter((bundle) => bundle.status === "COMPLETED").length,
        accent: "border-emerald-500",
      },
    ],
    [bundles],
  );

  const columns: DataTableColumn<Bundle>[] = [
    {
      key: "id",
      header: "Bundle ID",
      className: "w-[12rem]",
      render: (bundle) => <span className="font-mono text-xs font-semibold text-slate-900">{bundle.id}</span>,
    },
    { key: "order", header: "Order", render: (bundle) => bundle.orderId },
    { key: "style", header: "Style", render: (bundle) => bundle.style },
    { key: "size", header: "Size", render: (bundle) => bundle.size },
    { key: "stage", header: "Current stage", render: (bundle) => <StageChip stage={bundle.currentStage} /> },
    { key: "status", header: "Status", render: (bundle) => <StatusChip status={bundle.status} /> },
    {
      key: "actions",
      header: "Actions",
      render: (bundle) => (
        <Link
          href={`/bundles/${encodeURIComponent(bundle.id)}`}
          onClick={(event) => event.stopPropagation()}
          className="font-semibold text-blue-700 hover:text-blue-900 hover:underline"
        >
          View
        </Link>
      ),
    },
  ];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">Production overview</p>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">Bundle Dashboard</h1>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">
              {online ? "Online" : "Offline"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">Live status across garment production.</p>
        </div>
        <Link
          href="/scanner"
          className="inline-flex h-10 items-center rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
        >
          Open scanner
        </Link>
      </div>

      <section aria-label="Bundle statistics" className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-lg border border-slate-200 border-l-4 ${stat.accent} bg-white p-5 shadow-sm`}>
            <p className="text-sm font-medium text-slate-600">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-950">{loading ? "—" : stat.value}</p>
          </div>
        ))}
      </section>

      <div className="mt-6">
        <SyncStatus />
      </div>

      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-slate-950">Production bundles</h2>
            <p className="mt-0.5 text-sm text-slate-500">Select any row to inspect its audit trail.</p>
          </div>
          <SearchBar value={query} onChange={setQuery} placeholder="Search bundles" />
        </div>

        {loading ? <LoadingSpinner label="Loading production bundles" /> : null}
        {!loading && error ? <ErrorBanner message={error} onRetry={() => void refresh()} /> : null}
        {!loading && !error && filteredBundles.length === 0 ? (
          <EmptyState
            title={query ? "No matching bundles" : "No bundles yet"}
            description={query ? "Try a different ID, order, style, stage, or status." : "Created bundles will appear here."}
          />
        ) : null}
        {!loading && !error && filteredBundles.length > 0 ? (
          <DataTable
            rows={filteredBundles}
            columns={columns}
            rowKey={(bundle) => bundle.id}
            onRowClick={(bundle) => router.push(`/bundles/${encodeURIComponent(bundle.id)}`)}
            rowClassName={(bundle) =>
              bundle.status === "FLAGGED" ? "bg-red-50/70" : ""
            }
          />
        ) : null}
      </section>
    </main>
  );
}
