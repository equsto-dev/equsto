import { calculateUnifiedQuote } from "../lib/pfos/core/unified-motor.ts";
import { allDayDiningCafe } from "../lib/pfos/core/rules/all-day-dining-cafe/template.ts";
import { db } from "../lib/db.ts";

const r = await calculateUnifiedQuote(
  {
    konsept: "all-day-dining-cafe",
    m2: 280,
    sehir: "İstanbul",
    fiyatStratejisi: "orta",
  },
  allDayDiningCafe,
);

const zone = r.kalemler.filter((k) => k.kaynak !== "template");
const tpl = r.kalemler.filter((k) => k.kaynak === "template");
console.log("total", r.kalemler.length, "zone", zone.length, "template", tpl.length);
console.log(
  "poz (first 12):",
  r.kalemler.slice(0, 12).map((k) => `${k.poz} ${k.kategoriKodu} ${k.isim.slice(0, 30)}`).join("\n  "),
);
console.log(
  "eksik zorunlu:",
  r.kalemler.filter((k) => k.tip === "zorunlu" && !k.urun).map((k) => k.urunTipi).join(", "),
);

await db.$disconnect();
