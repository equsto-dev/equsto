import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

/** İlk boya öncesi hero ızgarası — body sınıfları / theme.css gelmeden PFOS görseli tam genişlikte görünmesin */
export const HOME_CRITICAL_CSS = `
:root{--eq-home-hero-visual-aspect:4/3}
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads{display:grid;grid-template-columns:repeat(3,1fr);overflow:hidden}
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads .hero-card{position:relative;height:auto;min-height:0;max-height:none;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column}
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads .hero-card-visual{position:relative;width:100%;aspect-ratio:var(--eq-home-hero-visual-aspect);flex:0 0 auto;overflow:hidden}
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads .hero-card-img--pfos-cover{position:absolute;inset:0;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:contain;object-position:center center}
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads .hero-card-img--bar-combo,
body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads .hero-card-img--yer-bufe{position:absolute;inset:0;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover}
@media(max-width:768px){body.eq-shop.eq-home .right-col>section.hero.eq-home-hero-ads{grid-template-columns:1fr}}
`.trim();

export const HOME_BODY_CLASS = "eq-shop eq-home eq-home-mutbex eq-home-decor";

export const HOME_EXTRA_STYLES = [
  `/eq-home-mutbex.css?v=${v}`,
  `/eq-home-decor.css?v=${v}`,
  `/contact.css?v=${v}`,
];

export const HOME_SCRIPTS = [
  `/eq-home-vitrin.js?v=${v}`,
  `/eq-category-overrides.js?v=${v}`,
  `/eq-vendor-sanitize.js?v=${v}`,
  `/eq-display-terminology.js?v=${v}`,
  `/eq-dept-tips.js?v=${v}`,
  `/equsto-engine.js`,
  `/pfos-rule-engine.js`,
  `/eq-product-compare.js`,
  `/eq-vitrin-config.js?v=${v}`,
  `/eq-home-mutbex.js?v=${v}`,
  `/eq-product-card-tint.js?v=${v}`,
  `/eq-analytics.js`,
];

export const PFOS_EXTRA_STYLES = [`/eq-pfos-wizard.css?v=${v}`];

export const PFOS_SCRIPTS = [
  `/eq-display-terminology.js?v=${v}`,
  `/eq-pfos-i18n.js?v=${v}`,
  `/eq-pfos-programmatic-seo.js`,
  `/pfos-wizard-schema.js?v=${v}`,
  `/pfos-template-api.js?v=${v}`,
  `/equsto-engine.js`,
  `/pfos-rule-engine.js`,
  `/equsto-pricing-core.js`,
  `/pfos-pricing.js`,
  `/pfos-calc-engine.js`,
  `/pfos-wizard-bootstrap.js?v=${v}`,
  `/pfos-location.js`,
  `/pfos-teklif-ui.js`,
  `/pfos-teklif-excel.js`,
  `/equsto-adres-national.js`,
  `/pfos-wizard.js?v=${v}`,
  `/eq-analytics.js`,
];

export const LOGIN_SCRIPTS = [`/auth-social.js?v=${v}`, `/theme.js?v=${v}`];

export const IMT300_SCRIPTS = [`/eq-youtube-embed.js`];

export const BAR_MODULE_SCRIPTS = [`/eq-bar-module.js?v=${v}`];

export const BAR_DESIGN_SCRIPTS = [`/eq-bar-design.js?v=${v}`, `/eq-analytics.js`];

export const ADMIN_SCRIPTS = [`/admin-app.js?v=${v}`];

export const PRODUCT_SCRIPTS = [
  `/eq-display-terminology.js?v=${v}`,
  `/eq-shop-catalog-bootstrap.js?v=${v}`,
  `/eq-filter-column.js?v=${v}`,
  `/eq-category-shell.js?v=${v}`,
];
