import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.goto('https://equsto.com/shop/pisirme?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(10000);
const s = await page.evaluate(() => ({
  cards: document.querySelectorAll('.eq-dept-plp-card').length,
  status: document.getElementById('eq-dept-plp-grid')?.innerText?.slice(0, 80),
  visible: [...document.querySelectorAll('.eq-dept-plp-card')].slice(0, 2).map((c) => {
    const r = c.getBoundingClientRect();
    return { w: r.width, h: r.height, display: getComputedStyle(c).display };
  }),
}));
console.log(JSON.stringify(s, null, 2));
await browser.close();
