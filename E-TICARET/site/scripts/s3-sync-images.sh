#!/usr/bin/env bash
# Upload public/images to S3 for CloudFront
set -euo pipefail

cd /opt/equsto/E-TICARET/site

if [[ ! -f .env.production ]]; then
  echo "HATA: .env.production yok"
  exit 1
fi

export $(grep -v '^#' .env.production | xargs)

if [[ -z "${AWS_S3_BUCKET:-}" ]]; then
  echo "AWS_S3_BUCKET not set in .env.production"
  exit 1
fi

echo "[s3-sync] Bucket: $AWS_S3_BUCKET"
echo "[s3-sync] Region: ${AWS_REGION:-eu-central-1}"

# Sync images
aws s3 sync public/images s3://$AWS_S3_BUCKET/images --region ${AWS_REGION:-eu-central-1} --only-show-errors

echo "[s3-sync] Done"