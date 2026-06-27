import { calculateListeQuote } from "../lib/pfos/liste-fiyat";
import ExcelJS from "exceljs";
import { pickBestProformaRows } from "../lib/pfos/liste-proforma-excel";
import { db } from "../lib/db";

async function main() {
  const xlsxPath =
    "C:\\D Disk\\2023\\2023-014 EDİRNE OTEL DEMİR ŞEF\\2023-014.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("worksheet yok");

  const satirlar = pickBestProformaRows(ws);
  console.log("Parsed rows:", satirlar.length);
  console.log(
    "Mevcut:",
    satirlar.filter((r) => r.mevcut).length,
    "Excel fiyatli:",
    satirlar.filter((r) => (r.birim_fiyat_eur ?? 0) > 0).length,
  );

  const res = await calculateListeQuote({
    satirlar,
    kaynakDosya: "2023-014.xlsx",
    kaynakTip: "excel",
    projeAdi: "2023-014",
    sehir: "İstanbul",
    fiyatStratejisi: "ekonomik",
  });

  console.log("--- Ozet ---");
  console.log(
    "Eslesme:",
    res.ozet.eslesmeSayisi,
    "/",
    res.ozet.zorunluKalemSayisi,
  );
  console.log("Toplam TRY:", res.ozet.toplamFiyat, res.ozet.doviz);
  console.log("Guven:", res.guvenSkoru);

  const zorunlu = res.kalemler.filter((k) => k.tip === "zorunlu");
  for (const k of zorunlu) {
    const fiyat = k.urun?.fiyat ?? 0;
    const sku = k.urun?.sku ?? "-";
    const excel = satirlar.find((s) => s.poz === k.referansPoz)?.birim_fiyat_eur;
    console.log(
      k.referansPoz,
      k.isim.slice(0, 40),
      "| SKU:",
      sku,
      "| TRY:",
      fiyat,
      "| Excel EUR:",
      excel ?? "-",
    );
  }

  const opsiyonel = res.kalemler.filter((k) => k.tip === "opsiyonel");
  console.log("--- Opsiyonel (mevcut) ---");
  for (const k of opsiyonel) {
    console.log(k.referansPoz, k.isim.slice(0, 40));
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
