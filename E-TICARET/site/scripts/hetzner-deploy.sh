#!/usr/bin/env bash
# Hetzner sunucuda güncelleme — repo kökünden veya E-TICARET/site içinden çalıştırın.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$SITE_DIR"

if [[ ! -f .env.production ]]; then
  echo "[hetzner-deploy] HATA: .env.production yok — cp .env.production.example .env.production"
  exit 1
fi

echo "[hetzner-deploy] site: $SITE_DIR"
git fetch origin
git pull --ff-only origin main

# Docker app nextjs (uid 1001) — public/data bind mount yazılabilir olmalı
if [[ -d public/data ]]; then
  chown -R 1001:1001 public/data 2>/dev/null || true
fi

docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d

if [[ -d node_modules/@prisma/client ]]; then
  echo "[hetzner-deploy] prisma generate (host scripts)..."
  node --import ./scripts/load-env.mjs ./node_modules/prisma/build/index.js generate
  echo "[hetzner-deploy] prisma migrate deploy (host)..."
  node --import ./scripts/load-env.mjs ./node_modules/prisma/build/index.js migrate deploy \
    || echo "[hetzner-deploy] migrate uyarı — DIRECT_URL kontrol edin"
  if [[ -f scripts/export-pfos-referans-sku-links.mjs ]]; then
    echo "[hetzner-deploy] referans SKU links export..."
    node --import ./scripts/load-env.mjs scripts/export-pfos-referans-sku-links.mjs \
      || echo "[hetzner-deploy] SKU export uyarı — DATABASE_URL kontrol edin"
  fi
else
  echo "[hetzner-deploy] migrate atlandı (node_modules yok) — npm ci && npm run db:migrate:deploy"
fi

echo "[hetzner-deploy] sağlık kontrolü..."
sleep 3
docker compose --env-file .env.production exec -T app node -e "fetch('http://127.0.0.1:3000/').then(r=>{console.log('HTTP',r.status);process.exit(r.ok?0:1)}).catch(e=>{console.error(e);process.exit(1)})" \
  || docker compose --env-file .env.production logs --tail=30 app

echo "[hetzner-deploy] OK"
