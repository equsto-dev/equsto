import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(indexPath, "utf8");
const m = raw.match(/export const IndexBodyHtml = "([\s\S]*)";;;/);
if (!m) throw new Error("IndexBodyHtml not found");
let html = JSON.parse(`"${m[1]}"`);

html = html.replace(
  'class="hero-card-img hero-card-img--pfos-cover" src="/images/pfos/proje-fabrikasi-eskiz.jpg?v=20260602eskiz-jpg"',
  'class="hero-card-img hero-card-img--pfos-cover" src="/images/pfos/proje-fabrikasi-mutfak-eskiz.jpg?v=20260602hero-contain"'
);

html = html.replace(
  `<a class="eq-mx-hero__slide eq-mx-hero__slide--pfos is-active" href="pfos.html">
                <img class="eq-mx-hero__slide-bg" src="/images/pfos/proje-fabrikasi-eskiz.jpg?v=20260602eskiz-jpg" alt="" width="1200" height="800" decoding="async">
                <div class="eq-mx-hero__slide-shade" aria-hidden="true"></div>
                <div class="eq-mx-hero__slide-cap"><h2>Proje Fabrikası</h2><p>Beş dakikada ekipman listesi ve anlık teklif</p><span class="eq-mx-hero__slide-cta">Keşfet →</span></div>
              </a>`,
  `<a class="eq-mx-hero__slide eq-mx-hero__slide--pfos is-active" href="pfos.html">
                <img class="eq-mx-hero__slide-bg" src="/images/pfos/proje-fabrikasi-bar-plan.png?v=20260602slider-contain" alt="" width="1200" height="800" decoding="async">
                <div class="eq-mx-hero__slide-shade" aria-hidden="true"></div>
                <div class="eq-mx-hero__slide-cap"><h2>Proje Fabrikası</h2><p>Beş dakikada ekipman listesi ve anlık teklif</p><span class="eq-mx-hero__slide-cta">Keşfet →</span></div>
              </a>`
);

html = html.replace(
  `<a class="eq-mx-hero__slide" href="bar-design.html" style="background-image:url(/images/home/hero-bar-cocktailstation.png?v=20260520barcover)">
                <div class="eq-mx-hero__slide-cap"><h2>Bar Design Studio</h2><p>IMT300 berrak buz · modüler kokteyl istasyonu</p><span class="eq-mx-hero__slide-cta">Keşfet →</span></div>
              </a>`,
  `<a class="eq-mx-hero__slide eq-mx-hero__slide--bar" href="bar-design.html">
                <img class="eq-mx-hero__slide-bg" src="/images/home/hero-bar-cocktailstation.png?v=20260520barcover" alt="" width="1200" height="714" decoding="async">
                <div class="eq-mx-hero__slide-shade" aria-hidden="true"></div>
                <div class="eq-mx-hero__slide-cap"><h2>Bar Design Studio</h2><p>IMT300 berrak buz · modüler kokteyl istasyonu</p><span class="eq-mx-hero__slide-cta">Keşfet →</span></div>
              </a>`
);

html = html.replace(
  'src="/images/pfos/proje-fabrikasi-eskiz.jpg?v=20260602eskiz-jpg" alt="">',
  'src="/images/pfos/proje-fabrikasi-bar-plan.png?v=20260602slider-contain" alt="">'
);

const out = `/** Auto-generated from public/index.html — do not edit by hand */\nexport const IndexBodyHtml = ${JSON.stringify(html)};\n`;
fs.writeFileSync(indexPath, out, "utf8");
console.log("patched index.ts hero card + slider separation");
