import { PfosBodyHtml } from "../lib/vitrin/bodies/pfos.ts";
const s = PfosBodyHtml;
const needles = ["Mr. Equsto", "Proje Fabrikası", "Teklif", "Adım", "Konsept", "data-i18n", "pf-m"];
for (const n of needles) console.log(n, s.includes(n));
console.log("\n--- sample ---\n", s.slice(0, 2500));
