# Bundle Tracker | Project Nexus

A production-stage bundle tracking demo built with Next.js. This app supports online bundle inspection, offline scan queueing, and immutable audit history reconciliation.

## Overview

Bundle Tracker helps production teams scan garment bundles, advance them through stages, and preserve an immutable audit trail. It supports offline scanning with local IndexedDB persistence, queued sync, and conflict-safe backend reconciliation.

## Architecture

- Browser-based React UI with Next.js App Router
- Offline cache and queue storage in IndexedDB via Dexie
- Backend API routes powered by Next.js route handlers
- Service layer for bundle and scan operations
- Prisma ORM with SQLite persistence

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Prisma
- SQLite
- Dexie
- Zod

## Folder Structure

- `app/` — pages, routes, and view composition
- `components/` — reusable UI elements
- `hooks/` — custom React behavior
- `lib/` — shared utilities and API helpers
- `modules/` — service layer and validation logic
- `offline/` — IndexedDB persistence and cache helpers
- `prisma/` — schema and migrations
- `services/` — front-end API wrappers
- `types/` — application type definitions
- `scripts/` — test and automation scripts

## Database Design

- `Bundle`
  - `id`, `orderId`, `style`, `size`, `quantity`
  - `currentStage`, `status`, `createdAt`, `updatedAt`
  - relation to `ScanLog`
- `ScanLog`
  - `clientId` unique audit identifier
  - `bundleId`, `stage`, `scannedAt`, `receivedAt`, `deviceId`
  - `flagged`, `flagReason`

## Offline Sync

- Offline scans are stored in IndexedDB as a pending queue
- Bundle metadata is cached locally to support offline lookup
- The app tracks connectivity and allows forced offline mode
- Queued scans are posted to `POST /api/sync` when online
- Existing backend sync logic is preserved

## Conflict Handling

- All scans are preserved in an immutable `ScanLog`
- Duplicate or conflicting offline scans are detected by `clientId`
- Backward stage movements are flagged instead of overwritten
- Current stage is derived from the highest recorded stage by order

## Getting Started

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

Open `http://localhost:3000`.

## Seed Database

```bash
npm run db:seed
```

## Build and Verify

```bash
npm run build
npm run lint
npm run test:api
```

## API Endpoints

- `GET /api/bundles`
- `POST /api/bundles`
- `GET /api/bundles/[id]`
- `POST /api/bundles/[id]/scan`
- `POST /api/sync`

## Notes

- This app is designed to preserve audit history and support offline queueing.
- Future improvements include stable device IDs, richer merge review, and audit export.
