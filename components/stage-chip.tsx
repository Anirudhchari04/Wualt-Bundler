import { Badge } from "@/components/badge";
import type { ProductionStage } from "@/types/bundle";
import { stageLabels } from "@/utils/stages";

export function StageChip({ stage }: { stage: ProductionStage }) {
  const tone = stage === "PACKING" ? "green" : stage === "CUTTING" ? "neutral" : "blue";
  return <Badge tone={tone}>{stageLabels[stage]}</Badge>;
}
