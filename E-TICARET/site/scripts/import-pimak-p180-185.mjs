#!/usr/bin/env node
/**
 * Pimak katalog s.180–185 → servis hattı ürünleri import
 *
 * Kaynak: PFOS/veri/pimak/p180-185-products.json
 * Hedef:  public/data/dept/servis.json (+ rebuild ekipmanlar)
 *
 * Kullanım:
 *   node scripts/import-pimak-p180-185.mjs
 *   node scripts/import-pimak-p180-185.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { fetchTcmbEurRate } from "./fetch-tcmb-kur.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../../PFOS/veri/pimak/p180-185-products.json");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const MANIFEST = path.join(ROOT, "public/data/pimak/manifest.json");

const PIMAK_BRAND = "Pimak";
const PIMAK_BRAND_ID = "pimak";
const PIMAK_KAYNAK = "pimak-katalog-pdf";
const DEPT = "servis";
const KDV = Number(process.env.EQUSTO_KDV_ORAN || "20");
const dryRun = process.argv.includes("--dry-run");

function fmtTry(n) {
  const v = Math.round(Number(n));
  const parts = v.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

function pricingFromListe(listeEur, kur) {
  // Pimak PDF fiyatı "liste" gibi; burada basit çevrim yapıyoruz.
  const netTry = listeEur * kur;
  const kdvDahil = netTry * (1 + KDV / 100);
  return {
    liste_fiyati_eur: listeEur,
    satis_fiyati_eur: Math.round(listeEur * 100) / 100,
    kur_eur_try: kur,
    fiyat_tl: Math.round(kdvDahil),
    fiyat_tl_net: Math.round(netTry),
    price: `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(kdvDahil)}`,
    fiyat_bekleniyor: false,
  };
}

function slugifySimple(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function isP180185Row(r) {
  const k = String(r?.kaynak || "");
  const page = Number(r?.pdf_page);
  return k === PIMAK_KAYNAK && page >= 180 && page <= 185;
}

function toRow(p, kur) {
  const sku = String(p.urun_kodu || "").trim().toUpperCase();
  const slug = `pimak-${slugifySimple(sku)}`;
  const id = `${PIMAK_BRAND_ID}__${slug}`;
  const liste = Number(p.liste_fiyati_eur) || 0;
  const px = liste > 0 ? pricingFromListe(liste, kur) : null;
  const specs = [
    p.baslik,
    "",
    ...(p.temel_ozellikler || []).map((t) => `• ${t}`),
    "",
    `Ürün kodu: ${sku}`,
    p.ebat_mm ? `Ebat (mm): ${p.ebat_mm}` : "",
    p.agirlik_kg ? `Ağırlık (Kg): ${p.agirlik_kg}` : "",
    `Kaynak: Pimak katalog 2026 s.${p.pdf_page}`,
    `Marka: ${PIMAK_BRAND}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    id,
    dept: DEPT,
    category: "servis-hatti",
    brand: PIMAK_BRAND,
    oem_brand: "Pimak",
    name: String(p.baslik || sku),
    price: px?.price || "Teklif için iletişim",
    fiyat_bekleniyor: !px,
    specs,
    aciklama: (p.temel_ozellikler || []).join("\n"),
    teknik_ozellikler: [
      ...(p.temel_ozellikler || []),
      p.ebat_mm ? `Ebat (mm): ${p.ebat_mm}` : "",
      p.agirlik_kg ? `Ağırlık (Kg): ${p.agirlik_kg}` : "",
      `Katalog sayfası: ${p.pdf_page}`,
    ].filter(Boolean),
    sku,
    model: sku,
    urun_kodu: sku,
    kaynak: PIMAK_KAYNAK,
    kaynak_url: "",
    pdf_page: p.pdf_page,
    linkKaynak: "",
    ...(px || {}),
    kaynak_fiyat_listesi: px ? PIMAK_KAYNAK : undefined,
    marka_kodu: "PIMAK",
    marka_urun_kodu: sku.replace(/^PIMAK\./i, ""),
  };
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Kaynak yok:", SRC);
    process.exit(1);
  }
  const products = JSON.parse(fs.readFileSync(SRC, "utf8"));
  if (!Array.isArray(products) || !products.length) {
    console.error("Kaynak boş:", SRC);
    process.exit(1);
  }

  const tcmb = await fetchTcmbEurRate();
  const kur =
    Number(process.env.EQUSTO_EUR_TRY) > 0 ? Number(process.env.EQUSTO_EUR_TRY) : tcmb.rate;

  const rows = products.map((p) => toRow(p, kur));
  const priced = rows.filter((r) => !r.fiyat_bekleniyor).length;

  const file = path.join(DEPT_DIR, `${DEPT}.json`);
  let kept = [];
  if (fs.existsSync(file)) {
    kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isP180185Row(r));
  }
  const merged = [...kept, ...rows];

  if (!dryRun) {
    fs.mkdirSync(DEPT_DIR, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(merged), "utf8");

    // Pimak manifestini güncelle (bilgi amaçlı)
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    let man = {};
    try {
      man = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
    } catch {}
    fs.writeFileSync(
      MANIFEST,
      JSON.stringify(
        {
          ...man,
          generated: new Date().toISOString(),
          brand: PIMAK_BRAND,
          kaynak: PIMAK_KAYNAK,
          pdf_pages: "180-185",
          imported_servis: rows.length,
          priced_servis: priced,
        },
        null,
        2,
      ) + "\n",
      "utf8",
    );

    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }

  console.log("[pimak p180-185] servis rows:", rows.length, "| fiyatlı:", priced);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

