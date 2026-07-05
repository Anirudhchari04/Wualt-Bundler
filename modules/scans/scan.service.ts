import { Prisma, type ScanLog } from "@prisma/client";

import { ConflictError, NotFoundError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import {
  compareStages,
  deriveBundleStatus,
  deriveCurrentStage,
} from "@/lib/stages";
import { bundleService } from "@/modules/bundles/bundle.service";
import type { RecordScanInput } from "./scan.validation";

export type ScanResult = {
  scan: ScanLog;
  duplicate: boolean;
  bundle: Awaited<ReturnType<typeof bundleService.getById>>;
};

export class ScanService {
  async record(input: RecordScanInput): Promise<ScanResult> {
    try {
      const outcome = await prisma.$transaction((tx) => this.recordInTransaction(tx, input));
      return {
        ...outcome,
        bundle: await bundleService.getById(input.bundleId),
      };
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const existing = await prisma.scanLog.findUnique({ where: { clientId: input.clientId } });
        if (existing && scansMatch(existing, input)) {
          return {
            scan: existing,
            duplicate: true,
            bundle: await bundleService.getById(input.bundleId),
          };
        }
        throw clientIdConflict(input.clientId);
      }
      throw error;
    }
  }

  private async recordInTransaction(tx: Prisma.TransactionClient, input: RecordScanInput) {
    const existing = await tx.scanLog.findUnique({ where: { clientId: input.clientId } });
    if (existing) {
      if (!scansMatch(existing, input)) throw clientIdConflict(input.clientId);
      return { scan: existing, duplicate: true };
    }

    const bundle = await tx.bundle.findUnique({
      where: { id: input.bundleId },
      include: { scanLogs: { select: { stage: true, flagged: true } } },
    });
    if (!bundle) throw new NotFoundError(`Bundle '${input.bundleId}' was not found.`);

    const establishedStage = deriveCurrentStage(bundle.scanLogs);
    const isBackward = compareStages(input.stage, establishedStage) < 0;
    const scan = await tx.scanLog.create({
      data: {
        ...input,
        flagged: isBackward,
        flagReason: isBackward
          ? `Backward movement: ${input.stage} received after ${establishedStage} was established.`
          : null,
      },
    });

    const completeHistory = [
      ...bundle.scanLogs,
      { stage: scan.stage, flagged: scan.flagged },
    ];
    await tx.bundle.update({
      where: { id: input.bundleId },
      data: {
        currentStage: deriveCurrentStage(completeHistory),
        status: deriveBundleStatus(completeHistory),
      },
    });

    return { scan, duplicate: false };
  }
}

export function scansMatch(existing: ScanLog, input: RecordScanInput) {
  return (
    existing.clientId === input.clientId &&
    existing.bundleId === input.bundleId &&
    existing.stage === input.stage &&
    existing.scannedAt.getTime() === input.scannedAt.getTime() &&
    existing.deviceId === input.deviceId
  );
}

function clientIdConflict(clientId: string) {
  return new ConflictError(`clientId '${clientId}' is already assigned to another scan.`);
}

export const scanService = new ScanService();
