import { Prisma, ProductionStage } from "@prisma/client";
import { randomUUID } from "node:crypto";

import { ConflictError, NotFoundError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { deriveBundleStatus, deriveCurrentStage } from "@/lib/stages";
import type { CreateBundleInput, ListBundlesInput } from "./bundle.validation";

const bundleWithScans = {
  scanLogs: {
    orderBy: [{ receivedAt: "asc" }, { id: "asc" }],
  },
} satisfies Prisma.BundleInclude;

export class BundleService {
  async list(input: ListBundlesInput) {
    const where: Prisma.BundleWhereInput = {
      ...(input.orderId ? { orderId: input.orderId } : {}),
      ...(input.stage ? { currentStage: input.stage } : {}),
      ...(input.status ? { status: input.status } : {}),
    };
    const skip = (input.page - 1) * input.limit;

    const [records, total] = await prisma.$transaction([
      prisma.bundle.findMany({
        where,
        include: bundleWithScans,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip,
        take: input.limit,
      }),
      prisma.bundle.count({ where }),
    ]);

    return {
      data: records.map(withDerivedState),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    };
  }

  async create(input: CreateBundleInput) {
    const id = input.id ?? `BND-${randomUUID()}`;
    const now = new Date();

    try {
      return await prisma.$transaction(async (tx) => {
        const bundle = await tx.bundle.create({
          data: {
            id,
            orderId: input.orderId,
            style: input.style,
            size: input.size,
            quantity: input.quantity,
            currentStage: ProductionStage.CUTTING,
          },
        });

        const initialScan = await tx.scanLog.create({
          data: {
            clientId: `bundle-created:${id}`,
            bundleId: id,
            stage: ProductionStage.CUTTING,
            scannedAt: now,
            receivedAt: now,
            deviceId: "system",
          },
        });

        return withDerivedState({ ...bundle, scanLogs: [initialScan] });
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictError(`Bundle '${id}' already exists.`);
      }
      throw error;
    }
  }

  async getById(id: string) {
    const bundle = await prisma.bundle.findUnique({
      where: { id },
      include: bundleWithScans,
    });
    if (!bundle) throw new NotFoundError(`Bundle '${id}' was not found.`);
    return withDerivedState(bundle);
  }
}

function withDerivedState<T extends { scanLogs: Array<{ stage: ProductionStage; flagged: boolean }> }>(
  bundle: T,
) {
  return {
    ...bundle,
    currentStage: deriveCurrentStage(bundle.scanLogs),
    status: deriveBundleStatus(bundle.scanLogs),
  };
}

export const bundleService = new BundleService();
