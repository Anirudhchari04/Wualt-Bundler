-- CreateTable
CREATE TABLE "Bundle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currentStage" TEXT NOT NULL DEFAULT 'CUTTING',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "scannedAt" DATETIME NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceId" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    CONSTRAINT "ScanLog_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "Bundle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Bundle_orderId_idx" ON "Bundle"("orderId");

-- CreateIndex
CREATE INDEX "Bundle_currentStage_status_idx" ON "Bundle"("currentStage", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ScanLog_clientId_key" ON "ScanLog"("clientId");

-- CreateIndex
CREATE INDEX "ScanLog_bundleId_scannedAt_idx" ON "ScanLog"("bundleId", "scannedAt");

-- CreateIndex
CREATE INDEX "ScanLog_flagged_idx" ON "ScanLog"("flagged");
