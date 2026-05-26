import fs from "node:fs";

const p = "public/bar-design.html";
let s = fs.readFileSync(p, "utf8");
const anchor = '  <motion class="bd-vitrum-landing" id="bd-vitrum-landing">';
const anchor2 = '  <div class="bd-vitrum-landing" id="bd-vitrum-landing">';
const idx = s.indexOf(anchor2);
if (idx < 0) {
  console.error("anchor not found");
  process.exit(1);
}
const ice = `  <section class="bd-ice-strip" aria-label="Buz ve servis görselleri" data-i18n-attr="aria-label:besos.ice_strip_aria">
    <div class="bd-ice-strip-inner">
      <img src="images/besos/besos-ice-mint.png" alt="" width="640" height="800" loading="lazy" decoding="async">
      <img src="images/besos/besos-ice-bar.png" alt="" width="640" height="800" loading="lazy" decoding="async">
      <img src="images/besos/besos-ice-tong.png" alt="" width="640" height="800" loading="lazy" decoding="async">
      <img src="images/besos/besos-ice-diamond.png" alt="" width="640" height="800" loading="lazy" decoding="async">
      <img src="images/besos/besos-ice-molds.png" alt="" width="640" height="800" loading="lazy" decoding="async">
      <img src="images/besos/besos-ice-sphere.png" alt="" width="640" height="800" loading="lazy" decoding="async">
    </div>
  </section>

`;
if (s.includes('class="bd-ice-strip"')) {
  console.log("ice strip already present");
  process.exit(0);
}
s = s.slice(0, idx) + ice + s.slice(idx);
fs.writeFileSync(p, s);
console.log("ok");
