# EOF Talent Deployment Guide

## Local Bootstrap (no Docker)

1. Install and run PostgreSQL locally; create database `eof_talent`.
2. Install packages:
   - `npm install`
3. Copy `backend/.env.example` → `backend/.env` and set `DATABASE_URL`.
4. Keep `STORAGE_DRIVER=local` (media saved under `backend/uploads`).
5. Generate Prisma client:
   - `npm run prisma:generate`
6. Apply migration and seed:
   - `npm run prisma:migrate`
   - `npm run prisma:seed`
7. Start API:
   - `npm run start:backend`
8. Start mobile app:
   - `npm run start:mobile`

## Production Baseline

- Backend runtime: Node 20 with NestJS service.
- Data plane:
  - PostgreSQL for system-of-record data.
  - Local disk or cloud S3 (`STORAGE_DRIVER=s3`) for profile and album media.
- Horizontal scale:
  - Run multiple API instances behind a load balancer.
  - Sticky sessions for WebSocket traffic at ingress.
  - Prefer cloud object storage when running more than one API instance.

## Security Controls

- Use separate JWT access and refresh secrets in vault.
- Restrict `CORS_ORIGINS` to known app/admin domains.
- Keep media folders outside the git repo and back them up.
- Keep `OTP_TEST_BYPASS=false` in production.

## Deployment Steps

1. Build backend with `npm run build --workspace backend`.
2. Run Prisma migration job before app rollout.
3. Deploy backend service with rolling strategy.
4. Point mobile app `EXPO_PUBLIC_API_URL` to production API.
5. Run the release checklist in [`docs/release-checklist.md`](release-checklist.md).
