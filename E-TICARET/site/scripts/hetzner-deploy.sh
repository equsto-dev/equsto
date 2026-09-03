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

# Sync images to S3 for CloudFront (if AWS configured)
if [[ -f .env.production ]]; then
  # Source only AWS vars to avoid issues with special chars in other vars
  AWS_S3_BUCKET=$(grep '^AWS_S3_BUCKET=' .env.production | cut -d'=' -f2-)
  AWS_REGION=$(grep '^AWS_REGION=' .env.production | cut -d'=' -f2-)
  if [[ -n "${AWS_S3_BUCKET:-}" ]] && command -v aws &> /dev/null; then
    echo "[hetzner-deploy] Syncing images to S3..."
    aws s3 sync public/images "s3://$AWS_S3_BUCKET/images" --region "${AWS_REGION:-eu-central-1}" --only-show-errors || echo "[hetzner-deploy] S3 sync failed (non-fatal)"
  else
    echo "[hetzner-deploy] S3 sync skipped (no AWS_S3_BUCKET or aws cli)"
  fi
fi

# Docker app nextjs (uid 1001) — public/data bind mount yazılabilir olmalı
if [[ -d public/data ]]; then
  chown -R 1001:1001 public/data 2>/dev/null || true
fi
if [[ -d scripts/data ]]; then
  mkdir -p scripts/data
  chown -R 1001:1001 scripts/data 2>/dev/null || true
fi

docker compose --env-file .env.production build --pull
docker compose --env-file .env.production up -d

export EQUSTO_ENV_FILE=.env.production

if [[ ! -d node_modules/@prisma/client ]]; then
  echo "[hetzner-deploy] npm ci (migrate için)..."
  npm ci --ignore-scripts
fi

echo "[hetzner-deploy] prisma generate (host)..."
node --import ./scripts/load-env.mjs ./node_modules/prisma/build/index.js generate
echo "[hetzner-deploy] prisma migrate deploy (host)..."
node --import ./scripts/load-env.mjs ./node_modules/prisma/build/index.js migrate deploy

if [[ -f scripts/export-pfos-referans-sku-links.mjs ]]; then
  echo "[hetzner-deploy] referans SKU links export..."
  # .mjs → .ts import; tsx gerekli (düz node ERR_UNKNOWN_FILE_EXTENSION verir)
  if [[ -f ./node_modules/tsx/dist/cli.mjs ]]; then
    node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs \
      scripts/export-pfos-referans-sku-links.mjs \
      || echo "[hetzner-deploy] SKU export uyarı — DATABASE_URL / Prisma kontrol edin"
  else
    echo "[hetzner-deploy] SKU export atlandı — tsx yok (npm ci gerekir)"
  fi
fi

echo "[hetzner-deploy] sağlık kontrolü..."
sleep 3
docker compose --env-file .env.production exec -T app node -e "fetch('http://127.0.0.1:3000/').then(r=>{console.log('HTTP',r.status);process.exit(r.ok?0:1)}).catch(e=>{console.error(e);process.exit(1)})" \
  || docker compose --env-file .env.production logs --tail=30 app

echo "[hetzner-deploy] OK"
