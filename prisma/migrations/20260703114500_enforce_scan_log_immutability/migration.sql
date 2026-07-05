-- ScanLog is an append-only audit ledger. Enforce that invariant below Prisma.
CREATE TRIGGER "ScanLog_prevent_update"
BEFORE UPDATE ON "ScanLog"
BEGIN
  SELECT RAISE(ABORT, 'ScanLog records are immutable');
END;

CREATE TRIGGER "ScanLog_prevent_delete"
BEFORE DELETE ON "ScanLog"
BEGIN
  SELECT RAISE(ABORT, 'ScanLog records are immutable');
END;
