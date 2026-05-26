import https from "node:https";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = path.join(ROOT, "public/data/images");

function get(url) {
  return new Promise((r) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
      const c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => r({ s: res.statusCode, body: Buffer.concat(c).toString("utf8") }));
    });
  });
}

const page = "https://www.kariyermutfak.com/gorkem-elektrikli-sos-benmari-alt-dolapli-40x71x85-cm-781";
const x = await get(page);
const urls = [...x.body.matchAll(/urunresimleri\/buyuk\/[^"'\s<>]+/gi)].map((m) => m[0]);
console.log("status", x.s, "urls", urls.length, urls[0]);

if (urls[0]) {
  const full = `https://static.ticimax.cloud/3562/Uploads/UrunResimleri/buyuk/${urls[0].split("/").pop()}`;
  const img = await get(full);
  const fn = "_781-test.png";
  fs.writeFileSync(path.join(IMG, fn), Buffer.from(img.body || "", "binary"));
  const py = path.join(ROOT, "scripts/detect_kariyer_overlay.py");
  const ov = spawnSync("python", [py, "--file", fn], { cwd: ROOT, encoding: "utf8" });
  console.log("overlay", ov.stdout);
}
