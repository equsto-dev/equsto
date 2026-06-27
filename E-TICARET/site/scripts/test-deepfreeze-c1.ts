import type { PfosEkipmanSatir } from "../lib/pfos/kategoriler/types";
import { ekipmanToReferansKalemler } from "../lib/pfos/referans/pfos-referans-loader";
import { matchProductForReferansKalem } from "../lib/pfos/referans/match-referans-kalem";
import {
  isPanelDerinDondurucuOdaPfosKalem,
  isPanelSogukOdaPfosKalem,
  matchSogukOdaByReferans,
} from "../lib/pfos/referans/soguk-oda-match";

const scenarios: PfosEkipmanSatir[] = [
  {
    bolum: "DEEPFREEZE_DEPO",
    bolumAd: "C- DEEPFREEZE DEPO",
    poz: "C1",
    ad: "PANEL TİP SOĞUK ODA",
    olcu: "200*200*240",
    adet: 1,
  },
  {
    bolum: "C",
    bolumAd: "C- DEEPFREEZE DEPO",
    poz: "C1",
    ad: "PANEL TİP SOĞUK ODA",
    olcu: "2000*2000*240",
    adet: 1,
  },
  {
    bolum: "C",
    bolumAd: "",
    poz: "C1",
    ad: "PANEL TİP SOĞUK ODA",
    olcu: "2000*2000*240",
    adet: 1,
  },
];

async function main() {
  for (const satir of scenarios) {
    console.log("\n--- scenario bolum=", satir.bolum, "bolumAd=", satir.bolumAd);
    const [ref] = ekipmanToReferansKalemler([satir], "upload:test.xlsx");
    console.log("urunTipi:", ref.urunTipi, "altKategori:", ref.altKategori);
    const opts = {
      isim: ref.isim,
      urunTipi: ref.urunTipi,
      notlar: ref.notlar,
      altKategori: ref.altKategori,
    };
    console.log("derin:", isPanelDerinDondurucuOdaPfosKalem(opts));
    console.log("soguk:", isPanelSogukOdaPfosKalem(opts));
    const panel = await matchSogukOdaByReferans(
      ref.isim,
      satir.olcu,
      ref.notlar,
      ref.urunTipi,
      "ekonomik",
      ref.altKategori,
    );
    console.log("panel match:", panel?.sku, panel?.ad?.slice(0, 40));
  }

  const [ref] = ekipmanToReferansKalemler([scenarios[0]!], "upload:test.xlsx");
  const bulut = await matchProductForReferansKalem({
    urunTipi: ref.urunTipi,
    isim: ref.isim,
    notlar: ref.notlar,
    referansPoz: "C1",
    referansListeKey: "bulut-burger-40-80",
    altKategori: ref.altKategori,
    fiyatStratejisi: "ekonomik",
  });
  console.log("\nbulut link match:", bulut?.sku, bulut?.ad?.slice(0, 80));
}

main().catch(console.error);
