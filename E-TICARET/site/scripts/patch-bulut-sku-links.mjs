/**
 * Bulut mutfak — doğrulanmış poz → SKU override'ları (seed sonrası).
 * Kullanım: node scripts/patch-bulut-sku-links.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const LINKS_PATH = path.join(SITE, "public", "data", "pfos-referans-sku-links.json");
const REF_DIR = path.join(SITE, "public", "data", "pfos-referans");

const content = JSON.parse(fs.readFileSync(LINKS_PATH, "utf8"));
const links = content.links;

function applyLinks(listeKeys, pozMap) {
  for (const liste of listeKeys) {
    for (const [poz, item] of Object.entries(pozMap)) {
      links[`${liste}|${poz}`] = item;
    }
  }
}

function unlinkPoz(listeKeys, pozList) {
  for (const liste of listeKeys) {
    for (const poz of pozList) {
      delete links[`${liste}|${poz}`];
    }
  }
}

function listeKeysFor(kategoriId) {
  const keys = [`${kategoriId}-40-80`, kategoriId];
  if (kategoriId === "bulut-burger") keys.push("bulut-burger-35-100");
  return keys;
}

const deepFreezeC1 = {
  sku: "7919.DF2020.00",
  marka: "Öztiryakiler",
  name: "PANEL TİP DERİN DONDURUCU ODA — DEEP FREEZE PANEL-SPLİT -22/-18 °C 200×200×240 cm",
};

/** PDF C- bölümünde yanlışlıkla "soğuk oda" yazılmış deepfreeze satırları */
for (const file of fs
  .readdirSync(REF_DIR)
  .filter((f) => f.startsWith("bulut-") && f.endsWith("-40-80.json"))) {
  const raw = JSON.parse(fs.readFileSync(path.join(REF_DIR, file), "utf8"));
  const c1 = raw.kalemler?.find((k) => k.poz === "C1");
  if (
    c1?.bolum === "DEEPFREEZE_DEPO" &&
    /so[gğ]uk\s*oda/i.test(String(c1.ad ?? ""))
  ) {
    applyLinks(listeKeysFor(raw.kategoriId), { C1: deepFreezeC1 });
  }
}

const evLinks = {
  C1: deepFreezeC1,
  D2: {
    sku: "EQ.KCT05.13070",
    marka: "Equsto",
    name: "ÇALIŞMA TEZGAHI, ETRAFI AÇIK, TABAN RAFLI, TEK ÇEKMECELİ 1300×700×850 mm",
  },
  D4: {
    sku: "7865.60605.21",
    marka: "Öztiryakiler",
    name: "YER OCAĞI GAZLI ÇİFT YANIŞLI 60×60×50",
  },
  D15: {
    sku: "MT152X",
    marka: "Portashelf",
    name: "TEPSİ TAŞIMA ARABASI 15 KATLI – YÜKSEK",
    fiyat_try: 14395,
  },
};
applyLinks(listeKeysFor("bulut-ev-yemek"), evLinks);

/** Hamburger / döner — ortak pişirme hattı doğrulamaları */
const grillPackLinks = {
  D1: {
    sku: "EQ.KTEVT02.14070",
    marka: "Equsto",
    name: "TEK EVYELİ TEZGAH, ETRAFI AÇIK, TABAN RAFSIZ 1400×700×850 mm",
  },
  D4: {
    sku: "79E3.27NMV.03",
    marka: "Öztiryakiler",
    name: "MAKE-UP TEZGAH TİPİ BUZDOLABI, 3 SIRA ÇEKMECELİ 1400×700×850 mm",
  },
  D6: {
    sku: "7919.10LTS.00",
    marka: "Öztiryakiler",
    name: "SLIM 100 LTS INOX KAPI DERIN DONDURUCU (690×600×850 mm)",
  },
  E4: {
    sku: "EQ.KTEVT02.14070",
    marka: "Equsto",
    name: "TEK EVYELİ TEZGAH, ETRAFI AÇIK, TABAN RAFSIZ 1400×700×850 mm",
  },
};

const setalti4Kapili140 = {
  sku: "7919.47NTV.C1",
  marka: "Öztiryakiler",
  name: "470 NTV CİHAZALTI 4 KAPILI DOLAP 1400×700×600 mm",
};

applyLinks(listeKeysFor("bulut-burger"), {
  ...grillPackLinks,
  D13: setalti4Kapili140,
  D14: {
    sku: "EQ.KDAVOTF02.300100",
    marka: "Equsto",
    name: "DAVLUMBAZ ORTA TİP, FİLTRELİ 3000×1000×600 mm",
  },
});
applyLinks(listeKeysFor("bulut-doner"), {
  ...grillPackLinks,
  D9: {
    sku: "VKM-G4R",
    marka: "Vosco",
    name: "DÖNER OCAĞI, 4 RADYANLI, GAZLI",
  },
  D14: setalti4Kapili140,
  D15: {
    sku: "EQ.KDAVDTF02.30090",
    marka: "Equsto",
    name: "DAVLUMBAZ DUVAR TİPİ, FİLTRELİ 3000×900×600 mm",
  },
});

/** Kebap / balık — geniş duvar davlumbaz */
const duvarDavlumbaz440 = {
  sku: "EQ.KDAVDTF02.30090",
  marka: "Equsto",
  name: "DAVLUMBAZ DUVAR TİPİ, FİLTRELİ 3000×900×600 mm",
};
applyLinks(listeKeysFor("bulut-kebap"), { D11: duvarDavlumbaz440 });
applyLinks(listeKeysFor("bulut-balik"), { D12: duvarDavlumbaz440 });

applyLinks(listeKeysFor("bulut-manti"), {
  D6: {
    sku: "EQ.KDAVDTF02.30090",
    marka: "Equsto",
    name: "DAVLUMBAZ DUVAR TİPİ, FİLTRELİ 3000×900×600 mm",
  },
});

applyLinks(listeKeysFor("bulut-pastane-firin"), {
  D6: {
    sku: "EQ.KDAVDT01.250140",
    marka: "Equsto",
    name: "FİLTRESİZ DAVLUMBAZ, DUVAR TİPİ 2500×1400×600 mm",
  },
});

/** Katalogda net karşılığı olmayan / yanlış otomatik eşleşen pozlar → fiyatsız referans */
const fiyatsizPoz = ["D3", "D10"];
for (const kid of [
  "bulut-pizza",
  "bulut-pide",
  "bulut-pastane-firin",
]) {
  unlinkPoz(listeKeysFor(kid), fiyatsizPoz);
}

const applied = Object.keys(links).filter((k) => k.startsWith("bulut-")).length;
fs.writeFileSync(LINKS_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log(`Bulut SKU overrides applied (${applied} bulut-* link entries)`);
