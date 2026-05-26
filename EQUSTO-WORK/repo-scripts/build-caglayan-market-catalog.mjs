/**
 * caglayan-sogutma-catalog-export → public/data/caglayan-market-reyon-catalogue.json
 * + gömülü görseller → public/data/caglayan-market/images/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const exportRoot = path.join(root, "caglayan-sogutma-catalog-export");
const metinDir = path.join(exportRoot, "tam_veri", "metin_duz");
const manifestPath = path.join(exportRoot, "manifest.json");
const embSrc = path.join(exportRoot, "gömülü_görseller");
const outJson = path.join(root, "public", "data", "caglayan-market-reyon-catalogue.json");
const outImgDir = path.join(root, "public", "data", "caglayan-market", "images");

const SERIES_WHITELIST = new Set([
  "NİLÜFER",
  "NILUFER",
  "LOTUS",
  "NERGIS",
  "NERGİS",
  "LALE",
  "İNCİ",
  "INCI",
  "HERCAI",
  "HERCAİ",
  "REYHAN",
  "SARDUNYA",
  "SARDUNYA",
  "GARDENYA",
  "GARDENİA",
  "ANEMON",
  "AKASYA",
  "BEGONVİL",
  "BEGONVIL",
  "MANOLYA",
  "DEFNE",
  "LEYLAK",
  "ERGUVAN",
  "ERGUVA",
  "KRIZANTEM",
  "KRİZANTEM",
]);

const SKIP_NAMES = new Set([
  "İCİNDEKİLER",
  "ICINDEKILER",
  "DIKEY",
  "ALÇAKDIKEY",
  "ALCAKDIKEY",
  "MOTOR",
  "TEKNİK",
  "TEKNIK",
]);

function normSeries(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/İ/g, "I")
    .replace(/Ğ/g, "G")
    .replace(/Ü/g, "U")
    .replace(/Ş/g, "S")
    .replace(/Ö/g, "O")
    .replace(/Ç/g, "C");
}

function parseSpacedName(line) {
  line = String(line || "").trim();
  if (!line || line.length > 80) return null;
  const parts = line.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  if (!parts.every((p) => p.length <= 2)) return null;
  const joined = parts.join("");
  if (joined.length < 3 || joined.length > 28) return null;
  if (!/^[A-Za-z\u00C0-\u024F]+$/.test(joined)) return null;
  return joined;
}

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function assignTileId(text) {
  const h = String(text || "").toLocaleLowerCase("tr");
  if (/dondurma|freezer|frozen|derin\s*dondurucu/.test(h)) return "dondurma-reyon";
  if (/balık|balik|\bfish\b|blk/.test(h)) return "balik-sarkuteri";
  if (/şarküteri|sarkuteri|delicatessen|paket\s*et|pocket\s*meat/.test(h)) return "balik-sarkuteri";
  if (/self\s*servis|self-servis/.test(h)) return "self-servis";
  if (/sıcak|sicak|\bhot\b|benmari|bain\s*marie/.test(h)) return "sicak-teshir";
  if (/içecek|icecek|\bdrink\b|süt|sut|\bmilk\b/.test(h)) return "icecek-vitrin";
  if (/set\s*üstü|set\s*ustu/.test(h)) return "set-ustu";
  if (/camlı|camli|teşhir\s*buzdolab|teshir\s*buzdolab/.test(h)) return "camli-dolap";
  return "soguk-teshir";
}

function isTechnicalPage(lines) {
  const blob = lines.join(" ").toUpperCase();
  if (/TECHNICAL\s+DRAWINGS/.test(blob) && lines.length < 12) return true;
  if (/TECHNICAL\s+DETAILS/.test(blob) && !lines.some((l) => /[ğüşıöçĞÜŞİÖÇ]/.test(l) && l.length > 50)) return true;
  return false;
}

function pickTurkishBlurb(lines) {
  for (const ln of lines) {
    if (ln.length < 35 || ln.length > 420) continue;
    if (!/[ğüşıöçĞÜŞİÖÇ]/.test(ln)) continue;
    if (/TECHNICAL|T E K N I K|Length \(mm\)|Temperature Class/i.test(ln)) continue;
    if (parseSpacedName(ln)) continue;
    return ln.trim();
  }
  return "";
}

function isVariantCodeLine(ln, seriesNorm) {
  if (!ln || ln.length > 64) return false;
  if (/^(Length|Height|Depth|Temperature|Loading|End thickness)/i.test(ln)) return false;
  const up = ln.toUpperCase();
  if (!up.includes(seriesNorm.split("")[0]) && !new RegExp(seriesNorm.slice(0, 4)).test(up)) {
    /* series prefix loose */
  }
  if (/^[A-Z][A-Z0-9][A-Z0-9\s./+-]{2,}$/.test(ln) && /\d|[A-Z]{2,}/.test(ln)) {
    if (/^(ML|SL|MC|AD|FG|HG|BLK|NF)\b/.test(up) || seriesNorm && up.includes(seriesNorm.slice(0, 4))) {
      return true;
    }
    if (/\b(NF|MC|AD|FG|HG|SL|ML|BLK|ZYT|BM)\b/.test(up)) return true;
  }
  return false;
}

