# syntax=docker/dockerfile:1
# Build: docker compose build  (E-TICARET/site içinden)
# Context: bu klasör — next.config outputFileTracingRoot site köküne düşer

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
ENV PRISMA_SKIP_POSTINSTALL_GENERATE=true
# postinstall scripts/ gerektirir — deps aşamasında yalnızca package*.json var
RUN npm ci --ignore-scripts

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* build-time (runtime env ile değişmez — rebuild gerekir)
ARG NEXT_PUBLIC_SITE_URL=https://equsto.com
ARG NEXT_PUBLIC_ASSET_CDN_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_GA4_ID
ARG NEXT_PUBLIC_GOOGLE_ADS_ID
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_ASSET_CDN_URL=$NEXT_PUBLIC_ASSET_CDN_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_GA4_ID=$NEXT_PUBLIC_GA4_ID \
    NEXT_PUBLIC_GOOGLE_ADS_ID=$NEXT_PUBLIC_GOOGLE_ADS_ID \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    DOCKER_BUILD=1 \
    NODE_ENV=production \
    NODE_OPTIONS=--max-old-space-size=4096

RUN node scripts/docker-ci.mjs

FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NODE_OPTIONS=--max-old-space-size=2560 \
    CHROMIUM_LOCAL_EXEC_PATH=/usr/bin/chromium \
    HOME=/tmp

# PFOS teklif PDF — puppeteer-core + sistem Chromium (libnspr4 vb.)
RUN apt-get update -qq \
  && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    chromium \
    fonts-liberation \
    fonts-noto-core \
  && rm -rf /var/lib/apt/lists/* \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/var/catalog ./var/catalog
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
