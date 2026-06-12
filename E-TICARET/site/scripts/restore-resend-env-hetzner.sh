#!/usr/bin/env bash
set -euo pipefail
SITE="/opt/equsto/E-TICARET/site"
SRC="$SITE/.env.production.save"
ENV="$SITE/.env.production"
KEYS='RESEND_API_KEY|RESEND_FROM|RESEND_ACCOUNT_EMAIL|EQUSTO_NOTIFY_EMAIL'

test -f "$SRC" || { echo "HATA: $SRC yok"; exit 1; }
test -f "$ENV" || { echo "HATA: $ENV yok"; exit 1; }

grep -E "^($KEYS)=" "$SRC" | sed 's/=.*/=***/'
grep -v -E "^($KEYS)=" "$ENV" > "$ENV.tmp"
grep -E "^($KEYS)=" "$SRC" >> "$ENV.tmp"
mv "$ENV.tmp" "$ENV"
cd "$SITE"
docker compose --env-file .env.production up -d app
docker compose --env-file .env.production exec -T app printenv RESEND_FROM
echo OK
