import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "lib/vitrin/bodies/index.ts");
const raw = fs.readFileSync(indexPath, "utf8");
const m = raw.match(/export const IndexBodyHtml = "([\s\S]*)";;;/);
if (!m) throw new Error("IndexBodyHtml not found");
const html = JSON.parse(`"${m[1]}"`);

if (html.includes("eq-home-hero-ads")) {
  console.log("hero section already present");
  process.exit(0);
}

const heroSection = `<section class="hero eq-home-hero-ads" aria-label="Equsto vitrin reklamları" data-i18n-attr="aria-label:home.hero_ads_aria">
        <div class="hero-card hero-card--pfos" onclick="eqGo('pfos')" role="link" tabindex="0" onkeydown="if(event.key==='Enter')eqGo('pfos')">
          <div class="hero-card-visual hero-card-visual--pfos" aria-hidden="true">
            <img class="hero-card-img hero-card-img--pfos-cover" src="/images/pfos/proje-fabrikasi-mutfak-eskiz.jpg?v=20260602mutfak-eskiz" alt="Proje Fabrikası — endüstriyel mutfak eskizi" width="1200" height="800" loading="eager" decoding="async" fetchpriority="high">
            <div class="hero-card-visual__shade hero-card-visual__shade--pfos" aria-hidden="true"></div>
          </div>
          <div class="hero-card-body">
            <div class="hero-tag" data-i18n="home.hero_card1_tag">Proje Çözümleri</div>
            <div class="hero-title"><span data-i18n="home.hero_card1_title">Proje Fabrikası</span><span class="hero-title-sep" aria-hidden="true"> | </span><em class="hero-title-tagline" data-i18n="home.hero_card1_tagline">Beş dakikada yapılır, hemen teslim edilir.</em></div>
            <p class="hero-pitch" data-i18n="home.hero_card1_pitch">Adım adım soru-cevap ile ekipman listeniz ve anlık teklif.</p>

          </div>
        </div>
        <div class="hero-card hero-card--yer hero-card--soon" aria-disabled="true">
          <div class="hero-card-visual hero-card-visual--yer" aria-hidden="true">
            <img class="hero-card-img hero-card-img--yer-bufe" src="/images/home/hero-yer-sofrasi-bufe.png?v=20260520yerbufe" alt="Yer Sofrası — açık büfe ve chafing ekipmanları" width="1200" height="800" loading="lazy" decoding="async">
          </div>
          <div class="hero-card-body">
            <div class="hero-tag" data-i18n="home.hero_card2_tag">Restoran &amp; Catering</div>
            <div class="hero-title"><span data-i18n="home.hero_card2_title">Yer Sofrası</span><span class="hero-title-sep" aria-hidden="true"> | </span><span class="hero-title-tagline" data-i18n="home.hero_card2_tagline">Pek yakında.</span></div>
            <p class="hero-pitch" data-i18n="home.hero_card2_pitch">Konsept vitrin, masa düzeni ve servis hatları.</p>
          </div>
        </div>
        <div class="hero-card hero-card--besos" onclick="eqGo('besos')" role="link" tabindex="0" onkeydown="if(event.key==='Enter')eqGo('besos')">
          <div class="hero-card-visual hero-card-visual--besos" aria-hidden="true">
            <img class="hero-card-img hero-card-img--bar-combo" src="/images/home/hero-bar-cocktailstation.png?v=20260520barcover" alt="Besos modüler kokteyl istasyonu" width="1200" height="714" loading="eager" decoding="async" fetchpriority="high">
          </div>
          <div class="hero-card-body">
            <div class="hero-tag" data-i18n="home.hero_card3_tag">Bar &amp; Beverages</div>
            <div class="hero-title"><span data-i18n="home.hero_card3_title">Bar Design</span><span class="hero-title-sep" aria-hidden="true"> | </span><em class="hero-title-tagline" data-i18n="home.hero_card3_tagline">İlham versin diye tasarlandı.</em></div>
            <p class="hero-pitch" data-i18n="home.hero_card3_pitch">IMT300 berrak buz · modüler kokteyl istasyonu.</p>

          </div>
        </div>
      </section>`;

const marker = "      </div>\r\n\r\n      <nav class=\"eq-decor-catstrip\"";
const insertAt = html.indexOf(marker);
if (insertAt < 0) throw new Error("insert marker not found");

const next = html.slice(0, insertAt + "      </div>".length) + "\r\n\r\n      " + heroSection + html.slice(insertAt + "      </div>".length);
const out = `/** Auto-generated from public/index.html — do not edit by hand */\nexport const IndexBodyHtml = ${JSON.stringify(next)};\n`;
fs.writeFileSync(indexPath, out, "utf8");
console.log("restored hero section");
