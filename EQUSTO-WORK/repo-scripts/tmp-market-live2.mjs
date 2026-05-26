import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://equsto.com/shop/market-reyonlari?t=' + Date.now(), {
  waitUntil: 'domcontentloaded',
  timeout: 60000,
});
await page.waitForTimeout(10000);
const s = await page.evaluate(() => ({
  err: !!document.querySelector('.eq-cat-load-err'),
  count: document.getElementById('eq-cat-result-count')?.textContent,
  cards: document.querySelectorAll('.eq-cm-prod-card, .eq-cat-prod-card, article').length,
  tiles: document.querySelectorAll('.eq-cm-tile, .eq-mx-story').length,
}));
console.log(JSON.stringify(s, null, 2));
await browser.close();
