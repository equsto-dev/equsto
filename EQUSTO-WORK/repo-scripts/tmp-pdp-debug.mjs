import { chromium } from 'playwright';

const url =
  'https://equsto.com/shop/pisirme/ztiryakiler-end-striyel-mutfak-ztiryakiler-set-st-yar-oluklu-zgara-gazl-80x90x30-900-seri-krom-kapl-7864-n1-80903-19c?t=' +
  Date.now();
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const network = [];
page.on('response', (r) => {
  const u = r.url();
  if (u.includes('.json') || u.includes('product') || u.includes('bootstrap')) {
    network.push({ u: u.slice(0, 100), status: r.status() });
  }
});
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(15000);
const dbg = await page.evaluate(() => ({
  miss: document.querySelector('.eq-product-miss')?.textContent?.slice(0, 120),
  hasCatalog: !!window.EqustoShopCatalog,
  hasLoadForProduct: typeof window.EqustoShopCatalog?.loadForProductPage,
  hasEqProductSlug: typeof window.eqProductSlug,
  pathname: location.pathname,
}));
console.log(JSON.stringify({ dbg, network, errs }, null, 2));
await browser.close();
