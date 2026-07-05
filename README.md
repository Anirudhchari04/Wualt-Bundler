# Bundle Tracker

Bundle Tracker is a production-oriented demo application for moving garment bundles through a staged workflow while preserving an immutable audit trail. It combines a modern Next.js interface with offline-first scan capture, queued synchronization, and conflict-safe reconciliation so the experience remains usable even when the floor network drops.

![Bundle Tracker overview](public/images/bundle-tracker-overview.svg)

## Why this project exists

This app was built to demonstrate how a manufacturing or warehouse workflow can remain reliable even in unstable connectivity conditions. A scanner can still record a movement when the network is down, and once the connection returns, the pending events are safely synced back into the system without sacrificing audit integrity.

## What this project does

- Lets a user locate a bundle and advance it to the next production stage
- Captures scans locally when offline and syncs them later when connectivity returns
- Preserves every scan in an immutable history so no audit entry is overwritten
- Flags backward-stage movements instead of silently discarding them
- Demonstrates a practical conflict-resolution model for distributed scan events

## Workflow at a glance

![Bundle Tracker workflow](public/images/bundle-tracker-workflow.svg)

1. A scanner or operator advances a bundle to the next stage.
2. The scan is written to a local pending queue when the app is offline.
3. The sync engine replays those scans once the network is available again.
4. Any anomalous backward movement is preserved and flagged for review.

## Key features

- Responsive scanner workflow built with Next.js and React
- IndexedDB-backed offline queue and cache via Dexie
- API routes for bundle lookup, scan advancement, and sync reconciliation
- Prisma + SQLite persistence for a lightweight local-first demo database
- Seed data for quick onboarding and demo runs
- Conflict-safe handling that prioritizes audit retention over destructive overwrite behavior

## Tech stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Dexie
- Zod

## Getting started

```bash
# Install dependencies
npm install

# Create the database and run migrations
npx prisma migrate dev

# Seed with sample bundles
npm run db:seed

# Start the dev server
npm run dev
```

Open http://localhost:3000.

## Project structure

- app/ — routes, pages, and UI composition
- components/ — reusable interface components
- hooks/ — React hooks for online and offline state
- modules/ — business logic and validation layers
- offline/ — local queue and cache persistence
- prisma/ — schema, migrations, and seed data
- services/ — frontend API wrappers
- types/ — shared domain types

## Verification and demo commands

```bash
npm run build
npm run lint
npm run test:api
```

## Design highlights

- The current stage is derived from the highest recorded stage rather than overwritten by sync order.
- Scan history is immutable, which makes audit review safer and more trustworthy.
- Backward-stage events are preserved and flagged so they can be investigated without data loss.

## Notes

This project is intentionally scoped as a polished demo for offline-first bundle handling and audit-safe conflict resolution. It is designed to be extended into a more production-grade system with server-issued device identities, stronger sync recovery, and supervisor review workflows.
