/**
 * Vitrum /bars sayfasından metin çeker; vitrum-bars-landing.json ile birleştirir.
 *   node scripts/fetch-vitrum-bars-landing.mjs --insecure
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "data", "vitrum-bars-landing.json");
const URL = "https://www.vitrumgroup.org/bars";
const INSECURE = process.argv.includes("--insecure");

if (INSECURE) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

function strip(html) {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(OUT, "utf8"));
  } catch (_) {}

  const r = await fetch(URL, {
    headers: { "User-Agent": "EqustoVitrumLanding/1.0 (+https://equsto.com)" },
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const html = await r.text();
  const plain = strip(html);

  const payload = {
    ...existing,
    source: URL,
    fetchedAt: new Date().toISOString(),
    pageTitle: (html.match(/<title[^>]*>([^<]+)</i) || [])[1] || existing.pageTitle,
    rawLength: plain.length,
  };

  await fs.writeFile(OUT, JSON.stringify(payload, null, 2), "utf8");
  console.log("[vitrum] landing meta güncellendi →", path.relative(ROOT, OUT));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
