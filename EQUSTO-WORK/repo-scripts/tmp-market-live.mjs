import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const fails = [];
page.on('response', (r) => {
  if (r.status() >= 400 && /equsto\.com/.test(r.url())) {
    fails.push(r.status() + ' ' + r.url().replace(/\?.*$/, '').replace('https://equsto.com', ''));
  }
});
await page.goto('https://equsto.com/shop/market-reyonlari?t=' + Date.now(), {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(8000);
const s = await page.evaluate(() => ({
  err: document.querySelector('.eq-cat-load-err')?.textContent?.slice(0, 100),
  hasCatalog: typeof window.EqCategoryCatalog !== 'undefined',
  grid: document.querySelectorAll('.eq-mx-prod-card, .prod-card, [class*="prod-card"]').length,
  shell: document.getElementById('eq-cat-shell')?.innerHTML?.slice(0, 150),
}));
console.log(JSON.stringify({ s, fails: fails.slice(0, 10) }, null, 2));
await browser.close();
