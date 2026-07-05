import { ConflictError, NotFoundError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { compareStages } from "@/lib/stages";
import {
  scanService,
  scansMatch,
  type ScanResult,
} from "@/modules/scans/scan.service";
import type { RecordScanInput } from "@/modules/scans/scan.validation";
import type { SyncRequest } from "./sync.validation";

export class SyncService {
  async sync(input: SyncRequest) {
    await this.preflight(input.scans);

    const results: ScanResult[] = [];
    const scansInStageOrder = [...input.scans].sort((left, right) =>
      compareStages(left.stage, right.stage),
    );
    for (const scan of scansInStageOrder) {
      results.push(await scanService.record(scan));
    }

    return {
      received: input.scans.length,
      created: results.filter((result) => !result.duplicate).length,
      duplicates: results.filter((result) => result.duplicate).length,
      flagged: results.filter((result) => result.scan.flagged).length,
      scans: results.map(({ scan, duplicate }) => ({ ...scan, duplicate })),
      bundles: uniqueBundles(results),
    };
  }

  private async preflight(scans: RecordScanInput[]) {
    assertRequestClientIdsAreConsistent(scans);

    const bundleIds = [...new Set(scans.map((scan) => scan.bundleId))];
    const clientIds = [...new Set(scans.map((scan) => scan.clientId))];
    const [bundles, existingScans] = await prisma.$transaction([
      prisma.bundle.findMany({ where: { id: { in: bundleIds } }, select: { id: true } }),
      prisma.scanLog.findMany({ where: { clientId: { in: clientIds } } }),
    ]);

    const foundBundleIds = new Set(bundles.map((bundle) => bundle.id));
    const missingBundleId = bundleIds.find((id) => !foundBundleIds.has(id));
    if (missingBundleId) {
      throw new NotFoundError(`Bundle '${missingBundleId}' was not found.`);
    }

    const inputByClientId = new Map(scans.map((scan) => [scan.clientId, scan]));
    const conflict = existingScans.find(
      (existing) => !scansMatch(existing, inputByClientId.get(existing.clientId)!),
    );
    if (conflict) {
      throw new ConflictError(
        `clientId '${conflict.clientId}' is already assigned to another scan.`,
      );
    }
  }
}

function assertRequestClientIdsAreConsistent(scans: RecordScanInput[]) {
  const seen = new Map<string, RecordScanInput>();
  for (const scan of scans) {
    const previous = seen.get(scan.clientId);
    if (previous && !sameInput(previous, scan)) {
      throw new ConflictError(
        `clientId '${scan.clientId}' is used by conflicting scans in this request.`,
      );
    }
    seen.set(scan.clientId, scan);
  }
}

function sameInput(left: RecordScanInput, right: RecordScanInput) {
  return (
    left.bundleId === right.bundleId &&
    left.stage === right.stage &&
    left.scannedAt.getTime() === right.scannedAt.getTime() &&
    left.deviceId === right.deviceId
  );
}

function uniqueBundles(results: ScanResult[]) {
  return [...new Map(results.map((result) => [result.bundle.id, result.bundle])).values()];
}

export const syncService = new SyncService();
