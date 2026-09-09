import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const OUT_DIR = resolve(__dirname, 'output');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const SITEMAP_INDEX = 'https://equsto.com/sitemap.xml';
const USER_AGENT = 'Mozilla/5.0 (compatible; EqustoSitemapAudit/1.0)';
const CONCURRENCY = 25;
const REQUEST_TIMEOUT = 8000;
const RETRIES = 2;
const RATE_LIMIT_MS = 50;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
});

async function fetchWithRetry(url, options = {}, attempt = 1) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'User-Agent': USER_AGENT, ...options.headers },
      redirect: 'manual',
    });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    if (attempt < RETRIES && (e.name === 'AbortError' || e.code === 'ECONNRESET' || e.code === 'ETIMEDOUT' || e.name === 'TimeoutError')) {
      await new Promise(r => setTimeout(r, 500 * attempt));
      return fetchWithRetry(url, options, attempt + 1);
    }
    throw e;
  }
}

async function fetchAllSitemaps() {
  const res = await fetchWithRetry(SITEMAP_INDEX);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const sitemaps = parsed.sitemapindex?.sitemap || [];
  return sitemaps.map(s => ({ url: s.loc, lastmod: s.lastmod }));
}

async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetchWithRetry(sitemapUrl);
  const xml = await res.text();
  const parsed = parser.parse(xml);
  const urls = parsed.urlset?.url || [];
  return urls.map(u => ({
    url: u.loc,
    lastmod: u.lastmod,
    changefreq: u.changefreq,
    priority: u.priority,
    sitemap: sitemapUrl,
  }));
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    u.hash = '';
    const params = [...u.searchParams.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    u.search = params.length ? '?' + new URLSearchParams(params).toString() : '';
    return u.toString();
  } catch {
    return url;
  }
}

function classifyUrlType(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    if (path.startsWith('/shop/') && path.match(/\/shop\/[^/]+\/[^/]+$/)) return 'PRODUCT';
    if (path.startsWith('/shop/marka/')) return 'BRAND';
    if (path.startsWith('/shop/') && path.match(/\/shop\/[^/]+(\?.*)?$/)) return 'CATEGORY';
    if (path.startsWith('/shop/')) return 'DEPARTMENT';
    if (path.startsWith('/blog') || path.startsWith('/rehber/')) return 'BLOG';
    if (path.startsWith('/projeler/')) return 'PROJECT';
    if (path.startsWith('/pfos/') || path.startsWith('/besos/')) return 'PFOS_BESOS';
    if (path === '/' || path === '/en' || path === '/en/') return 'HOME';
    return 'OTHER';
  } catch {
    return 'OTHER';
  }
}

function classifyHttpStatus(status) {
  if (status === 200) return '200';
  if (status >= 300 && status < 400) return '3xx';
  if (status === 404) return '404';
  if (status === 410) return '410';
  if (status >= 500) return '500+';
  if (status === 'TIMEOUT') return 'TIMEOUT';
  if (status === 'CONNECTION_ERROR') return 'CONNECTION_ERROR';
  if (status === 'ERROR') return 'ERROR';
  return String(status);
}

