#!/bin/sh
set -e

echo "[entrypoint] Waiting for database..."
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

echo "[entrypoint] Seeding master data (tags, org types, plans)..."
node prisma/seed.cjs || echo "[entrypoint] Seed failed (non-fatal)"

echo "[entrypoint] Starting API on 0.0.0.0:${PORT:-3000}"
exec node dist/main.js
