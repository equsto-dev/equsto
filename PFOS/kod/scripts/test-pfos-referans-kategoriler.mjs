/**
 * Steakhouse / Balıkçı referans listeleri — motor smoke test
 *   node --import ./scripts/load-env.mjs ./node_modules/tsx/dist/cli.mjs scripts/test-pfos-referans-kategoriler.mjs
 */
import { resolveTemplateForQuote } from "../lib/pfos/core/templates/index.ts";
import { calculateUnifiedQuote } from "../lib/pfos/core/unified-motor.ts";

const CASES = [
  { konsept: "steakhouse", m2: 115, altTip: undefined },
  { konsept: "steakhouse", m2: 200, altTip: undefined },
  { konsept: "balikci", m2: 115, altTip: undefined },
  { konsept: "balikci", m2: 200, altTip: undefined },
  { konsept: "balikci", m2: 80, altTip: "Mahalle Balıkçısı / Balık Lokantası" },
  { konsept: "coffee-shop", m2: 120, altTip: undefined },
];

for (const c of CASES) {
  const template = await resolveTemplateForQuote(c.konsept, c.m2, c.altTip);
  const r = await calculateUnifiedQuote(
    {
      konsept: c.konsept,
      m2: c.m2,
      altTip: c.altTip,
      sehir: "İstanbul",
      fiyatStratejisi: "ekonomik",
    },
    template,
  );
  console.log(
    `[${c.konsept} ${c.m2}m²${c.altTip ? " " + c.altTip : ""}]`,
    "kalem:",
    r.kalemler.length,
    "referans:",
    template.referansId || "—",
    "eslesme:",
    r.ozet.eslesmeSayisi + "/" + r.ozet.toplamKalemSayisi,
  );
}