async function auditUrl(urlObj, semaphore) {
  await semaphore.acquire();
  try {
    const start = Date.now();
    const res = await fetchWithRetry(urlObj.url, { method: 'HEAD' });
    const elapsed = Date.now() - start;
    let finalUrl = urlObj.url;
    let redirectChain = [];
    let redirectCount = 0;
    let status = res.status;
    let statusText = res.statusText;

    while ([301, 302, 303, 307, 308].includes(res.status) && res.headers.get('location') && redirectCount < 10) {
      const loc = res.headers.get('location');
      redirectChain.push(loc);
      redirectCount++;
      const nextRes = await fetchWithRetry(loc, { method: 'HEAD' });
      res = nextRes;
      status = res.status;
      statusText = res.statusText;
      finalUrl = loc;
    }

    let canonical = null;
    let html = '';
    let contentType = res.headers.get('content-type') || '';
    let indexability = 'UNKNOWN';
    let metaRobots = null;
    let xRobotsTag = res.headers.get('x-robots-tag');

    if (status === 200 && contentType.includes('text/html')) {
      const htmlRes = await fetchWithRetry(finalUrl, { method: 'GET' });
      html = await htmlRes.text();
      const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      if (canonicalMatch) canonical = canonicalMatch[1];
      const metaRobotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
      if (metaRobotsMatch) metaRobots = metaRobotsMatch[1].toLowerCase();
    }

    if (status === 200 && contentType.includes('text/html')) {
      const hasNoIndex = metaRobots?.includes('noindex') || xRobotsTag?.includes('noindex');
      if (hasNoIndex) {
        indexability = 'NOINDEX';
      } else {
        indexability = 'INDEXABLE';
      }
    } else if (status === 200) {
      indexability = 'NON_HTML';
    } else {
      indexability = 'NON_INDEXABLE_STATUS';
    }

    let canonicalStatus = 'MISSING_CANONICAL';
    if (canonical) {
      const normCanonical = normalizeUrl(canonical);
      const normFinal = normalizeUrl(finalUrl);
      if (normCanonical === normFinal) {
        canonicalStatus = 'SELF_CANONICAL';
      } else {
        const canonUrl = new URL(canonical);
        const finalUrlObj = new URL(finalUrl);
        if (canonUrl.protocol !== finalUrlObj.protocol) {
          canonicalStatus = 'HTTP_CANONICAL';
        } else if (canonUrl.hostname.replace(/^www\./, '') !== finalUrlObj.hostname.replace(/^www\./, '')) {
          canonicalStatus = 'WWW_CANONICAL';
        } else if (redirectCount > 0) {
          canonicalStatus = 'REDIRECT_CANONICAL';
        } else if (canonUrl.search !== finalUrlObj.search) {
          canonicalStatus = 'PARAMETER_CANONICAL';
        } else {
          canonicalStatus = 'WRONG_CANONICAL';
        }
      }
    }

    return {
      ...urlObj,
      finalUrl,
      status,
      statusText,
      redirectChain: redirectChain.join(' -> '),
      redirectCount,
      elapsed,
      canonical,
      canonicalStatus,
      indexability,
      metaRobots,
      xRobotsTag,
      urlType: classifyUrlType(urlObj.url),
      normalizedUrl: normalizeUrl(urlObj.url),
      normalizedCanonical: canonical ? normalizeUrl(canonical) : '',
      httpStatusClass: classifyHttpStatus(status),
    };
  } catch (e) {
    let errorStatus = 'ERROR';
    if (e.name === 'AbortError' || e.name === 'TimeoutError') errorStatus = 'TIMEOUT';
    else if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND' || e.code === 'ECONNRESET') errorStatus = 'CONNECTION_ERROR';
    
    return {
      ...urlObj,
      finalUrl: urlObj.url,
      status: errorStatus,
      statusText: e.message,
      redirectChain: '',
      redirectCount: 0,
      elapsed: 0,
      canonical: '',
      canonicalStatus: 'ERROR',
      indexability: 'ERROR',
      metaRobots: '',
      xRobotsTag: '',
      urlType: classifyUrlType(urlObj.url),
      normalizedUrl: normalizeUrl(urlObj.url),
      normalizedCanonical: '',
      error: e.message,
      httpStatusClass: classifyHttpStatus(errorStatus),
    };
  } finally {
    semaphore.release();
  }
}

