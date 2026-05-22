# EOF Talent App

Monorepo for EOF Talent marketplace:

- `backend`: NestJS API + Prisma
- `mobile-app`: React Native (Expo) app
- `packages/shared`: shared contracts and enums

## Quick start

1. Copy `.env.example` to `.env` and update values.
2. Install dependencies:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. Run migrations and seed:
   - `npm run prisma:migrate`
   - `npm run prisma:seed`
5. Start backend:
   - `npm run start:backend`
6. Start mobile app:
   - `npm run start:mobile`

## Tests

- Backend tests:
  - `npm run test --workspace backend`
- Mobile type-check:
  - `npx tsc -p mobile-app/tsconfig.json --noEmit`

## Deployment

- Infrastructure and rollout guide: [`docs/deployment-guide.md`](docs/deployment-guide.md)
- Pre-release checklist: [`docs/release-checklist.md`](docs/release-checklist.md)
