/**
 * Güncel EUR → TRY kuru (merge / fiyat dönüşümü).
 * Sıra: EQUSTO_EUR_TRY (manuel) → TCMB döviz satış → Frankfurter → son kayıtlı dosya.
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetch as undiciFetch } from "undici";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RATE_FILE = path.join(__dirname, "..", "..", "public", "data", "equsto-eur-try-rate.json");
const FALLBACK_RATE = 52.8159;
const UA = "EqustoCatalog/1.0 (+https://equsto.com)";

function parseTcmbXml(xml) {
  const block = xml.match(/<Currency[^>]*Kod="EUR"[^>]*>[\s\S]*?<\/Currency>/i);
  if (!block) return null;
  const selling = block[0].match(/<ForexSelling>([0-9]+(?:[.,][0-9]+)?)<\/ForexSelling>/i);
  if (!selling) return null;
  const n = Number(String(selling[1]).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function httpsGetText(url, ms = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "User-Agent": UA,
          Accept: "application/xml, application/json, text/plain, */*",
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if ((res.statusCode || 0) < 200 || (res.statusCode || 0) >= 300) {
            reject(new Error("HTTP " + res.statusCode));
            return;
          }
          resolve(body);
        });
      },
    );
    req.on("error", reject);
    req.setTimeout(ms, () => req.destroy(new Error("timeout")));
  });
}

async function fetchJson(url, ms = 12000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await undiciFetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json", "User-Agent": UA },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function fetchTcmbXml() {
  try {
    return await httpsGetText("https://www.tcmb.gov.tr/kurlar/today.xml");
  } catch (e1) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const res = await undiciFetch("https://www.tcmb.gov.tr/kurlar/today.xml", {
        signal: ctrl.signal,
        headers: { Accept: "application/xml,text/xml", "User-Agent": UA },
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } catch (e2) {
      throw new Error((e1 && e1.message) || String(e1));
    } finally {
      clearTimeout(t);
    }
  }
}

function readSavedRate() {
  try {
    if (!fs.existsSync(RATE_FILE)) return null;
    const j = JSON.parse(fs.readFileSync(RATE_FILE, "utf8"));
    if (j && Number(j.rate) > 0) return j;
  } catch (_) {}
  return null;
}

function saveRate(meta) {
  try {
    fs.mkdirSync(path.dirname(RATE_FILE), { recursive: true });
    fs.writeFileSync(RATE_FILE, JSON.stringify(meta, null, 2) + "\n", "utf8");
  } catch (_) {}
}

/**
 * @returns {Promise<{ rate: number, source: string, fetchedAt: string, label?: string }>}
 */
export async function fetchEurTryRate() {
  const manual = process.env.EQUSTO_EUR_TRY;
  if (manual != null && String(manual).trim() !== "") {
    const rate = Number(manual);
    if (Number.isFinite(rate) && rate > 0) {
      const meta = {
        rate,
        source: "env:EQUSTO_EUR_TRY",
        label: "Manuel (ortam değişkeni)",
        fetchedAt: new Date().toISOString(),
      };
      saveRate(meta);
      return meta;
    }
  }

  const errors = [];

  try {
    const xml = await fetchText("https://www.tcmb.gov.tr/kurlar/today.xml");
    const rate = parseTcmbXml(xml);
    if (rate) {
      const meta = {
        rate,
        source: "tcmb:ForexSelling",
        label: "TCMB döviz satış (EUR)",
        fetchedAt: new Date().toISOString(),
      };
      saveRate(meta);
      return meta;
    }
    errors.push("TCMB: EUR ForexSelling bulunamadı");
  } catch (e) {
    errors.push("TCMB: " + (e && e.message ? e.message : String(e)));
  }

  try {
    const j = await fetchJson("https://api.frankfurter.app/latest?from=EUR&to=TRY");
    const rate = j && j.rates && Number(j.rates.TRY);
    if (Number.isFinite(rate) && rate > 0) {
      const meta = {
        rate,
        source: "frankfurter.app",
        label: "Frankfurter (ECB referans)",
        fetchedAt: new Date().toISOString(),
        date: j.date || null,
      };
      saveRate(meta);
      return meta;
    }
    errors.push("Frankfurter: TRY yok");
  } catch (e) {
    errors.push("Frankfurter: " + (e && e.message ? e.message : String(e)));
  }

  const saved = readSavedRate();
  if (saved) {
    return {
      ...saved,
      source: (saved.source || "saved") + "+fallback",
      label: (saved.label || saved.source) + " (ağ hatası — son kayıt)",
      fetchedAt: new Date().toISOString(),
      warnings: errors,
    };
  }

  const meta = {
    rate: FALLBACK_RATE,
    source: "fallback:static",
    label: "Varsayılan yedek kur",
    fetchedAt: new Date().toISOString(),
    warnings: errors,
  };
  saveRate(meta);
  return meta;
}
