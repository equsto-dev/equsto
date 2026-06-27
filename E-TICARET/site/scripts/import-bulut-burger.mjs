/**
 * bulut-hamburgerci-referans.xlsx & bulut-burger-35-100.json generator
 * Kullanım: node scripts/import-bulut-burger.mjs
 */
import ExcelJS from "exceljs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const OUT = path.join(SITE, "public", "data", "pfos-referans");
const MANIFEST = path.join(SITE, "public", "data", "pfos-kategoriler.json");

const KATEGORI_ID = "bulut-burger";
const BANT_ID = "35-100";
const XLSX = "bulut-hamburgerci-referans.xlsx";
const REFERANS_M2 = 60;

const kalemler = [
  { bolum: "KURU_DEPO", bolumAd: "A- KURU DEPO", poz: "A1", ad: "DİZDEN KUMANDALI EL YIKAMA LAVABOSU", olcu: "-", adet: 1, kategori: "tezgah" },
  { bolum: "KURU_DEPO", bolumAd: "A- KURU DEPO", poz: "A2", ad: "İSTİF RAFI", olcu: "152*46*160", adet: 2, kategori: "tezgah" },
  { bolum: "SOGUK_ODA", bolumAd: "B- SOĞUK ODA", poz: "B1", ad: "PANEL TİP SOĞUK ODA", olcu: "200*300*240", adet: 1, kategori: "diger" },
  { bolum: "SOGUK_ODA", bolumAd: "B- SOĞUK ODA", poz: "B2", ad: "İSTİF RAFI", olcu: "137*46*160", adet: 2, kategori: "tezgah" },
  { bolum: "DEEPFREEZE_DEPO", bolumAd: "C- DEEPFREEZE DEPO", poz: "C1", ad: "PANEL TİP SOĞUK ODA", olcu: "200*200*240", adet: 1, kategori: "diger" },
  { bolum: "DEEPFREEZE_DEPO", bolumAd: "C- DEEPFREEZE DEPO", poz: "C2", ad: "İSTİF RAFI", olcu: "152*46*160", adet: 2, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D1", ad: "TEK EVİYELİ ÇALIŞMA TEZGAHI", olcu: "140*70*85", adet: 1, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D2", ad: "DEPO TİPİ BUZDOLABI, TEK KAPILI", olcu: "70*85*205", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D3", ad: "ÇALIŞMA TEZGAHI, TABAN VE ARA RAFLI", olcu: "160*70*85", adet: 2, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D4", ad: "MAKE-UP TEZGAH TİPİ BUZDOLABI, 3 SIRA ÇEKMECELİ", olcu: "140*70*85", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D5", ad: "ÇALIŞMA TEZGAHI, TABAN RAFLI", olcu: "140*70*85", adet: 1, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D6", ad: "SET ALTI DEEP FREEZE", olcu: "60*60*85", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D7", ad: "ÇALIŞMA TEZGAHI - DOLAPLI , ARA RAFLI", olcu: "190*60*85", adet: 1, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D8", ad: "ÇALIŞMA TEZGAHI -DOLAPLI , ARA RAFLI", olcu: "170*60*85", adet: 1, kategori: "tezgah" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D9", ad: "4 AÇIK ALEVLİ OCAK, SETÜSTÜ", olcu: "80*70*30", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D10", ad: "FRİTÖZ, İKİ HAZNELİ, ELK. SETÜSTÜ", olcu: "80*70*30", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D11", ad: "PATATES DİNLENDİRME, ELK. SETÜSTÜ", olcu: "40*70*30", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D12", ad: "PLATE IZGARA, DÜZ, GAZLI, SETÜSTÜ", olcu: "80*70*85", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D13", ad: "SETALTI BUZDOLABI, 2 KAPILI", olcu: "140*70*60", adet: 2, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D14", ad: "DAVLUMBAZ, ORTA TİP, FİLTRELİ", olcu: "320*97*50", adet: 1, kategori: "diger" },
  { bolum: "PISIRME", bolumAd: "D- PİŞİRME", poz: "D15", ad: "SİNEK ÖLDÜRÜCÜ", olcu: "-", adet: 1, kategori: "diger" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E1", ad: "BULAŞIK SIYIRMA TEZGAHI", olcu: "140*70*85", adet: 1, kategori: "tezgah" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E2", ad: "BASKET RAFI", olcu: "140*40*60", adet: 1, kategori: "tezgah" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E3", ad: "ÇÖP ARABASI", olcu: "Ø40*50", adet: 1, kategori: "diger" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E4", ad: "TEK EVYELİ ÇALIŞMA TEZGAHI", olcu: "140*70*85", adet: 1, kategori: "tezgah" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E5", ad: "BULAŞIK YIKAMA MAKİNASI", olcu: "500 Tb/saat", adet: 1, kategori: "diger" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E6", ad: "DUVAR RAFI", olcu: "140*30*4", adet: 1, kategori: "tezgah" },
  { bolum: "BULASIK_YIKAMA", bolumAd: "E- BULAŞIK YIKAMA", poz: "E7", ad: "İSTİF RAFI", olcu: "152*46*160", adet: 1, kategori: "tezgah" },
  { bolum: "YER_IZGARASI", bolumAd: "Y- YER IZGARASI", poz: "Y1", ad: "YER IZGARASI", olcu: "30*30*14", adet: 2, kategori: "diger" }
];

