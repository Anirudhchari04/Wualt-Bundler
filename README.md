# Bundle Tracker

Bundle Tracker is a production-oriented demo application for moving garment bundles through a staged workflow while preserving an immutable audit trail. It combines a modern Next.js interface with offline-first scan capture, queued synchronization, and conflict-safe reconciliation so the experience remains usable even when the floor network drops.

## What this project does

- Lets a user locate a bundle and advance it to the next production stage
- Captures scans locally when offline and syncs them later when connectivity returns
- Preserves every scan in an immutable history so no audit entry is overwritten
- Flags backward-stage movements instead of silently discarding them
- Demonstrates a practical conflict-resolution model for distributed scan events

## Key features

- Responsive scanner workflow built with Next.js and React
- IndexedDB-backed offline queue and cache via Dexie
- API routes for bundle lookup, scan advancement, and sync reconciliation
- Prisma + SQLite persistence for a lightweight local-first demo database
- Seed data for quick onboarding and demo runs

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

## Notes

This project is intentionally scoped as a polished demo for offline-first bundle handling and audit-safe conflict resolution. It is designed to be extended into a more production-grade system with server-issued device identities, stronger sync recovery, and supervisor review workflows.
