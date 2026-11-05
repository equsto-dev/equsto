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
# git fetch/pull done by workflow before calling this script

echo "[hetzner-deploy] env koruma (keep + DIRECT_URL)..."
node scripts/protect-hetzner-env.mjs

# Debug: check .env.production exists
if [[ ! -f .env.production ]]; then
  echo "[hetzner-deploy] HATA: .env.production yok"
  exit 1
fi
echo "[hetzner-deploy] .env.production found"

# Sync images to S3 for CloudFront (if AWS configured)
if [[ -f .env.production ]]; then
  # Source only AWS vars to avoid issues with special chars in other vars
  AWS_S3_BUCKET=$(grep '^AWS_S3_BUCKET=' .env.production 2>/dev/null | cut -d'=' -f2- || true)
  AWS_REGION=$(grep '^AWS_REGION=' .env.production 2>/dev/null | cut -d'=' -f2- || true)
  AWS_ACCESS_KEY_ID=$(grep '^AWS_ACCESS_KEY_ID=' .env.production 2>/dev/null | cut -d'=' -f2- || true)
  AWS_SECRET_ACCESS_KEY=$(grep '^AWS_SECRET_ACCESS_KEY=' .env.production 2>/dev/null | cut -d'=' -f2- || true)
  export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
  # CLOUDFRONT_DISTRIBUTION_ID should be set as environment variable (from GitHub secret)
  # Not stored in .env.production for security
  if [[ -n "${AWS_S3_BUCKET:-}" && -n "${AWS_ACCESS_KEY_ID:-}" && -n "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
    AWS_REGION="${AWS_REGION:-eu-central-1}"
    export AWS_DEFAULT_REGION="$AWS_REGION"

    ensure_aws_cli() {
      if command -v aws >/dev/null 2>&1; then
        return 0
      fi
      echo "[hetzner-deploy] aws cli yok — kuruluyor…"
      if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq awscli 2>/dev/null || true
      fi
      if command -v aws >/dev/null 2>&1; then
        return 0
      fi
      # apt paketi yoksa resmi AWS CLI v2
      if command -v curl >/dev/null 2>&1; then
        local tmp
        tmp="$(mktemp -d)"
        if curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "$tmp/awscliv2.zip" \
          && (command -v unzip >/dev/null 2>&1 || apt-get install -y -qq unzip 2>/dev/null) \
          && unzip -q "$tmp/awscliv2.zip" -d "$tmp" \
          && "$tmp/aws/install" -i /usr/local/aws-cli -b /usr/local/bin; then
          command -v aws >/dev/null 2>&1 && return 0
        fi
        rm -rf "$tmp" || true
      fi
      return 1
    }

    run_s3_sync() {
      local region="$1"
      if ensure_aws_cli; then
        echo "[hetzner-deploy] Syncing images to S3 ($AWS_S3_BUCKET) via aws cli…"
        aws s3 sync public/images "s3://$AWS_S3_BUCKET/images" --region "$region" --only-show-errors
        return $?
      fi
      if command -v docker >/dev/null 2>&1; then
        echo "[hetzner-deploy] aws cli yok — docker amazon/aws-cli ile S3 sync…"
        local img="public.ecr.aws/aws-cli/aws-cli:latest"
        docker pull "$img" >/dev/null 2>&1 || img="amazon/aws-cli:latest"
        docker run --rm \
          -e AWS_ACCESS_KEY_ID \
          -e AWS_SECRET_ACCESS_KEY \
          -e AWS_DEFAULT_REGION="$region" \
          -v "$SITE_DIR/public/images:/images:ro" \
          "$img" \
          s3 sync /images "s3://$AWS_S3_BUCKET/images" --region "$region" --only-show-errors
        return $?
      fi
      echo "[hetzner-deploy] S3 sync skipped (aws cli + docker yok)"
      return 1
    }

    run_cf_invalidation() {
      local region="$1"
      [[ -n "${CLOUDFRONT_DISTRIBUTION_ID:-}" ]] || return 0
      echo "[hetzner-deploy] Creating CloudFront invalidation…"
      if command -v aws >/dev/null 2>&1; then
        aws cloudfront create-invalidation \
          --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
          --paths "/images/pfos/*" "/images/catalog/cafemarkt/*" "/images/catalog/sparo/*" \
          --region "$region" || echo "[hetzner-deploy] CloudFront invalidation failed (non-fatal)"
        return 0
      fi
      if command -v docker >/dev/null 2>&1; then
        docker run --rm \
          -e AWS_ACCESS_KEY_ID \
          -e AWS_SECRET_ACCESS_KEY \
          -e AWS_DEFAULT_REGION="$region" \
          public.ecr.aws/aws-cli/aws-cli:latest \
          cloudfront create-invalidation \
            --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
            --paths "/images/pfos/*" "/images/catalog/cafemarkt/*" "/images/catalog/sparo/*" \
            --region "$region" || echo "[hetzner-deploy] CloudFront invalidation failed (non-fatal)"
      fi
    }

    if run_s3_sync "$AWS_REGION"; then
      run_cf_invalidation "$AWS_REGION"
    else
      echo "[hetzner-deploy] S3 sync failed (non-fatal)"
    fi
  else
    echo "[hetzner-deploy] S3 sync skipped (AWS_S3_BUCKET / credentials yok)"
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
mkdir -p scripts/data/liste-uploads
chown -R 1001:1001 scripts/data 2>/dev/null || true
mkdir -p data/liste-uploads
chown -R 1001:1001 data/liste-uploads 2>/dev/null || true

if [[ -f scripts/reprice-all-from-tcmb-kur.mjs ]]; then
  echo "[hetzner-deploy] TCMB kur ile katalog TL fiyatları..."
  node scripts/reprice-all-from-tcmb-kur.mjs || echo "[hetzner-deploy] kur reprice uyarı — devam"
  chown -R 1001:1001 public/data 2>/dev/null || true
fi

docker compose --env-file .env.production build --pull --no-cache

echo "[hetzner-deploy] eski app container adı çakışması temizliği..."
docker ps -a --format '{{.Names}}' | grep -E '(^|_)equsto-app-1$' | while read -r name; do
  docker rm -f "$name" >/dev/null 2>&1 || true
done

docker compose --env-file .env.production up -d --remove-orphans

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

if [[ -f scripts/index-meilisearch.mjs ]]; then
  echo "[hetzner-deploy] Meilisearch indeks (katalog)..."
  MEILI_KEY="$(grep '^MEILISEARCH_MASTER_KEY=' .env.production 2>/dev/null | cut -d'=' -f2- || true)"
  MEILISEARCH_HOST=http://127.0.0.1:7700 \
  MEILISEARCH_MASTER_KEY="${MEILI_KEY:-equsto-prod-meili-key}" \
  node --import ./scripts/load-env.mjs scripts/index-meilisearch.mjs \
    || echo "[hetzner-deploy] Meili indeks uyarı — devam"
fi

if [[ -f scripts/hetzner-install-cron.sh ]]; then
  echo "[hetzner-deploy] crontab (TCMB + ajanlar)..."
  bash scripts/hetzner-install-cron.sh || echo "[hetzner-deploy] cron kurulum uyarı"
fi

echo "[hetzner-deploy] OK"
