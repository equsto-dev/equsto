import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const IMG = path.join(ROOT, "public", "data", "images");

function httpBuf(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            resolve(httpBuf(new URL(res.headers.location, url).href));
            return;
          }
          resolve({ status: res.statusCode, buf: Buffer.concat(chunks) });
        });
      })
      .on("error", () => resolve({ status: 0, buf: Buffer.alloc(0) }));
  });
}

const urls = [
  "https://static.ticimax.cloud/3562/uploads/urunresimleri/5db8bdb5-bf27-4814-add7-4ed079faf6af.png",
  "https://static.ticimax.cloud/3562/uploads/urunresimleri/5c98ec7f-4dbe-441e-9e0f-d69a381dddf3.png",
  "https://static.ticimax.cloud/cdn-cgi/image/width=1200,quality=95/3562/uploads/urunresimleri/buyuk/5db8bdb5-bf27-4814-add7-4ed079faf6af.png",
  "https://static.ticimax.cloud/cdn-cgi/image/width=1200,quality=95/3562/uploads/urunresimleri/5db8bdb5-bf27-4814-add7-4ed079faf6af.png",
];

for (let i = 0; i < urls.length; i++) {
  const { status, buf } = await httpBuf(urls[i]);
  const fn = `_probe-gorkem-v${i}.png`;
  fs.writeFileSync(path.join(IMG, fn), buf);
  const py = spawnSync("python", [path.join(__dirname, "detect_kariyer_overlay.py"), "--file", fn], {
    cwd: ROOT,
    encoding: "utf8",
  });
  console.log(status, buf.length, (py.stdout || "").trim());
  console.log(" ", urls[i].slice(60));
}
