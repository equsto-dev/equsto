import ExcelJS from "exceljs";
import { pickBestProformaRows } from "../lib/pfos/liste-proforma-excel";

const xlsxPath =
  "C:\\D Disk\\2023\\2023-014 EDİRNE OTEL DEMİR ŞEF\\2023-014.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  const rows = pickBestProformaRows(ws);
  for (const r of rows) {
    console.log(
      JSON.stringify({
        poz: r.poz,
        ad: r.ad,
        olcu: r.olcu,
        adet: r.adet,
        marka: r.marka,
        mevcut: r.mevcut,
        birim_fiyat_eur: r.birim_fiyat_eur,
        bolumAd: r.bolumAd,
      }),
    );
  }
}

main().catch(console.error);
