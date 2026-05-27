/**
 * Vitrum /bars hero video + poster → public/assets/besos/
 * Kaynak: https://www.vitrumgroup.org/bars
 *
 *   node scripts/fetch-vitrum-bars-hero.mjs
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public/assets/besos");

const ASSETS = {
  mp4: "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-transcode.mp4",
  webm: "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-transcode.webm",
  poster:
    "https://cdn.prod.website-files.com/678a5dce92e76b8ef57ebc9d%2F678fcaaaeb2ce6f77c20ab7a_vitrum%20bars%20hero-poster-00001.jpg",
};

const META = {
  source: "https://www.vitrumgroup.org/bars",
  fetchedAt: new Date().toISOString(),
  local: {
    mp4: "/assets/besos/vitrum-bars-hero.mp4",
    webm: "/assets/besos/vitrum-bars-hero.webm",
    poster: "/assets/besos/vitrum-bars-hero-poster.jpg",
  },
};

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log("✓", path.basename(dest), `(${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
}

await mkdir(OUT, { recursive: true });
await download(ASSETS.mp4, path.join(OUT, "vitrum-bars-hero.mp4"));
await download(ASSETS.webm, path.join(OUT, "vitrum-bars-hero.webm"));
await download(ASSETS.poster, path.join(OUT, "vitrum-bars-hero-poster.jpg"));
await writeFile(
  path.join(ROOT, "public/data/vitrum-bars-hero-video.json"),
  JSON.stringify(META, null, 2) + "\n",
);
console.log("Meta → public/data/vitrum-bars-hero-video.json");
