import { z } from "zod";

export const scanPayloadSchema = z.object({
  clientId: z.string().trim().min(1).max(150),
  stage: z.enum(["CUTTING", "SEWING", "FINISHING", "PACKING"]),
  scannedAt: z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  deviceId: z.string().trim().min(1).max(150),
});

export const syncScanSchema = scanPayloadSchema.extend({
  bundleId: z.string().trim().min(1).max(100),
});

export type ScanPayload = z.infer<typeof scanPayloadSchema>;
export type SyncScanInput = z.infer<typeof syncScanSchema>;
export type RecordScanInput = ScanPayload & { bundleId: string };
