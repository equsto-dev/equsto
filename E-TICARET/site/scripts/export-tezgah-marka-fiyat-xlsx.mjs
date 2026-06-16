#!/usr/bin/env node
/**
 * Pimak ↔ Equsto tezgah — yalnızca doğrulanmış 1:1 ürün eşleşmeleri (Excel).
 * Geniş "taban raflı" grubuna servis bankosu vb. karıştırılmaz.
 *
 *   node scripts/export-tezgah-marka-fiyat-xlsx.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEPT = path.join(ROOT, "public/data/dept/tezgah.json");
const OUT = path.join(ROOT, "scripts/out/tezgah-pimak-equsto-fiyat-karsilastirma.xlsx");

/**
 * Pimak PDF varyant soneki → Equsto 2026 fiyat listesi seri kodu.
 * @see lib/pfos/core/calisma-tezgah.ts inferEqustoTezgahVariantSuffix
 */
const VERIFIED_MAP = {
  "00": {
    series: "KCT01",
    tip: "Alt tablasız çalışma tezgahı",
    equstoTip: "Çalışma tezgahı, etrafı açık, RAFSIZ",
    guven: "kesin",
  },
  "04": {
    series: "KCT08",
    tip: "Taban ve ara raflı çalışma tezgahı",
    equstoTip: "Çalışma tezgahı, etrafı açık, taban VE ara raflı",
    guven: "kesin",
  },
  "08": {
    series: "KCT04",
    tip: "Taban raflı çalışma tezgahı",
    equstoTip: "Çalışma tezgahı, etrafı açık, taban raflı",
    guven: "kesin",
  },
  "13": {
    series: "KDCT01",
    tip: "Dolaplı çalışma tezgahı",
    equstoTip: "Dolaplı çalışma tezgahı, etrafı kapalı, taban+ara raflı",
    guven: "kesin",
  },
  "15": {
    series: "KHCT04",
    tip: "Hareketli tezgah — taban ve ara raflı",
    equstoTip: "Hareketli çalışma tezgahı, taban+ara raflı, tekerlekli",
    guven: "kesin",
  },
  "46": {
    series: "KMERTT04",
    tip: "Mermer tablalı — taban raflı",
    equstoTip: "Mermer tablalı tezgah, etrafı açık, taban raflı",
    guven: "kesin",
  },
  "50": {
    series: "KMERTT01",
    tip: "Mermer tablalı tezgah",
    equstoTip: "Mermer tablalı tezgah (taban rafsız)",
    guven: "kesin",
  },
  "51": {
    series: "KPTT04",
    tip: "Polietilen tablalı — taban raflı",
    equstoTip: "Polietilen tablalı tezgah, etrafı açık, taban raflı",
    guven: "kesin",
  },
  "56": {
    series: "KCT09",
    tip: "Ara raflı blok çekmeceli (dolaplı gövde)",
    equstoTip: "Çalışma tezgahı, taban+ara raflı, dörtlü blok çekmeceli",
    guven: "kesin",
  },
  "70": {
    series: "KHCT01",
    tip: "Hareketli tezgah — taban raflı",
    equstoTip: "Hareketli çalışma tezgahı, taban raflı, tekerlekli",
    guven: "kesin",
  },
  "31": {
    series: "KPTT01",
    tip: "Polietilen tablalı tezgah",
    equstoTip: "Polietilen tablalı tezgah, etrafı açık, taban RAFSIZ",
    guven: "yakın",
    not: "Pimak adında taban rafı belirtilmeyebilir; KPTT01 taban rafsız",
  },
  "12": {
    series: "KCEVT01",
    tip: "Çift evyeli taban rafsız",
    equstoTip: "Çift evyeli tezgah, etrafı açık, taban RAFSIZ",
    guven: "kesin",
  },
  "14": {
    series: "KCEVD02",
    tip: "Çift evyeli taban raflı",
    equstoTip: "Çift evyeli dolap, etrafı kapalı, taban raflı",
    guven: "yakın",
    not: "Pimak açık taban raflı; Equsto’da açık çift raflı yok — en yakın KCEVD02 dolaplı",
  },
};

