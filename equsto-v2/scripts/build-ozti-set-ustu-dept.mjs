/**
 * Öztiryakiler SETÜSTÜ MUTFAK EKİPMANLARI → public/data/dept/set-ustu-mutfak.json
 *   node scripts/build-ozti-set-ustu-dept.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "scripts/data/ozti-eslesme-2026.json");
const MAP = path.join(ROOT, "scripts/data/ozti-set-ustu-kategoriler.json");
const OUT = path.join(ROOT, "public/data/dept/set-ustu-mutfak.json");
const BRAND = "Öztiryakiler Endüstriyel Mutfak";
const BRAND_ID = "oztiryakiler-endustriyel-mutfak";

function slugify(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function slugId(kod) {
  return `${BRAND_ID}__${slugify(kod)}`;
}

function mapTip(kategori, nav) {
  const k = String(kategori || "").toLocaleUpperCase("tr");
  for (const n of nav) {
    const keys = String(n.search || n.label)
      .split("|")
      .map((x) => x.trim())
      .filter(Boolean);
    for (const key of keys) {
      if (new RegExp(key, "i").test(k)) return n.tip;
    }
  }
  return slugify(kategori) || "diger";
}

/** Excel bayi_iskonto = indirim oranı (0,65 → %65); satış = liste × (1 − oran). */
function oztiSatisEur(liste, bayiIsk) {
  const L = Number(liste);
  if (!(L > 0)) return null;
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return Math.round(L * 100) / 100;
  return Math.round(L * (1 - isk) * 100) / 100;
}

function oztiIskontoYuzde(bayiIsk) {
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return 0;
  return Math.round(isk * 10000) / 100;
}

function isSetUstu(row, allow) {
  const pathHay = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  if (/SETÜSTÜ\s*MUTFAK|SETUSTU\s*MUTFAK/.test(pathHay)) return true;
  if (allow.includes(kat)) return true;
  for (const a of allow) {
    if (a && kat.indexOf(a) >= 0) return true;
  }
  return false;
}

function rowToVitrin(row, nav) {
  const kod = row.urun_kodu;
  const tip = mapTip(row.kategori, nav);
  const liste = row.liste_fiyati_eur ?? row.liste_fiyati;
  const iskPct = oztiIskontoYuzde(row.bayi_iskonto);
  const odeme =
    row.odeme_carpani != null
      ? Number(row.odeme_carpani)
      : iskPct > 0
        ? Math.round((1 - Number(row.bayi_iskonto)) * 10000) / 10000
        : 1;
  const satis = oztiSatisEur(liste, row.bayi_iskonto) ?? liste;
  const specs = [
    row.urun_tanimi,
    `Ürün kodu: ${kod}`,
    `Liste (EUR): ${liste}`,
    `Bayi iskonto: %${iskPct || "—"} (ödeme çarpanı ${odeme})`,
    `Satış (EUR): ${satis}`,
    `Kategori: ${row.kategori || ""}`,
    "Kaynak: Öztiryakiler Fiyat Listesi 2025",
  ].join("\n");

  return {
    category: tip,
    brand: BRAND,
    name: row.urun_tanimi || kod,
    price: "",
    specs,
    images: [],
    sku: kod,
    model: kod,
    liste_fiyati_eur: liste,
    satis_fiyati_eur: satis,
    bayi_iskonto: row.bayi_iskonto,
    odeme_carpani: odeme,
    iskonto_yuzde: iskPct,
    iskonto_oran: iskPct,
    para_birimi: row.para_birimi || "EUR",
    kaynak: "ozti-fiyat-listesi-2025",
    kaynak_fiyat_listesi: "ozti-2025-set-ustu-mutfak",
    dept: "set-ustu-mutfak",
    vitrin_arka_plan: true,
    id: slugId(kod),
    urun_kodu: kod,
    pdf_eslesme: !!row.pdf_eslesme,
    pdf_sayfalar: row.pdf?.sayfalar,
  };
}

const cfg = JSON.parse(fs.readFileSync(MAP, "utf8"));
const allow = cfg.kategori_leaf_allow.map((x) => String(x).toLocaleUpperCase("tr"));
const rows = JSON.parse(fs.readFileSync(SRC, "utf8").replace(/\bNaN\b/g, "null"));
const out = rows.filter((r) => isSetUstu(r, allow)).map((r) => rowToVitrin(r, cfg.nav));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out), "utf8");
console.log("[ozti-set-ustu] yazıldı:", out.length, "ürün →", path.relative(ROOT, OUT));
