import { z } from "zod";

export const bundleIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

export const createBundleSchema = z.object({
  id: z.string().trim().min(1).max(100).optional(),
  orderId: z.string().trim().min(1).max(100),
  style: z.string().trim().min(1).max(150),
  size: z.string().trim().min(1).max(30),
  quantity: z.number().int().positive().max(100_000),
});

export const listBundlesSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  orderId: z.string().trim().min(1).max(100).optional(),
  stage: z.enum(["CUTTING", "SEWING", "FINISHING", "PACKING"]).optional(),
  status: z.enum(["ACTIVE", "FLAGGED", "COMPLETED"]).optional(),
});

export type CreateBundleInput = z.infer<typeof createBundleSchema>;
export type ListBundlesInput = z.infer<typeof listBundlesSchema>;
