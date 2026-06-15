import { matchReferansKalem } from "../lib/pfos/referans/referans-eslestirme.ts";
import {
  isSenoxMeyveSikacagiReferansIsim,
  isSenoxPortakalSikacagiReferansIsim,
} from "../lib/pfos/core/senox-marka.ts";

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
    expectSku: "118.PS.01",
    expectMarka: "Şenox",
  },
  {
    isim: "PORTAKAL SIKMA MAKİNASI",
    urunTipi: "kati-meyve-sikacagi",
    expectSku: "118.PS.01",
    expectMarka: "Şenox",
  },
  {
    isim: "PORTAKAL SIKMA MAKİNESİ",
    urunTipi: "meyve_sikacagi",
    expectSku: "118.PS.01",
    expectMarka: "Şenox",
  },
];

let failed = 0;
for (const c of cases) {
  console.log("---", c.isim, c.urunTipi ? `(${c.urunTipi})` : "");
  console.log(
    "  senox portakal?",
    isSenoxPortakalSikacagiReferansIsim(c.isim, c.urunTipi),
  );
  console.log(
    "  senox kati meyve?",
    isSenoxMeyveSikacagiReferansIsim(c.isim, c.urunTipi),
  );
  const r = await matchReferansKalem({
    isim: c.isim,
    urunTipi: c.urunTipi,
    notlar: "",
    fiyatStratejisi: "ekonomik",
    sku: null,
  });
  console.log("  sku:", r?.sku, "marka:", r?.marka, "eur:", r?.fiyatEur);
  if (r?.sku !== c.expectSku || r?.marka !== c.expectMarka) {
    console.log("  FAIL expected", c.expectSku, c.expectMarka);
    failed++;
  } else {
    console.log("  OK");
  }
}
process.exit(failed > 0 ? 1 : 0);
