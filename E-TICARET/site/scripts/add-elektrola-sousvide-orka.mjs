#!/usr/bin/env node
/**
 * Elektrola Expert Sous Vide — Orka Gıda (sirkülatör + Kit18 tank/kapak).
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
const KDV = 20;
const HAVALE_PCT = 2;

/** Solo: 51.600 TL KDV dahil. Kit18: 61.375 TL KDV dahil (manuel). */
const PRODUCTS = [
  {
    sku: "ESV2GAC2EX",
    id: "elektrola__esv2gac2ex",
    priceTl: 51600,
    name: "Elektrola Expert Serisi Sous Vide Pişirme Sirkülatörü",
    orkaUrl:
      "https://www.orkagida.com/elektrola-expert-serisi-sous-vide-pisirme-sirkulatoru",
    tankNote: "Önemli: Tank ve kapak fiyata dahil değildir.",
    kit: false,
    imageUrls: [
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--6999-.jpeg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--4bbe-.jpeg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--394ac.jpeg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisi--469c-.jpeg",
    ],
  },
  {
    sku: "ESV2GAC2EX-KIT18",
    id: "elektrola__esv2gac2ex-kit18",
    priceTl: 61375,
    name: "Elektrola Expert Serisi Sous Vide Pişirme Kiti (Kit18)",
    orkaUrl: "https://www.orkagida.com/elektrola-expert-serisi-kit18",
    tankNote:
      "Önemli: 18 lt polikarbon tank ve kapak fiyata DAHİLDİR.",
    kit: true,
    imageUrls: [
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-kit18-4b4-1f.jpg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-kit18-e5de-1.jpg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-kit18--8500c.jpg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-kit18-3-4c49.jpg",
      "https://static.ticimax.cloud/11083/uploads/urunresimleri/buyuk/elektrola-expert-serisi-sous-vide-pisirm628e.jpg",
    ],
  },
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

function fileSlug(sku) {
  return String(sku)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildRow(def, localRels) {
  const net = Math.round(def.priceTl / (1 + KDV / 100));
  const havale = Math.round(def.priceTl * (1 - HAVALE_PCT / 100));
  const aciklama = [
    def.kit
      ? "Elektrola Expert Serisi sous vide pişirme kiti: sirkülatör + 18 lt polikarbon tank + kapak."
      : "Türkiye'nin ilk ve tek yerli üretim sous vide (suvid) pişirme sirkülatörü.",
    "0,1°C hassasiyetle çalışır; PID sıcaklık kontrolü.",
    "Kolay anlaşılır ön panel, görsel/işitsel hata uyarısı, sıcaklık kalibrasyonu,",
    "güç kesintisinde otomatik yeniden başlama, ileri/geri zaman sayacı,",
    "taşıma kulbu, paslanmaz çelik gövde, şamandıralı su seviye sensörü ve aşırı sıcaklık koruması.",
    "",
    def.tankNote,
    "",
    `Kaynak: ${def.orkaUrl}`,
  ].join("\n");

  const teknik = [
    "Isıtıcı: 2,0 kW",
    "Çalışma: 240 V / 50–60 Hz",
    "Sıcaklık hassasiyeti: 0,1°C",
    "Sıcaklık kontrolü: PID",
    "Sıcaklık ayarı: dijital",
    def.kit ? "Kit: 18 lt polikarbon tank + kapak dahil" : "Kapasite: 50 lt (tank hariç)",
    "Net ağırlık (sirkülatör): 4,0 kg",
    "Cihaz ölçüleri (sirkülatör): 120×240×370 mm",
    "Güvenlik: şamandıralı su seviye sensörü, aşırı sıcaklık koruma termostatı, rezistans koruyucu kafes",
    def.tankNote.replace(/^Önemli:\s*/i, ""),
  ];

  return {
    category: "sous-vide",
    brand: "Elektrola",
    name: def.name,
    price: formatTl(def.priceTl),
    specs: [
      def.name,
      `Model / SKU: ${def.sku}`,
      "Marka: Elektrola",
      "Kategori: Sous Vide",
      "",
      aciklama,
      "",
      "Teknik Özellikler",
      ...teknik,
      "",
      `Equsto satış (TL, KDV dahil): ${formatTl(def.priceTl)}`,
      `KDV %${KDV}`,
      `Havale / EFT: %${HAVALE_PCT} indirim → ${formatTl(havale)}`,
      `Kaynak: orkagida.com`,
      def.orkaUrl,
    ].join("\n"),
    aciklama,
    teknik_ozellikler: teknik,
    olculer: {
      genislik_mm: 120,
      derinlik_mm: 240,
      yukseklik_mm: 370,
      kapasite_lt: def.kit ? "18" : "50",
      guc_kw: "2",
    },
    keywords: [
      "Elektrola",
      def.sku,
      "sous vide",
      "sous-vide",
      "suvid",
      "immersion circulator",
      "vakumda pişirme",
      ...(def.kit ? ["kit18", "tank", "kapak", "18 lt"] : ["sirkülatör"]),
      def.name,
    ],
    images: def.imageUrls,
    images_local: localRels,
    sku: def.sku,
    model: def.sku,
    urun_kodu: def.sku,
    marka_kodu: "ELEKTROLA",
    marka_urun_kodu: def.sku,
    equsto_kod: `EQ-ELEKTROLA.${def.sku}`,
    para_birimi: "TRY",
    fiyat_tl: def.priceTl,
    fiyat_tl_net: net,
    kdv_oran: KDV,
    fiyat_havale_tl: havale,
    havale_iskonto_oran: HAVALE_PCT,
    kaynak: "orkagida-web",
    kaynak_fiyat_listesi: "orkagida-manual-2026-08",
    orkagida_url: def.orkaUrl,
    dept: "set-ustu-mutfak",
    tip_kodu: "sous-vide",
    id: def.id,
    stok: def.kit ? 4 : 19,
  };
}

async function ensureImages(def) {
  fs.mkdirSync(IMG_DIR, { recursive: true });
  const localRels = [];
  const base = fileSlug(def.sku);
  for (let i = 0; i < def.imageUrls.length; i += 1) {
    const url = def.imageUrls[i];
    const ext = /\.jpe?g/i.test(url) ? (url.toLowerCase().endsWith(".jpg") ? "jpg" : "jpeg") : "jpg";
    const file = i === 0 ? `${base}.${ext}` : `${base}-${i + 1}.${ext}`;
    const dest = path.join(IMG_DIR, file);
    if (!fs.existsSync(dest) || fs.statSync(dest).size < 2000) {
      const n = await downloadImage(url, dest);
      console.log("[img]", file, n, "bytes");
    } else {
      console.log("[img] keep", file);
    }
    localRels.push(`${IMG_SUB}/${file}`);
  }
  return localRels;
}

async function main() {
  const rows = JSON.parse(fs.readFileSync(DEPT_FILE, "utf8"));
  if (!Array.isArray(rows)) throw new Error("dept JSON array değil");

  for (const def of PRODUCTS) {
    const localRels = await ensureImages(def);
    const row = buildRow(def, localRels);
    const idx = rows.findIndex(
      (r) =>
        r?.id === def.id ||
        String(r?.sku || "").toUpperCase() === def.sku.toUpperCase(),
    );
    if (idx >= 0) {
      rows[idx] = { ...rows[idx], ...row };
      console.log("[catalog] updated", def.id, def.priceTl);
    } else {
      rows.push(row);
      console.log("[catalog] added", def.id, def.priceTl);
    }
    console.log(
      "[ok] PDP:",
      `https://equsto.com/shop/set-ustu-mutfak/${fileSlug(def.sku)}`,
    );
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
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
