import assert from "node:assert/strict";
import { closeSync, existsSync, openSync, rmSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const port = 3199;
const baseUrl = `http://127.0.0.1:${port}`;
const databasePath = fileURLToPath(new URL("../prisma/api-test.db", import.meta.url));
const testEnv = {
  ...process.env,
  DATABASE_URL: "file:./api-test.db",
  NEXT_TELEMETRY_DISABLED: "1",
  RUST_BACKTRACE: "1",
};
const prismaCli = fileURLToPath(
  new URL("../node_modules/prisma/build/index.js", import.meta.url),
);
const nextCli = fileURLToPath(
  new URL("../node_modules/next/dist/bin/next", import.meta.url),
);
let server;

function cleanDatabase() {
  for (const suffix of ["", "-journal", "-shm", "-wal"]) {
    const path = `${databasePath}${suffix}`;
    if (existsSync(path)) rmSync(path, { force: true });
  }
}

function migrateDatabase() {
  // Prisma's Windows engine expects the SQLite file to exist on Node 24.
  closeSync(openSync(databasePath, "a"));
  let lastMigration;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    lastMigration = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
      env: testEnv,
      encoding: "utf8",
      shell: false,
      timeout: 30_000,
    });
    if (lastMigration.status === 0) return;
  }
  throw new Error(
    lastMigration?.error?.message ||
      lastMigration?.stderr ||
      lastMigration?.stdout ||
      "Test migration failed.",
  );
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js test server exited with code ${server.exitCode}.`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/bundles`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Next.js test server did not become ready.");
}

async function request(path, options = {}, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json();
  assert.equal(
    response.status,
    expectedStatus,
    `${options.method ?? "GET"} ${path}: ${JSON.stringify(body)}`,
  );
  return body;
}

async function runTests() {
  const initialList = await request("/api/bundles");
  assert.equal(initialList.data.length, 0);

  const bundle = {
    id: "TEST-BND-001",
    orderId: "TEST-ORDER-001",
    style: "API Test Overshirt",
    size: "M",
    quantity: 12,
  };
  const created = await request(
    "/api/bundles",
    { method: "POST", body: JSON.stringify(bundle) },
    201,
  );
  assert.equal(created.data.currentStage, "CUTTING");
  assert.equal(created.data.scanLogs.length, 1);

  await request("/api/bundles", { method: "POST", body: JSON.stringify(bundle) }, 409);
  await request("/api/bundles/DOES-NOT-EXIST", {}, 404);

  const details = await request(`/api/bundles/${bundle.id}`);
  assert.equal(details.data.id, bundle.id);

  const invalidScan = {
    clientId: "invalid-stage",
    stage: "IRONING",
    scannedAt: "2026-07-03T10:00:00.000Z",
    deviceId: "test-device",
  };
  await request(
    `/api/bundles/${bundle.id}/scan`,
    { method: "POST", body: JSON.stringify(invalidScan) },
    422,
  );

  const sewingScan = {
    clientId: "test-direct-sewing",
    stage: "SEWING",
    scannedAt: "2026-07-03T10:01:00.000Z",
    deviceId: "test-device",
  };
  const scanned = await request(
    `/api/bundles/${bundle.id}/scan`,
    { method: "POST", body: JSON.stringify(sewingScan) },
    201,
  );
  assert.equal(scanned.data.bundle.currentStage, "SEWING");

  const duplicate = await request(
    `/api/bundles/${bundle.id}/scan`,
    { method: "POST", body: JSON.stringify(sewingScan) },
  );
  assert.equal(duplicate.data.duplicate, true);

  await request(
    `/api/bundles/${bundle.id}/scan`,
    {
      method: "POST",
      body: JSON.stringify({ ...sewingScan, stage: "FINISHING" }),
    },
    409,
  );

  const backward = await request(
    `/api/bundles/${bundle.id}/scan`,
    {
      method: "POST",
      body: JSON.stringify({
        ...sewingScan,
        clientId: "test-backward-cutting",
        stage: "CUTTING",
      }),
    },
    201,
  );
  assert.equal(backward.data.scan.flagged, true);
  assert.equal(backward.data.bundle.currentStage, "SEWING");
  assert.equal(backward.data.bundle.status, "FLAGGED");

  await request(
    "/api/bundles",
    {
      method: "POST",
      body: JSON.stringify({ ...bundle, id: "TEST-BND-002" }),
    },
    201,
  );

  const syncPayload = {
    scans: [
      {
        bundleId: "TEST-BND-002",
        clientId: "test-sync-finishing",
        stage: "FINISHING",
        scannedAt: "2026-07-03T09:00:00.000Z",
        deviceId: "offline-device-b",
      },
      {
        bundleId: "TEST-BND-002",
        clientId: "test-sync-sewing",
        stage: "SEWING",
        scannedAt: "2026-07-03T12:00:00.000Z",
        deviceId: "offline-device-a",
      },
    ],
  };
  const synced = await request(
    "/api/sync",
    { method: "POST", body: JSON.stringify(syncPayload) },
  );
  assert.equal(synced.data.created, 2);
  assert.equal(synced.data.flagged, 0);
  assert.equal(synced.data.bundles[0].currentStage, "FINISHING");

  const syncedAgain = await request(
    "/api/sync",
    { method: "POST", body: JSON.stringify(syncPayload) },
  );
  assert.equal(syncedAgain.data.created, 0);
  assert.equal(syncedAgain.data.duplicates, 2);

  await request(
    "/api/sync",
    {
      method: "POST",
      body: JSON.stringify({
        scans: [{ ...syncPayload.scans[0], bundleId: "DOES-NOT-EXIST", clientId: "missing" }],
      }),
    },
    404,
  );

  const finalDetails = await request("/api/bundles/TEST-BND-002");
  assert.equal(finalDetails.data.scanLogs.length, 3);
  const finalList = await request("/api/bundles?stage=FINISHING&limit=10");
  assert.equal(finalList.pagination.total, 1);
}

function stopServer() {
  if (!server || server.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(server.pid), "/t", "/f"], { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
}

try {
  cleanDatabase();
  migrateDatabase();
  server = spawn(process.execPath, [nextCli, "dev", "-p", String(port)], {
    env: testEnv,
    stdio: "inherit",
    shell: false,
  });
  await waitForServer();
  await runTests();
  console.log("API integration tests passed.");
} finally {
  stopServer();
  cleanDatabase();
}
