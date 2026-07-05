import { Badge } from "@/components/badge";
import { StageChip } from "@/components/stage-chip";
import type { ScanLog } from "@/types/bundle";
import { formatDateTime } from "@/utils/format";

export function Timeline({ scans }: { scans: ScanLog[] }) {
  const sortedScans = [...scans].sort(
    (a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime(),
  );

  return (
    <ol className="space-y-3">
      {sortedScans.map((scan, index) => (
        <li key={scan.id} className="relative grid grid-cols-[1.5rem_1fr] gap-4 pb-7 last:pb-0">
          {index < scans.length - 1 ? (
            <span className="absolute left-[0.7rem] top-5 h-[calc(100%-0.5rem)] w-px bg-slate-200" />
          ) : null}
          <span
            className={`relative mt-1 h-6 w-6 rounded-full border-4 border-white ${
              scan.flagged ? "bg-red-500 ring-1 ring-red-200" : "bg-blue-700 ring-1 ring-blue-200"
            }`}
          />
          <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <StageChip stage={scan.stage} />
                {scan.flagged ? <Badge tone="red">Flagged</Badge> : null}
              </div>
              <time className="text-xs font-semibold text-slate-500" dateTime={scan.scannedAt}>
                Scanned {formatDateTime(scan.scannedAt)}
              </time>
            </div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">Device ID</dt>
                <dd className="mt-1 font-mono text-sm text-slate-800">{scan.deviceId}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Received at</dt>
                <dd className="mt-1 text-sm text-slate-800">{formatDateTime(scan.receivedAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">Audit ID</dt>
                <dd className="mt-1 font-mono text-sm text-slate-800 truncate" title={scan.clientId}>{scan.clientId}</dd>
              </div>
              {scan.flagged ? (
                <div>
                  <dt className="text-xs text-slate-500">Flag reason</dt>
                  <dd className="mt-1 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    {scan.flagReason ?? "Invalid production movement detected."}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        </li>
      ))}
    </ol>
  );
}
