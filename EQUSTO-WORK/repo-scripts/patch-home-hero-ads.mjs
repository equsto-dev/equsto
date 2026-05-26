import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "public", "index.html");
let h = fs.readFileSync(p, "utf8");

h = h.replace('class="hero-banner">', 'class="hero-banner eq-world-first-banner">');

const bannerIdx = h.indexOf('class="hero-banner eq-world-first-banner"');
if (bannerIdx >= 0) {
  const ki = h.indexOf('data-i18n="home.banner_kicker"', bannerIdx);
  if (ki >= 0) {
    const textStart = h.indexOf(">", ki) + 1;
    const textEnd = h.indexOf("<", textStart);
    h = h.slice(0, textStart) + "Mr. Equsto Presents" + h.slice(textEnd);
  }
}

const heroStart = h.indexOf('      <section class="hero">');
const heroEnd = h.indexOf("      </section>", heroStart) + "      </section>".length;
if (heroStart < 0) {
  console.error("[patch] hero section not found");
  process.exit(1);
}

const heroNew = `      <section class="hero eq-home-hero-ads" aria-label="Equsto vitrin reklamları" data-i18n-attr="aria-label:home.hero_ads_aria">
        <\u0064iv class="hero-card hero-card--pfos" onclick="eqGo('pfos')" role="link" tabindex="0" onkeydown="if(event.key==='Enter')eqGo('pfos')">
          <\u0064iv class="hero-card-visual hero-card-visual--pfos" aria-hidden="true">
            <span class="hero-pfos-stat"><strong>24</strong><span data-i18n="home.hero_card1_stat">saat</span></span>
          </\u0064iv>
          <\u0064iv class="hero-card-body">
            <\u0064iv class="hero-tag" data-i18n="home.hero_card1_tag">Proje Çözümleri</\u0064iv>
            <\u0064iv class="hero-title" data-i18n="home.hero_card1_title">Proje Fabrikası</\u0064iv>
            <p class="hero-pitch" data-i18n="home.hero_card1_pitch">24 saatte mutfak projeniz — adım adım soru-cevap, anlık teklif.</p>
            <span class="hero-cta" data-i18n="home.hero_card1_cta">Projeyi başlat →</span>
          </\u0064iv>
        </\u0064iv>
        <\u0064iv class="hero-card hero-card--yer hero-card--soon" aria-disabled="true">
          <span class="hero-soon-badge" data-i18n="home.hero_card2_soon">PEK YAKINDA</span>
          <\u0064iv class="hero-card-visual hero-card-visual--yer" aria-hidden="true"></\u0064iv>
          <\u0064iv class="hero-card-body">
            <\u0064iv class="hero-tag" data-i18n="home.hero_card2_tag">Restoran &amp; Catering</\u0064iv>
            <\u0064iv class="hero-title" data-i18n="home.hero_card2_title">Yer Sofrası</\u0064iv>
            <p class="hero-pitch" data-i18n="home.hero_card2_pitch">Konsept vitrin, masa düzeni ve servis hatları — çok yakında.</p>
          </\u0064iv>
        </\u0064iv>
        <\u0064iv class="hero-card hero-card--besos" onclick="eqGo('besos')" role="link" tabindex="0" onkeydown="if(event.key==='Enter')eqGo('besos')">
          <\u0064iv class="hero-card-visual hero-card-visual--besos" aria-hidden="true">
            <img class="hero-card-img hero-card-img--ice" src="/images/imt300/imt300-1.jpg" alt="" width="400" height="300" loading="eager" decoding="async">
            <img class="hero-card-img hero-card-img--cs" src="/data/cocktailstations-images/cs-basic-plus.jpg" alt="" width="400" height="300" loading="eager" decoding="async">
          </\u0064iv>
          <\u0064iv class="hero-card-body">
            <\u0064iv class="hero-tag" data-i18n="home.hero_card3_tag">Bar &amp; Beverages</\u0064iv>
            <\u0064iv class="hero-title" data-i18n="home.hero_card3_title">Bar Design</\u0064iv>
            <p class="hero-pitch" data-i18n="home.hero_card3_pitch">IMT300 berrak buz makinesi · Cocktailstations kokteyl istasyonları.</p>
            <span class="hero-cta" data-i18n="home.hero_card3_cta">Bar Design →</span>
          </\u0064iv>
        </\u0064iv>
      </section>`;

h = h.slice(0, heroStart) + heroNew + h.slice(heroEnd);
fs.writeFileSync(p, h);
console.log("[patch] public/index.html hero ads updated");
