import { chromium } from 'playwright';

const url =
  'https://equsto.com/shop/pisirme/ztiryakiler-end-striyel-mutfak-ztiryakiler-set-st-yar-oluklu-zgara-gazl-80x90x30-900-seri-krom-kapl-7864-n1-80903-19c';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url + '?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(12000);
const s = await page.evaluate(() => ({
  title: document.title,
  loading: document.body?.innerText?.includes('yükleniyor'),
  product: !!document.querySelector('.eq-product-grid, .eq-buybox, #eq-ph-main'),
  miss: document.querySelector('.eq-product-miss')?.textContent?.slice(0, 80) || '',
}));
console.log(JSON.stringify({ s, errs }, null, 2));
await browser.close();
