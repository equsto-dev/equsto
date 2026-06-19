import { matchItem } from "../lib/pfos/parse-upload/meili-kalem-eslestir.ts";
import { db } from "../lib/db.ts";

const testCases = [
  {
    name: "10. Toast Machine vs Doner wrap/slice",
    item: {
      tanim: "TOST MAKİNESİ, ELEKTRİKLİ",
      marka_orijinal: "Atalay",
      olcu: "30*40",
      adet: 1,
      mevcut: false,
      poz: "01"
    }
  },
  {
    name: "11. Stone Oven vs Knife Sterilizer Cabinet",
    item: {
      tanim: "İKİ KATLI EKMEK FIRINI, TAŞ TABANLI fimak 1 14000 [object Object]",
      marka_orijinal: "Atalay",
      marka_urun_kodu: "ABS-10",
      olcu: "40*60",
      adet: 1,
      mevcut: false,
      poz: "02"
    }
  },
  {
    name: "12. Induction Cooker (with endüsyinolu typo)",
    item: {
      tanim: "endüsyinolu ocak Atalay",
      olcu: "40*70",
      adet: 1,
      mevcut: false,
      poz: "03"
    }
  },
  {
    name: "13. Cake Display Cabinet vs Market Reyon image",
    item: {
      tanim: "PASTA VİTRİN DOLABI",
      marka_orijinal: "Çağlayan Soğutma",
      marka_urun_kodu: "EQ-İNCİ-EQ10",
      olcu: "300*70*170",
      adet: 1,
      mevcut: false,
      poz: "04"
    }
  },
  {
    name: "14. Undercounter Glass Door Fridge (with BIZDLABI typo) vs Hood",
    item: {
      tanim: "CAM KAPILI TEZGAH TİPİ BIZDLABI, 3 KAPILI, HAREKETLİ",
      marka_orijinal: "Equsto",
      marka_urun_kodu: "20155.00",
      olcu: "187*70*85",
      adet: 1,
      mevcut: false,
      poz: "05"
    }
  },
  {
    name: "15. Microwave Oven vs Pizza Oven",
    item: {
      tanim: "TURBO MİKRODALGA FIRIN - menumaster 1 4850 [object Object]",
      marka_orijinal: "Atalay",
      marka_urun_kodu: "APF-40/1",
      olcu: "—",
      adet: 1,
      mevcut: false,
      poz: "06"
    }
  },
  {
    name: "16. Centrifugal Juicer vs Orange squeezer",
    item: {
      tanim: "katı meyve sıkacağı/presi",
      marka_orijinal: "Santos",
      olcu: "—",
      adet: 1,
      mevcut: false,
      poz: "07"
    }
  },
  {
    name: "17. Trash Trolley",
    item: {
      tanim: "portashelf çöp arabası",
      olcu: "—",
      adet: 1,
      mevcut: false,
      poz: "08"
    }
  },
  {
    name: "Extra: Double Sink Work Table Image & SKU",
    item: {
      tanim: "ÇİFT EVYELİ ÇALIŞMA TEZGAHI",
      marka_orijinal: "Equsto",
      olcu: "140*70*85",
      adet: 1,
      mevcut: false,
      poz: "09"
    }
  },
  {
    name: "Extra: Single Sink Work Table Image & SKU",
    item: {
      tanim: "TEK EVYELİ ÇALIŞMA TEZGAHI",
      marka_orijinal: "Equsto",
      olcu: "120*70*85",
      adet: 1,
      mevcut: false,
      poz: "10"
    }
  },
  {
    name: "Extra: Catering Oven (Yemekçilik Fırını) brand choice",
    item: {
      tanim: "Yemekçilik Fırını, 10 GN 1/1, elektrikli",
      olcu: "10 GN 1/1",
      adet: 1,
      mevcut: false,
      poz: "11"
    }
  }
];

async function main() {
  console.log("=== RUNNING VERIFICATION FOR MATCH FIXES ===");
  for (const tc of testCases) {
    console.log(`\nTest Case: ${tc.name}`);
    console.log(`Input description: "${tc.item.tanim}" (Code: ${tc.item.marka_urun_kodu ?? 'None'})`);
    
    try {
      const result = await matchItem(tc.item);
      const matchedUrun = result.matched.eslesen_urun;
      
      if (matchedUrun) {
        console.log(`-> Matched SKU : ${matchedUrun.stok_no}`);
        console.log(`-> Matched Name: ${matchedUrun.urun_adi}`);
        console.log(`-> Brand       : ${matchedUrun.marka}`);
        console.log(`-> Image URL   : ${result.bestHit?.image ?? 'None'}`);
        console.log(`-> Price (EUR) : ${matchedUrun.satis_fiyati_eur ?? '—'}`);
      } else {
        console.log("-> No catalog match found (Matched to Custom/Ozel Imalat).");
      }
    } catch (e) {
      console.error("Error running test case:", e);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
