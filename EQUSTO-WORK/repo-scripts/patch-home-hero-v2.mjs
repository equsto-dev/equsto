import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const p = path.join(root, "public", "index.html");
let h = fs.readFileSync(p, "utf8");

const bannerOld = `      <div class="hero-banner eq-world-first-banner">
        <motion class="hero-kicker" data-i18n="home.banner_kicker">Mr. Equsto Presents</motion>
        <h1 class="hero-h1 eq-wf-headline" data-i18n="home.banner_h1">DÜNYADA BİR İLK</h1>
        <motion class="hero-sub" data-i18n="home.banner_sub">Endüstriyel Mutfak &amp; Gastronomi Platformu</motion>
        <p class="hero-lead eq-wf-lead" data-i18n="home.banner_lead">Sorulara göre anlık fiyat teklifi, Proje Fabrikası ve Bar Design Studio — tek platformda.</p>
        <p class="eq-sr-only">
          <strong>Equsto</strong>, Türkiye merkezli endüstriyel mutfak ve gastronomi platformudur. Restoran, kafe, otel, bulut mutfak ve catering işletmelerine pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları; Proje Fabrikası (PFOS) ile anlık teklif; Bar Design Studio (Besos) ile bar modülü tasarımı sunar.
        </p>
      </motion>`.replace(/motion/g, "div");

const bannerNew = `      <div class="hero-banner eq-world-first-banner">
        <p class="hero-platform-line" data-i18n="home.banner_platform">Equsto Endüstriyel Mutfak &amp; Gastronomi Platformu</p>
        <h1 class="hero-h1 eq-wf-headline" data-i18n="home.banner_world_first">DÜNYADA BİR İLK!</h1>
        <p class="eq-sr-only">
          Equsto, Türkiye merkezli endüstriyel mutfak ve gastronomi platformudur: pişirme, soğutma, yıkama, hazırlık, kahve ve içecek ekipmanları; Proje Fabrikası (PFOS) ile anlık teklif; Bar Design Studio (Besos) ile bar modül seçimi.
        </p>
      </motion>`.replace(/motion/g, "div");

if (!h.includes(bannerOld)) {
  console.error("[patch-v2] banner block not found");
  process.exit(1);
}
h = h.replace(bannerOld, bannerNew);

h = h.replace(
  `<span class="hero-pfos-stat"><strong>24</strong><span data-i18n="home.hero_card1_stat">saat</span></span>`,
  `<p class="hero-pfos-promise" data-i18n="home.hero_card1_promise">Beş dakikada yapılır,<br>hemen teslim edilir</p>`
);

h = h.replace(
  'data-i18n="home.hero_card1_pitch">24 saatte mutfak projeniz — adım adım soru-cevap, anlık teklif.</p>',
  'data-i18n="home.hero_card1_pitch">Adım adım soru-cevap ile ekipman listeniz ve anlık teklif.</p>'
);

h = h.replace(
  'src="/data/cocktailstations-images/cs-basic-plus.jpg"',
  'src="/images/home/hero-bar-cocktailstation.png"'
);

fs.writeFileSync(p, h);
console.log("[patch-v2] index.html updated");
