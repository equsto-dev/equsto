import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto('https://equsto.com/?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(3000);

const fnCheck = await page.evaluate(() => ({
  eqDeptGo: typeof window.eqDeptGo,
  eqGo: typeof window.eqGo,
  eqIsDeptNavKey: typeof window.eqIsDeptNavKey,
  pisirme: typeof window.eqDeptGo === 'function' ? (window.eqIsDeptNavKey('pisirme'), 'ok') : 'no',
}));

for (const dept of ['pisirme', 'sogutma', 'tezgah']) {
  await page.goto('https://equsto.com/?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.evaluate((d) => {
    if (typeof window.eqDeptGo === 'function') window.eqDeptGo(d);
  }, dept);
  await page.waitForURL(/shop|pisirme|sogutma|tezgah/, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(5000);
  console.log(
    JSON.stringify({
      dept,
      url: page.url(),
      cards: await page.$$eval('.eq-dept-plp-card', (e) => e.length).catch(() => 0),
      vitrin: await page.$$eval('.eq-vitrin-card', (e) => e.length).catch(() => 0),
      loading: await page
        .evaluate(() => document.body?.innerText?.includes('yükleniyor') || document.body?.innerText?.includes('yüklenemedi'))
        .catch(() => false),
    })
  );
}

console.log('fnCheck', fnCheck);
await browser.close();
