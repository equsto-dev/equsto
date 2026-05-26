import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const results = [];

// Homepage dept tiles / nav
await page.goto('https://equsto.com/?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(4000);

const deptLinks = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="/shop/"], [data-eq-dept], [onclick*="eqDeptGo"]')];
  return links.slice(0, 30).map((el) => ({
    tag: el.tagName,
    href: el.getAttribute('href'),
    dataDept: el.getAttribute('data-eq-dept'),
    onclick: (el.getAttribute('onclick') || '').slice(0, 60),
    text: (el.textContent || '').trim().slice(0, 40),
  }));
});
results.push({ step: 'home-links', deptLinks: deptLinks.slice(0, 15) });

// Try clicking first visible /shop/pisirme link if any
const pisirmeLink = await page.$('a[href="/shop/pisirme"], a[href*="shop/pisirme"]');
if (pisirmeLink) {
  await pisirmeLink.click();
  await page.waitForTimeout(5000);
  results.push({
    step: 'click-pisirme',
    url: page.url(),
    cards: await page.$$eval('.eq-dept-plp-card', (els) => els.length),
    title: await page.title(),
  });
} else {
  results.push({ step: 'click-pisirme', error: 'no pisirme link found' });
}

// Drawer: open and click sogutma
await page.goto('https://equsto.com/?t=' + Date.now(), { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2000);
const drawerBtn = await page.$('[onclick*="toggleDrawer"], #eqShopAllBtn, .eq-shop-all-btn, button[aria-label*="kategori"]');
if (drawerBtn) {
  await drawerBtn.click();
  await page.waitForTimeout(1500);
}
const sogLink = await page.$('#catDrawer a[href*="sogutma"], #catDrawer [data-href*="sogutma"]');
if (sogLink) {
  await sogLink.click();
  await page.waitForTimeout(6000);
  results.push({
    step: 'drawer-sogutma',
    url: page.url(),
    cards: await page.$$eval('.eq-dept-plp-card', (els) => els.length).catch(() => 0),
    title: await page.title(),
  });
} else {
  const drawerHtml = await page.$eval('#catDrawer', (el) => el.innerHTML.slice(0, 200)).catch(() => '');
  results.push({ step: 'drawer-sogutma', error: 'no sogutma in drawer', drawerHtml });
}

// Old URLs
for (const u of [
  'https://equsto.com/pisirme.html',
  'https://equsto.com/urunler/pisirme',
  'https://equsto.com/sogutma.html',
]) {
  const res = await page.goto(u + '?t=' + Date.now(), { waitUntil: 'domcontentloaded', timeout: 30000 });
  results.push({
    step: 'legacy-' + u.split('/').pop(),
    status: res?.status(),
    finalUrl: page.url(),
    cards: await page.$$eval('.eq-dept-plp-card', (els) => els.length).catch(() => -1),
  });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
