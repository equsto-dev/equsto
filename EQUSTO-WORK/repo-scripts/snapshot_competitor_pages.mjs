/**
 * Rakip vitrin sayfalarının kamuya açık HTML anlık görüntüsü (metin).
 * Çıktı: scripts/_competitor_cache/*.txt — diff ile kargo / vitrin / proje vurgularını izlemek için.
 *
 * Çalıştır: npm run rakip:snapshot
 */
import fs from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "scripts", "_competitor_cache");

/** İzlenen URL’ler: gerektiğinde TARGETS dizisine satır ekleyin. */
const TARGETS = [
  { id: "cafemarkt-home", url: "https://www.cafemarkt.com/" },
  { id: "cafemarkt-proje", url: "https://www.cafemarkt.com/endustriyel-mutfak-proje" },
  { id: "mutbex-home", url: "https://www.mutbex.com/" },
  { id: "kariyermutfak-home", url: "https://www.kariyermutfak.com/" },
  { id: "kariyermutfak-www", url: "https://kariyermutfak.com/" },
];

const MAX_BYTES = 280_000;
const FETCH_HEADERS = {
  "User-Agent": "EqustoCompetitorMonitor/1.0 (+https://equsto.com; internal snapshot)",
  Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "tr-TR,tr;q=0.9",
};
function isTlsVerifyError(e) {
  const c = e && e.cause;
  const code = (c && c.code) || (e && e.code) || "";
  const msg = String((e && e.message) || e || "");
  return /UNABLE_TO_VERIFY|CERT_|certificate/i.test(String(code) + msg);
}

function fetchInsecureHttp(url, signal, redirectsLeft) {
  redirectsLeft = redirectsLeft == null ? 5 : redirectsLeft;
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(
      u,
      { method: "GET", headers: FETCH_HEADERS, rejectUnauthorized: false },
      (res) => {
        const loc = res.headers.location;
        if (loc && redirectsLeft > 0 && res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          const next = new URL(loc, u).href;
          fetchInsecureHttp(next, signal, redirectsLeft - 1).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            statusText: res.statusMessage || "",
            raw: Buffer.concat(chunks).toString("utf8"),
          });
        });
      }
    );
    req.on("error", reject);
    if (signal) {
      if (signal.aborted) {
        req.destroy();
        reject(signal.reason || new Error("aborted"));
        return;
      }
      signal.addEventListener(
        "abort",
        () => {
          req.destroy();
          reject(signal.reason || new Error("aborted"));
        },
        { once: true }
      );
    }
    req.end();
  });
}

async function fetchPageHtml(url, signal) {
  try {
    const r = await fetch(url, { signal, redirect: "follow", headers: FETCH_HEADERS });
    return { status: r.status, statusText: r.statusText, raw: await r.text() };
  } catch (e) {
    if (!isTlsVerifyError(e)) throw e;
    console.warn("[rakip] TLS retry (insecure):", url);
    return fetchInsecureHttp(url, signal);
  }
}

async function snapOne({ id, url }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25_000);
  const file = path.join(OUT, `${id}.txt`);
  try {
    const { status, statusText, raw } = await fetchPageHtml(url, ctrl.signal);
    const head = [
      `# id: ${id}`,
      `# fetched: ${new Date().toISOString()}`,
      `# status: ${status} ${statusText}`,
      `# url: ${url}`,
      `# bytes: ${raw.length}`,
      "",
    ].join("\n");
    const body = raw.length > MAX_BYTES ? raw.slice(0, MAX_BYTES) + "\n\n# --- truncated ---\n" : raw;
    await fs.mkdir(OUT, { recursive: true });
    await fs.writeFile(file, head + body, "utf8");
    console.log("[rakip]", id, status, raw.length, "→", path.relative(ROOT, file));
  } catch (e) {
    const cause = e && e.cause ? ` | cause: ${e.cause}` : "";
    const code = e && e.code ? ` | code: ${e.code}` : "";
    const msg = e && e.message ? String(e.message) : String(e);
    const full = msg + cause + code;
    await fs.mkdir(OUT, { recursive: true });
    await fs.writeFile(
      file,
      [`# id: ${id}`, `# fetched: ${new Date().toISOString()}`, `# error: ${full}`, `# url: ${url}`, ""].join("\n"),
      "utf8"
    );
    console.error("[rakip] FAIL", id, full);
  } finally {
    clearTimeout(timer);
  }
}

for (const t of TARGETS) {
  await snapOne(t);
}
console.log("[rakip] bitti. Çıktı:", OUT);
