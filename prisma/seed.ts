import {
  BundleStatus,
  Prisma,
  PrismaClient,
  ProductionStage,
} from "@prisma/client";

const prisma = new PrismaClient();

const stageOrder = [
  ProductionStage.CUTTING,
  ProductionStage.SEWING,
  ProductionStage.FINISHING,
  ProductionStage.PACKING,
] as const;

const bundles = [
  ["BND-1001", "ORD-24071", "Classic Crew Tee", "S", 24, 0],
  ["BND-1002", "ORD-24071", "Classic Crew Tee", "M", 30, 1],
  ["BND-1003", "ORD-24071", "Classic Crew Tee", "L", 28, 2],
  ["BND-1004", "ORD-24072", "Oxford Work Shirt", "M", 18, 3],
  ["BND-1005", "ORD-24072", "Oxford Work Shirt", "L", 20, 1],
  ["BND-1006", "ORD-24073", "Utility Cargo Trouser", "30", 16, 0],
  ["BND-1007", "ORD-24073", "Utility Cargo Trouser", "32", 20, 2],
  ["BND-1008", "ORD-24073", "Utility Cargo Trouser", "34", 20, 3],
  ["BND-1009", "ORD-24074", "Ribbed Polo", "S", 22, 1],
  ["BND-1010", "ORD-24074", "Ribbed Polo", "M", 26, 2],
  ["BND-1011", "ORD-24074", "Ribbed Polo", "XL", 18, 0],
  ["BND-1012", "ORD-24075", "Relaxed Hoodie", "M", 14, 3],
  ["BND-1013", "ORD-24075", "Relaxed Hoodie", "L", 16, 1],
  ["BND-1014", "ORD-24076", "Canvas Chore Jacket", "M", 12, 2],
  ["BND-1015", "ORD-24076", "Canvas Chore Jacket", "L", 12, 0],
  ["BND-1016", "ORD-24077", "Performance Legging", "XS", 20, 1],
  ["BND-1017", "ORD-24077", "Performance Legging", "S", 24, 2],
  ["BND-1018", "ORD-24078", "Linen Resort Shirt", "M", 15, 3],
  ["BND-1019", "ORD-24078", "Linen Resort Shirt", "L", 15, 0],
  ["BND-1020", "ORD-24079", "Quilted Gilet", "XL", 10, 2],
] as const;

async function main() {
  const baseTime = new Date("2026-06-16T03:30:00.000Z");

  for (const [id, orderId, style, size, quantity, stageIndex] of bundles) {
    const currentStage = stageOrder[stageIndex];
    const isCompleted = currentStage === ProductionStage.PACKING;
    const hasBackwardScan = id === "BND-1020";

    await prisma.bundle.upsert({
      where: { id },
      update: {},
      create: {
        id,
        orderId,
        style,
        size,
        quantity,
        currentStage,
        status: hasBackwardScan
          ? BundleStatus.FLAGGED
          : isCompleted
            ? BundleStatus.COMPLETED
            : BundleStatus.ACTIVE,
        createdAt: new Date(baseTime.getTime() + Number(id.slice(-2)) * 3_600_000),
      },
    });

    const scans: Prisma.ScanLogCreateInput[] = stageOrder
      .slice(0, stageIndex + 1)
      .map((stage, index) => {
      const scannedAt = new Date(
        baseTime.getTime() + Number(id.slice(-2)) * 3_600_000 + index * 86_400_000,
      );

        return {
        id: `SCAN-${id.slice(-4)}-${stage}`,
        clientId: `seed-${id.toLowerCase()}-${stage.toLowerCase()}`,
        bundle: { connect: { id } },
        stage,
        scannedAt,
        receivedAt: new Date(scannedAt.getTime() + 90_000),
        deviceId: index % 2 === 0 ? "cut-floor-tablet-01" : "line-supervisor-02",
        };
      });

    if (hasBackwardScan) {
      const scannedAt = new Date(baseTime.getTime() + 5 * 86_400_000);
      scans.push({
        id: "SCAN-1020-BACKWARD-SEWING",
        clientId: "seed-bnd-1020-backward-sewing",
        bundle: { connect: { id } },
        stage: ProductionStage.SEWING,
        scannedAt,
        receivedAt: new Date(scannedAt.getTime() + 7_200_000),
        deviceId: "offline-handheld-03",
        flagged: true,
        flagReason: "Backward movement: SEWING scan received after FINISHING.",
      });
    }

    for (const scan of scans) {
      await prisma.scanLog.upsert({
        where: { clientId: scan.clientId },
        update: {},
        create: scan,
      });
    }
  }
}

main()
  .then(() => {
    console.log(`Seeded ${bundles.length} bundles with immutable scan history.`);
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
