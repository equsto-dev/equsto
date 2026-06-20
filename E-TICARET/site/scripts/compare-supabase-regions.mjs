/**
 * İki Supabase bölgesinde tablo sayılarını karşılaştırır.
 * Kullanım:
 *   node --import ./scripts/load-env.mjs scripts/compare-supabase-regions.mjs
 *   node scripts/compare-supabase-regions.mjs .env.production.hetzner
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const extraEnv = process.argv[2];
if (extraEnv) {
  const file = path.resolve(extraEnv);
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const val = m[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    process.env[m[1]] = val;
  }
}

function hostOf(url) {
  try {
    return new URL(String(url).replace(/^postgresql:/, "http:")).host;
  } catch {
    return "?";
  }
}

async function stats(label, url) {
  if (!url) {
    console.log(`${label}: (missing URL)`);
    return;
  }
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    const [products, brands, categories] = await Promise.all([
      prisma.product.count(),
      prisma.brand.count(),
      prisma.category.count(),
    ]);
    console.log(
      `${label} @ ${hostOf(url)} → products=${products}, brands=${brands}, categories=${categories}`,
    );
  } catch (e) {
    console.log(`${label} @ ${hostOf(url)} → FAIL ${String(e.message || e).split("\n")[0]}`);
  } finally {
    await prisma.$disconnect();
  }
}

const tokyo = process.env.DATABASE_URL;
const frankfurt = process.env.FRANKFURT_DATABASE_URL || process.env.DATABASE_URL;

if (extraEnv) {
  await stats("target", frankfurt);
} else {
  const hetznerEnv = path.join(process.cwd(), ".env.production.hetzner");
  let frankfurtUrl = "";
  if (fs.existsSync(hetznerEnv)) {
    for (const line of fs.readFileSync(hetznerEnv, "utf8").split(/\r?\n/)) {
      const m = line.match(/^DATABASE_URL=(.*)$/);
      if (m) frankfurtUrl = m[1].replace(/^"(.*)"$/, "$1");
    }
  }
  await stats("tokyo (local .env)", tokyo);
  if (frankfurtUrl) await stats("frankfurt (hetzner)", frankfurtUrl);
}