class Semaphore {
  constructor(limit) {
    this.limit = limit;
    this.current = 0;
    this.queue = [];
  }
  acquire() {
    return new Promise(resolve => {
      if (this.current < this.limit) {
        this.current++;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }
  release() {
    this.current--;
    if (this.queue.length > 0) {
      this.current++;
      this.queue.shift()();
    }
  }
}

async function main() {
  console.log('🔍 Discovering sitemaps from production...');
  const sitemaps = await fetchAllSitemaps();
  console.log(`Found ${sitemaps.length} sitemaps`);

  console.log('\n📥 Extracting URLs from all sitemaps...');
  let allUrls = [];
  for (const sm of sitemaps) {
    const urls = await fetchSitemapUrls(sm.url);
    allUrls.push(...urls);
    console.log(`  ${sm.url}: ${urls.length} URLs`);
    await new Promise(r => setTimeout(r, RATE_LIMIT_MS));
  }
  console.log(`\nTotal URLs extracted: ${allUrls.length}`);

  console.log('\n🌐 Auditing URLs with HTTP requests...');
  const semaphore = new Semaphore(CONCURRENCY);
  const results = [];
  const batchSize = 200;
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(u => auditUrl(u, semaphore)));
    results.push(...batchResults);
    if (i % 2000 === 0) console.log(`  Progress: ${Math.min(i + batchSize, allUrls.length)}/${allUrls.length}`);
  }

  console.log('\n🔍 Detecting duplicates...');
  const byNormUrl = new Map();
  const byNormCanonical = new Map();
  for (const r of results) {
    if (!byNormUrl.has(r.normalizedUrl)) byNormUrl.set(r.normalizedUrl, []);
    byNormUrl.get(r.normalizedUrl).push(r.url);
    if (r.normalizedCanonical) {
      if (!byNormCanonical.has(r.normalizedCanonical)) byNormCanonical.set(r.normalizedCanonical, []);
      byNormCanonical.get(r.normalizedCanonical).push(r.url);
    }
  }
  const duplicateUrls = [...byNormUrl.entries()].filter(([_, v]) => v.length > 1);
  const duplicateCanonicals = [...byNormCanonical.entries()].filter(([_, v]) => v.length > 1);

  console.log('\n📊 Generating output files...');

  const tsvHeaders = [
    'sitemap', 'url', 'url_type', 'lastmod',
    'http_status', 'final_url', 'redirect_count', 'redirect_chain',
    'canonical', 'canonical_status', 'indexable', 'robots_blocked',
    'meta_robots', 'x_robots_tag', 'issue', 'elapsed_ms'
  ];

  const tsvRows = [tsvHeaders.join('\t')];
  for (const r of results) {
    let issue = '';
    if (r.httpStatusClass === '404') issue = 'SITEMAP_URL_404';
    else if (r.httpStatusClass === '500+') issue = 'SITEMAP_URL_500';
    else if (r.redirectCount > 0) issue = 'SITEMAP_URL_REDIRECT';
    else if (r.canonicalStatus === 'WRONG_CANONICAL') issue = 'WRONG_CANONICAL';
    else if (r.canonicalStatus === 'MISSING_CANONICAL') issue = 'MISSING_CANONICAL';
    else if (r.indexability === 'NOINDEX') issue = 'NOINDEX';
    else if (r.httpStatusClass === 'TIMEOUT') issue = 'TIMEOUT';
    else if (r.httpStatusClass === 'CONNECTION_ERROR') issue = 'CONNECTION_ERROR';
    else if (r.error) issue = 'ERROR';

    const isDuplicate = byNormUrl.get(r.normalizedUrl)?.length > 1;
    if (isDuplicate && !issue) issue = 'DUPLICATE_URL';

    tsvRows.push(tsvHeaders.map(h => {
      let v = '';
      switch (h) {
        case 'sitemap': v = r.sitemap; break;
        case 'url': v = r.url; break;
        case 'url_type': v = r.urlType; break;
        case 'lastmod': v = r.lastmod || ''; break;
        case 'http_status': v = r.status; break;
        case 'final_url': v = r.finalUrl; break;
        case 'redirect_count': v = r.redirectCount; break;
        case 'redirect_chain': v = r.redirectChain; break;
        case 'canonical': v = r.canonical || ''; break;
        case 'canonical_status': v = r.canonicalStatus; break;
        case 'indexable': v = r.indexability; break;
        case 'robots_blocked': v = r.indexability === 'ROBOTS_BLOCKED' ? 'YES' : 'NO'; break;
        case 'meta_robots': v = r.metaRobots || ''; break;
        case 'x_robots_tag': v = r.xRobotsTag || ''; break;
        case 'issue': v = issue; break;
        case 'elapsed_ms': v = r.elapsed; break;
        default: v = r[h] ?? '';
      }
      return typeof v === 'string' ? v.replace(/\t/g, ' ').replace(/\n/g, ' ') : String(v);
    }).join('\t'));
  }
  writeFileSync(resolve(OUT_DIR, '01_SITEMAP_AUDIT.tsv'), tsvRows.join('\n'));
  console.log('  ✓ 01_SITEMAP_AUDIT.tsv');

  const errorRows = [['url', 'issue_type', 'http_status', 'final_url', 'canonical', 'details'].join('\t')];
  for (const r of results) {
    if (r.httpStatusClass !== '200' || r.redirectCount > 0 || r.canonicalStatus !== 'SELF_CANONICAL' ||
        r.indexability !== 'INDEXABLE' || r.error) {
      let issueType = '';
      if (r.httpStatusClass === '404') issueType = 'SITEMAP_URL_404';
      else if (r.httpStatusClass === '410') issueType = 'SITEMAP_URL_410';
      else if (r.httpStatusClass === '500+') issueType = 'SITEMAP_URL_500';
      else if (r.httpStatusClass === '3xx' && r.redirectCount > 0) issueType = 'SITEMAP_URL_REDIRECT';
      else if (r.redirectCount > 1) issueType = 'SITEMAP_URL_REDIRECT_CHAIN';
      else if (r.canonicalStatus === 'WRONG_CANONICAL') issueType = 'WRONG_CANONICAL';
      else if (r.canonicalStatus === 'MISSING_CANONICAL') issueType = 'MISSING_CANONICAL';
      else if (r.canonicalStatus === 'HTTP_CANONICAL') issueType = 'HTTP_CANONICAL';
      else if (r.canonicalStatus === 'WWW_CANONICAL') issueType = 'WWW_CANONICAL';
      else if (r.canonicalStatus === 'REDIRECT_CANONICAL') issueType = 'REDIRECT_CANONICAL';
      else if (r.canonicalStatus === 'PARAMETER_CANONICAL') issueType = 'PARAMETER_CANONICAL';
      else if (r.indexability === 'NOINDEX') issueType = 'NOINDEX';
      else if (r.httpStatusClass === 'TIMEOUT') issueType = 'TIMEOUT';
      else if (r.httpStatusClass === 'CONNECTION_ERROR') issueType = 'CONNECTION_ERROR';
      else if (r.error) issueType = 'ERROR';
      else issueType = 'OTHER';

      errorRows.push([
        r.url, issueType, r.status, r.finalUrl, r.canonical || '', r.error || ''
      ].map(v => String(v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'));
    }
  }
  writeFileSync(resolve(OUT_DIR, '02_SITEMAP_ERRORS.tsv'), errorRows.join('\n'));
  console.log('  ✓ 02_SITEMAP_ERRORS.tsv');

  const redirectRows = [['url', 'http_status', 'final_url', 'redirect_count', 'redirect_chain', 'canonical'].join('\t')];
  for (const r of results) {
    if (r.redirectCount > 0) {
      redirectRows.push([
        r.url, r.status, r.finalUrl, r.redirectCount, r.redirectChain, r.canonical || ''
      ].map(v => String(v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'));
    }
  }
  writeFileSync(resolve(OUT_DIR, '03_SITEMAP_REDIRECTS.tsv'), redirectRows.join('\n'));
  console.log('  ✓ 03_SITEMAP_REDIRECTS.tsv');

  const canonicalRows = [['url', 'canonical', 'issue_type'].join('\t')];
  for (const r of results) {
    if (r.canonicalStatus !== 'SELF_CANONICAL' && r.canonicalStatus !== 'MISSING_CANONICAL' && r.canonicalStatus !== 'NON_HTML' && r.canonicalStatus !== 'ERROR') {
      canonicalRows.push([r.url, r.canonical, r.canonicalStatus].map(v => String(v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'));
    }
  }
  writeFileSync(resolve(OUT_DIR, '04_SITEMAP_CANONICAL_ISSUES.tsv'), canonicalRows.join('\n'));
  console.log('  ✓ 04_SITEMAP_CANONICAL_ISSUES.tsv');

  const noindexRows = [['url', 'http_status', 'robots', 'reason'].join('\t')];
  for (const r of results) {
    if (r.indexability === 'NOINDEX') {
      noindexRows.push([r.url, r.status, r.metaRobots || r.xRobotsTag || '', 'meta_robots_noindex'].map(v => String(v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t'));
    }
  }
  writeFileSync(resolve(OUT_DIR, '05_SITEMAP_NOINDEX.tsv'), noindexRows.join('\n'));
  console.log('  ✓ 05_SITEMAP_NOINDEX.tsv');

  const summary = {
    timestamp: new Date().toISOString(),
    total_sitemap_files: sitemaps.length,
    total_urls: results.length,
    http_200: results.filter(r => r.httpStatusClass === '200').length,
    http_3xx: results.filter(r => r.httpStatusClass === '3xx').length,
    http_404: results.filter(r => r.httpStatusClass === '404').length,
    http_410: results.filter(r => r.httpStatusClass === '410').length,
    http_500_plus: results.filter(r => r.httpStatusClass === '500+').length,
    timeouts: results.filter(r => r.httpStatusClass === 'TIMEOUT').length,
    connection_errors: results.filter(r => r.httpStatusClass === 'CONNECTION_ERROR').length,
    self_canonical: results.filter(r => r.canonicalStatus === 'SELF_CANONICAL').length,
    wrong_canonical: results.filter(r => r.canonicalStatus === 'WRONG_CANONICAL').length,
    missing_canonical: results.filter(r => r.canonicalStatus === 'MISSING_CANONICAL').length,
    http_canonical: results.filter(r => r.canonicalStatus === 'HTTP_CANONICAL').length,
    www_canonical: results.filter(r => r.canonicalStatus === 'WWW_CANONICAL').length,
    redirect_canonical: results.filter(r => r.canonicalStatus === 'REDIRECT_CANONICAL').length,
    parameter_canonical: results.filter(r => r.canonicalStatus === 'PARAMETER_CANONICAL').length,
    indexable: results.filter(r => r.indexability === 'INDEXABLE').length,
    noindex: results.filter(r => r.indexability === 'NOINDEX').length,
    robots_blocked: results.filter(r => r.indexability === 'ROBOTS_BLOCKED').length,
    noindex_and_robots_blocked: results.filter(r => r.indexability === 'NOINDEX_AND_ROBOTS_BLOCKED').length,
    duplicate_urls: duplicateUrls.length,
    product_urls: results.filter(r => r.urlType === 'PRODUCT').length,
    category_urls: results.filter(r => r.urlType === 'CATEGORY').length,
    brand_urls: results.filter(r => r.urlType === 'BRAND').length,
    department_urls: results.filter(r => r.urlType === 'DEPARTMENT').length,
    blog_urls: results.filter(r => r.urlType === 'BLOG').length,
    project_urls: results.filter(r => r.urlType === 'PROJECT').length,
    pfos_besos_urls: results.filter(r => r.urlType === 'PFOS_BESOS').length,
    home_urls: results.filter(r => r.urlType === 'HOME').length,
    other_urls: results.filter(r => r.urlType === 'OTHER').length,
    critical_issues: results.filter(r => r.httpStatusClass === '404' || r.httpStatusClass === '500+' || r.httpStatusClass === 'CONNECTION_ERROR').length,
    high_issues: results.filter(r => r.redirectCount > 0 || r.canonicalStatus === 'WRONG_CANONICAL' || r.indexability === 'NOINDEX').length,
    medium_issues: results.filter(r => r.canonicalStatus === 'MISSING_CANONICAL' || r.canonicalStatus === 'REDIRECT_CANONICAL' || r.canonicalStatus === 'HTTP_CANONICAL' || r.canonicalStatus === 'WWW_CANONICAL' || r.canonicalStatus === 'PARAMETER_CANONICAL').length,
  };

  writeFileSync(resolve(OUT_DIR, '06_SITEMAP_SUMMARY.json'), JSON.stringify(summary, null, 2));
  console.log('  ✓ 06_SITEMAP_SUMMARY.json');

  console.log('\n✅ Audit complete!');
  console.log(`Output files in: ${OUT_DIR}`);
  console.log('\n📋 SUMMARY:');
  console.log(`  Sitemap files: ${summary.total_sitemap_files}`);
  console.log(`  Total URLs: ${summary.total_urls}`);
  console.log(`  HTTP 200: ${summary.http_200}`);
  console.log(`  HTTP 3xx: ${summary.http_3xx}`);
  console.log(`  HTTP 404: ${summary.http_404}`);
  console.log(`  HTTP 410: ${summary.http_410}`);
  console.log(`  HTTP 500+: ${summary.http_500_plus}`);
  console.log(`  Timeouts: ${summary.timeouts}`);
  console.log(`  Connection Errors: ${summary.connection_errors}`);
  console.log(`  Self Canonical: ${summary.self_canonical}`);
  console.log(`  Wrong Canonical: ${summary.wrong_canonical}`);
  console.log(`  Missing Canonical: ${summary.missing_canonical}`);
  console.log(`  Indexable: ${summary.indexable}`);
  console.log(`  Noindex: ${summary.noindex}`);
  console.log(`  Robots Blocked: ${summary.robots_blocked}`);
  console.log(`  Duplicate URL groups: ${summary.duplicate_urls}`);
  console.log(`  Critical Issues: ${summary.critical_issues}`);
  console.log(`  High Issues: ${summary.high_issues}`);
  console.log(`  Medium Issues: ${summary.medium_issues}`);
  console.log('\n  By URL Type:');
  console.log(`    Product: ${summary.product_urls}`);
  console.log(`    Category: ${summary.category_urls}`);
  console.log(`    Brand: ${summary.brand_urls}`);
  console.log(`    Department: ${summary.department_urls}`);
  console.log(`    Blog: ${summary.blog_urls}`);
  console.log(`    Project: ${summary.project_urls}`);
  console.log(`    PFOS/BESOS: ${summary.pfos_besos_urls}`);
  console.log(`    Home: ${summary.home_urls}`);
  console.log(`    Other: ${summary.other_urls}`);
}

main().catch(console.error);