import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LINKS_PATH = path.join(
  __dirname,
  "..",
  "public",
  "data",
  "pfos-referans-sku-links.json",
);

const content = JSON.parse(fs.readFileSync(LINKS_PATH, "utf8"));
const links = content.links;

const deepFreezeC1 = {
  sku: "7919.DF2020.00",
  marka: "Öztiryakiler",
  name: "PANEL TİP DERİN DONDURUCU ODA — DEEP FREEZE PANEL-SPLİT -22/-18 °C 200×200×240 cm",
};

for (const key of [
  "bulut-burger|C1",
  "bulut-burger-35-100|C1",
  "bulut-burger-40-80|C1",
]) {
  links[key] = deepFreezeC1;
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

for (const liste of ["bulut-ev-yemek-40-80", "bulut-ev-yemek"]) {
  for (const [poz, item] of Object.entries(evLinks)) {
    links[`${liste}|${poz}`] = item;
  }
}

const burgerLinks = {
  D1: {
    sku: "EQ.KTEVT02.14070",
    marka: "Equsto",
    name: "TEK EVYELİ TEZGAH, ETRAFI AÇIK, TABAN RAFSIZ 1400×700×850 mm",
  },
  D4: {
    sku: "79E3.27NMV.03",
    marka: "Öztiryakiler",
    name: "TAG 270 NMV 6 ÇEKMECE YATAY TİP BUZDOLABI (make-up, 3 sıra çekmece, 142×70)",
  },
  D6: {
    sku: "7919.06LMV.00",
    marka: "Öztiryakiler",
    name: "GN 600 LMV TEK KAPI SETALTI DERİN DONDURUCU (60×60 ref.)",
  },
  D13: {
    sku: "7919.27NTV.C1",
    marka: "Öztiryakiler",
    name: "270 NTV CİHAZALTI 2 KAPILI DOLAP (142×70 setaltı)",
  },
  E4: {
    sku: "EQ.KTEVT02.14070",
    marka: "Equsto",
    name: "TEK EVYELİ TEZGAH, ETRAFI AÇIK, TABAN RAFSIZ 1400×700×850 mm",
  },
};

for (const liste of [
  "bulut-burger-40-80",
  "bulut-burger",
  "bulut-burger-35-100",
]) {
  for (const [poz, item] of Object.entries(burgerLinks)) {
    links[`${liste}|${poz}`] = item;
  }
}

fs.writeFileSync(LINKS_PATH, `${JSON.stringify(content, null, 2)}\n`, "utf8");
console.log("Updated bulut SKU links");
