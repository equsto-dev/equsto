import { matchReferansKalem } from "../lib/pfos/referans/referans-eslestirme.ts";
import { isSenoxMeyveSikacagiReferansIsim } from "../lib/pfos/core/senox-marka.ts";

const cases = [
  {
    isim: "KATI MEYVE SIKACAĞI",
    urunTipi: "kati-meyve-sikacagi",
    expectSku: "118.KM01",
    expectMarka: "Şenox",
  },
  {
    isim: "Katı Meyve Sıkacağı",
    urunTipi: "kati-meyve-sikacagi",
    expectSku: "118.KM01",
    expectMarka: "Şenox",
  },
  {
    isim: "PORTAKAL SIKMA MAKİNESİ",
    urunTipi: "meyve_sikacagi",
    expectSenox: false,
  },
];

for (const c of cases) {
  console.log("---", c.isim);
  console.log("  senox?", isSenoxMeyveSikacagiReferansIsim(c.isim, c.urunTipi));
  const r = await matchReferansKalem({
    isim: c.isim,
    urunTipi: c.urunTipi,
    notlar: "",
    fiyatStratejisi: "ekonomik",
    sku: null,
  });
  console.log("  sku:", r?.sku, "marka:", r?.marka, "eur:", r?.fiyatEur);
  if (c.expectSenox === false) {
    if (r?.marka === "Şenox" && /118\.KM/i.test(r?.sku ?? "")) {
      console.log("  FAIL: portakal should not map to Senox KM01");
    }
  } else if (r?.sku !== c.expectSku || r?.marka !== c.expectMarka) {
    console.log("  FAIL expected", c.expectSku, c.expectMarka);
  } else {
    console.log("  OK");
  }
}
