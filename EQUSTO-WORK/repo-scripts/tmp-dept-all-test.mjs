import { chromium } from 'playwright';

const DEPTS = ['pisirme', 'sogutma', 'kahve', 'yikama', 'hazirlik', 'icecek', 'tezgah'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];

for (const dept of DEPTS) {
  const url = `https://equsto.com/shop/${dept}?t=${Date.now()}`;
  const errs = [];
  page.removeAllListeners('pageerror');
  page.on('pageerror', (e) => errs.push(e.message));
  let status = 0;
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = res?.status() ?? 0;
    await page.waitForTimeout(4000);
    const info = await page.evaluate(() => {
      const cards = document.querySelectorAll('.eq-product-card, .eq-plp-card, [data-eq-product]');
      const links = [...document.querySelectorAll('a[href*="/shop/"]')]
        .map((a) => a.getAttribute('href'))
        .filter((h) => h && /\/shop\/[^/]+\/[^/]+/.test(h));
      const loading = document.body?.innerText?.includes('yükleniyor');
      const err404 = document.body?.innerText?.includes('404') || document.title?.includes('404');
      return { cards: cards.length, productLinks: links.length, firstLink: links[0] || null, loading, err404 };
    });
    let pdp = null;
    if (info.firstLink) {
      const pdpUrl = info.firstLink.startsWith('http') ? info.firstLink : `https://equsto.com${info.firstLink}`;
      await page.goto(pdpUrl + (pdpUrl.includes('?') ? '&' : '?') + 't=' + Date.now(), {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });
      await page.waitForTimeout(6000);
      pdp = await page.evaluate(() => ({
        miss: !!document.querySelector('.eq-product-miss'),
        buybox: !!document.querySelector('.eq-buybox, #eq-ph-main, .eq-product-grid'),
        loading: document.body?.innerText?.includes('yükleniyor'),
        title: document.title?.slice(0, 60),
      }));
    }
    results.push({ dept, status, ...info, pdp, errs: errs.slice(0, 2) });
  } catch (e) {
    results.push({ dept, error: String(e.message).slice(0, 120) });
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
