/**
 * yuksel-missing-images.json → web'den görsel indir, ekipmanlar.json güncelle
 *
 *   node scripts/report-yuksel-missing-images.mjs
 *   node scripts/fetch-yuksel-images-from-web.mjs --dry-run --limit=5
 *   node scripts/fetch-yuksel-images-from-web.mjs --limit=50
 *   node scripts/fetch-yuksel-images-from-web.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT = path.join(ROOT, 'public', 'data', 'yuksel-missing-images.json');
const CATALOG = path.join(ROOT, 'public', 'data', 'ekipmanlar.json');
const IMG_DIR = path.join(ROOT, 'public', 'data', 'images');
const LOG = path.join(ROOT, 'public', 'data', 'yuksel-web-images-log.json');

const DRY = process.argv.includes('--dry-run');
const limit = parseInt((process.argv.find((x) => x.startsWith('--limit=')) || '').split('=')[1] || '0', 10);
const delayMs = parseInt((process.argv.find((x) => x.startsWith('--delay=')) || '').split('=')[1] || '350', 10);

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 EqustoYukselImg/1.0';

function slugSku(sku) {
  return String(sku || '')
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'yuksel-urun';
}

function httpBuf(url, maxRedirect = 4) {
  return new Promise((resolve) => {
    const fetch = (u, n) => {
      const parsed = new URL(u);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.request(
        parsed,
        {
          headers: {
            'User-Agent': UA,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
          },
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const code = res.statusCode || 0;
            if ([301, 302, 307, 308].includes(code) && res.headers.location && n > 0) {
              fetch(new URL(res.headers.location, u).href, n - 1);
              return;
            }
            resolve({
              status: code,
              buf: Buffer.concat(chunks),
              type: String(res.headers['content-type'] || ''),
            });
          });
        },
      );
      req.on('error', () => resolve({ status: 0, buf: Buffer.alloc(0), type: '' }));
      req.setTimeout(25000, () => {
        req.destroy();
        resolve({ status: 0, buf: Buffer.alloc(0), type: '' });
      });
      req.end();
    };
    fetch(url, maxRedirect);
  });
}

const TICIMAX_RE =
  /https:\/\/static\.ticimax\.cloud\/cdn-cgi\/image\/[^\s"'<>]+\/3562\/[^\s"'<>]*urunresimleri[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi;

async function tryKariyer(row) {
  const q = encodeURIComponent(row.sku || row.searchQuery);
  const { status, buf } = await httpBuf(`https://www.kariyermutfak.com/arama?kelime=${q}`);
  if (status !== 200 || buf.length < 500) return null;
  const html = buf.toString('utf8');
  const paths = [...html.matchAll(/href="(\/[^"]+-\d+-p\.html)"/gi)].map((m) => m[1]);
  const uniq = [...new Set(paths)].slice(0, 4);
  for (const rel of uniq) {
    const page = await httpBuf(`https://www.kariyermutfak.com${rel}`);
    if (page.status !== 200) continue;
    const ph = page.buf.toString('utf8');
    const urls = [...ph.matchAll(TICIMAX_RE)].map((m) => m[0]);
    const best = [...new Set(urls)].sort((a, b) => b.length - a.length)[0];
    if (best) return { source: 'kariyermutfak.com', page: rel, url: best };
  }
  return null;
}

async function tryBing(row) {
  const q = String(row.searchQuery || row.sku || '').trim();
  if (!q) return null;
  const { status, buf } = await httpBuf(
    `https://www.bing.com/images/search?q=${encodeURIComponent(q)}&form=HDRSC2&first=1`,
  );
  if (status !== 200) return null;
  const html = buf.toString('utf8');
  const urls = [];
  for (const m of html.matchAll(/murl&quot;:&quot;(https?:\/\/[^&]+?)&quot;/g)) {
    urls.push(m[1].replace(/\\u002f/g, '/'));
  }
  for (const m of html.matchAll(/"murl":"(https?:\/\/[^"]+)"/g)) {
    urls.push(m[1]);
  }
  for (const url of [...new Set(urls)].slice(0, 8)) {
    if (/logo|icon|favicon|\.svg|banner/i.test(url)) continue;
    const probe = await httpBuf(url);
    if (probe.status === 200 && probe.buf.length > 8000 && probe.type.startsWith('image/')) {
      return { source: 'bing.com', url };
    }
  }
  return null;
}

async function tryDuckDuckGo(row) {
  const q = String(row.searchQuery || row.sku || '').trim();
  if (!q) return null;
  const home = await httpBuf(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`);
  if (home.status !== 200) return null;
  const html = home.buf.toString('utf8');
  const m = html.match(/vqd=["']([^"']+)["']/) || html.match(/vqd=([\d-]+)/);
  if (!m) return null;
  const vqd = encodeURIComponent(m[1]);
  const { status, buf } = await httpBuf(
    `https://duckduckgo.com/i.js?o=json&q=${encodeURIComponent(q)}&vqd=${vqd}`,
  );
  if (status !== 200) return null;
  let data;
  try {
    data = JSON.parse(buf.toString('utf8'));
  } catch {
    return null;
  }
  const results = data.results || [];
  for (const r of results) {
    const url = r.image || r.thumbnail;
    if (!url || !/^https?:\/\//i.test(url)) continue;
    if (/logo|icon|banner|sprite|favicon|\.svg/i.test(url)) continue;
    const probe = await httpBuf(url);
    if (probe.status === 200 && probe.buf.length > 8000 && probe.type.startsWith('image/')) {
      return { source: 'duckduckgo', url, width: r.width, height: r.height };
    }
  }
  return null;
}

async function downloadImage(url, destPath) {
  const { status, buf, type } = await httpBuf(url);
  if (status !== 200 || buf.length < 4000 || !type.startsWith('image/')) return false;
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buf);
  return true;
}

async function main() {
  if (!fs.existsSync(REPORT)) {
    console.error('Önce: node scripts/report-yuksel-missing-images.mjs');
    process.exit(1);
  }
  const { missing } = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
  let items = missing.filter((x) => x.source === 'yerli');
  if (limit > 0) items = items.slice(0, limit);

  const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
  const bySku = new Map();
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    if (!String(p.kaynak_fiyat_listesi || '').includes('yuksel-2025-yerli')) continue;
    const sku = String(p.sku || p.model || '')
      .toUpperCase()
      .replace(/\s+/g, '');
    if (sku) bySku.set(sku, i);
  }

  const log = { at: new Date().toISOString(), ok: [], fail: [], skipped: [] };
  console.log('[yuksel-web-img] Denenecek:', items.length, DRY ? '(dry-run)' : '');

  for (let i = 0; i < items.length; i++) {
    const row = items[i];
    const skuKey = String(row.sku || '')
      .toUpperCase()
      .replace(/\s+/g, '');
    const destName = `yuksel-web-${slugSku(row.sku)}_1.jpg`;
    const dest = path.join(IMG_DIR, destName);
    const rel = `images/${destName}`;

    if (fs.existsSync(dest) && fs.statSync(dest).size > 4000) {
      log.skipped.push({ sku: row.sku, rel, reason: 'exists' });
      if (!DRY && bySku.has(skuKey)) catalog[bySku.get(skuKey)].images = [rel];
      continue;
    }

    let hit = await tryKariyer(row);
    if (!hit) hit = await tryBing(row);
    if (!hit) hit = await tryDuckDuckGo(row);

    if (!hit) {
      log.fail.push({ sku: row.sku, name: row.name, query: row.searchQuery });
      if ((i + 1) % 20 === 0) console.log('…', i + 1, '/', items.length);
      await new Promise((r) => setTimeout(r, delayMs));
      continue;
    }

    if (DRY) {
      log.ok.push({ sku: row.sku, rel, dry: true, ...hit });
      console.log('[dry]', row.sku, '←', hit.source, hit.url?.slice(0, 70));
    } else {
      const ok = await downloadImage(hit.url, dest);
      if (ok && bySku.has(skuKey)) {
        catalog[bySku.get(skuKey)].images = [rel];
        log.ok.push({ sku: row.sku, rel, bytes: fs.statSync(dest).size, ...hit });
        if ((log.ok.length % 10) === 0) console.log('✓', log.ok.length, row.sku);
      } else {
        log.fail.push({ sku: row.sku, name: row.name, reason: 'download-failed', ...hit });
      }
    }

    await new Promise((r) => setTimeout(r, delayMs));
  }

  // Aynı PDF sayfasında görseli olan kardeş üründen kopyala
  const pageImg = new Map();
  for (const p of catalog) {
    if (!String(p.kaynak_fiyat_listesi || '').includes('yuksel-2025-yerli')) continue;
    const img = (p.images || [])[0];
    if (!img || !fs.existsSync(path.join(ROOT, 'public', 'data', img.replace(/^\//, '')))) continue;
    const pg = p.page;
    if (pg != null && !pageImg.has(pg)) pageImg.set(pg, img);
  }
  let inherited = 0;
  for (const p of catalog) {
    if (!String(p.kaynak_fiyat_listesi || '').includes('yuksel-2025-yerli')) continue;
    const img = (p.images || [])[0];
    if (img && fs.existsSync(path.join(ROOT, 'public', 'data', img.replace(/^\//, '')))) continue;
    const rel = pageImg.get(p.page);
    if (!rel) continue;
    p.images = [rel];
    inherited++;
  }
  if (inherited) console.log('[yuksel-web-img] Sayfa ortak görseli:', inherited);

  if (!DRY) {
    fs.writeFileSync(CATALOG, JSON.stringify(catalog));
    try {
      const { execSync } = await import('node:child_process');
      execSync('node scripts/build-dept-catalog.mjs', { cwd: ROOT, stdio: 'inherit' });
    } catch (e) {
      console.warn('[yuksel-web-img] dept build:', e.message);
    }
  }

  fs.writeFileSync(LOG, JSON.stringify(log, null, 2) + '\n', 'utf8');
  console.log('[yuksel-web-img] OK:', log.ok.length, 'fail:', log.fail.length, 'skip:', log.skipped.length);
  console.log('[yuksel-web-img] Log:', LOG);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