/** Bilinçli eşleştirilmemeli — farklı ürün ailesi */
const NO_MATCH = {
  "11": "Pimak: açık tek evyeli TABAN RAFLI. Equsto’da yok (KTEVDT02=dolaplı kapalı, KTEVT01=açık taban rafsız).",
  "17": "Üç evyeli — Equsto fiyat listesinde karşılık yok.",
  "23": "Tabak ısıtma dolabı — çalışma tezgahı değil.",
  "25": "Balık hazırlama tezgahı — Equsto KSBST farklı ürün.",
  "52": "Set altı dolaplı (550 mm yükseklik) — Equsto’da aynı ölçü yok.",
  "57": "Bulaşık makinesi giriş-çıkış — Equsto KPRMXT farklı ürün.",
  "91": "Et kütüğü — Equsto KPEKKBHT farklı ürün.",
};

function midToDim(mid) {
  const w = Number(mid.slice(0, 3)) * 10;
  const d = Number(mid.slice(3, 5)) * 10;
  return { w, d, h: 850, label: `${w}×${d}×850 mm` };
}

function fmtTry(n) {
  return Number.isFinite(n) ? Math.round(n) : null;
}

function pctDiff(a, b) {
  if (!a || !b) return null;
  return Math.round(((b - a) / a) * 1000) / 10;
}

function findEqusto(rows, series, mid) {
  const sku = `EQ.${series}.${mid}`;
  return rows.find((r) => String(r.sku).toUpperCase() === sku.toUpperCase());
}

const all = JSON.parse(fs.readFileSync(DEPT, "utf8"));
const pimak = all.filter((r) => r.brand === "Pimak");
const equsto = all.filter((r) => r.brand === "Equsto");

const pairs = [];
const noEqusto = [];
const wrongOldExamples = [];

for (const p of pimak) {
  const m = String(p.sku || "").match(/^PIMAK\.(\d{5})\.(\d{2})$/i);
  if (!m) continue;
  const [, mid, suf] = m;
  const dim = midToDim(mid);

  if (NO_MATCH[suf]) {
    noEqusto.push({
      pimakSku: p.sku,
      suffix: suf,
      dim: dim.label,
      pimakName: p.name,
      pimakFiyat: fmtTry(p.fiyat_tl),
      sebep: NO_MATCH[suf],
    });
    continue;
  }

  const map = VERIFIED_MAP[suf];
  if (!map) {
    noEqusto.push({
      pimakSku: p.sku,
      suffix: suf,
      dim: dim.label,
      pimakName: p.name,
      pimakFiyat: fmtTry(p.fiyat_tl),
      sebep: "Eşleme tablosunda tanımsız Pimak varyantı",
    });
    continue;
  }

  const eq = findEqusto(equsto, map.series, mid);
  if (!eq) {
    noEqusto.push({
      pimakSku: p.sku,
      suffix: suf,
      dim: dim.label,
      pimakName: p.name,
      pimakFiyat: fmtTry(p.fiyat_tl),
      sebep: `Equsto ${map.series}.${mid} bu ölçüde yok`,
      beklenenEqusto: `EQ.${map.series}.${mid}`,
    });
    continue;
  }

  const pF = fmtTry(p.fiyat_tl);
  const eF = fmtTry(eq.fiyat_tl);
  const diff = eF - pF;
  pairs.push({
    guven: map.guven,
    suffix: suf,
    tip: map.tip,
    dim: dim.label,
    mid,
    pimakSku: p.sku,
    pimakName: p.name,
    pimakFiyat: pF,
    pimakListeEur: p.liste_fiyati_eur ?? null,
    pimakKaynak: p.kaynak,
    equstoSku: eq.sku,
    equstoName: eq.name,
    equstoFiyat: eF,
    equstoKaynak: eq.kaynak,
    farkTl: diff,
    farkPct: pctDiff(pF, eF),
    ucuzMarka: diff > 0 ? "Pimak" : diff < 0 ? "Equsto" : "Eşit",
    eslesmeNotu: map.not || "",
    equstoTip: map.equstoTip,
  });

  // Eski hatalı gruplama örneği: taban raflı + servis bankosu
  if (suf === "08") {
    const bad = findEqusto(equsto, "KSRVB02", mid);
    if (bad) {
      wrongOldExamples.push({
        pimakSku: p.sku,
        dogruEqusto: eq.sku,
        dogruFiyat: eF,
        yanlisEqusto: bad.sku,
        yanlisAd: bad.name?.slice(0, 60),
        yanlisFiyat: fmtTry(bad.fiyat_tl),
        aciklama: "Eski rapor aynı ölçüdeki SICAK SERVİS BANKOSU ile eşleştirmişti",
      });
    }
  }
}

pairs.sort((a, b) => {
  const g = { kesin: 0, yakın: 1 };
  return (g[a.guven] ?? 2) - (g[b.guven] ?? 2) || a.mid.localeCompare(b.mid) || a.suffix.localeCompare(b.suffix);
});

