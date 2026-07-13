#!/usr/bin/env bash
# Hetzner crontab — Equsto ajanları (CRON_SECRET .env.production'dan okunur)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SITE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${SITE_DIR}/.env.production"
BASE_URL="${EQUSTO_CRON_BASE_URL:-https://equsto.com}"

echo "[cron] site: ${SITE_DIR}"

if ! command -v crontab >/dev/null 2>&1; then
  echo "[cron] cron paketi yok — kuruluyor..."
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y -qq cron
  systemctl enable cron
  systemctl start cron
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[cron] HATA: $ENV_FILE yok"
  exit 1
fi

CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d '"' | tr -d "'" | tr -d '[:space:]')"
if [[ -z "$CRON_SECRET" ]]; then
  echo "[cron] HATA: CRON_SECRET .env.production içinde tanımlı değil"
  exit 1
fi

AUTH="Authorization: Bearer ${CRON_SECRET}"

CRON_BLOCK="# Equsto ajanları — ${BASE_URL}
30 12 * * * curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/tcmb-kur\" >/tmp/equsto-cron-tcmb.log 2>&1
0 3 * * 1 curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/catalog-agent?ai=1\" >/tmp/equsto-cron-catalog.log 2>&1
15 3 * * 1 curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/mobile-agent?ai=1\" >/tmp/equsto-cron-mobile.log 2>&1
30 3 * * 1 curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/google-ads-agent?ai=1\" >/tmp/equsto-cron-ads.log 2>&1
45 3 * * 1 curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/en-agent?ai=1\" >/tmp/equsto-cron-en.log 2>&1
0 4 * * 1 curl -fsS -H \"${AUTH}\" \"${BASE_URL}/api/cron/blog-agent?ai=1\" >/tmp/equsto-cron-blog.log 2>&1"

TMP="$(mktemp)"
{
  crontab -l 2>/dev/null || true
} | grep -v 'Equsto ajanları' | grep -v '/api/cron/' >"$TMP" || true
printf '%s\n' "$CRON_BLOCK" >>"$TMP"
crontab "$TMP"
rm -f "$TMP"

if ! crontab -l >/dev/null 2>&1; then
  echo "[cron] HATA: crontab yazılamadı"
  exit 1
fi

echo "[cron] Crontab güncellendi:"
crontab -l | grep -E 'Equsto|equsto|/api/cron/'
