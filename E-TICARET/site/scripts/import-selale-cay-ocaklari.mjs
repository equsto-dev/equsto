#!/usr/bin/env node
/**
 * Şelale Çay Ocakları — 1.09.2026 fiyat listesi PDF → icecek dept.
 *
 * Kategori: içecek → çay ocakları (category: cay-ocagi)
 * Fiyat: katalogdaki TL tutarları aynen KDV dahil satış fiyatı (kullanıcı talimatı).
 *
 * Parser notları:
 *  - TR fiyat: "39.000,00" → 39000 (nokta binlik, virgül ondalık)
 *  - Seri başlıkları Y konumuna göre tablolara bağlanır (TBİ Türkçe İ korunur)
 *  - Görseller PDF gömülü seri fotoğrafları
 *
 *   node scripts/import-selale-cay-ocaklari.mjs
 *   node scripts/import-selale-cay-ocaklari.mjs --dry
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync, spawnSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const PDF = path.join(
  ROOT,
  "scripts/data/selale/cay-kazani-fiyatlari-1.09.2026.pdf",
);
const DEPT_FILE = path.join(ROOT, "public/data/dept/icecek.json");
const IMG_DIR = path.join(ROOT, "public/images/catalog/selale/web");
const IMG_SUB = "images/catalog/selale/web";
const PARSED_OUT = path.join(
  ROOT,
  "scripts/data/selale/cay-ocaklari-parsed.json",
);

const KDV = 20;
const HAVALE_PCT = 2;
const DRY = process.argv.includes("--dry");

/** PDF’deki seri başlıkları → marka ürün adı (layout Y sırası). */
const SERIES_BY_HEADER = {
  "TERMOBOX BLACK STAR": {
    key: "termobox-black-star",
    label: "Termobox Black Star",
    finish: "Siyah termobox gövde, yan ocaklı",
  },
  "TERMOBOX ANTİK": {
    key: "termobox-antik",
    label: "Termobox Antik",
    finish: "Antik bakır desenli gövde, yan ocaklı",
  },
  "ANTİK FLAMİNGO ELEKTRİKLİ": {
    key: "antik-flamingo-elektrikli",
    label: "Antik Flamingo Elektrikli",
    finish: "Antik desenli gövde, krom ayaklı, elektrikli",
  },
  "TERMOBOX İNOX": {
    key: "termobox-inox",
    label: "Termobox İnox",
    finish: "Paslanmaz çelik gövde, yan ocaklı",
  },
  "BLACK FLAMİNGO ELEKTRİKLİ": {
    key: "black-flamingo-elektrikli",
    label: "Black Flamingo Elektrikli",
    finish: "Siyah gövde, krom ayaklı, elektrikli",
  },
};

function foldTr(s) {
  return String(s || "")
    .replace(/İ/g, "I")
    .replace(/I/g, "I")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

/** TR fiyat parse — binlik nokta, ondalık virgül. "39.000,00" → 39000 */
export function parseTrPrice(raw) {
  const s = String(raw || "")
    .trim()
    .replace(/\s/g, "")
    .replace(/[₺TL]/gi, "");
  if (!s) return null;
  // 39.000,00 | 39000,00 | 39000
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(s)) {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }
  if (/^\d+(,\d{1,2})?$/.test(s)) {
    const n = Number(s.replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }
  if (/^\d+(\.\d+)?$/.test(s) && !s.includes(",")) {
    // Ambiguous: treat as plain number only if no thousand-group pattern
    const n = Number(s);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
  }
  return null;
}

function formatTl(n) {
  return (
    "₺" +
    Number(n).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) +
    " KDV dahil"
  );
}

