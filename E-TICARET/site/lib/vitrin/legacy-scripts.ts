import { SHOP_ASSET_V } from "@/lib/shop/assets";

const v = SHOP_ASSET_V;

export const HOME_EXTRA_STYLES = [
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
  `/eq-analytics.js`,
];

export const PFOS_SCRIPTS = [
  `/eq-display-terminology.js?v=${v}`,
  `/eq-pfos-i18n.js?v=${v}`,
  `/eq-pfos-programmatic-seo.js`,
  `/equsto-engine.js`,
  `/pfos-rule-engine.js`,
  `/equsto-pricing-core.js`,
  `/pfos-pricing.js`,
  `/pfos-calc-engine.js`,
  `/pfos-location.js`,
  `/pfos-teklif-ui.js`,
  `/pfos-teklif-excel.js`,
  `/equsto-adres-national.js`,
  `/eq-analytics.js`,
];

export const LOGIN_SCRIPTS = [`/auth-social.js?v=${v}`];

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
