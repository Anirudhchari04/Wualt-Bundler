import { Badge } from "@/components/badge";
import type { BundleStatus } from "@/types/bundle";

const statusConfig = {
  ACTIVE: { label: "Active", tone: "blue" },
  FLAGGED: { label: "Flagged", tone: "red" },
  COMPLETED: { label: "Completed", tone: "green" },
} as const;

export function StatusChip({ status }: { status: BundleStatus }) {
  const config = statusConfig[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
