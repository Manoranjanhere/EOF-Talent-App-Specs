#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
# Simple retry loop for Postgres readiness
i=0
until npx prisma migrate deploy --schema=./prisma/schema.prisma; do
  i=$((i + 1))
  if [ "$i" -ge 30 ]; then
    echo "[entrypoint] Prisma migrate failed after retries"
    exit 1
  fi
  echo "[entrypoint] DB not ready, retry $i/30..."
  sleep 2
done

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "[entrypoint] Seeding database..."
  npx prisma db seed || echo "[entrypoint] Seed skipped/failed (non-fatal)"
fi

echo "[entrypoint] Starting API on 0.0.0.0:${PORT:-3000}"
exec node dist/main.js
