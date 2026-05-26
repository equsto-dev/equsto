/**
 * Supabase bağlantı testi — .env içindeki DATABASE_URL / DIRECT_URL.
 * Kullanım: node --import ./scripts/load-env.mjs scripts/verify-db.mjs
 */
import { PrismaClient } from "@prisma/client";

const urls = [
  ["DATABASE_URL", process.env.DATABASE_URL],
  ["DIRECT_URL", process.env.DIRECT_URL],
];

function hostOf(url) {
  try {
    return new URL(url.replace(/^postgresql:/, "http:")).host;
  } catch {
    return "?";
  }
}

for (const [name, url] of urls) {
  if (!url) {
    console.log(`${name}: (missing)`);
    continue;
  }
  console.log(`${name}: host ${hostOf(url)}`);
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    await prisma.$connect();
    console.log(`${name}: OK`);
  } catch (e) {
    const msg =
      e?.meta?.message ||
      e?.cause?.message ||
      (e?.message && e.message.trim()) ||
      e?.code ||
      JSON.stringify(e, null, 0)?.slice(0, 200) ||
      String(e);
    console.log(`${name}: FAIL — ${String(msg).split("\n")[0]}`);
  } finally {
    await prisma.$disconnect();
  }
}
