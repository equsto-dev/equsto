import { matchProductForReferansKalem } from "../lib/pfos/referans/match-referans-kalem";
import { db } from "../lib/db";

async function main() {
  const u = await matchProductForReferansKalem({
    urunTipi: "setalti-buzdolabi-tek",
    fiyatStratejisi: "ekonomik",
    isim: "CİHAZALTI BUZDOLABI, ÇİFT SIRA ÇEKMECELİ",
    notlar: "Marka: sktürk · Ölçü: 160*70*60",
    referansPoz: "A5",
    referansListeKey: "upload:2023-014",
  });
  console.log({
    sku: u?.sku,
    ad: u?.ad,
    fiyat: u?.fiyat,
    fiyatEur: u?.fiyatEur,
    marka: u?.marka,
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
