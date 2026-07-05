import type { ProductionStage } from "@/types/bundle";

export const stageLabels: Record<ProductionStage, string> = {
  CUTTING: "Cutting",
  SEWING: "Sewing",
  FINISHING: "Finishing",
  PACKING: "Packing",
};

const nextStage: Record<ProductionStage, ProductionStage | null> = {
  CUTTING: "SEWING",
  SEWING: "FINISHING",
  FINISHING: "PACKING",
  PACKING: null,
};

export function getNextStage(stage: ProductionStage) {
  return nextStage[stage];
}