function skuSlug(sku) {
  return foldTr(sku)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function writeJsonAtomic(filePath, data, pretty = false) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  const body = pretty
    ? `${JSON.stringify(data, null, 2)}\n`
    : JSON.stringify(data);
  fs.writeFileSync(tmp, body, "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

function extractWithPython() {
  const py = `
import json, sys
try:
    import pymupdf as fitz
except ImportError:
    import fitz

pdf = sys.argv[1]
img_dir = sys.argv[2]
doc = fitz.open(pdf)
page = doc[0]

# Text lines with positions
lines = []
for b in page.get_text("dict")["blocks"]:
    if b.get("type") != 0:
        continue
    for line in b.get("lines", []):
        text = "".join(s["text"] for s in line["spans"]).strip()
        if not text:
            continue
        x0, y0, x1, y1 = line["bbox"]
        lines.append({"text": text, "x0": x0, "y0": y0, "x1": x1, "y1": y1})

# Series headers (known labels)
HEADERS = [
    "TERMOBOX BLACK STAR",
    "TERMOBOX ANTİK",
    "ANTİK FLAMİNGO ELEKTRİKLİ",
    "TERMOBOX İNOX",
    "BLACK FLAMİNGO ELEKTRİKLİ",
]
headers = []
for h in HEADERS:
    for ln in lines:
        if ln["text"].strip() == h:
            headers.append({"name": h, "y0": ln["y0"]})
            break
headers.sort(key=lambda x: x["y0"])

# Product rows: "N Demlikli Model" + code + price on same Y
from collections import defaultdict
by_y = defaultdict(list)
for ln in lines:
    by_y[round(ln["y0"], 1)].append(ln)

def parse_tr_price(raw):
    s = str(raw or "").strip().replace(" ", "").replace("₺", "").replace("TL", "").replace("tl", "")
    if not s:
        return None
    import re
    if re.match(r"^\\d{1,3}(\\.\\d{3})+(,\\d{1,2})?$", s):
        return round(float(s.replace(".", "").replace(",", ".")), 2)
    if re.match(r"^\\d+(,\\d{1,2})?$", s):
        return round(float(s.replace(",", ".")), 2)
    if re.match(r"^\\d+(\\.\\d+)?$", s) and "," not in s:
        return round(float(s), 2)
    return None

products = []
for y, group in sorted(by_y.items()):
    texts = sorted(group, key=lambda g: g["x0"])
    joined = " | ".join(t["text"] for t in texts)
    dem = None
    code = None
    price = None
    for t in texts:
        m = __import__("re").match(r"^(\\d)\\s*Demlikli\\s*Model$", t["text"].strip())
        if m:
            dem = int(m.group(1))
        elif __import__("re").match(r"^(TBBS|TBA|TBİ|TBI|ABF|ATK)[\\s]?\\d", t["text"].strip(), __import__("re").I) or \\
             __import__("re").match(r"^(TBBS|TBA|TBİ|TBI)\\d", t["text"].strip()):
            code = t["text"].strip()
        else:
            p = parse_tr_price(t["text"])
            if p is not None and p >= 1000:
                price = p
    if dem and code and price is not None:
        # Assign series: last header with y0 < this row y
        series = None
        for h in headers:
            if h["y0"] < y:
                series = h["name"]
        products.append({
            "demlik": dem,
            "sku": code,
            "price_tl": price,
            "series_header": series,
            "y0": y,
        })

# Images: embed order by Y (skip tiny logo)
imgs = []
for b in page.get_text("dict")["blocks"]:
    if b.get("type") != 1:
        continue
    x0, y0, x1, y1 = b["bbox"]
    w = x1 - x0
    h = y1 - y0
    if w < 80 or h < 80:
        continue
    imgs.append({"bbox": [x0, y0, x1, y1], "y0": y0, "w": w, "h": h})
imgs.sort(key=lambda i: i["y0"])

# Extract embedded bitmaps sorted by page Y of image blocks
import os
os.makedirs(img_dir, exist_ok=True)
# Map image xref extraction by vertical order of get_images + placement
# Use pixmap render crops from page for reliability linked to series headers
series_images = {}
for i, h in enumerate(headers):
    # image whose vertical center is just below header / near next table
    y_lo = h["y0"]
    y_hi = headers[i + 1]["y0"] if i + 1 < len(headers) else page.rect.height
    best = None
    best_score = 1e18
    for im in imgs:
        cy = (im["bbox"][1] + im["bbox"][3]) / 2
        if y_lo - 5 <= cy <= y_hi + 5:
            # prefer right-column product photos
            score = abs(cy - (y_lo + 40))
            if im["bbox"][0] > 350:
                score -= 50
            if score < best_score:
                best_score = score
                best = im
    series_images[h["name"]] = best["bbox"] if best else None

# Save crops at 3x for usable PDP thumbs
mat = fitz.Matrix(3, 3)
saved = {}
for name, bbox in series_images.items():
    if not bbox:
        continue
    clip = fitz.Rect(bbox)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    key = name.lower()
    for a, b in [("İ", "i"), ("ı", "i"), ("ş", "s"), ("Ş", "s"), ("ö", "o"), ("Ö", "o"),
                 ("ü", "u"), ("Ü", "u"), ("ç", "c"), ("Ç", "c"), ("ğ", "g"), ("Ğ", "g"),
                 (" ", "-"), ("â", "a")]:
        key = key.replace(a, b)
    import re
    key = re.sub(r"[^a-z0-9-]+", "", key)
    fname = f"seri-{key}.jpg"
    dest = os.path.join(img_dir, fname)
    # pymupdf jpeg
    pix.pil_save(dest, format="JPEG", quality=88) if False else None
    try:
        pix.save(dest, jpg_quality=88)
    except TypeError:
        pix.save(dest)
    saved[name] = fname

out = {
    "source": os.path.basename(pdf),
    "headers": headers,
    "products": products,
    "series_images": saved,
}
print(json.dumps(out, ensure_ascii=False, indent=2))
`;
  const r = spawnSync("python3", ["-c", py, PDF, IMG_DIR], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error("PDF parse failed");
  }
  return JSON.parse(r.stdout);
}

function buildRow(item, seriesMeta, imageRel) {
  const sku = item.sku;
  const slug = skuSlug(sku);
  const id = `selale__${slug}`;
  const demlik = item.demlik;
  const priceTl = item.price_tl;
  const net = Math.round(priceTl / (1 + KDV / 100));
  const havale = Math.round(priceTl * (1 - HAVALE_PCT / 100));
  const name = `Şelale ${seriesMeta.label} ${demlik} Demlikli Çay Ocağı, ${sku}`;
  const teknik = [
    `Model / SKU: ${sku}`,
    `Seri: ${seriesMeta.label}`,
    `Demlik kapasitesi: ${demlik}`,
    `Kaplama: ${seriesMeta.finish}`,
    "Marka: Şelale Çay Kazanları",
    "Elektrikli modellerin içi paslanmaz çeliktir; fiyat full modellerle aynıdır.",
    "Opsiyon: Akıllı çay kazanı farkı net 120 USD; Otomatik çakmak farkı net 3.000 TL.",
  ];
  const aciklama = [
    `${seriesMeta.label} serisi ${demlik} demlikli endüstriyel çay ocağı.`,
    seriesMeta.finish + ".",
    "Kafe, lokanta, büro ve endüstriyel mutfaklar için Şelale çay ocağı.",
  ].join(" ");

  return {
    category: "cay-ocagi",
    brand: "Şelale",
    name,
    price: formatTl(priceTl),
    specs: [
      name,
      `Model / SKU: ${sku}`,
      "Marka: Şelale",
      "Kategori: İçecek > Çay Ocakları",
      `Seri: ${seriesMeta.label}`,
      "",
      aciklama,
      "",
      "Teknik Özellikler",
      ...teknik,
      "",
      `Equsto satış (TL, KDV dahil): ${formatTl(priceTl)}`,
      `Katalog liste (1.09.2026, vitrine KDV dahil olarak işlendi): ${formatTl(priceTl)}`,
      `KDV %${KDV}`,
      `Havale / EFT: %${HAVALE_PCT} indirim → ${formatTl(havale)}`,
      "Kaynak: Şelale Çay Kazanı Fiyat Listesi 1.09.2026",
      "https://www.selalekazan.com",
    ].join("\n"),
    aciklama,
    description: name,
    teknik_ozellikler: teknik,
    keywords: [
      "Şelale",
      "Selale",
      sku,
      seriesMeta.label,
      "çay ocağı",
      "cay ocagi",
      `${demlik} demlikli`,
      "termobox",
      "flamingo",
      name,
    ],
    images: imageRel ? [imageRel] : [],
    image: imageRel || undefined,
    sku,
    model: sku,
    urun_kodu: sku,
    marka_kodu: "SELALE",
    marka_urun_kodu: sku,
    equsto_kod: `EQ-SELALE.${sku.replace(/\s+/g, "")}`,
    para_birimi: "TRY",
    fiyat_tl: priceTl,
    fiyat_tl_net: net,
    kdv_oran: KDV,
    fiyat_havale_tl: havale,
    havale_iskonto_oran: HAVALE_PCT,
    kaynak: "selale-fiyat-listesi-2026-09",
    kaynak_fiyat_listesi: "selale-cay-kazani-1.09.2026",
    dept: "icecek",
    tip_kodu: "cay-ocagi",
    urun_kategori: "İçecek",
    urun_alt_kategori: "Çay Ocakları",
    alt_kategori_1: "cay-ocagi",
    alt_kategori_2: "Çay Ocakları",
    kategori_yolu: ["İçecek", "Çay Ocakları"],
    id,
    fiyat_bekleniyor: false,
    selale_seri: seriesMeta.key,
    selale_demlik: demlik,
  };
}

function selfTestParseTrPrice() {
  const cases = [
    ["39.000,00", 39000],
    ["40.050,00", 40050],
    ["55.800,00", 55800],
    ["66.750,00", 66750],
    ["38.000,00", 38000],
    ["50.500,00", 50500],
  ];
  for (const [raw, expect] of cases) {
    const got = parseTrPrice(raw);
    if (got !== expect) {
      throw new Error(`parseTrPrice(${raw}) = ${got}, expected ${expect}`);
    }
  }
  // Guard: must NOT treat 39.000 as 39
  if (parseTrPrice("39.000,00") < 1000) {
    throw new Error("binlik ayracı hatalı parse edildi");
  }
}

function main() {
  selfTestParseTrPrice();
  if (!fs.existsSync(PDF)) throw new Error(`PDF yok: ${PDF}`);

  console.log("[selale] PDF parse…", path.relative(ROOT, PDF));
  const parsed = extractWithPython();
  fs.mkdirSync(path.dirname(PARSED_OUT), { recursive: true });
  writeJsonAtomic(PARSED_OUT, parsed);

  if (!parsed.products?.length) throw new Error("PDF’den ürün çıkmadı");
  console.log("[selale] parse:", parsed.products.length, "ürün");

  // Validate expected SKUs / prices (katalog kilit)
  const expected = {
    TBBS2D: 39000,
    TBBS3D: 43000,
    TBBS4D: 50500,
    TBBS5D: 58000,
    TBBS6D: 62500,
    TBA2D: 44500,
    TBA3D: 50500,
    TBA4D: 57000,
    TBA5D: 62000,
    TBA6D: 67000,
    "ABF 255": 40000,
    "ABF 355": 45500,
    "ABF 455": 51500,
    "ABF 555": 55800,
    "ABF 655": 62500,
    TBİ2D: 40050,
    TBİ3D: 47500,
    TBİ4D: 53500,
    TBİ5D: 58500,
    TBİ6D: 66750,
    "ATK 255": 38000,
    "ATK 355": 41500,
    "ATK 455": 48800,
    "ATK 555": 54000,
    "ATK 655": 60500,
  };

  const bySku = new Map(parsed.products.map((p) => [p.sku, p]));
  for (const [sku, price] of Object.entries(expected)) {
    const row = bySku.get(sku);
    if (!row) throw new Error(`Eksik SKU: ${sku}`);
    if (row.price_tl !== price) {
      throw new Error(
        `Fiyat uyuşmazlığı ${sku}: parse=${row.price_tl} beklenen=${price}`,
      );
    }
    const meta = SERIES_BY_HEADER[row.series_header];
    if (!meta) {
      throw new Error(`Seri eşleşmedi ${sku}: ${row.series_header}`);
    }
  }
  console.log("[selale] fiyat kilit OK — 25 SKU");

  const rows = [];
  for (const item of parsed.products) {
    const meta = SERIES_BY_HEADER[item.series_header];
    const imgFile = parsed.series_images?.[item.series_header];
    const imageRel = imgFile ? `${IMG_SUB}/${imgFile}` : null;
    rows.push(buildRow(item, meta, imageRel));
  }

  if (DRY) {
    console.log("[selale] dry-run, örnek:", JSON.stringify(rows[0], null, 2));
    console.log("[selale] toplam", rows.length);
    return;
  }

  const dept = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  if (!Array.isArray(dept)) throw new Error("icecek.json array değil");

  let added = 0;
  let updated = 0;
  for (const row of rows) {
    const idx = dept.findIndex(
      (r) =>
        r?.id === row.id ||
        (String(r?.marka_kodu || "").toUpperCase() === "SELALE" &&
          String(r?.sku || "").toUpperCase() === String(row.sku).toUpperCase()),
    );
    if (idx >= 0) {
      dept[idx] = { ...dept[idx], ...row };
      updated += 1;
      console.log("[catalog] updated", row.id, row.fiyat_tl);
    } else {
      dept.push(row);
      added += 1;
      console.log("[catalog] added", row.id, row.fiyat_tl);
    }
  }

  writeJsonAtomic(DEPT_FILE, dept, true);
  console.log(`[selale] icecek.json → +${added} / ~${updated} (toplam ${dept.length})`);

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/build-sitemap.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
}

main();
