import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEB = path.join(ROOT, "public/images/catalog/ozti/web");
const AX = "https://oztiryakiler.com.tr/ax-images/images";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0";
const MIN = 5000;

const KODS = [
  "8573.CDE3S",
  "8573.CDE4S",
  "8573.CDE5S",
  "8573.CDGE4S",
  "8573.CSGE4S",
  "8573.CDGE5",
  "8573.CSGE5S",
  "8573.CDGE6S",
  "8573.EDE3S",
  "8573.ESE2S",
  "8573.ESE3S",
  "9810.EF705.H0",
  "9810.EF708.G0",
  "9810.EF708.S0",
  "8840.USD01.00",
  "8841.SDC10.00",
  "8841.SDC20.00",
  "8841.SDK10.00",
  "8841.SDP10.00",
];

function slug(kod) {
  return (
    "ozti-" +
    kod
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "")
  );
}

async function head(url) {
  const r = await fetch(url, { method: "HEAD", headers: { "User-Agent": UA } });
  return r.status;
}

async function download(kod) {
  const url = `${AX}/${encodeURIComponent(kod)}.jpg`;
  const dest = path.join(WEB, slug(kod) + ".jpg");
  if (fs.existsSync(dest) && fs.statSync(dest).size >= MIN) {
    return { kod, ok: true, note: "exists" };
  }
  const st = await head(url);
  if (st !== 200) return { kod, ok: false, note: `cdn ${st}` };
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN) return { kod, ok: false, note: `small ${buf.length}` };
  fs.mkdirSync(WEB, { recursive: true });
  fs.writeFileSync(dest, buf);
  return { kod, ok: true, note: `${buf.length}b` };
}

for (const kod of KODS) {
  const r = await download(kod);
  console.log(r.ok ? "OK" : "FAIL", kod, r.note);
}
