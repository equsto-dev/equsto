/**
 * Vercel env yapıştırma kontrolü — şifre loglanmaz.
 * Kullanım: node --import ./scripts/load-env.mjs scripts/vercel-env-hint.mjs
 */
function audit(name, raw) {
  if (!raw) {
    console.log(`${name}: EKSIK`);
    return;
  }
  let val = raw;
  const hadQuotes =
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"));
  if (hadQuotes) val = val.slice(1, -1);

  let parsed;
  try {
    parsed = new URL(val.replace(/^postgresql:/, "http:"));
  } catch {
    console.log(`${name}: GECERSIZ URL (ozel karakter encode?)`);
    return;
  }

  const pass = decodeURIComponent(parsed.password || "");
  const masked = val.replace(
    /:([^:@/]+)@/,
    ":***@"
  );

  console.log(`\n${name}:`);
  console.log(`  uzunluk: ${val.length}`);
  console.log(`  host: ${parsed.host}`);
  console.log(`  sifre uzunlugu: ${pass.length}`);
  console.log(`  pgbouncer: ${val.includes("pgbouncer=true") ? "evet" : "hayir"}`);
  console.log(`  ornek (maskeli): ${masked.slice(0, 80)}...`);

  console.log("\n  Vercel'e yapistirirken:");
  console.log("  - Variable name:", name);
  console.log("  - Value: .env.local icindeki tirnak DISINDAKI metin");
  console.log("  - Tirnak (\") EKLEMEYIN");
  console.log("  - Production + Preview isaretli olsun");
}

console.log("\n=== Yerel .env.local -> Vercel kontrol listesi ===\n");
audit("DATABASE_URL", process.env.DATABASE_URL);
audit("DIRECT_URL", process.env.DIRECT_URL);

function envLine(name) {
  const v = process.env[name]?.trim();
  if (!v) {
    console.log(`\n${name}: EKSIK`);
    return;
  }
  const preview = v.length > 60 ? v.slice(0, 56) + "..." : v;
  console.log(`\n${name}: OK (${v.length} karakter)`);
  console.log(`  onizleme: ${preview}`);
}

console.log("\n--- Medya / arama ---");
envLine("NEXT_PUBLIC_ASSET_CDN_URL");
envLine("MEILISEARCH_HOST");
envLine("MEILISEARCH_MASTER_KEY");
console.log("\nMeilisearch: npm run search:health → npm run search:index");
console.log("CDN: npm run assets:cdn:verify (veya node scripts/faz-b-verify-cdn.mjs)");
console.log("\nKaydettikten sonra: Deployments -> Redeploy (Production, cache kapali onerilir)");
