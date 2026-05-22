# EOF Talent Deployment Guide

## Local Infra Bootstrap

1. Start local dependencies:
   - `docker compose up -d postgres redis minio`
2. Install packages:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Apply migration and seed:
   - `npm run prisma:migrate`
   - `npm run prisma:seed`
5. Start API:
   - `npm run start:backend`
6. Start mobile app:
   - `npm run start:mobile`

## Production Baseline

- Backend runtime: Node 20 with containerized NestJS service.
- Data plane:
  - PostgreSQL for system-of-record data.
  - Redis for low-latency chat/session/cache.
  - S3-compatible object storage for profile and album media.
- Horizontal scale:
  - Run multiple API instances behind a load balancer.
  - Sticky sessions for WebSocket traffic at ingress.
  - Move Socket.IO to Redis adapter in phase 2 for cross-instance fan-out.

## Security Controls

- Use separate JWT access and refresh secrets in vault.
- Restrict `CORS_ORIGINS` to known app/admin domains.
- Use private bucket ACL and signed URLs for media access.
- Keep `OTP_TEST_BYPASS=false` in production.

## Deployment Steps

1. Build backend image:
   - `docker build -f backend/Dockerfile -t eof-talent-backend:1.0.0 .`
2. Run Prisma migration job before app rollout.
3. Deploy backend service with rolling strategy.
4. Point mobile app `EXPO_PUBLIC_API_URL` to production API.
5. Run the release checklist in [`docs/release-checklist.md`](release-checklist.md).
