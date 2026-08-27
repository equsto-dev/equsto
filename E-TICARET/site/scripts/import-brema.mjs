import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOGUTMA_JSON = path.join(ROOT, "public/data/dept/sogutma.json");
const PLACEHOLDER_IMG_SRC = path.join(ROOT, "public/images/equsto-logo.png");
const PLACEHOLDER_IMG_DEST_DIR = path.join(ROOT, "public/images/catalog/brema");
const PLACEHOLDER_IMG_DEST = path.join(PLACEHOLDER_IMG_DEST_DIR, "placeholder.png");

// Ensure directory exists
if (!fs.existsSync(PLACEHOLDER_IMG_DEST_DIR)) {
  fs.mkdirSync(PLACEHOLDER_IMG_DEST_DIR, { recursive: true });
}
if (fs.existsSync(PLACEHOLDER_IMG_SRC) && !fs.existsSync(PLACEHOLDER_IMG_DEST)) {
  fs.copyFileSync(PLACEHOLDER_IMG_SRC, PLACEHOLDER_IMG_DEST);
}

const EUR_TRY_RATE = 53.0346; // Project current conversion rate in JSON
const DISCOUNT = 0.48; // 48% discount
const VAT = 0.20; // 20% VAT

const bremaProducts = [
  // Page 2
  {
    sku: "BRE-CB184AHC",
    model: "CB 184 A HC",
    name: "Brema CB 184 A HC Küp Buz Makinesi",
    listPriceEur: 1718,
    page: 2,
    specs: {
      "Günlük Kapasite": "23 kg",
      "Depo Kapasitesi": "4 kg",
      "Buz Cinsi": "Küp buz (13 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.26 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "355x404x595 mm",
      "Ağırlık": "27.5 kg",
    },
    elGuc: 0.26,
  },
  {
    sku: "BRE-CB249AHC",
    model: "CB 249 A HC",
    name: "Brema CB 249 A HC Küp Buz Makinesi",
    listPriceEur: 2011,
    page: 2,
    specs: {
      "Günlük Kapasite": "32 kg",
      "Depo Kapasitesi": "9 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.27 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "387x470x692 mm",
      "Ağırlık": "32 kg",
    },
    elGuc: 0.27,
  },
  {
    sku: "BRE-CB416AHC",
    model: "CB 416 A HC",
    name: "Brema CB 416 A HC Küp Buz Makinesi",
    listPriceEur: 2453,
    page: 2,
    specs: {
      "Günlük Kapasite": "44 kg",
      "Depo Kapasitesi": "16 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Güç": "0.45 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "497x592x797 mm",
      "Ağırlık": "43 kg",
    },
    elGuc: 0.45,
  },
  {
    sku: "BRE-CB640AHC",
    model: "CB 640 A HC",
    name: "Brema CB 640 A HC Küp Buz Makinesi",
    listPriceEur: 3472,
    page: 2,
    specs: {
      "Günlük Kapasite": "73 kg",
      "Depo Kapasitesi": "40 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.59 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "735x603x960 mm",
      "Ağırlık": "67 kg",
    },
    elGuc: 0.59,
  },
  // Page 3
  {
    sku: "BRE-CB840AHC",
    model: "CB 840 A HC",
    name: "Brema CB 840 A HC Küp Buz Makinesi",
    listPriceEur: 3758,
    page: 3,
    specs: {
      "Günlük Kapasite": "82 kg",
      "Depo Kapasitesi": "40 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.70 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "735x603x1020 mm",
      "Ağırlık": "71 kg",
    },
    elGuc: 0.70,
  },
  {
    sku: "BRE-CB955AHC",
    model: "CB 955 A HC",
    name: "Brema CB 955 A HC Küp Buz Makinesi",
    listPriceEur: 3970,
    page: 3,
    specs: {
      "Günlük Kapasite": "97 kg",
      "Depo Kapasitesi": "55 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.87 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "735x603x1120 mm",
      "Ağırlık": "74 kg",
    },
    elGuc: 0.87,
  },
  {
    sku: "BRE-CB1565AHC",
    model: "CB 1565 A HC",
    name: "Brema CB 1565 A HC Küp Buz Makinesi",
    listPriceEur: 5439,
    page: 3,
    specs: {
      "Günlük Kapasite": "160 kg",
      "Depo Kapasitesi": "65 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Güç": "1.28 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "840x740x1185 mm",
      "Ağırlık": "118 kg",
    },
    elGuc: 1.28,
  },
  {
    sku: "BRE-C150AHC",
    model: "C 150 A HC",
    name: "Brema C 150 A HC Küp Buz Makinesi",
    listPriceEur: 5050,
    page: 3,
    specs: {
      "Günlük Kapasite": "155 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Güç": "1.06 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "862x555x720 mm",
      "Ağırlık": "110 kg",
      "Uyumlu Hazneler": "BIN 240PE, BIN 200 ve BIN 350 model buz hazneleri ile uyumludur."
    },
    elGuc: 1.06,
  },
  {
    sku: "BRE-C300A",
    model: "C 300 A",
    name: "Brema C 300 A Küp Buz Makinesi",
    listPriceEur: 8427,
    page: 3,
    specs: {
      "Günlük Kapasite": "320 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Güç": "3.00 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "1250x580x848 mm",
      "Ağırlık": "152 kg",
      "Uyumlu Hazneler": "BIN 350 model buz haznesi ile kullanıma uygundur."
    },
    elGuc: 3.00,
  },
  // Page 4 (B-Qube)
  {
    sku: "BRE-CB249AHCBQUBE",
    model: "CB249 A HC B-QUBE",
    name: "Brema CB249 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 2275,
    page: 4,
    specs: {
      "Günlük Kapasite": "32 kg",
      "Depo Kapasitesi": "9 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.27 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "387x470x692 mm",
      "Ağırlık": "32 kg",
    },
    elGuc: 0.27,
  },
  {
    sku: "BRE-CB416AHCBQUBE",
    model: "CB416 A HC B-QUBE",
    name: "Brema CB416 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 2798,
    page: 4,
    specs: {
      "Günlük Kapasite": "44 kg",
      "Depo Kapasitesi": "16 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.45 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "497x592x797 mm",
      "Ağırlık": "43 kg",
    },
    elGuc: 0.45,
  },
  {
    sku: "BRE-CB425AHCBQUBE",
    model: "CB425 A HC B-QUBE",
    name: "Brema CB425 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 2851,
    page: 4,
    specs: {
      "Günlük Kapasite": "54 kg",
      "Depo Kapasitesi": "25 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.45 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "497x592x907 mm",
      "Ağırlık": "46 kg",
    },
    elGuc: 0.45,
  },
  {
    sku: "BRE-CB640AHCBQUBE",
    model: "CB640 A HC B-QUBE",
    name: "Brema CB640 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 3641,
    page: 4,
    specs: {
      "Günlük Kapasite": "73 kg",
      "Depo Kapasitesi": "40 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.59 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "735x603x960 mm",
      "Ağırlık": "67 kg",
    },
    elGuc: 0.59,
  },
  // Page 5
  {
    sku: "BRE-CB840AHCBQUBE",
    model: "CB840 A HC B-QUBE",
    name: "Brema CB840 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 3999,
    page: 5,
    specs: {
      "Günlük Kapasite": "82 kg",
      "Depo Kapasitesi": "40 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.70 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "735x603x1020 mm",
      "Ağırlık": "71 kg",
    },
    elGuc: 0.70,
  },
  {
    sku: "BRE-CB955AHCBQUBE",
    model: "CB955 A HC B-QUBE",
    name: "Brema CB955 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 4162,
    page: 5,
    specs: {
      "Günlük Kapasite": "97 kg",
      "Depo Kapasitesi": "55 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.87 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "738x603x1120 mm",
      "Ağırlık": "74 kg",
    },
    elGuc: 0.87,
  },
  {
    sku: "BRE-CB1565AHCBQUBE",
    model: "CB1565 A HC B-QUBE",
    name: "Brema CB1565 A HC B-QUBE B-Küp Buz Makinesi",
    listPriceEur: 5814,
    page: 5,
    specs: {
      "Günlük Kapasite": "160 kg",
      "Depo Kapasitesi": "65 kg",
      "Buz Cinsi": "B-Küp buz (23 g)",
      "Güç": "1.15 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "840x740x1185 mm",
      "Ağırlık": "118 kg",
    },
    elGuc: 1.15,
  },
  // Page 6 (Hızlı Küp)
  {
    sku: "BRE-VB250AHC",
    model: "VB 250 A HC",
    name: "Brema VB 250 A HC Hızlı Küp Buz Makinesi",
    listPriceEur: 3902,
    page: 6,
    specs: {
      "Günlük Kapasite": "105 kg",
      "Depo Kapasitesi": "35 kg",
      "Buz Cinsi": "Hızlı küp buz (7 g)",
      "Güç": "0.71 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "738x600x1085 mm",
      "Ağırlık": "68.5 kg",
    },
    elGuc: 0.71,
  },
  {
    sku: "BRE-VM350A",
    model: "VM 350 A",
    name: "Brema VM 350 A Hızlı Küp Buz Makinesi",
    listPriceEur: 4603,
    page: 6,
    specs: {
      "Günlük Kapasite": "140 kg",
      "Buz Cinsi": "Hızlı küp buz (7 g)",
      "Güç": "1.40 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "540x544x747 mm",
      "Ağırlık": "73 kg",
      "Uyumlu Hazneler": "BIN 110, BIN 200, BIN 240PE model buz hazneleri ve ID70 dispanseri ile kullanıma uygundur."
    },
    elGuc: 1.40,
  },
  {
    sku: "BRE-VM500A",
    model: "VM 500 A",
    name: "Brema VM 500 A Hızlı Küp Buz Makinesi",
    listPriceEur: 5650,
    page: 6,
    specs: {
      "Günlük Kapasite": "200 kg",
      "Buz Cinsi": "Hızlı küp buz (7 g)",
      "Güç": "1.60 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "770x550x805 mm",
      "Ağırlık": "90 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, BIN 350, DRB 100 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 1.60,
  },
  {
    sku: "BRE-VM900A",
    model: "VM 900 A",
    name: "Brema VM 900 A Hızlı Küp Buz Makinesi",
    listPriceEur: 7462,
    page: 6,
    specs: {
      "Günlük Kapasite": "400 kg",
      "Buz Cinsi": "Hızlı küp buz (7 g)",
      "Güç": "3.00 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "770x550x805 mm",
      "Ağırlık": "113 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, BIN 350, DRB 100 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 3.00,
  },
  {
    sku: "BRE-VM1700A",
    model: "VM 1700 A",
    name: "Brema VM 1700 A Hızlı Küp Buz Makinesi",
    listPriceEur: 14914,
    page: 6,
    specs: {
      "Günlük Kapasite": "770 kg",
      "Buz Cinsi": "Hızlı küp buz (7 g)",
      "Güç": "4.30 kW",
      "Voltaj": "380/400V 3N ~ 50 Hz",
      "Boyutlar": "1250x645x950 mm",
      "Ağırlık": "186 kg",
      "Uyumlu Hazneler": "BIN 350 model buz haznesi ile kullanıma uygundur."
    },
    elGuc: 4.30,
  },
  // Page 7 (Kar Buz)
  {
    sku: "BRE-GB902AHC",
    model: "GB 902 A HC",
    name: "Brema GB 902 A HC Kar Buz Makinesi",
    listPriceEur: 4443,
    page: 7,
    specs: {
      "Günlük Kapasite": "125 kg",
      "Depo Kapasitesi": "20 kg",
      "Güç": "0.47 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "500x660x800 mm",
      "Ağırlık": "59 kg",
    },
    elGuc: 0.47,
  },
  {
    sku: "BRE-GB1540AHC",
    model: "GB 1540 A HC",
    name: "Brema GB 1540 A HC Kar Buz Makinesi",
    listPriceEur: 5334,
    page: 7,
    specs: {
      "Günlük Kapasite": "175 kg",
      "Depo Kapasitesi": "40 kg",
      "Güç": "0.70 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "738x690x1030 mm",
      "Ağırlık": "85 kg",
    },
    elGuc: 0.70,
  },
  {
    sku: "BRE-G160AHC",
    model: "G 160 A HC",
    name: "Brema G 160 A HC Kar Buz Makinesi",
    listPriceEur: 5369,
    page: 7,
    specs: {
      "Günlük Kapasite": "170 kg",
      "Güç": "0.83 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "560x569x600 mm",
      "Ağırlık": "63 kg",
      "Uyumlu Hazneler": "BIN 240PE, BIN 110, BIN 200 ve RB 100 model buz hazneleri ile uyumludur."
    },
    elGuc: 0.83,
  },
  {
    sku: "BRE-G280AHC",
    model: "G 280 A HC",
    name: "Brema G 280 A HC Kar Buz Makinesi",
    listPriceEur: 7200,
    page: 7,
    specs: {
      "Günlük Kapasite": "300 kg",
      "Güç": "1.10 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "560x569x695 mm",
      "Ağırlık": "83 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, BIN 350, DRB 100, BIN 110, RB 100 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 1.10,
  },
  {
    sku: "BRE-G510A",
    model: "G 510 A",
    name: "Brema G 510 A Kar Buz Makinesi",
    listPriceEur: 8728,
    page: 7,
    specs: {
      "Günlük Kapasite": "500 kg",
      "Güç": "1.40 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "560x569x695 mm",
      "Ağırlık": "102 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, BIN 350, BIN 110, RB 100, BIN 550 V DS, DRB 100/500/1200 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 1.40,
  },
  {
    sku: "BRE-G1000A",
    model: "G 1000 A",
    name: "Brema G 1000 A Kar Buz Makinesi",
    listPriceEur: 18407,
    page: 7,
    specs: {
      "Günlük Kapasite": "1000 kg",
      "Güç": "3.20 kW",
      "Voltaj": "380/400V 3N ~ 50 Hz",
      "Boyutlar": "934x684x700 mm",
      "Ağırlık": "167 kg",
      "Uyumlu Hazneler": "BIN 550 V DS, DRB 500/1200 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 3.20,
  },
  // Page 8 (Granül)
  {
    sku: "BRE-TB852AHC",
    model: "TB 852 A HC",
    name: "Brema TB 852 A HC Granül Buz Makinesi",
    listPriceEur: 4594,
    page: 8,
    specs: {
      "Günlük Kapasite": "105 kg",
      "Depo Kapasitesi": "20 kg",
      "Buz Ölçüsü": "Granül buz ölçüsü: 8x16x7 mm",
      "Güç": "0.44 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "500x660x800 mm",
      "Ağırlık": "59 kg",
    },
    elGuc: 0.44,
  },
  {
    sku: "BRE-TB1404AHC",
    model: "TB 1404 A HC",
    name: "Brema TB 1404 A HC Granül Buz Makinesi",
    listPriceEur: 5311,
    page: 8,
    specs: {
      "Günlük Kapasite": "153 kg",
      "Depo Kapasitesi": "40 kg",
      "Buz Ölçüsü": "Granül buz ölçüsü: 8x16x7 mm",
      "Güç": "0.72 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "738x690x962 mm",
      "Ağırlık": "90 kg",
    },
    elGuc: 0.72,
  },
  {
    sku: "BRE-TM250AHC",
    model: "TM 250 A HC",
    name: "Brema TM 250 A HC Granül Buz Makinesi",
    listPriceEur: 7797,
    page: 8,
    specs: {
      "Günlük Kapasite": "260 kg",
      "Buz Ölçüsü": "Granül buz ölçüsü: 13x18x13 mm",
      "Güç": "1.04 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "560x569x695 mm",
      "Ağırlık": "83 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, BIN 350, DRB 100, BIN 110, RB 100 model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 1.04,
  },
  {
    sku: "BRE-TM450AHC",
    model: "TM 450 A HC",
    name: "Brema TM 450 A HC Granül Buz Makinesi",
    listPriceEur: 8996,
    page: 8,
    specs: {
      "Günlük Kapasite": "420 kg",
      "Buz Ölçüsü": "Granül buz ölçüsü: 16.5x18x11 mm",
      "Güç": "1.42 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "560x569x695 mm",
      "Ağırlık": "102 kg",
      "Uyumlu Hazneler": "BIN 200, BIN 240PE, DRB 100/500/1200, BIN 110, RB 100, BIN 350, BIN 550 V DS model buz hazneleri ile kullanıma uygundur."
    },
    elGuc: 1.42,
  },
  // Page 9 (Dispenser & Gömme)
  {
    sku: "BRE-FRESHMAKERA",
    model: "FRESH MAKER A",
    name: "Brema FRESH MAKER A Küp Buz Makinesi ve Su Dispenseri",
    listPriceEur: 2821,
    page: 9,
    specs: {
      "Günlük Kapasite": "25 kg",
      "Depo Kapasitesi": "4 kg",
      "Buz Cinsi": "Küp buz (13 g)",
      "Güç": "0.32 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "540x430x440 mm",
      "Ağırlık": "37.5 kg",
    },
    elGuc: 0.32,
  },
  {
    sku: "BRE-IC18AHC",
    model: "IC 18 A HC",
    name: "Brema IC 18 A HC Gömme Küp Buz Makinesi",
    listPriceEur: 2446,
    page: 9,
    specs: {
      "Günlük Kapasite": "25 kg",
      "Depo Kapasitesi": "4 kg",
      "Buz Cinsi": "Küp buz (13 g)",
      "Gömme": "Gömme için uygundur",
      "Güç": "0.24 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "540x430x475 mm",
      "Ağırlık": "32.5 kg",
    },
    elGuc: 0.24,
  },
  {
    sku: "BRE-IC24AHC",
    model: "IC 24 A HC",
    name: "Brema IC 24 A HC Gömme Küp Buz Makinesi",
    listPriceEur: 2925,
    page: 9,
    specs: {
      "Günlük Kapasite": "30 kg",
      "Depo Kapasitesi": "6 kg",
      "Buz Cinsi": "Küp buz (18 g)",
      "Gömme": "Gömme için uygundur",
      "Güç": "0.28 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "595x510x507 mm",
      "Ağırlık": "38 kg",
    },
    elGuc: 0.28,
  },
  {
    sku: "BRE-HIKU26AHC",
    model: "HIKU 26 A HC",
    name: "Brema HIKU 26 A HC Küp Buz Makinesi Dispenseri",
    listPriceEur: 3681,
    page: 9,
    specs: {
      "Günlük Kapasite": "25 kg",
      "Depo Kapasitesi": "7 kg",
      "Buz Cinsi": "Küp buz (13 g)",
      "Temizleme": "Otomatik temizleme sistemi",
      "Güç": "0.29 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "395x530x790 mm",
      "Ağırlık": "41 kg",
    },
    elGuc: 0.29,
  },
  {
    sku: "BRE-DSS42A",
    model: "DSS 42 A",
    name: "Brema DSS 42 A Küp Buz Makinesi Dispenseri",
    listPriceEur: 4255,
    page: 9,
    specs: {
      "Günlük Kapasite": "48 kg",
      "Depo Kapasitesi": "12 kg",
      "Buz Cinsi": "Küp buz (13 g)",
      "Güç": "0.46 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "500x630x920 mm",
      "Ağırlık": "66 kg",
    },
    elGuc: 0.46,
  },
  {
    sku: "BRE-BSFA",
    model: "BSF A",
    name: "Brema BSF A Granül Buz Makinesi Dispenseri",
    listPriceEur: 6815,
    page: 9,
    specs: {
      "Günlük Kapasite": "105 kg",
      "Depo Kapasitesi": "5 kg",
      "Buz Ölçüsü": "Granül buz ölçüsü: 8x16x7 mm",
      "Güç": "0.44 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "396x708x871 mm",
      "Ağırlık": "61 kg",
    },
    elGuc: 0.44,
  },
  // Page 10 (Dispenser & Hazne)
  {
    sku: "BRE-ID70",
    model: "ID 70",
    name: "Brema ID 70 Buz Dispenseri",
    listPriceEur: 4861,
    page: 10,
    specs: {
      "Depo Kapasitesi": "21 kg",
      "Buz Cinsi": "7gr veya 13x18x13 mm",
      "Güç": "0.24 kW",
      "Voltaj": "220/230V 1N ~ 50 Hz",
      "Boyutlar": "568x800x817 mm",
      "Ağırlık": "58 kg",
      "Uyumlu Makineler": "VM 350 ve TM 250 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0.24,
  },
  {
    sku: "BRE-BIN110",
    model: "BIN 110",
    name: "Brema BIN 110 Buz Haznesi",
    listPriceEur: 2125,
    page: 10,
    specs: {
      "Hazne Kapasitesi": "100 kg",
      "Boyutlar": "560x815x1100 mm",
      "Ağırlık": "53 kg",
      "Uyumlu Makineler": "VM 350, G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-BIN200",
    model: "BIN 200",
    name: "Brema BIN 200 Buz Haznesi",
    listPriceEur: 2343,
    page: 10,
    specs: {
      "Hazne Kapasitesi": "200 kg",
      "Boyutlar": "870x790x1100 mm",
      "Ağırlık": "74 kg",
      "Uyumlu Makineler": "VM 350/500/900, G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-BIN240PE",
    model: "BIN 240 PE",
    name: "Brema BIN 240 PE Buz Haznesi",
    listPriceEur: 2229,
    page: 10,
    specs: {
      "Hazne Kapasitesi": "180 kg",
      "Boyutlar": "942x795x1153 mm",
      "Ağırlık": "64 kg",
      "Uyumlu Makineler": "VM 350/500/900, G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-BIN350",
    model: "BIN 350",
    name: "Brema BIN 350 Buz Haznesi",
    listPriceEur: 3411,
    page: 10,
    specs: {
      "Hazne Kapasitesi": "350 kg",
      "Boyutlar": "1250x790x1100 mm",
      "Ağırlık": "105 kg",
      "Uyumlu Makineler": "C 300, VM 500/900/1700, G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  // Page 11
  {
    sku: "BRE-RB100",
    model: "RB 100",
    name: "Brema RB 100 Buz Haznesi",
    listPriceEur: 6068,
    page: 11,
    specs: {
      "Araba Kapasitesi": "108 kg",
      "Hazne Kapasitesi": "17 kg",
      "Boyutlar": "795x1060x1284 mm",
      "Ağırlık": "64 kg",
      "Uyumlu Makineler": "G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-DRB100",
    model: "DRB 100",
    name: "Brema DRB 100 Buz Haznesi",
    listPriceEur: 9597,
    page: 11,
    specs: {
      "Araba Kapasitesi": "108 kg x 2",
      "Hazne Kapasitesi": "50 kg",
      "Boyutlar": "1560x1060x1484 mm",
      "Ağırlık": "135 kg",
      "Uyumlu Makineler": "VM 500/900, G 280/510, TM 250/450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-DRB500",
    model: "DRB 500",
    name: "Brema DRB 500 Buz Haznesi",
    listPriceEur: 16691,
    page: 11,
    specs: {
      "Araba Kapasitesi": "108 kg x 2",
      "Hazne Kapasitesi": "300 kg",
      "Boyutlar": "1560x1330x1810 mm",
      "Ağırlık": "204 kg",
      "Uyumlu Makineler": "G 510, G 1000, TM 450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-DRB1200",
    model: "DRB 1200",
    name: "Brema DRB 1200 Buz Haznesi",
    listPriceEur: 20383,
    page: 11,
    specs: {
      "Araba Kapasitesi": "108 kg x 2",
      "Hazne Kapasitesi": "1.000 kg",
      "Boyutlar": "1560x1330x2460 mm",
      "Ağırlık": "251 kg",
      "Uyumlu Makineler": "G 510, G 1000, TM 450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  },
  {
    sku: "BRE-BIN550VDS",
    model: "BIN 550 V DS",
    name: "Brema BIN 550 V DS Buz Haznesi",
    listPriceEur: 11882,
    page: 11,
    specs: {
      "Hazne Kapasitesi": "550 kg",
      "Boyutlar": "1110x1060x1915 mm",
      "Ağırlık": "163 kg",
      "Uyumlu Makineler": "G 510, G 1000, TM 450 model buz makineleri ile kullanıma uygundur."
    },
    elGuc: 0,
  }
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

function processImport() {
  console.log("Reading existing sogutma.json...");
  let currentProducts = [];
  if (fs.existsSync(SOGUTMA_JSON)) {
    currentProducts = JSON.parse(fs.readFileSync(SOGUTMA_JSON, "utf8"));
  }

  const brandName = "Krom Mutfak San. Tic. A.Ş.";
  const oemBrand = "Brema";
  
  // Filter out any existing Brema products to prevent duplication
  currentProducts = currentProducts.filter(p => p.brand !== brandName && p.oem_brand !== oemBrand);

  console.log(`Adding ${bremaProducts.length} Brema products with 48% discount...`);
  
  for (const item of bremaProducts) {
    const listPrice = item.listPriceEur;
    const discountVal = DISCOUNT;
    const salePriceEur = Math.round(listPrice * (1 - discountVal) * 100) / 100;
    const priceTlNet = Math.round(salePriceEur * EUR_TRY_RATE);
    const priceTlWithVat = Math.round(priceTlNet * (1 + VAT));
    
    const slug = slugify(`brema-${item.model}`);
    const id = `${slugify(brandName)}__${slugify(item.sku)}`;
    
    // Construct specs string
    let specsText = `${item.name}\n\n`;
    specsText += `Ürün kodu: ${item.sku}\n`;
    specsText += `Liste fiyatı (EUR): ${listPrice}\n`;
    specsText += `Bayi iskonto: %${DISCOUNT * 100} (ödeme çarpanı ${1 - DISCOUNT})\n`;
    specsText += `Equsto satış (EUR): ${salePriceEur}\n`;
    specsText += `Hesap: liste × (1 − bayi iskonto)\n`;
    specsText += `Equsto satış (TL, KDV dahil): ₺${priceTlWithVat.toLocaleString("tr-TR")},00\n`;
    specsText += `Kur: 1 EUR = ${EUR_TRY_RATE} TRY (KDV %${VAT * 100})\n`;
    specsText += `Kategori: BUZ MAKİNELERİ\n`;
    specsText += `Kaynak: Brema Fiyat Listesi 2026\n\n`;
    specsText += `Teknik Özellikler\n`;
    
    const techSpecsArr = [];
    const olculerObj = {};
    
    for (const [key, value] of Object.entries(item.specs)) {
      specsText += `${key}: ${value}\n`;
      techSpecsArr.push(`${key}: ${value}`);
      
      // Attempt to extract dimensions and weight/volume
      if (key.toLowerCase().includes("boyut")) {
        olculerObj.boyutlar = value;
      }
      if (key.toLowerCase().includes("ağırlık")) {
        olculerObj.agirlik = value;
      }
    }
    
    if (item.elGuc > 0) {
      olculerObj.guc_kw = item.elGuc.toString();
    }
    
    specsText += `Katalog sayfası: ${item.page}`;
    techSpecsArr.push(`Katalog sayfası: ${item.page}`);

    const productJson = {
      category: "buz-makineleri",
      brand: brandName,
      name: item.name.toUpperCase(),
      price: `₺${priceTlWithVat.toLocaleString("tr-TR")},00 KDV dahil`,
      specs: specsText,
      aciklama: `${item.name.toUpperCase()}\n\nKategori: BUZ MAKİNELERİ`,
      teknik_ozellikler: techSpecsArr,
      olculer: Object.keys(olculerObj).length > 0 ? olculerObj : null,
      keywords: [
        brandName,
        oemBrand,
        item.sku,
        "BUZ MAKİNELERİ",
        "buz-makineleri",
        item.model,
        item.name,
      ],
      images: [
        "images/catalog/brema/placeholder.png"
      ],
      sku: item.sku,
      model: item.model,
      liste_fiyati: listPrice,
      liste_fiyati_eur: listPrice,
      liste_fiyati_tl: null,
      alis_fiyati: salePriceEur,
      alis_fiyati_eur: salePriceEur,
      alis_fiyati_tl: null,
      satis_fiyati_eur: salePriceEur,
      satis_fiyati_tl: null,
      satis_eur_indirimli: salePriceEur,
      iskontolu_fiyat: salePriceEur,
      bayi_iskonto: DISCOUNT,
      odeme_carpani: 1 - DISCOUNT,
      iskonto_yuzde: DISCOUNT * 100,
      iskonto_oran: DISCOUNT * 100,
      para_birimi: "EUR",
      fiyat_kaynagi: "brema-fiyat-listesi-2026",
      stok_no: item.sku,
      kur_eur_try: EUR_TRY_RATE,
      fiyat_tl_net: priceTlNet,
      fiyat_tl: priceTlWithVat,
      kdv_oran: VAT * 100,
      kaynak: "brema-fiyat-listesi-2026",
      kaynak_fiyat_listesi: "brema-fiyat-listesi-2026",
      dept: "sogutma",
      vitrin_arka_plan: false,
      id: id,
      urun_kodu: item.sku,
      barkod: "",
      pdf_eslesme: true,
      pdf_sayfalar: [item.page],
      oem_brand: oemBrand
    };

    currentProducts.push(productJson);
  }

  console.log(`Writing updated sogutma.json (Total products: ${currentProducts.length})...`);
  fs.writeFileSync(SOGUTMA_JSON, JSON.stringify(currentProducts, null, 2), "utf8");
  console.log("Import successfully written to public/data/dept/sogutma.json");
}

processImport();
