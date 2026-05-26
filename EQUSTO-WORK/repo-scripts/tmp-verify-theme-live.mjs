import { chromium } from 'playwright';

const t = await fetch('https://equsto.com/theme.js?t=' + Date.now()).then((r) => r.text());
console.log('live theme has eq-dept-plp skip:', t.includes('eq-dept-plp'));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const scripts = [];
page.on('response', (r) => {
  if (/eq-shop-vitrin|eq-mutbex-chrome|eq-vitrin-config/.test(r.url()) && r.status() === 200) {
    scripts.push(r.url().replace(/\?.*$/, '').split('/').pop());
  }
});
await page.goto('https://equsto.com/shop/pisirme?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(6000);
const s = await page.evaluate(() => ({
  body: document.body.className,
  cards: document.querySelectorAll('.eq-dept-plp-card').length,
  count: document.getElementById('eq-dept-plp-count')?.textContent?.trim(),
}));
console.log(JSON.stringify({ scripts, s }, null, 2));
await browser.close();