const kesin = pairs.filter((p) => p.guven === "kesin");
const avgP = kesin.reduce((s, x) => s + x.pimakFiyat, 0) / kesin.length;
const avgE = kesin.reduce((s, x) => s + x.equstoFiyat, 0) / kesin.length;

const wb = new ExcelJS.Workbook();
wb.creator = "equsto";
wb.created = new Date();

const readme = wb.addWorksheet("README");
readme.columns = [{ width: 100 }];
readme.addRow(["Tezgah Pimak ↔ Equsto fiyat karşılaştırması"]);
readme.addRow([`Oluşturulma: ${new Date().toISOString()}`]);
readme.addRow([""]);
readme.addRow(["Bu dosya yalnızca doğrulanmış 1:1 ürün eşleşmelerini içerir."]);
readme.addRow(["Önceki geniş rapordaki +%100+ farklar: aynı ölçüdeki FARKLI ürünler (servis bankosu,"]);
readme.addRow(["bulaşık sıyırma, tek evyeli dolaplı vb.) 'taban raflı' anahtar kelimesiyle gruplanmıştı."]);
readme.addRow([""]);
readme.addRow([`Kesin eşleşme: ${kesin.length} çift | Yakın: ${pairs.length - kesin.length} çift`]);
readme.addRow([`Kesin çiftlerde ortalama: Pimak ₺${Math.round(avgP).toLocaleString("tr-TR")} · Equsto ₺${Math.round(avgE).toLocaleString("tr-TR")}`]);
readme.addRow([`Pimak daha ucuz: ${kesin.filter((x) => x.farkTl > 0).length} · Equsto daha ucuz: ${kesin.filter((x) => x.farkTl < 0).length}`]);

const sheet = wb.addWorksheet("Eslesen_1e1");
sheet.columns = [
  { header: "Güven", key: "guven", width: 8 },
  { header: "Varyant", key: "tip", width: 32 },
  { header: "Ölçü", key: "dim", width: 16 },
  { header: "Pimak SKU", key: "pimakSku", width: 18 },
  { header: "Pimak adı", key: "pimakName", width: 42 },
  { header: "Pimak ₺ KDV dahil", key: "pimakFiyat", width: 16 },
  { header: "Pimak liste €", key: "pimakListeEur", width: 12 },
  { header: "Equsto SKU", key: "equstoSku", width: 20 },
  { header: "Equsto adı", key: "equstoName", width: 42 },
  { header: "Equsto ₺ KDV dahil", key: "equstoFiyat", width: 16 },
  { header: "Fark ₺ (Equsto−Pimak)", key: "farkTl", width: 18 },
  { header: "Fark %", key: "farkPct", width: 10 },
  { header: "Daha ucuz", key: "ucuzMarka", width: 10 },
  { header: "Eşleşme notu", key: "eslesmeNotu", width: 36 },
];
sheet.getRow(1).font = { bold: true };
for (const row of pairs) sheet.addRow(row);

const noSheet = wb.addWorksheet("Pimak_eslesmeyen");
noSheet.columns = [
  { header: "Pimak SKU", key: "pimakSku", width: 18 },
  { header: "Sonek", key: "suffix", width: 8 },
  { header: "Ölçü", key: "dim", width: 16 },
  { header: "Pimak adı", key: "pimakName", width: 42 },
  { header: "Pimak ₺", key: "pimakFiyat", width: 12 },
  { header: "Sebep", key: "sebep", width: 70 },
  { header: "Beklenen Equsto", key: "beklenenEqusto", width: 20 },
];
noSheet.getRow(1).font = { bold: true };
for (const row of noEqusto) noSheet.addRow(row);

const errSheet = wb.addWorksheet("Eski_hatali_ornek");
errSheet.columns = [
  { header: "Pimak SKU", key: "pimakSku", width: 18 },
  { header: "Doğru Equsto", key: "dogruEqusto", width: 18 },
  { header: "Doğru ₺", key: "dogruFiyat", width: 12 },
  { header: "Yanlış eşleşen", key: "yanlisEqusto", width: 18 },
  { header: "Yanlış ürün adı", key: "yanlisAd", width: 50 },
  { header: "Yanlış ₺", key: "yanlisFiyat", width: 12 },
  { header: "Açıklama", key: "aciklama", width: 50 },
];
errSheet.getRow(1).font = { bold: true };
for (const row of wrongOldExamples) errSheet.addRow(row);

