import { z } from "zod";

import { syncScanSchema } from "@/modules/scans/scan.validation";

export const syncRequestSchema = z.object({
  scans: z.array(syncScanSchema).min(1).max(500),
});

export type SyncRequest = z.infer<typeof syncRequestSchema>;
