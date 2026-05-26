import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('https://equsto.com/shop/pisirme?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(8000);

const imgs = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.eq-dept-plp-card img')].slice(0, 5);
  return cards.map((img) => ({ src: img.src, naturalWidth: img.naturalWidth, complete: img.complete }));
});

const failed = [];
page.on('response', (r) => {
  if (r.request().resourceType() === 'image' && r.status() >= 400) {
    failed.push({ url: r.url().slice(0, 100), status: r.status() });
  }
});

await page.reload({ waitUntil: 'networkidle', timeout: 90000 }).catch(() => {});
await page.waitForTimeout(3000);

console.log(JSON.stringify({ imgs, failed: failed.slice(0, 10) }, null, 2));
await browser.close();
