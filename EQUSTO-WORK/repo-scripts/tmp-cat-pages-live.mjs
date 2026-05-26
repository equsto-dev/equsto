import { chromium } from 'playwright';

const DEPTS = ['pisirme', 'sogutma', 'kahve', 'yikama', 'hazirlik', 'icecek', 'tezgah'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];

for (const dept of DEPTS) {
  const url = `https://equsto.com/shop/${dept}?nocache=${Date.now()}`;
  const errs = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', (e) => errs.push(e.message));
  const failed = [];
  page.removeAllListeners('requestfailed');
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (/\.(js|json|css)|dept\//.test(u)) failed.push({ u: u.slice(0, 90), err: r.failure()?.errorText });
  });
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    status = res?.status() ?? 0;
    await page.waitForTimeout(6000);
    const info = await page.evaluate(() => ({
      title: document.title,
      bodyClass: document.body?.className || '',
      statusText: document.querySelector('.eq-dept-plp-status')?.textContent?.trim()?.slice(0, 80) || '',
      gridHtml: (document.getElementById('eq-dept-plp-grid')?.innerHTML || '').slice(0, 120),
      cardCount: document.querySelectorAll('.eq-dept-plp-card, .eq-plp-card').length,
      countEl: document.getElementById('eq-dept-plp-count')?.textContent?.trim() || '',
      hasPlpJs: typeof window.__eqDeptPlpSetSort === 'function',
      hasCatalog: !!window.EqustoShopCatalog,
    }));
    results.push({ dept, status, ...info, errs: errs.slice(0, 3), failed: failed.slice(0, 5) });
  } catch (e) {
    results.push({ dept, error: String(e.message).slice(0, 120) });
  }
}

// shop hub
try {
  const res = await page.goto(`https://equsto.com/shop/?t=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  results.push({ dept: 'shop-hub', status: res?.status(), title: await page.title() });
} catch (e) {
  results.push({ dept: 'shop-hub', error: String(e.message) });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
