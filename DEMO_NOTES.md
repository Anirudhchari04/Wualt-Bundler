# Demo Notes — Bundle Tracker

## 1. Architecture Overview
- Start with the browser UI built in Next.js.
- Note the split between online API routes and offline IndexedDB storage.
- Point out the service layer that keeps backend logic separated from route handlers.

## 2. Database and Backend
- Explain the Prisma + SQLite stack.
- `Bundle` stores production package metadata.
- `ScanLog` stores immutable scan history with `clientId`, `scannedAt`, `receivedAt`, and `flagged` metadata.

## 3. Offline Queue
- Demonstrate offline mode in the top nav toggle.
- Show that scans are queued locally in IndexedDB.
- Verify the pending queue count and sync status on the dashboard.

## 4. Conflict Resolution
- Use the bundled conflict scenario: two offline windows scan the same bundle differently.
- Reconnect each window and show that both scan records remain.
- Confirm the bundle is flagged and the current stage derives from stage order.

## 5. Immutable Audit Log
- Open the bundle details page.
- Show chronological timeline rendering with scanned time, received time, device, and audit ID.
- Call out flagged entries and preserved history.

## 6. Future Improvements
- Mention per-device stable IDs, bundle creation UI, audit exports, and improved offline recovery messaging.

## 7. Wrap Up
- Reinforce that the system preserves data faithfully,
- keeps history immutable,
- and supports offline scanning with eventual sync.