function parseVariantBlocks(lines, series) {
  const sn = normSeries(series);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (!isVariantCodeLine(ln, sn)) continue;
    const chunk = lines.slice(i, Math.min(lines.length, i + 45));
    if (!chunk.some((l) => /^Length \(mm\)$/i.test(l))) continue;
    blocks.push({ code: ln.trim(), specs: chunk.join("\n") });
  }
  return blocks;
}

function main() {
  if (!fs.existsSync(metinDir)) {
    console.error("[caglayan-market] metin_duz yok:", metinDir);
    process.exit(1);
  }
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : { sayfalar: [] };
  /** PDF’te ilk gömülü çoğu sayfada renk şeridi; en büyük dosya = ürün render. */
  function pickBestEmbedded(files) {
    let best = null;
    let bestSize = 0;
    for (const file of files || []) {
      const src = path.join(embSrc, file);
      if (!fs.existsSync(src)) continue;
      const sz = fs.statSync(src).size;
      if (sz > bestSize) {
        bestSize = sz;
        best = file;
      }
    }
    return best;
  }

  const pageImg = {};
  for (const p of manifest.sayfalar || []) {
    const imgs = p.gömülü || p.gomulu || [];
    pageImg[p.sayfa] = pickBestEmbedded(imgs);
  }

  fs.mkdirSync(outImgDir, { recursive: true });
  const copied = new Set();
  function ensureImage(file) {
    if (!file || copied.has(file)) return file;
    const src = path.join(embSrc, file);
    if (!fs.existsSync(src)) return null;
    const dst = path.join(outImgDir, file);
    if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    copied.add(file);
    return file;
  }

  const products = [];
  const seen = new Set();

  for (let page = 1; page <= 200; page++) {
    const f = path.join(metinDir, `sayfa_${String(page).padStart(4, "0")}.txt`);
    if (!fs.existsSync(f)) continue;
    const lines = fs
      .readFileSync(f, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length || isTechnicalPage(lines)) continue;

    let series = null;
    for (const ln of lines) {
      const n = parseSpacedName(ln);
      if (!n) continue;
      const nn = normSeries(n);
      if (SKIP_NAMES.has(nn) || SKIP_NAMES.has(n.toUpperCase())) continue;
      if (SERIES_WHITELIST.has(n.toUpperCase()) || SERIES_WHITELIST.has(nn)) {
        series = n;
        break;
      }
    }
    if (!series) continue;

    const blurb = pickTurkishBlurb(lines);
    const imgFile = ensureImage(pageImg[page]);
    const imgRel = imgFile ? `images/caglayan-${imgFile}` : "";
    const variants = parseVariantBlocks(lines, series);

    if (variants.length) {
      for (const v of variants) {
        const name = `Çağlayan ${series} ${v.code}`;
        const key = slugify(name);
        if (seen.has(key)) continue;
        seen.add(key);
        const specs = [blurb, v.specs].filter(Boolean).join("\n\n");
        products.push({
          category: "market-reyonlari",
          brand: "Çağlayan Soğutma",
          name,
          price: "",
          specs,
          images: imgRel ? [imgRel] : [],
          page,
          series,
          tileId: assignTileId(specs + " " + series),
          slug: key,
        });
      }
      continue;
    }

    if (!blurb) continue;
    const name = `Çağlayan ${series} — Market reyonu`;
    const key = slugify(`caglayan-${series}-p${page}`);
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      category: "market-reyonlari",
      brand: "Çağlayan Soğutma",
      name,
      price: "",
      specs: blurb,
      images: imgRel ? [imgRel] : [],
      page,
      series,
      tileId: assignTileId(blurb + " " + series),
      slug: key,
    });
  }

  const seriesList = [...new Set(products.map((p) => p.series).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "tr")
  );
  const navSubs = seriesList
    .map((s) => ({
      label: s,
      href: `market-reyonlari.html?q=${encodeURIComponent(s)}`,
      search: s,
    }))
    .concat([{ label: "Tüm Çağlayan kataloğu", href: "market-reyonlari.html" }]);

  const catalogue = {
    source: "caglayan-sogutma-catalog-export",
    brand: "Çağlayan Soğutma",
    updated: new Date().toISOString().slice(0, 10),
    productCount: products.length,
    navSubs,
    products,
  };

  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(catalogue, null, 2), "utf8");
  console.log("[caglayan-market]", products.length, "ürün →", outJson);
  console.log("[caglayan-market]", copied.size, "görsel →", outImgDir);
}

main();
