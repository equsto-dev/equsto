import { calculateListeQuote } from "../lib/pfos/liste-fiyat";
import ExcelJS from "exceljs";
import { pickBestProformaRows } from "../lib/pfos/liste-proforma-excel";
import { db } from "../lib/db";
import { pfosResponseToTeklifV14 } from "../lib/pfos/teklif/map-pfos-response";
import fs from "fs";

async function main() {
  const xlsxPath = "C:\\D Disk\\EQUSTO-WORK\\PFOS\\veri\\proje-veri\\RESTORAN.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  if (!ws) {
    console.error("No worksheet found!");
    return;
  }

  const satirlar = pickBestProformaRows(ws);
  
  const outPath = "C:\\Users\\adema\\.gemini\\antigravity\\brain\\69dd9e5c-c964-4077-969f-ce53728ca4d0\\scratch\\teklif_output.txt";
  const out = fs.createWriteStream(outPath, { encoding: "utf-8" });

  out.write(`Parsed ${satirlar.length} rows from Excel.\n`);

  for (let i = 0; i < satirlar.length; i++) {
    out.write(`Parsed Row ${i + 1}: ${JSON.stringify(satirlar[i])}\n`);
  }

  const res = await calculateListeQuote({
    satirlar,
    kaynakDosya: "RESTORAN.xlsx",
    kaynakTip: "excel",
    projeAdi: "RESTORAN",
    sehir: "İstanbul",
    fiyatStratejisi: "orta",
  });

  out.write("\n--- PFOSResponse Ozet ---\n");
  out.write(`Guven Skoru: ${res.guvenSkoru}\n`);
  out.write(`Toplam Kalem Sayisi: ${res.ozet.toplamKalemSayisi}\n`);
  out.write(`Eşleşme Sayısı: ${res.ozet.eslesmeSayisi}\n`);

  // Map to V14 Teklif
  const teklif = pfosResponseToTeklifV14(res, {
    projeAdi: "RESTORAN",
    musteri: "Muzaffer Bey",
    teslimatAdresi: "İstanbul",
    bolumM2: {},
    eurTry: 53.185,
  });

  out.write("\n--- Teklif V14 Satirlari ---\n");
  for (const s of teklif.satirlar) {
    out.write(`BölümNo: ${s.bolumNo} | BölümBaşlık: ${s.bolumBaslik} | Poz: ${s.poz} | StokNo: ${s.stokNo} | Tanım: ${s.tanim.slice(0, 40)} | Marka: ${s.marka}\n`);
  }
  
  out.end();
  console.log("Written output to teklif_output.txt successfully.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
