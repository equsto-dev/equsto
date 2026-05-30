/**
 * Next kurulumu bozuksa vitrin önizlemesi — yalnızca Node (ek paket yok).
 *   node scripts/dev-static.mjs
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;

const DEPT_HTML = {
  pisirme: "pisirme.html",
  sogutma: "sogutma.html",
  kahve: "kahve.html",
  yikama: "yikama.html",
  hazirlik: "hazirlik.html",
  icecek: "icecek.html",
  tezgah: "tezgah.html",
  dolap: "dolap.html",
  davlumbaz: "davlumbaz.html",
  tasima: "tasima.html",
  araba: "araba.html",
  istif: "istif.html",
  "set-ustu-mutfak": "set-ustu-mutfak.html",
  kuvetler: "kuvetler.html",
  "market-reyonlari": "market-reyonlari.html",
};

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".pdf": "application/pdf",
};

function resolveFile(urlPath) {
  const p = decodeURIComponent(urlPath.split("?")[0]).replace(/\/+$/, "") || "/";

  if (p === "/") return "index.html";
  if (p === "/pfos" || p === "/pfos/") return "pfos.html";
  if (p === "/sepet" || p === "/sepet/") return "sepet.html";
  if (p === "/arama" || p === "/arama/") return "arama.html";
  if (p === "/contact" || p === "/contact/") return "contact.html";

  const shopDept = p.match(/^\/shop\/([^/]+)$/);
  if (shopDept) {
    const file = DEPT_HTML[shopDept[1]];
    if (file) return file;
  }

  const shopProduct = p.match(/^\/shop\/[^/]+\/[^/]+$/);
  if (shopProduct) return "product.html";

  if (p.endsWith(".html")) return p.slice(1);
  const bare = p.slice(1);
  if (bare && !bare.includes("..") && fs.existsSync(path.join(PUBLIC, bare))) return bare;
  const asHtml = bare + ".html";
  if (fs.existsSync(path.join(PUBLIC, asHtml))) return asHtml;

  return null;
}

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type || "text/plain; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const rel = resolveFile(req.url || "/");
  if (!rel) {
    send(res, 404, "404 — " + req.url);
    return;
  }
  const file = path.join(PUBLIC, rel.replace(/\//g, path.sep));
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    send(res, 404, "Dosya yok: " + rel);
    return;
  }
  const ext = path.extname(file).toLowerCase();
  fs.readFile(file, (err, data) => {
    if (err) {
      send(res, 500, String(err));
      return;
    }
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("[dev-static] Acik — pencereyi kapatmayin");
  console.log("[dev-static] http://127.0.0.1:" + PORT + "/shop/kuvetler");
  console.log("[dev-static] http://localhost:" + PORT);
});
