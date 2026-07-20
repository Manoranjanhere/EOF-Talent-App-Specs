# EOF Talent App

EOF Talent is a talent marketplace platform for Events/OTT/Fashion use cases.
This repository is a monorepo containing:

- `backend`: NestJS API with Prisma/PostgreSQL data layer.
- `mobile-app`: React Native (Expo) client app with role-aware navigation.
- `packages/shared`: shared enums/contracts used by backend and mobile.

Version: `1.0.0` (MVP-first delivery)

## What This Project Covers

The current implementation provides the full v1 foundation described in the build plan:

- Email/password auth and mobile OTP auth.
- Role-based flows for talent, employer/agency, and admin operators.
- Talent and organization profile management.
- Tag-based skills model (primary and secondary tags).
- Album/media management with private access grants and expiry.
- Subscription plan master and user subscription purchases.
- Job posting, job applications, and job/member search.
- Chat APIs with seen and block features, plus WebSocket gateway.
- Profile flagging, moderation actions, and feedback/help requests.
- Audit-first data model with soft-delete approach and clone-audit tables.

## User Roles (GIDs)

Role constants live in `packages/shared/src/index.ts`.

- `1`: Talent
- `2`: Talent Employer / Talent Finder Agency
- `5`: Admin
- `7`: Team Admin
- `10`: Super Admin

## Repository Layout

- `backend`
  - `src/modules`: feature modules (`auth`, `users`, `profiles`, `tags`, `albums`, `subscriptions`, `jobs`, `search`, `chat`, `moderation`, `feedback`, `health`)
  - `src/common`: guards, decorators, interceptors
  - `prisma`: schema and seed
  - `test`: backend test suite
- `mobile-app`
  - `src/navigation`: auth + role-based app navigation
  - `src/screens`: user/admin screens
  - `src/services`: API service layer
  - `src/state`: auth context state
- `packages/shared`
  - shared enums like `GroupId`, `PurchaseType`, `UserFlagReason`, `AlbumVisibility`
- `docs`
  - deployment guide and release checklist

## Architecture Overview

- Frontend: React Native Expo app (`mobile-app`).
- Backend: NestJS REST API + Socket.IO gateway (`backend`).
- Persistence: PostgreSQL via Prisma.
- Media target: S3-compatible object storage (optional locally).
- API docs: Swagger at `/docs` on backend server.

## Backend API Surface

All REST routes are under `/api` prefix.

- `auth`
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/login/mobile-otp`
  - `POST /api/auth/login/mobile-otp/send` (request OTP before login)
- `users`
  - `GET /api/users/me`
  - `PATCH /api/users/:id/activate`
  - `PATCH /api/users/:id/deactivate`
  - `PATCH /api/users/:id/login-enabled`
- `profiles`
  - `GET /api/profiles/:userId`
  - `PATCH /api/profiles/talent/me`
  - `PATCH /api/profiles/org/me`
  - `POST /api/profiles/tags/me`
  - `POST /api/profiles/:userId/rate`
- `tags`
  - `GET /api/tags`
  - `POST /api/tags`
- `albums`
  - `POST /api/albums`
  - `POST /api/albums/:albumId/assets`
  - `POST /api/albums/:albumId/access-grants`
  - `GET /api/albums/:albumId/access-grants`
  - `DELETE /api/albums/access-grants/:grantId`
- `subscriptions`
  - `GET /api/subscriptions/plans`
  - `POST /api/subscriptions/plans`
  - `POST /api/subscriptions/purchase`
  - `GET /api/subscriptions/me`
- `jobs`
  - `GET /api/jobs`
  - `POST /api/jobs`
  - `POST /api/jobs/:jobId/apply`
- `search`
  - `GET /api/search/members`
  - `GET /api/search/jobs`
- `chat`
  - `GET /api/chat/threads`
  - `POST /api/chat/threads`
  - `GET /api/chat/threads/:threadId/messages`
  - `POST /api/chat/threads/:threadId/messages`
  - `PATCH /api/chat/threads/:threadId/seen`
  - `POST /api/chat/block`
  - `PATCH /api/chat/unblock/:blockedUserId`
- `moderation`
  - `POST /api/moderation/flags`
  - `GET /api/moderation/flags`
  - `POST /api/moderation/actions`
- `feedback`
  - `POST /api/feedback`
  - `GET /api/feedback/me`
- `health`
  - `GET /api/health`

Swagger UI: `http://localhost:3000/docs`

## Data Model and Compliance Notes

Prisma schema is at `backend/prisma/schema.prisma`.

Highlights:

- Use-case-neutral naming with master/child patterns.
- Tags are modeled as `tag_master` with link tables (`profile_tag_link`, `job_tag_link`) and FK indexes.
- Member-facing profile extension is `profile_member` (not skill/talent-specific).
- Availability flag is `is_available` on `user_account`.
- Ratings use `user_rating`.
- Every business table includes audit fields:
  - `last_update_at`
  - `last_update_ip`
  - `last_update_by`
- Soft-delete pattern is enforced using `is_active`.
- Users/sub-data are retained (not physically deleted in app flows).
- Clone audit tables are present for admin and purchase snapshots:
  - `clone_audit_admin`
  - `clone_audit_purchase`

## Mobile App Coverage

The mobile app contains:

- Auth screens: login, register.
- Dashboard and role-aware tabs.
- Talent profile and employer/agency profile screens.
- Albums and private-access management screen.
- Member search and job search card screens.
- Job posting screen (employer/agency roles).
- Chat screen with seen and block actions.
- Feedback/help screen.
- Admin moderation screens for reports and user actions.

