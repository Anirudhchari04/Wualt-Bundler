import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";

const databasePath = fileURLToPath(new URL("../prisma/api-test.db", import.meta.url));
const prismaCli = fileURLToPath(new URL("../node_modules/prisma/build/index.js", import.meta.url));

if (existsSync(databasePath)) rmSync(databasePath);
if (existsSync(`${databasePath}-journal`)) rmSync(`${databasePath}-journal`);
if (existsSync(`${databasePath}-shm`)) rmSync(`${databasePath}-shm`);
if (existsSync(`${databasePath}-wal`)) rmSync(`${databasePath}-wal`);

const env = {
  ...process.env,
  DATABASE_URL: "file:./prisma/api-test.db",
  NEXT_TELEMETRY_DISABLED: "1",
  RUST_BACKTRACE: "1",
};

const migrate = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
  env,
  encoding: "utf8",
  shell: false,
  timeout: 30000,
});

if (migrate.status !== 0) {
  console.error(migrate.stderr || migrate.stdout);
  process.exit(1);
}

const { bundleService } = await import("../modules/bundles/bundle.service.js");
const { syncService } = await import("../modules/sync/sync.service.js");
const { prisma } = await import("../lib/prisma.js");

const testId = "TEST-CONFLICT";

try {
  const bundle = await bundleService.create({
    id: testId,
    orderId: "O-1",
    style: "Conflict Test",
    size: "M",
    quantity: 5,
  });
  console.log("created", bundle.id, bundle.currentStage, bundle.status);

  const scanA = {
    bundleId: testId,
    clientId: "A-1",
    stage: "SEWING",
    scannedAt: new Date().toISOString(),
    deviceId: "A",
  };

  const scanB = {
    bundleId: testId,
    clientId: "B-1",
    stage: "CUTTING",
    scannedAt: new Date(Date.now() + 1000).toISOString(),
    deviceId: "B",
  };

  const resultA = await syncService.sync({ scans: [scanA] });
  console.log("syncA", resultA.created, resultA.duplicates, resultA.flagged);

  const afterA = await bundleService.getById(testId);
  console.log("afterA", afterA.currentStage, afterA.status, afterA.scanLogs.length);

  const resultB = await syncService.sync({ scans: [scanB] });
  console.log("syncB", resultB.created, resultB.duplicates, resultB.flagged);

  const afterB = await bundleService.getById(testId);
  console.log("afterB", afterB.currentStage, afterB.status, afterB.scanLogs.length);

  const logs = await prisma.scanLog.findMany({
    where: { bundleId: testId },
    orderBy: [{ receivedAt: "asc" }],
  });
  console.log(
    "logs",
    logs.map((l) => ({ clientId: l.clientId, stage: l.stage, flagged: l.flagged })),
  );
} finally {
  await prisma.$disconnect();
}
