#!/usr/bin/env bash
# Quick update loop on EC2 after git pull
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  echo "Missing .env — run: cp deploy/ec2.env.example .env && nano .env"
  exit 1
fi

docker compose up -d --build
docker compose ps
echo ""
echo "API: http://13.203.201.155:3000/api"
echo "Docs: http://13.203.201.155:3000/docs"
echo "Health: curl http://127.0.0.1:3000/api/health"
