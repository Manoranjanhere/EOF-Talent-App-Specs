# EOF Talent v1 Release Checklist

## Environment and Infra

- [ ] Production domains and SSL certificates configured
- [ ] `backend/.env.production.example` mapped to secret store values
- [ ] PostgreSQL backups and point-in-time recovery enabled
- [ ] Redis persistence and memory policies configured
- [ ] S3 bucket lifecycle and access policy validated

## Data and Compliance

- [ ] Prisma migrations applied on staging and production
- [ ] Seed data loaded: groups, employer types, plans, tags
- [ ] Audit fields (`last_update_at`, `last_update_ip`, `last_update_by`) confirmed on key writes
- [ ] No hard-delete flow for `user_account` and dependent entities
- [ ] Clone audit writes verified for admin and subscription purchase actions

## Core Functional Smoke Tests

- [ ] Register/login via email and password
- [ ] Mobile OTP login (or production provider flow)
- [ ] Profile update and mandatory profile photo constraint
- [ ] Album creation limits and private access grant + revoke
- [ ] Messaging subscription purchase and chat send/seen/block
- [ ] Job posting purchase + 90-day validity + job search cards
- [ ] Member search filters and card responses
- [ ] Flag profile + admin action workflow
- [ ] Help/feedback ticket submission

## Operational Hardening

- [ ] API rate limits and auth guards tested under load
- [ ] WebSocket connection limits and stale connection cleanup configured
- [ ] Application logs and alerts integrated
- [ ] Error dashboard and incident on-call flow documented
