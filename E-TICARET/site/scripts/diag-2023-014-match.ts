import ExcelJS from "exceljs";
import { pickBestProformaRows } from "../lib/pfos/liste-proforma-excel";
import { ekipmanToReferansKalemler } from "../lib/pfos/referans/pfos-referans-loader";
import { referansKalemlerToTemplateItems } from "../lib/pfos/referans/build-template-items";
import { matchProductForReferansKalem } from "../lib/pfos/referans/match-referans-kalem";
import { inferUrunTipiFromReferansSatir } from "../lib/pfos/referans/infer-urun-tipi";
import { db } from "../lib/db";

const xlsxPath =
  "C:\\D Disk\\2023\\2023-014 EDİRNE OTEL DEMİR ŞEF\\2023-014.xlsx";

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const rows = pickBestProformaRows(wb.worksheets[0]!);
  const kalemler = ekipmanToReferansKalemler(rows, "upload:2023-014");
  const items = referansKalemlerToTemplateItems(kalemler);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const item = items[i];
    const urunTipi = inferUrunTipiFromReferansSatir({
      bolum: row.bolum,
      bolumAd: row.bolumAd,
      poz: row.poz,
      ad: row.ad,
      olcu: row.olcu,
      adet: row.adet,
    });
    const urun = await matchProductForReferansKalem({
      urunTipi: item?.urunTipi ?? urunTipi,
      fiyatStratejisi: "ekonomik",
      isim: row.ad,
      notlar: item?.notlar,
      referansPoz: row.poz,
      referansListeKey: "upload:2023-014",
      kategoriKodu: item?.kategoriKodu,
    });
    console.log(
      row.poz,
      row.ad.slice(0, 42),
      row.olcu,
      row.mevcut ? "MEVCUT" : "",
      "→",
      urun?.sku ?? "—",
      urun?.ad?.slice(0, 35) ?? "—",
      urun?.fiyat ?? 0,
      "TRY",
      "| tip:",
      item?.urunTipi ?? urunTipi,
    );
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