async function main() {
  // 1. Generate Excel File
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("HAMBURGERCİ");

  // A1:D2 merged title block
  ws.mergeCells("A1:D2");
  const titleCell = ws.getCell("A1");
  titleCell.value = "HAMBURGERCİ";
  titleCell.font = { name: "Arial", size: 22, bold: true, color: { argb: "FFFF0000" } }; // Red text
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF000000" } // Black background
  };

  // Set heights of title rows
  ws.getRow(1).height = 25;
  ws.getRow(2).height = 25;

  // Header row
  const headerRow = ws.getRow(3);
  headerRow.values = ["P.NO", "ÜRÜN ADI", "ÖLÇÜ", "AD."];
  headerRow.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(3).height = 25;

  ws.columns = [
    { key: "poz", width: 12 },
    { key: "ad", width: 55 },
    { key: "olcu", width: 22 },
    { key: "adet", width: 10 }
  ];

  headerRow.eachCell(c => {
    c.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF333333" } // Dark gray background
    };
    c.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } }
    };
  });

  // Write items and sections
  let curBolum = "";
  let rowIndex = 4;

  for (const item of kalemler) {
    if (item.bolumAd !== curBolum) {
      curBolum = item.bolumAd;
      // Section header row
      ws.mergeCells(`A${rowIndex}:D${rowIndex}`);
      const secCell = ws.getCell(`A${rowIndex}`);
      secCell.value = item.bolumAd;
      secCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      secCell.alignment = { vertical: "middle", horizontal: "center" };
      secCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF444444" } // Gray background
      };
      ws.getRow(rowIndex).height = 25;
      rowIndex++;
    }

    // Write data row
    const row = ws.getRow(rowIndex);
    row.values = [item.poz, item.ad, item.olcu, item.adet];
    row.font = { name: "Arial", size: 10 };
    row.alignment = { vertical: "middle" };
    row.getCell(1).alignment = { horizontal: "center" };
    row.getCell(3).alignment = { horizontal: "center" };
    row.getCell(4).alignment = { horizontal: "center" };

    row.eachCell({ includeEmpty: true }, c => {
      c.border = {
        top: { style: "thin", color: { argb: "FFCCCCCC" } },
        left: { style: "thin", color: { argb: "FFCCCCCC" } },
        bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
        right: { style: "thin", color: { argb: "FFCCCCCC" } }
      };
    });

    ws.getRow(rowIndex).height = 20;
    rowIndex++;
  }

  // Create Excel destination directory if not exists
  const excelDir = path.join(SITE, "..", "..", "PFOS", "veri");
  await fs.mkdir(excelDir, { recursive: true });
  const excelDest = path.join(excelDir, XLSX);
  await wb.xlsx.writeFile(excelDest);
  console.log("Excel saved to:", excelDest);

  // 2. Generate JSON Reference File
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const jsonListe = {
    kategoriId: KATEGORI_ID,
    bantId: BANT_ID,
    label: "Bulut Mutfak - Hamburgerci",
    referansM2: REFERANS_M2,
    kaynakDosya: XLSX,
    yukleme: new Date().toISOString(),
    kalemSayisi: kalemler.length,
    toplamAdet,
    kalemler,
  };

  await fs.mkdir(OUT, { recursive: true });
  const jsonDest = path.join(OUT, `${KATEGORI_ID}-${BANT_ID}.json`);
  await fs.writeFile(jsonDest, JSON.stringify(jsonListe, null, 2), "utf8");
  console.log("JSON saved to:", jsonDest);

  // 3. Update pfos-kategoriler.json manifest
  let manifest = { version: "1", updated_at: new Date().toISOString(), kategoriler: [] };
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
  } catch (_) {
    // New manifest
  }

  const meta = {
    listeDosya: `${KATEGORI_ID}-${BANT_ID}.json`,
    kalemSayisi: jsonListe.kalemSayisi,
    toplamAdet: jsonListe.toplamAdet,
    kaynakDosya: jsonListe.kaynakDosya,
    yukleme: jsonListe.yukleme,
  };

  const kategoriler = Array.isArray(manifest.kategoriler) ? manifest.kategoriler : [];
  const idx = kategoriler.findIndex((k) => k.id === KATEGORI_ID);
  const kayit = {
    id: KATEGORI_ID,
    label: "Hamburgerci",
    ustKategori: "Bulut Mutfak",
    bantlar: [
      {
        id: BANT_ID,
        label: "35–100 m²",
        referansM2: REFERANS_M2,
        meta,
      },
    ],
  };

  if (idx >= 0) {
    kategoriler[idx] = kayit;
  } else {
    kategoriler.push(kayit);
  }

  manifest.kategoriler = kategoriler;
  manifest.updated_at = new Date().toISOString();
  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  console.log("Manifest updated at:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
