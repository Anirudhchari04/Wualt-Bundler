import { BundleStatus, ProductionStage } from "@prisma/client";

export const STAGE_ORDER = [
  ProductionStage.CUTTING,
  ProductionStage.SEWING,
  ProductionStage.FINISHING,
  ProductionStage.PACKING,
] as const;

const stageRank = new Map(STAGE_ORDER.map((stage, index) => [stage, index]));

export function compareStages(left: ProductionStage, right: ProductionStage) {
  return getStageRank(left) - getStageRank(right);
}

export function deriveCurrentStage(
  scans: ReadonlyArray<{ stage: ProductionStage }>,
): ProductionStage {
  return scans.reduce<ProductionStage>(
    (highest, scan) => (compareStages(scan.stage, highest) > 0 ? scan.stage : highest),
    ProductionStage.CUTTING,
  );
}

export function deriveBundleStatus(
  scans: ReadonlyArray<{ stage: ProductionStage; flagged: boolean }>,
): BundleStatus {
  if (scans.some((scan) => scan.flagged)) return BundleStatus.FLAGGED;
  return deriveCurrentStage(scans) === ProductionStage.PACKING
    ? BundleStatus.COMPLETED
    : BundleStatus.ACTIVE;
}

function getStageRank(stage: ProductionStage) {
  const rank = stageRank.get(stage);
  if (rank === undefined) throw new Error(`Unknown production stage: ${stage}`);
  return rank;
}