Navigation is role-sensitive in `mobile-app/src/navigation/root-navigator.tsx`.

## Prerequisites

- Node.js `>=20.11.0`
- npm
- PostgreSQL installed and running locally (required)

This project does **not** use Docker. Media files are stored on local disk by default (`STORAGE_DRIVER=local`).

## Environment Configuration

Root template:

- `.env.example` (project-level reference)

Backend:

- `backend/.env.example` for local development
- `backend/.env.production.example` for production baseline

Mobile:

- `mobile-app/.env.example`

Important backend variables:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `STORAGE_DRIVER` (`local` by default)
- `UPLOAD_DIR` (default `./uploads`)
- `OTP_TEST_BYPASS` (set `true` locally; dev OTP is always `123456` and is logged in the backend terminal)

### Mobile OTP (local dev)

- MVP does **not** send real SMS yet. OTP is stored in memory and returned in the API when `OTP_TEST_BYPASS=true`.
- Flow: `POST /api/auth/login/mobile-otp/send` → enter OTP → `POST /api/auth/login/mobile-otp`.
- The mobile number must belong to an existing account (register with phone first).
- After **Send OTP**, check the backend terminal for: `[DEV OTP] mobile=... code=123456`.
- If the backend restarts (file save / hot reload), request OTP again — the in-memory code is cleared.

Important mobile variable:

- `EXPO_PUBLIC_API_URL`

## Local Development Quick Start

1. Install dependencies:
   - `npm install`
2. Make sure PostgreSQL is running and create DB `eof_talent`.
3. Prepare environment files:
   - copy `backend/.env.example` to `backend/.env`
   - set `DATABASE_URL` to your local Postgres user/password
   - copy `mobile-app/.env.example` to `mobile-app/.env`
4. Generate Prisma client:
   - `npm run prisma:generate`
5. Apply migrations and seed:
   - `npm run prisma:migrate`          # apply existing migrations (deploy)
   - `npm run prisma:migrate:dev -- --name your_change`  # only when you change schema.prisma
   - `npm run prisma:seed`
6. Start backend:
   - `npm run start:backend`
7. Start mobile app:
   - `npm run start:mobile`

### Media (local vs S3)

Default is **local disk** (no S3):
- `STORAGE_DRIVER=local`
- Files go to `backend/uploads` (gitignored)
- Served at `http://localhost:3000/api/media/files/...`

Optional cloud S3 later — set in `backend/.env`:
```
STORAGE_DRIVER=s3
S3_REGION=ap-south-1
S3_BUCKET=your-bucket-name
S3_ACCESS_KEY=...
S3_SECRET_KEY=...
S3_ENDPOINT=https://s3.ap-south-1.amazonaws.com
S3_FORCE_PATH_STYLE=false
```

### Role-based app features

| Feature | Talent | Employer/Agency |
|---|---|---|
| Discover talent | No | Yes |
| Search jobs | Yes | No |
| Post job | No | Yes |
| Albums / portfolio upload | Yes | No |
| Company profile | No | Yes |
| Chat / Help | Yes | Yes |

## Scripts

From repository root:

- `npm run build`: build all workspaces
- `npm run test`: run tests across workspaces
- `npm run lint`: run workspace lint scripts
- `npm run start:backend`: start NestJS in watch mode
- `npm run start:mobile`: start Expo
- `npm run prisma:generate`: generate Prisma client
- `npm run prisma:migrate`: apply pending migrations (`prisma migrate deploy`)
- `npm run prisma:migrate:dev`: create/apply a new migration while developing
- `npm run prisma:seed`: seed baseline data

Backend-only (workspace `backend`):

- `npm run build --workspace backend`
- `npm run test --workspace backend`
- `npm run start --workspace backend`
- `npm run start:dev --workspace backend`

Mobile-only (workspace `mobile-app`):

- `npm run start --workspace mobile-app`
- `npm run android --workspace mobile-app`
- `npm run ios --workspace mobile-app`
- `npm run web --workspace mobile-app`

## Testing and Verification

Current checks used by this project:

- Backend Jest tests in `backend/test`.
- Mobile TypeScript validation (`tsc --noEmit`).
- Workspace-wide build and tests from root scripts.

Recommended verification flow before release:

1. `npm run build`
2. `npm run test`
3. Validate critical business flows from `docs/release-checklist.md`

## Seed Data Included

`backend/prisma/seed.ts` creates baseline records such as:

- User group masters (GIDs 1,2,5,7,10)
- Organization types
- Skill tags
- Subscription plans (messaging and job posting)
- Bootstrap system admin user and role link

## Deployment

- Detailed runbook: `docs/deployment-guide.md`
- Release readiness checklist: `docs/release-checklist.md`
- Local media folder: `backend/uploads` (`STORAGE_DRIVER=local`)

## Security and Reliability Defaults

- Validation pipe with strict request validation.
- Throttling guard enabled globally.
- JWT auth and role guard support.
- CORS support through `CORS_ORIGINS`.
- Audit context capture via interceptor.

## MVP Notes and Phase-2 Enhancements

This repository is MVP-first and provider-ready.

Likely phase-2 items:

- Production OTP provider integration.
- Payment gateway integration for subscriptions/job posting billing.
- Push notifications.
- Multi-instance Socket.IO (phase 2).
- Expanded mobile UI polish and test depth.
