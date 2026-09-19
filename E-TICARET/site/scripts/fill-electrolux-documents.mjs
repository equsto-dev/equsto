#!/usr/bin/env node
/**
 * Electrolux ürünlerinde eksik electrolux_documents alanını doldurur.
 * Kaynak: products-tr.json (varsa) + tools.electroluxprofessional.com (HEAD ile doğrula)
 * + resmi PDP scrape (URL bulunursa).
 *
 *   node scripts/fill-electrolux-documents.mjs
 *   node scripts/fill-electrolux-documents.mjs --dry-run
 *   node scripts/fill-electrolux-documents.mjs --cod 260635
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PFOS = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional");
const SRC = path.join(PFOS, "products-tr.json");
const URLS = path.join(PFOS, "product-urls.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_DOC = path.join(ROOT, "public/data/electrolux-professional/docs");

const UA = "EqustoImport/1.0 (+https://equsto.com; catalog-research)";
const TOOLS = "https://tools.electroluxprofessional.com/Mirror/Doc";
const dryRun = process.argv.includes("--dry-run");
const codFilter = process.argv.includes("--cod")
  ? String(process.argv[process.argv.indexOf("--cod") + 1] || "").trim()
  : "";

const DEPTS = [
  "pisirme",
  "sogutma",
  "yikama",
  "kahve",
  "hazirlik",
  "icecek",
  "davlumbaz",
  "servis",
  "araba",
  "tezgah",
  "dolap",
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripTags(html) {
  return String(html || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function modelFromName(name) {
  const s = String(name || "");
  const m =
    s.match(/\b([A-Z]{1,3}\d{2,4}[A-Z]{0,4})\b/) ||
    s.match(/\b(ECD\d{3}[A-Z]+)\b/i) ||
    s.match(/\b([A-Z]{2,}\d{2,}[A-Z]*)\b/);
  return m ? m[1].toUpperCase() : "";
}

async function headOk(url) {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(30000),
      redirect: "follow",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8" },
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function parseDocuments(html) {
  const section = html.match(/id="product-documents"[\s\S]*?<\/ul>/i)?.[0] || "";
  const docs = [];
  for (const li of section.matchAll(/<li>([\s\S]*?)<\/li>/gi)) {
    const chunk = li[1];
    const category = stripTags(
      chunk.match(/<a[^>]*data-toggle="collapse"[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "",
    );
    for (const a of chunk.matchAll(
      /<a[^>]*href="([^"]+)"[^>]*data-ga-action="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi,
    )) {
      const href = a[1].split("?")[0];
      if (!href.includes("tools.electroluxprofessional.com")) continue;
      docs.push({
        category,
        type: a[2] || "",
        title: stripTags(a[3]).replace(/\s*\([^)]*\)\s*$/, ""),
        url: href,
      });
    }
    for (const a of chunk.matchAll(
      /<a[^>]*href="(https:\/\/tools\.electroluxprofessional\.com[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi,
    )) {
      const href = a[1].split("?")[0];
      if (docs.some((d) => d.url === href)) continue;
      const title = stripTags(a[2]);
      let type = "FILE";
      try {
        const ext = path.extname(new URL(href).pathname).toLowerCase();
        type =
          ext === ".pdf"
            ? /veri|data|mad/i.test(category)
              ? "MAD2"
              : "BR"
            : ext === ".dwg"
              ? "CAD"
              : ext === ".rfa"
                ? "REVIT"
                : "FILE";
      } catch (_) {}
      docs.push({ category, type, title, url: href });
    }
  }
  const uniq = new Map();
  for (const d of docs) uniq.set(d.url, d);
  return [...uniq.values()];
}

async function downloadDoc(doc, cod) {
  if (!doc.url || dryRun) return doc;
  try {
    const base = path.basename(new URL(doc.url).pathname) || `${doc.type}.bin`;
    const dest = path.join(OUT_DOC, cod, base);
    await fsp.mkdir(path.dirname(dest), { recursive: true });
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      return {
        ...doc,
        local: `data/electrolux-professional/docs/${cod}/${base}`,
        size: fs.statSync(dest).size,
      };
    }
    const res = await fetch(doc.url, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(180000),
    });
    if (!res.ok) return doc;
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) return doc;
    await fsp.writeFile(dest, buf);
    return {
      ...doc,
      local: `data/electrolux-professional/docs/${cod}/${base}`,
      size: buf.length,
    };
  } catch {
    return doc;
  }
}

function docsFromSrc(srcByCod, cod) {
  const p = srcByCod.get(String(cod));
  if (!p?.documents?.length) return [];
  return p.documents.map((d) => ({
    category: d.category || "",
    type: d.type || "",
    title: d.title || "",
    url: d.url || undefined,
    local: d.local
      ? String(d.local).replace(/^media\/documents/, "data/electrolux-professional/docs")
      : undefined,
  }));
}

async function docsFromTools(cod, model, name) {
  const docs = [];
  const push = (category, type, title, url) => {
    if (!docs.some((d) => d.url === url)) docs.push({ category, type, title, url });
  };

  const madCandidates = [
    `${TOOLS}/MAD2/Electrolux%20Professional/Italian/${cod}-${Number(cod) + 20}_Italian.pdf`,
    `${TOOLS}/MAD2/Electrolux%20Professional/Italian/${cod}_Italian.pdf`,
    `${TOOLS}/MAD2/Electrolux%20Professional/English/${cod}_English.pdf`,
    `${TOOLS}/MAD2/Electrolux%20Professional/Dutch/${cod}_Dutch.pdf`,
  ];
  // Multislim twin sheets
  if (/^26063[58]$|^26065[58]$/.test(cod)) {
    madCandidates.unshift(
      `${TOOLS}/MAD2/Electrolux%20Professional/Italian/260635-260655_Italian.pdf`,
      `${TOOLS}/MAD2/Electrolux%20Professional/Dutch/Electric%20Compact%20Digital%20Oven%206GN%201_1_260635-260655_Dutch.pdf`,
    );
  }

  for (const url of madCandidates) {
    if (await headOk(url)) {
      push("Veri Sayfası", "MAD2", `${cod} Veri Sayfası`, url);
      break;
    }
  }

  const cadCandidates = [];
  if (model) {
    cadCandidates.push(`${TOOLS}/CAD/${model}.dwg`);
    cadCandidates.push(`${TOOLS}/CAD/${cod}_${model}.dwg`);
  }
  cadCandidates.push(`${TOOLS}/CAD/${cod}.dwg`);

  for (const url of cadCandidates) {
    if (await headOk(url)) {
      push("CAD Çizimleri", "CAD", model || cod, url);
      break;
    }
  }

  const revitCandidates = [];
  if (model) {
    revitCandidates.push(
      `${TOOLS}/REVIT/QF_ELECTROLUXPROFESSIONAL_${cod}_${model}.rfa`,
      `${TOOLS}/REVIT/${model}.rfa`,
    );
  }
  revitCandidates.push(`${TOOLS}/REVIT/QF_ELECTROLUXPROFESSIONAL_${cod}.rfa`);

  for (const url of revitCandidates) {
    if (await headOk(url)) {
      push("BIM/Revit", "REVIT", model || cod, url);
      break;
    }
  }

  if (/multislim/i.test(name || "")) {
    const brs = [
      `${TOOLS}/BR/BR_BR-9JE00082_1_5_1_18_EPR_brochure_MultiSlim_EN_20251007_LR.pdf`,
      `${TOOLS}/BR/BR_BR-9JE00182_1_5_1_1_EPR_brochure_MultiSlim_2021_LR.pdf`,
    ];
    for (const url of brs) {
      if (await headOk(url)) {
        push("Broşürler", "BR", "MultiSlim Broşür", url);
        break;
      }
    }
  }

  return docs;
}

async function docsFromPdp(url) {
  if (!url) return [];
  try {
    const html = await fetchHtml(url);
    return parseDocuments(html);
  } catch {
    return [];
  }
}

function mergeDocs(...lists) {
  const seen = new Map();
  for (const list of lists) {
    for (const d of list || []) {
      const key = String(d.url || d.local || d.title || "").toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.set(key, d);
    }
  }
  return [...seen.values()];
}

async function main() {
  const srcByCod = new Map();
  if (fs.existsSync(SRC)) {
    for (const p of JSON.parse(fs.readFileSync(SRC, "utf8"))) {
      if (p?.cod) srcByCod.set(String(p.cod), p);
    }
  }
  const urlByCod = new Map();
  if (fs.existsSync(URLS)) {
    for (const p of JSON.parse(fs.readFileSync(URLS, "utf8"))) {
      if (p?.cod) urlByCod.set(String(p.cod), p.url);
    }
  }

  let filled = 0;
  let stillEmpty = 0;
  const report = [];

  for (const dept of DEPTS) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    if (!fs.existsSync(file)) continue;
    const rows = JSON.parse(fs.readFileSync(file, "utf8"));
    let changed = false;

    for (const row of rows) {
      if (!/electrolux/i.test(String(row.brand || ""))) continue;
      const cod = String(row.sku || row.electrolux_cod || row.marka_urun_kodu || "").trim();
      if (!cod) continue;
      if (codFilter && cod !== codFilter) continue;
      if (Array.isArray(row.electrolux_documents) && row.electrolux_documents.length) continue;

      const model = modelFromName(row.name) || modelFromName(row.model);
      let docs = docsFromSrc(srcByCod, cod);

      if (!docs.length) {
        const pdpUrl =
          urlByCod.get(cod) ||
          row.kaynak_url ||
          row.linkKaynak ||
          srcByCod.get(cod)?.url ||
          "";
        const fromPdp = await docsFromPdp(pdpUrl);
        const fromTools = await docsFromTools(cod, model, row.name);
        docs = mergeDocs(fromPdp, fromTools);
        await sleep(120);
      }

      if (!docs.length) {
        stillEmpty++;
        report.push({ cod, dept, status: "empty", name: row.name });
        continue;
      }

      const withLocal = [];
      for (const d of docs) {
        withLocal.push(await downloadDoc(d, cod));
        await sleep(80);
      }

      row.electrolux_documents = withLocal;
      if (!row.kaynak) row.kaynak = "electrolux-professional";
      if (!row.kaynak_url && (urlByCod.get(cod) || srcByCod.get(cod)?.url)) {
        row.kaynak_url = urlByCod.get(cod) || srcByCod.get(cod).url;
      }
      filled++;
      changed = true;
      report.push({
        cod,
        dept,
        status: "ok",
        n: withLocal.length,
        cats: [...new Set(withLocal.map((d) => d.category).filter(Boolean))],
      });
      console.log(`[ok] ${cod} ${withLocal.length} döküman`, report.at(-1).cats.join(", "));
    }

    if (changed && !dryRun) {
      fs.writeFileSync(file, JSON.stringify(rows), "utf8");
    }
  }

  console.log(
    `[fill-electrolux-documents] ${dryRun ? "DRY-RUN " : ""}filled=${filled} stillEmpty=${stillEmpty}`,
  );
  if (stillEmpty) {
    console.log(
      "boş kalan:",
      report.filter((r) => r.status === "empty").map((r) => r.cod).join(", "),
    );
  }

  if (!dryRun && filled && !codFilter) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
