/**
 * PFOS referans listelerinden mutfak bölümü × konsept × ekipman korpusu üretir.
 * Claude liste analizi ve konsept eşleştirmede bağlam olarak kullanılır.
 * Kullanım: node scripts/build-pfos-mutfak-korpus.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const REF_DIR = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");
const PROJE_AKIS = path.join(SITE, "public", "data", "proje-akis.json");
const OUT = path.join(SITE, "public", "data", "pfos-mutfak-korpus.json");

const EKIPMAN_TIP_PATTERNS = [
  ["izgara", /\bizgar/i],
  ["ocak", /\bocak|\bkuzine|\bsac\s*tava/i],
  ["fritoz", /\bfrit/i],
  ["firin", /\bfırın|\bfirin|\btaş\s*taban/i],
  ["buzdolabi", /\bbuzdolab|\bsoğutucu|\bşok\s*dondur|\bdondurucu/i],
  ["soguk_oda", /\bsoğuk\s*oda|\bpanel\s*tip/i],
  ["bulasik", /\bbulaşık|\bgiyotin|\bbardak\s*yık/i],
  ["tezgah", /\btezgah|\bçalışma\s*tez/i],
  ["raf", /\braf|\betajer|\bi̇stif/i],
  ["davlumbaz", /\bdavlumbaz|\baspirat/i],
  ["hamur", /\bhamur|\byoğurma/i],
  ["kesim", /\bdoğrama|\bkıyma|\bet\s*kütüğü/i],
  ["bar", /\bbar\b|\bblender|\bçay\s*ocağı|\bşerbetlik/i],
  ["pasta", /\bpasta|\bteşhir|\bbain\s*marie/i],
  ["yikama", /\bön\s*yıkama|\bsprey\s*duş|\bkuvet/i],
  ["cop", /\bçöp\s*arabası/i],
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function ekipmanTipi(ad) {
  const s = String(ad || "");
  for (const [tip, re] of EKIPMAN_TIP_PATTERNS) {
    if (re.test(s)) return tip;
  }
  return "diger";
}

function normBolum(k) {
  return String(k.bolumAd || k.bolum || "GENEL")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function shopMetaByMotor() {
  const out = new Map();
  try {
    const raw = readJson(PROJE_AKIS);
    const data = raw.data ?? raw;
    for (const t of data.shopTypes ?? []) {
      const slug = t.pfos?.motorSlug;
      if (!slug) continue;
      out.set(slug, {
        label: t.name || slug,
        parent: t.parent || "",
        dukkanSecim: t.pfos?.dukkanSecim || t.name || "",
        desc: t.desc || "",
      });
    }
  } catch {
    /* */
  }
  try {
    const manifest = readJson(MANIFEST);
    for (const k of manifest.kategoriler ?? []) {
      if (out.has(k.id)) continue;
      out.set(k.id, {
        label: k.label || k.id,
        parent: k.ustKategori || "",
        dukkanSecim: k.label || k.id,
        desc: "",
      });
    }
  } catch {
    /* */
  }
  return out;
}

function main() {
  const shopMeta = shopMetaByMotor();
  const files = fs
    .readdirSync(REF_DIR)
    .filter((f) => f.endsWith(".json") && !f.includes("backup"));

  const konseptler = [];
  const bolumIndex = new Map();

  for (const file of files) {
    const liste = readJson(path.join(REF_DIR, file));
    if (!Array.isArray(liste.kalemler) || !liste.kalemler.length) continue;
    const motorSlug = liste.kategoriId || file.split("-")[0];
    const meta = shopMeta.get(motorSlug) || {
      label: motorSlug,
      parent: "",
      dukkanSecim: motorSlug,
      desc: "",
    };

    const bolumMap = new Map();
    for (const k of liste.kalemler) {
      const bolum = normBolum(k);
      if (!bolumMap.has(bolum)) {
        bolumMap.set(bolum, {
          bolum,
          kalemSayisi: 0,
          toplamAdet: 0,
          ekipmanTipleri: new Set(),
          ornekKalemler: [],
        });
      }
      const row = bolumMap.get(bolum);
      row.kalemSayisi += 1;
      row.toplamAdet += typeof k.adet === "number" ? k.adet : 1;
      const tip = ekipmanTipi(k.ad);
      row.ekipmanTipleri.add(tip);
      if (row.ornekKalemler.length < 6) row.ornekKalemler.push(k.ad);

      if (!bolumIndex.has(bolum)) {
        bolumIndex.set(bolum, {
          bolum,
          konseptler: new Set(),
          ekipmanTipleri: new Set(),
          ornekKalemler: [],
        });
      }
      const bi = bolumIndex.get(bolum);
      bi.konseptler.add(motorSlug);
      bi.ekipmanTipleri.add(tip);
      if (bi.ornekKalemler.length < 8) bi.ornekKalemler.push(k.ad);
    }

    const bolumler = [...bolumMap.values()]
      .map((b) => ({
        bolum: b.bolum,
        kalemSayisi: b.kalemSayisi,
        toplamAdet: b.toplamAdet,
        ekipmanTipleri: [...b.ekipmanTipleri].sort(),
        ornekKalemler: b.ornekKalemler,
      }))
      .sort((a, c) => c.kalemSayisi - a.kalemSayisi);

    konseptler.push({
      motorSlug,
      label: meta.label,
      ustSegment: meta.parent,
      dukkanSecim: meta.dukkanSecim,
      desc: meta.desc,
      kaynakDosya: liste.kaynakDosya || file,
      bantId: liste.bantId,
      kalemSayisi: liste.kalemSayisi ?? liste.kalemler.length,
      bolumler,
    });
  }

  konseptler.sort((a, b) => a.label.localeCompare(b.label, "tr"));

  const bolumSozlugu = [...bolumIndex.values()]
    .map((b) => ({
      bolum: b.bolum,
      konseptler: [...b.konseptler].sort(),
      ekipmanTipleri: [...b.ekipmanTipleri].sort(),
      ornekKalemler: b.ornekKalemler,
    }))
    .sort((a, b) => b.konseptler.length - a.konseptler.length);

  const payload = {
    version: 1,
    updated_at: new Date().toISOString(),
    konseptSayisi: konseptler.length,
    bolumSayisi: bolumSozlugu.length,
    konseptler,
    bolumSozlugu,
  };

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("OK", OUT, konseptler.length, "konsept,", bolumSozlugu.length, "bölüm");
}

main();
