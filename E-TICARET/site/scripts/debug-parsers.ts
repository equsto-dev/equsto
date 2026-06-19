import { 
  parseTabularProformaWorksheet, 
  parseColumnarProformaWorksheet, 
  parseProformaExcelWorksheet 
} from "../lib/pfos/liste-proforma-excel";
import { parseEkipmanWorksheet } from "../lib/pfos/kategoriler/parse-ekipman-xlsx";
import ExcelJS from "exceljs";
import { db } from "../lib/db";

async function main() {
  const xlsxPath = "C:\\D Disk\\EQUSTO-WORK\\PFOS\\veri\\proje-veri\\RESTORAN.xlsx";
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const ws = wb.worksheets[0];
  if (!ws) {
    console.error("No worksheet found!");
    return;
  }

  const tabular = parseTabularProformaWorksheet(ws);
  const columnar = parseColumnarProformaWorksheet(ws);
  const excel = parseProformaExcelWorksheet(ws);
  const ekipman = parseEkipmanWorksheet(ws);

  const scoreFunc = (rows: any[]) => {
    const validOlcuCount = rows.filter((r) => r.olcu && r.olcu !== "—").length;
    const validAdetCount = rows.filter((r) => r.adet && r.adet > 1).length;
    return rows.length + validOlcuCount * 5 + validAdetCount * 2;
  };

  console.log(`parseTabularProformaWorksheet returned: ${tabular.length} rows, score: ${scoreFunc(tabular)}`);
  console.log(`parseColumnarProformaWorksheet returned: ${columnar.length} rows, score: ${scoreFunc(columnar)}`);
  console.log(`parseProformaExcelWorksheet returned: ${excel.length} rows, score: ${scoreFunc(excel)}`);
  console.log(`parseEkipmanWorksheet returned: ${ekipman.length} rows, score: ${scoreFunc(ekipman)}`);

  console.log("\n--- Tabular Rows (first 5) ---");
  tabular.slice(0, 5).forEach((r, i) => console.log(i + 1, r));

  console.log("\n--- Excel Rows (first 5) ---");
  excel.slice(0, 5).forEach((r, i) => console.log(i + 1, r));
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
