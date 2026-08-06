#!/usr/bin/env node
/**
 * Elektrola Expert Sous Vide sirkülatörü — Orka Gıda kaynağından siteye ekle.
 * Fiyat: 51.600 TL KDV dahil (manuel).
 *
 *   node scripts/add-elektrola-sousvide-orka.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT_FILE = path.join(ROOT, "public/data/dept/set-ustu-mutfak.json");
const IMG_DIR = path.join(ROOT, "public/images/catalog/elektrola/web");
const IMG_SUB = "images/catalog/elektrola/web";
const ORKA_URL =
  "https://www.orkagida.com/elektrola-expert-serisi-sous-vide-pisirme-sirkulatoru";
const SKU = "ESV2GAC2EX";
const PRICE_TL = 51600;
const KDV = 20;
const HAVALE_PCT = 2;
const PRODUCT_ID = "elektrola__esv2gac2ex";

const IMAGE_URLS = [
  "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--6999-.jpeg",
  "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--4bbe-.jpeg",
  "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--394ac.jpeg",
  "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--469c-.jpeg",
];

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

function writeJsonAtomic(filePath, data) {
  const tmp = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(tmp, JSON.stringify(data), "utf8");
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {}
  fs.renameSync(tmp, filePath);
}

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 EqustoBot/1.0" },
  });
  if (!res.ok) throw new Error(`image ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 2000) throw new Error(`image too small ${buf.length} ${url}`);
  fs.writeFileSync(dest, buf);
  return buf.length;
}

async function main() {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const localRels = [];
  for (let i = 0; i < IMAGE_URLS.length; i += 1) {
    const ext = IMAGE_URLS[i].toLowerCase().includes(".jpg") ? "jpg" : "jpeg";
    const file =
      i === 0 ? `elektrola-esv2gac2ex.${ext}` : `elektrola-esv2gac2ex-${i + 1}.${ext}`;
    const dest = path.join(IMG_DIR, file);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 2000) {
      const n = await downloadImage(IMAGE_URLS[i], dest);
      console.log("[img]", file, n, "bytes");
    } else {
      console.log("[img] keep", file);
    }
    localRels.push(`${IMG_SUB}/${file}`);
  }

  const net = Math.round(PRICE_TL / (1 + KDV / 100));
  const havale = Math.round(PRICE_TL * (1 - HAVALE_PCT / 100));

  const name = "Elektrola Expert Serisi Sous Vide Pişirme Sirkülatörü";
  const aciklama = [
    "Türkiye'nin ilk ve tek yerli üretim sous vide (suvid) pişirme sirkülatörü.",
    "0,1°C hassasiyetle çalışır; PID sıcaklık kontrolü.",
    "Kolay anlaşılır ön panel, görsel/işitsel hata uyarısı, sıcaklık kalibrasyonu,",
    "güç kesintisinde otomatik yeniden başlama, ileri/geri zaman sayacı,",
    "taşıma kulbu, paslanmaz çelik gövde, şamandıralı su seviye sensörü ve aşırı sıcaklık koruması.",
    "",
    "Önemli: Tank ve kapak fiyata dahil değildir.",
    "",
    `Kaynak: ${ORKA_URL}`,
  ].join("\n");

  const teknik = [
    "Isıtıcı: 2,0 kW",
    "Çalışma: 240 V / 50–60 Hz",
    "Sıcaklık hassasiyeti: 0,1°C",
    "Sıcaklık kontrolü: PID",
    "Sıcaklık ayarı: dijital",
    "Kapasite: 50 lt",
    "Net ağırlık: 4,0 kg",
    "Cihaz ölçüleri: 120×240×370 mm",
    "Brüt ağırlık: 4,6 kg",
    "Nakliye ölçüleri: 175×260×415 mm",
    "Güvenlik: şamandıralı su seviye sensörü, aşırı sıcaklık koruma termostatı, rezistans koruyucu kafes",
    "Tank ve kapak fiyata dahil değildir",
  ];

  // Canlıda /public/images git dışı — absolute Ticimax URL ile göster (https geçer).
  const row = {
    category: "sous-vide",
    brand: "Elektrola",
    name,
    price: formatTl(PRICE_TL),
    specs: [
      name,
      `Model / SKU: ${SKU}`,
      "Marka: Elektrola",
      "Kategori: Sous Vide",
      "",
      aciklama,
      "",
      "Teknik Özellikler",
      ...teknik,
      "",
      `Equsto satış (TL, KDV dahil): ${formatTl(PRICE_TL)}`,
      `KDV %${KDV}`,
      `Havale / EFT: %${HAVALE_PCT} indirim → ${formatTl(havale)}`,
      `Kaynak: orkagida.com`,
      ORKA_URL,
    ].join("\n"),
    aciklama,
    teknik_ozellikler: teknik,
    olculer: {
      genislik_mm: 120,
      derinlik_mm: 240,
      yukseklik_mm: 370,
      kapasite_lt: "50",
      guc_kw: "2",
    },
    keywords: [
      "Elektrola",
      "ESV2GAC2EX",
      "sous vide",
      "sous-vide",
      "suvid",
      "immersion circulator",
      "vakumda pişirme",
      name,
    ],
    images: IMAGE_URLS,
    images_local: localRels,
    sku: SKU,
    model: SKU,
    urun_kodu: SKU,
    marka_kodu: "ELEKTROLA",
    marka_urun_kodu: SKU,
    equsto_kod: `EQ-ELEKTROLA.${SKU}`,
    para_birimi: "TRY",
    fiyat_tl: PRICE_TL,
    fiyat_tl_net: net,
    kdv_oran: KDV,
    fiyat_havale_tl: havale,
    havale_iskonto_oran: HAVALE_PCT,
    kaynak: "orkagida-web",
    kaynak_fiyat_listesi: "orkagida-manual-2026-08",
    orkagida_url: ORKA_URL,
    dept: "set-ustu-mutfak",
    tip_kodu: "sous-vide",
    id: PRODUCT_ID,
    stok: 19,
  };

  const rows = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  if (!Array.isArray(rows)) throw new Error("dept JSON array değil");
  const idx = rows.findIndex(
    (r) =>
      r?.id === PRODUCT_ID ||
      String(r?.sku || "").toUpperCase() === SKU ||
      /ESV2GAC2EX/i.test(String(r?.equsto_kod || "")),
  );
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], ...row };
    console.log("[catalog] updated", PRODUCT_ID);
  } else {
    rows.push(row);
    console.log("[catalog] added", PRODUCT_ID);
  }
  writeJsonAtomic(DEPT_FILE, rows);

  execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/build-sitemap.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  const slug = SKU.toLowerCase();
  console.log("[ok] PDP:", `https://equsto.com/shop/set-ustu-mutfak/${slug}`);
  console.log("[ok] fiyat:", PRICE_TL, "TL KDV dahil");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
