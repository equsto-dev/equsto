import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const LINKS_PATH = path.join(SITE, "public", "data", "pfos-referans-sku-links.json");

const exactLinks = {
  "A1": { "sku": "118.DBE.02", "name": "Senox Dizden Basmalı Evye, Çift Su Girişli, DBE-02" },
  "A2": { "sku": "46-X-152-X-183", "name": "Portashelf 4 Katlı Raf 46×152×183 cm" },
  "B1": { "sku": "7919.CR3020.00", "name": "SOĞUK ODA PANEL-SPLİT TİP, 0/+5 C" },
  "B2": { "sku": "46-X-137-X-183", "name": "Portashelf 4 Katlı Raf 46×137×183 cm" },
  "C1": { "sku": "7919.CR2020.00", "name": "SOĞUK ODA PANEL-SPLİT TİP, 0/+5 C" },
  "C2": { "sku": "46-X-152-X-183", "name": "Portashelf 4 Katlı Raf 46×152×183 cm" },
  "D1": { "sku": "7758.147C8.11", "name": "EVYELİ TEZG.1G/1D SOL 3 PERDELİ TABAN RAFLI 140*70" },
  "D2": { "sku": "79K4.06NMV.00", "name": "GN 600 NMV TEK INOX KAPI DİK TİP BUZDOLABI - K TİP" },
  "D3": { "sku": "EQ.KCT08.16070", "name": "ÇALIŞMA TEZGAHI, ETRAFI AÇIK, TABAN VE ARA RAFLI 1600×700×850 mm" },
  "D4": { "sku": "7919.27NTV.S0", "name": "TAG 270 NTV İKİ INOX KAPILI BUZDOLABI PİZZA HAZIRLIK 142*70" },
  "D5": { "sku": "EQ.KCT04.14070", "name": "ÇALIŞMA TEZGAHI, ETRAFI AÇIK, TABAN RAFLI 1400×700×850 mm" },
  "D6": { "sku": "118.SMF.5120.ST", "name": "Senox SMF-5120 ST Tezgah Altı Derin Dondurucu, Tek Kapılı" },
  "D7": { "sku": "7911.19060.13", "name": "ÇAL.TEZG.DOLAPLI ARA RAFLI 190*60" },
  "D8": { "sku": "7911.16060.13", "name": "ÇAL.TEZG.DOLAPLI ARA RAFLI 160*60" },
  "D9": { "sku": "AGO-870", "name": "Atalay Ocaklar AGO - 870 4 x Ø80 4 x 5 kW" },
  "D10": { "sku": "AEF-870", "name": "Atalay Fritözler AEF - 870 2 x Min. 6 lt. Max 12 lt 800 x 700 x 300" },
  "D11": { "sku": "APD-473", "name": "Atalay Fritözler APD - 473 Yekpare 400 x 730 x 300" },
  "D12": { "sku": "AGI-870", "name": "Atalay Izgaralar AGI - 870 Düz 800x700x300" },
  "D13": { "sku": "7919.47NTV.C1", "name": "470 NTV CİHAZALTI 4 KAPILI DOLAP" },
  "D14": { "sku": "7885.30155.10", "name": "DAVLUMBAZ ORTA TİP FİLTRELİ 300*150" },
  "D15": { "sku": "118.YSO.100", "name": "Senox Yapışkanlı Sinek Öldürücü, YSO 100" },
  "E1": { "sku": "7712.14070.03", "name": "BUL.ALMA TEZGAHI SIYIRMA HUNİLİ 140*70" },
  "E2": { "sku": "7897.14030.31", "name": "DUVAR RAFI SÜZMELİ 140*30" },
  "E3": { "sku": "MB126X", "name": "Portashelf Paslanmaz Çöp Arabası MB126X" },
  "E4": { "sku": "7758.147C8.11", "name": "EVYELİ TEZG.1G/1D SOL 3 PERDELİ TABAN RAFLI 140*70" },
  "E5": { "sku": "075T.11110.AD", "name": "TEZGAHALTI BULASIK YIKAMA MAK. TOUCH OBY 50T PDRT" },
  "E6": { "sku": "7897.14030.30", "name": "DUVAR RAFI 140*30" },
  "E7": { "sku": "46-X-152-X-183", "name": "Portashelf 4 Katlı Raf 46×152×183 cm" },
  "Y1": { "sku": "7960.02929.5Y2", "name": "YER IZGARASI TAVALI KENARDAN SIFONLU SAGDAN CIKISLI Q50 PVC 290*290" }
};

async function main() {
  const content = JSON.parse(fs.readFileSync(LINKS_PATH, "utf8"));
  
  if (!content.links) {
    content.links = {};
  }
  
  // Add both formats: bulut-burger|Poz and bulut-burger-35-100|Poz
  for (const [poz, item] of Object.entries(exactLinks)) {
    content.links[`bulut-burger|${poz}`] = item;
    content.links[`bulut-burger-35-100|${poz}`] = item;
  }
  
  fs.writeFileSync(LINKS_PATH, JSON.stringify(content, null, 2) + "\n", "utf8");
  console.log("Successfully updated public/data/pfos-referans-sku-links.json with exact PDF stock numbers!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