const mapSheet = wb.addWorksheet("Esleme_tablosu");
mapSheet.columns = [
  { header: "Pimak sonek", key: "suf", width: 10 },
  { header: "Equsto seri", key: "series", width: 12 },
  { header: "Pimak tip", key: "tip", width: 36 },
  { header: "Equsto tip", key: "equstoTip", width: 42 },
  { header: "Güven", key: "guven", width: 8 },
];
mapSheet.getRow(1).font = { bold: true };
for (const [suf, m] of Object.entries(VERIFIED_MAP)) {
  mapSheet.addRow({ suf: `.${suf}`, series: m.series, tip: m.tip, equstoTip: m.equstoTip, guven: m.guven });
}
for (const [suf, note] of Object.entries(NO_MATCH)) {
  mapSheet.addRow({ suf: `.${suf}`, series: "—", tip: note.slice(0, 80), equstoTip: "Eşleştirme yok", guven: "hariç" });
}

const ozet120 = wb.addWorksheet("Ozet_120x70");
ozet120.columns = [
  { header: "Tip", key: "tip", width: 40 },
  { header: "Pimak SKU", key: "pimakSku", width: 18 },
  { header: "Pimak ₺", key: "pimakFiyat", width: 14 },
  { header: "Pimak liste €", key: "pimakListeEur", width: 12 },
  { header: "Equsto SKU", key: "equstoSku", width: 20 },
  { header: "Equsto ₺", key: "equstoFiyat", width: 14 },
  { header: "Fark %", key: "farkPct", width: 10 },
  { header: "Not", key: "not", width: 50 },
];
ozet120.getRow(1).font = { bold: true };
const mid12070 = "12070";
for (const spec of [
  { suf: "12", label: "Çift evyeli taban rafsız" },
  { suf: "14", label: "Çift evyeli taban raflı (yakın: dolaplı KCEVD02)" },
  { suf: "11", label: "Tek evyeli taban raflı (Equsto açık karşılık yok)" },
  { suf: "17", label: "Üç evyeli (Equsto karşılık yok)" },
]) {
  const pim = pimak.find((r) => String(r.sku).toUpperCase() === `PIMAK.${mid12070}.${spec.suf}`);
  const map = VERIFIED_MAP[spec.suf];
  const eq = map ? findEqusto(equsto, map.series, mid12070) : null;
  const pF = pim ? fmtTry(pim.fiyat_tl) : null;
  const eF = eq ? fmtTry(eq.fiyat_tl) : null;
  ozet120.addRow({
    tip: spec.label,
    pimakSku: pim?.sku ?? `PIMAK.${mid12070}.${spec.suf}`,
    pimakFiyat: pF,
    pimakListeEur: pim?.liste_fiyati_eur ?? null,
    equstoSku: eq?.sku ?? (map ? `EQ.${map.series}.${mid12070}` : "—"),
    equstoFiyat: eF,
    farkPct: pF && eF ? pctDiff(pF, eF) : null,
    not: map?.not || NO_MATCH[spec.suf] || "",
  });
}
// Equsto çift evyeli dolaplı referans (KCEVD01 rafsız)
for (const eqSku of ["EQ.KCEVT01.12070", "EQ.KCEVD01.12070", "EQ.KCEVD02.12070"]) {
  const eq = equsto.find((r) => String(r.sku).toUpperCase() === eqSku);
  if (!eq) continue;
  ozet120.addRow({
    tip: `Equsto only — ${eq.name?.slice(0, 35) ?? eqSku}`,
    pimakSku: "—",
    pimakFiyat: null,
    pimakListeEur: null,
    equstoSku: eq.sku,
    equstoFiyat: fmtTry(eq.fiyat_tl),
    farkPct: null,
    not: "Karşılaştırma referansı",
  });
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await wb.xlsx.writeFile(OUT);

console.log("[export-tezgah-marka-fiyat-xlsx] OK");
console.log("  Dosya:", OUT);
console.log("  1:1 eşleşen:", pairs.length, `(kesin: ${kesin.length})`);
console.log("  Pimak eşleşmeyen:", noEqusto.length);
console.log("  Kesin çiftler — Pimak ucuz:", kesin.filter((x) => x.farkTl > 0).length, "| Equsto ucuz:", kesin.filter((x) => x.farkTl < 0).length);
console.log("  Kesin çiftler ort fark %:", Math.round(kesin.reduce((s, x) => s + Math.abs(x.farkPct), 0) / kesin.length * 10) / 10);
