/**
 * Google Merchant XML — yerel dosya üretimi (opsiyonel).
 * Canlı feed: GET /feeds/google-products.xml
 *
 *   npm run feed:google
 *   SITE_ORIGIN=https://equsto.com npm run feed:google
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(siteDir, "public", "feeds");
const outFile = path.join(outDir, "google-products.xml");

const origin = (process.env.SITE_ORIGIN || "https://equsto.com").replace(/\/$/, "");

async function buildViaFetch() {
  const url = `${origin}/feeds/google-products.xml`;
  console.log("[feed:google] fetch", url);
  const res = await fetch(url, { headers: { Accept: "application/xml" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.text();
}

async function buildViaTsx() {
  const tsxBin = path.join(siteDir, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
  const script = path.join(siteDir, "scripts", "run-google-merchant-feed.ts");
  const r = spawnSync(tsxBin, [script], {
    cwd: siteDir,
    encoding: "utf8",
    shell: process.platform === "win32",
    env: { ...process.env, NEXT_PUBLIC_SITE_ORIGIN: origin },
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "tsx feed build failed");
  }
  if (r.stdout.trim()) console.log(r.stdout.trim().split("\n")[0]);
  return fs.readFile(outFile, "utf8");
}

async function main() {
  let xml;
  try {
    xml = await buildViaTsx();
  } catch (e) {
    console.warn("[feed:google] tsx build failed, trying fetch:", e.message);
    xml = await buildViaFetch();
  }

  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(outFile, xml, "utf8");
  const count = (xml.match(/<item>/g) || []).length;
  console.log("[feed:google] wrote", outFile, "—", count, "items");
}

main().catch((e) => {
  console.error("[feed:google]", e.message || e);
  process.exit(1);
});
