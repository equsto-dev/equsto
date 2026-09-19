#!/usr/bin/env node
/**
 * CM import kapanış raporu:
 * - eklenecek-markalar vs katalog
 * - apply-report ürün sayıları
 * - eksik görsel / fiyat
 * - TUM-SORUN-LINKLERI.md yenile
 *
 *   node scripts/import-cm-brands/wrapup-status.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const REPORT = "C:/D Disk/EQUSTO-ONE/wip/cm-import-rapor";
const BRANDS_FILE = "C:/D Disk/EQUSTO-ONE/wip/eklenecek-markalar.txt";

function fold(s) {
  return String(s || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

function loadCatalog() {
  const products = [];
  for (const f of fs.readdirSync(DEPT_DIR).filter((x) => x.endsWith(".json") && !x.includes("_items"))) {
    const rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, f), "utf8"));
    if (!Array.isArray(rows)) continue;
    for (const r of rows) products.push({ ...r, _deptFile: f });
  }
  return products;
}

function hasImage(p) {
  const imgs = p.images || (p.image ? [p.image] : []);
  return Array.isArray(imgs) && imgs.some((x) => String(x || "").trim());
}

function hasPrice(p) {
  if (p.fiyat_bekleniyor === true) return false;
  const tl = Number(p.fiyat_tl);
  if (Number.isFinite(tl) && tl > 0) return true;
  const price = String(p.price || "");
  if (/teklif|bekleniyor|iletişim/i.test(price)) return false;
  if (/\d/.test(price)) return true;
  return false;
}

function isCmImport(p) {
  return (
    p.kaynak_fiyat_listesi === "cafemarkt-plp" ||
    p.fiyat_kaynak === "cafemarkt" ||
    !!p.cafemarkt_url ||
    !!p.cafemarkt_id
  );
}

function brandKey(name) {
  return fold(name);
}

function loadWantedBrands() {
  return fs
    .readFileSync(BRANDS_FILE, "utf8")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

function loadApplyReports() {
  const out = [];
  if (!fs.existsSync(REPORT)) return out;
  for (const f of fs.readdirSync(REPORT)) {
    if (!f.endsWith("-apply-report.json")) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(REPORT, f), "utf8"));
      out.push({ file: f, ...j });
    } catch (_) {}
  }
  return out;
}

function loadProblems() {
  const byBrand = [];
  if (!fs.existsSync(REPORT)) return byBrand;
  for (const f of fs.readdirSync(REPORT).sort()) {
    if (!f.endsWith("-problems.json")) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(REPORT, f), "utf8"));
      const items = Array.isArray(j) ? j : j.items || j.problems || [];
      const brand = f.replace(/-problems\.json$/, "");
      byBrand.push({ brand, file: f, items });
    } catch (_) {}
  }
  return byBrand;
}

function shopUrl(p) {
  const dept = p.dept || String(p._deptFile || "").replace(/\.json$/, "");
  const slug =
    p.slug ||
    String(p.id || "")
      .replace(/^[^_]+__/, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  if (dept && slug) return `https://equsto.com/shop/${dept}/${slug}`;
  return p.cafemarkt_url || "";
}

function writeProblemsMd(problemsByBrand, catalogStats) {
  const lines = [];
  lines.push(`# CM import — sorunlu ürün linkleri (güncel)`);
  lines.push("");
  lines.push(`Güncelleme: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Özet");
  lines.push("");
  lines.push(`| Metrik | Adet |`);
  lines.push(`|---|---:|`);
  lines.push(`| Katalog ürün | ${catalogStats.total} |`);
  lines.push(`| CM import ürün | ${catalogStats.cmTotal} |`);
  lines.push(`| Görsel yok (katalog) | ${catalogStats.noImage} |`);
  lines.push(`| Fiyat yok (katalog) | ${catalogStats.noPrice} |`);
  lines.push(`| Problems JSON marka | ${problemsByBrand.length} |`);

  let review = 0;
  let noImage = 0;
  let noPrice = 0;
  let araba = 0;
  let other = 0;
  for (const b of problemsByBrand) {
    for (const it of b.items) {
      const t = String(it.type || it.kind || it.reason || "").toLowerCase();
      if (t.includes("no-image") || t === "image") noImage++;
      else if (t.includes("no-price") || t === "price") noPrice++;
      else if (t.includes("araba")) araba++;
      else if (t.includes("review") || t.includes("belirsiz") || t.includes("group")) review++;
      else other++;
    }
  }
  lines.push(`| Problems: review | ${review} |`);
  lines.push(`| Problems: no-image | ${noImage} |`);
  lines.push(`| Problems: no-price | ${noPrice} |`);
  lines.push(`| Problems: araba | ${araba} |`);
  lines.push(`| Problems: diğer | ${other} |`);
  lines.push("");
  lines.push("GastroPlast ve Cambro atlandı (kapsam netleşmedi).");
  lines.push("");
  lines.push("> Aşağıda **no-image hariç** karar / fiyat / araba satırları. No-image ham JSON’da.");
  lines.push("");

  for (const b of problemsByBrand) {
    const actionable = b.items.filter((it) => {
      const t = String(it.type || it.kind || it.reason || "").toLowerCase();
      return !t.includes("no-image") && t !== "image";
    });
    if (!actionable.length) continue;
    const title = b.brand
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    lines.push(`## ${title} — karar / fiyat sorunları`);
    lines.push("");
    for (const it of actionable) {
      const typ = it.type || it.kind || "review";
      const name = it.name || it.title || it.product || "?";
      const url = it.url || it.cafemarkt_url || it.link || "";
      const note = it.note || it.reason || it.message || "";
      lines.push(`- [${typ}] ${name}${url ? ` — ${url}` : ""}${note ? ` | ${note}` : ""}`);
    }
    lines.push("");
  }

  fs.writeFileSync(path.join(REPORT, "TUM-SORUN-LINKLERI.md"), lines.join("\n"), "utf8");
}

function main() {
  const wanted = loadWantedBrands();
  const products = loadCatalog();
  const brandCounts = new Map();
  for (const p of products) {
    const b = String(p.brand || "").trim() || "(yok)";
    brandCounts.set(b, (brandCounts.get(b) || 0) + 1);
  }
  const brandKeys = [...brandCounts.keys()].map((b) => ({ name: b, key: brandKey(b), n: brandCounts.get(b) }));

  const aliases = new Map([
    [brandKey("Electrolux"), brandKey("Electrolux Professional")],
    [brandKey("Simonelli"), brandKey("Nuova Simonelli")],
    [brandKey("Cimbali"), brandKey("La Cimbali")],
    [brandKey("KM Kayalar"), brandKey("Kayalar")],
    [brandKey("Ice O Matic"), brandKey("Ice-O-Matic")],
    [brandKey("Öztiryakiler"), brandKey("Oztiryakiler")],
    [brandKey("İnoksan"), brandKey("Inoksan")],
    [brandKey("Şenox"), brandKey("Senox")],
    [brandKey("PortaShelf"), brandKey("Portashelf")],
    [brandKey("Portabianco"), brandKey("PORTABIANCO")],
    [brandKey("Robot Coupe"), brandKey("Yuksel Endustriyel")],
    [brandKey("Atalay"), brandKey("Atalay Endustriyel Mutfak Ekipmanlari")],
  ]);

  const intentionalSkip = new Set(["cambro", "gastroplast"]);

  function findBrand(wantedName) {
    const k = brandKey(wantedName);
    if (intentionalSkip.has(wantedName.toLocaleLowerCase("tr-TR"))) {
      return { name: `(atlandı) ${wantedName}`, key: k, n: 0, skipped: true };
    }
    const alt = aliases.get(k) || k;
    let hit = brandKeys.find((b) => b.key === k || b.key === alt);
    if (hit) return hit;
    hit = brandKeys.find((b) => b.key.includes(k) || (k.length > 4 && k.includes(b.key)));
    return hit || null;
  }

  const loaded = [];
  const missing = [];
  const skipped = [];
  for (const w of wanted) {
    const hit = findBrand(w);
    if (hit?.skipped) skipped.push(w);
    else if (hit) loaded.push({ wanted: w, site: hit.name, count: hit.n });
    else missing.push(w);
  }

  const applyReports = loadApplyReports();
  let applyKeep = 0;
  let applySkip = 0;
  const applyByBrand = [];
  for (const r of applyReports) {
    const brand = r.brand || r.name || r.file.replace(/-apply-report\.json$/, "");
    const k = Number(r.newRows || 0);
    const skip = Number(r.dropped || 0);
    applyByBrand.push({
      brand,
      newRows: k,
      matchedKeep: Number(r.matchedKeep || 0),
      review: Number(r.review || 0),
      dropped: skip,
      plp: Number(r.plp || 0),
    });
    applyKeep += k;
    applySkip += skip;
  }

  const cmProducts = products.filter(isCmImport);
  const cmByBrand = new Map();
  for (const p of cmProducts) {
    const b = String(p.brand || "").trim() || "(yok)";
    cmByBrand.set(b, (cmByBrand.get(b) || 0) + 1);
  }

  const noImage = products.filter((p) => !hasImage(p));
  const noPrice = products.filter((p) => !hasPrice(p));
  const cmNoImage = cmProducts.filter((p) => !hasImage(p));
  const cmNoPrice = cmProducts.filter((p) => !hasPrice(p));

  const catalogStats = {
    total: products.length,
    brands: brandCounts.size,
    cmTotal: cmProducts.length,
    noImage: noImage.length,
    noPrice: noPrice.length,
    cmNoImage: cmNoImage.length,
    cmNoPrice: cmNoPrice.length,
  };

  const problems = loadProblems();
  writeProblemsMd(problems, catalogStats);

  const status = {
    at: new Date().toISOString(),
    eklenecekMarkalar: wanted.length,
    loadedBrands: loaded.length,
    skippedBrands: skipped,
    missingBrands: missing,
    catalog: catalogStats,
    cmBrandsOnSite: cmByBrand.size,
    cmProductsByBrand: Object.fromEntries(
      [...cmByBrand.entries()].sort((a, b) => b[1] - a[1]),
    ),
    applyReports: {
      files: applyReports.length,
      summedKeep: applyKeep,
      byBrand: applyByBrand.sort((a, b) => b.newRows - a.newRows),
    },
    noImageSample: noImage.slice(0, 15).map((p) => ({
      id: p.id,
      brand: p.brand,
      name: p.name,
      url: shopUrl(p),
    })),
    noPriceSample: noPrice.slice(0, 20).map((p) => ({
      id: p.id,
      brand: p.brand,
      name: p.name,
      price: p.price,
      url: shopUrl(p),
    })),
    loadedSample: loaded.slice(0, 20),
  };

  fs.writeFileSync(path.join(REPORT, "WRAPUP-STATUS.json"), JSON.stringify(status, null, 2), "utf8");

  const md = [];
  md.push(`# CM import kapanış durumu`);
  md.push("");
  md.push(`Tarih: ${status.at}`);
  md.push("");
  md.push(`## eklenecek-markalar`);
  md.push("");
  md.push(`- Listede: **${wanted.length}** marka`);
  md.push(`- Sitede eşleşen: **${loaded.length}**`);
  md.push(`- Bilinçli atlanan: **${skipped.length}**${skipped.length ? ` — ${skipped.join(", ")}` : ""}`);
  md.push(`- Eksik / yüklenmemiş: **${missing.length}**${missing.length ? ` — ${missing.join(", ")}` : ""}`);
  md.push("");
  md.push(`## Katalog`);
  md.push("");
  md.push(`| | Adet |`);
  md.push(`|---|---:|`);
  md.push(`| Toplam ürün | ${catalogStats.total} |`);
  md.push(`| Marka | ${catalogStats.brands} |`);
  md.push(`| CM import ürün | ${catalogStats.cmTotal} |`);
  md.push(`| CM import marka | ${cmByBrand.size} |`);
  md.push(`| Görsel yok | ${catalogStats.noImage} |`);
  md.push(`| Fiyat yok | ${catalogStats.noPrice} |`);
  md.push(`| CM görsel yok | ${catalogStats.cmNoImage} |`);
  md.push(`| CM fiyat yok | ${catalogStats.cmNoPrice} |`);
  md.push("");
  md.push(`## CM ürün — marka başına (ilk 40)`);
  md.push("");
  [...cmByBrand.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .forEach(([b, n]) => md.push(`- ${b}: ${n}`));
  md.push("");
  md.push(`Apply report dosyası: ${applyReports.length} (sum keep alanları güvenilir değilse CM sayacı yukarıdaki).`);
  md.push("");
  md.push(`Sorun linkleri: \`TUM-SORUN-LINKLERI.md\``);
  md.push("");
  if (noImage.length) {
    md.push(`## Görsel yok (örnek)`);
    md.push("");
    for (const p of status.noImageSample) {
      md.push(`- ${p.brand} — ${p.name} — ${p.url || p.id}`);
    }
    md.push("");
  }
  if (noPrice.length) {
    md.push(`## Fiyat yok (örnek, max 20)`);
    md.push("");
    for (const p of status.noPriceSample) {
      md.push(`- ${p.brand} — ${p.name} — ${p.price || "—"} — ${p.url || p.id}`);
    }
    md.push("");
  }

  fs.writeFileSync(path.join(REPORT, "WRAPUP-STATUS.md"), md.join("\n"), "utf8");

  console.log(JSON.stringify({
    wanted: wanted.length,
    loaded: loaded.length,
    skipped,
    missing,
    catalog: catalogStats,
    cmBrands: cmByBrand.size,
    applyNewRowsSum: applyKeep,
    problemsFiles: problems.length,
  }, null, 2));
  console.log("→", path.join(REPORT, "WRAPUP-STATUS.md"));
  console.log("→", path.join(REPORT, "TUM-SORUN-LINKLERI.md"));
}

main();
