#!/usr/bin/env node
/**
 * Equsto Sitemap Audit Script
 * 
 * Performs comprehensive SEO audit of all sitemap URLs:
 * - HTTP status & redirects
 * - Canonical validation
 * - Indexability check
 * - Duplicate detection
 * - URL type classification
 * 
 * Usage: node scripts/seo/sitemap-audit.mjs
 * 
 * Output files:
 * - 01_SITEMAP_AUDIT.tsv
 * - 02_SITEMAP_ERRORS.tsv
 * - 03_SITEMAP_REDIRECTS.tsv
 * - 04_SITEMAP_CANONICAL_ISSUES.tsv
 * - 05_SITEMAP_NOINDEX.tsv
 * - 06_SITEMAP_SUMMARY.json
 */

import { fetch } from 'undici';
import { parseStringPromise } from 'xml2js';
import { createWriteStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ============ CONFIGURATION ============
const CONFIG = {
  baseUrl: 'https://equsto.com',
  sitemapIndexUrl: 'https://equsto.com/sitemap.xml',
  concurrency: 20,           // Max concurrent requests (increased)
  timeout: 15000,            // Request timeout (ms)
  maxRetries: 2,             // Retry failed requests
  retryDelay: 1000,          // Base delay between retries (ms)
  rateLimitDelay: 20,        // Delay between request batches (ms) - reduced
  userAgent: 'Equsto-Sitemap-Audit/1.0 (+https://equsto.com)',
  outputDir: resolve(__dirname, '../../audit'),
};

// ============ UTILITIES ============
class RateLimiter {
  constructor(concurrency, delayMs) {
    this.concurrency = concurrency;
    this.delayMs = delayMs;
    this.running = 0;
    this.queue = [];
  }

  async acquire() {
    if (this.running < this.concurrency) {
      this.running++;
      return;
    }
    return new Promise(resolve => this.queue.push(resolve));
  }

  release() {
    this.running--;
    if (this.queue.length > 0) {
      this.running++;
      const next = this.queue.shift();
      next();
    }
  }

  async wait() {
    await new Promise(r => setTimeout(r, this.delayMs));
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    // Normalize: lowercase host, remove default ports, remove fragment
    u.host = u.host.toLowerCase();
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) {
      u.port = '';
    }
    u.hash = '';
    // Sort query params for consistent comparison
    if (u.search) {
      const params = new URLSearchParams(u.search);
      const sorted = new URLSearchParams([...params.entries()].sort());
      u.search = sorted.toString();
    }
    // Remove trailing slash for non-root paths
    if (u.pathname.length > 1 && u.pathname.endsWith('/')) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.toString();
  } catch {
    return url;
  }
}

function classifyUrlType(url) {
  try {
    const u = new URL(url);
    const path = u.pathname.toLowerCase();
    
    if (path.startsWith('/shop/')) {
      if (path.includes('/marka/')) return 'BRAND';
      if (path.match(/^\/shop\/[^\/]+$/)) return 'DEPARTMENT';
      if (path.match(/^\/shop\/[^\/]+\?tip=/)) return 'CATEGORY'; // subcategory with tip param
      if (path.match(/^\/shop\/[^\/]+\/[^\/]+$/)) return 'PRODUCT';
      if (path.match(/^\/shop\/[^\/]+\/[^\/]+\?tip=/)) return 'CATEGORY';
      return 'OTHER';
    }
    if (path.startsWith('/blog') || path.startsWith('/rehber')) return 'BLOG';
    if (path === '/' || path === '') return 'HOME';
    return 'OTHER';
  } catch {
    return 'OTHER';
  }
}

function classifyCanonical(sitemapUrl, canonical) {
  if (!canonical) return 'MISSING_CANONICAL';
  
  const normSitemap = normalizeUrl(sitemapUrl);
  const normCanonical = normalizeUrl(canonical);
  
  if (normSitemap === normCanonical) return 'SELF_CANONICAL';
  
  // Check for common mismatch patterns
  const sitemapUrlObj = new URL(sitemapUrl);
  const canonicalObj = new URL(canonical);
  
  if (sitemapUrlObj.protocol !== canonicalObj.protocol) return 'HTTP_CANONICAL';
  if ((sitemapUrlObj.hostname.startsWith('www.') !== canonicalObj.hostname.startsWith('www.'))) return 'WWW_CANONICAL';
  
  // Check if canonical redirects
  // This would need HTTP check, for now just flag as WRONG
  return 'WRONG_CANONICAL';
}

// ============ SITEMAP PARSING ============
async function fetchSitemapIndex(url) {
  const res = await fetch(url, { headers: { 'User-Agent': CONFIG.userAgent } });
  if (!res.ok) throw new Error(`Failed to fetch sitemap index: ${res.status}`);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  
  const sitemaps = [];
  // Handle namespace-prefixed keys
  const sitemapIndex = parsed['sitemapindex'] || parsed['sitemapindex:'];
  if (sitemapIndex?.sitemap) {
    const items = Array.isArray(sitemapIndex.sitemap) 
      ? sitemapIndex.sitemap 
      : [sitemapIndex.sitemap];
    for (const item of items) {
      // With explicitArray: false, loc is a string, not array
      const loc = item['loc'] || item['sitemap:loc'];
      const lastmod = item['lastmod'] || item['sitemap:lastmod'];
      if (loc) sitemaps.push({ loc, lastmod });
    }
  }
  return sitemaps;
}

async function fetchSitemapUrls(url) {
  const res = await fetch(url, { headers: { 'User-Agent': CONFIG.userAgent } });
  if (!res.ok) throw new Error(`Failed to fetch sitemap: ${res.status} ${url}`);
  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  
  const urls = [];
  // Handle namespace-prefixed keys
  const urlset = parsed['urlset'] || parsed['urlset:'];
  if (urlset?.url) {
    const items = Array.isArray(urlset.url) 
      ? urlset.url 
      : [urlset.url];
    for (const item of items) {
      // With explicitArray: false, these are strings, not arrays
      const loc = item['loc'] || item['url:loc'];
      const lastmod = item['lastmod'] || item['url:lastmod'];
      const changefreq = item['changefreq'] || item['url:changefreq'];
      const priority = item['priority'] || item['url:priority'];
      if (loc) urls.push({ loc, lastmod, changefreq, priority });
    }
  }
  return urls;
}

// ============ HTTP AUDIT ============
async function auditUrl(limiter, url, sitemapSource, lastmod) {
  // followRedirects handles its own rate limiting
  let attempt = 0;
  let lastError = null;
  
  while (attempt <= CONFIG.maxRetries) {
    try {
      // Use followRedirects which does GET and follows redirects
      const result = await followRedirects(url, limiter);
      result.sitemap = sitemapSource;
      result.lastmod = lastmod;
      result.url_type = classifyUrlType(url);
      return result;
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= CONFIG.maxRetries) {
        await new Promise(r => setTimeout(r, CONFIG.retryDelay * attempt));
      }
    }
  }
  
  return {
    sitemap: sitemapSource,
    url,
    lastmod,
    url_type: classifyUrlType(url),
    http_status: 'ERROR',
    final_url: url,
    redirect_count: 0,
    redirect_chain: [],
    canonical: null,
    canonical_status: 'ERROR',
    indexable: 'ERROR',
    robots_blocked: false,
    meta_robots: null,
    x_robots_tag: null,
    issue: `Connection error after ${CONFIG.maxRetries + 1} attempts: ${lastError.message}`
  };
}

async function followRedirects(initialUrl, limiter) {
  const chain = [];
  let currentUrl = initialUrl;
  let redirectCount = 0;
  const maxRedirects = 10;
  let finalResponse = null;
  let limiterAcquired = false;
  
  while (redirectCount < maxRedirects) {
    await limiter.acquire();
    limiterAcquired = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);
      
      const res = await fetch(currentUrl, {
        method: 'GET',
        headers: { 'User-Agent': CONFIG.userAgent },
        redirect: 'manual',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      chain.push({ url: currentUrl, status: res.status });
      
      const location = res.headers.get('location');
      const isRedirect = [301, 302, 303, 307, 308].includes(res.status);
      
      if (isRedirect && location && redirectCount < maxRedirects - 1) {
        redirectCount++;
        currentUrl = new URL(location, currentUrl).toString();
        limiter.release();
        limiterAcquired = false;
        await limiter.wait();
        continue;
      }
      
      // Final response - get full content for canonical/indexability check
      finalResponse = res;
      break;
    } catch (err) {
      if (limiterAcquired) {
        limiter.release();
        limiterAcquired = false;
      }
      return {
        http_status: 'ERROR',
        final_url: currentUrl,
        redirect_count: redirectCount,
        redirect_chain: chain,
        canonical: null,
        canonical_status: 'ERROR',
        indexable: 'ERROR',
        robots_blocked: false,
        meta_robots: null,
        x_robots_tag: null,
        issue: `Request failed: ${err.message}`
      };
    }
  }
  
  if (limiterAcquired) {
    limiter.release();
    limiterAcquired = false;
  }
  
  if (!finalResponse) {
    return {
      http_status: 'ERROR',
      final_url: currentUrl,
      redirect_count: redirectCount,
      redirect_chain: chain,
      canonical: null,
      canonical_status: 'ERROR',
      indexable: 'ERROR',
      robots_blocked: false,
      meta_robots: null,
      x_robots_tag: null,
      issue: 'Max redirects exceeded or no response'
    };
  }
  
  const httpStatus = finalResponse.status;
  const finalUrl = currentUrl;
  
  // Get HTML content for canonical and indexability checks (only for 200 HTML)
  let canonical = null;
  let metaRobots = null;
  let xRobotsTag = finalResponse.headers.get('x-robots-tag');
  let indexable = 'INDEXABLE';
  let robotsBlocked = false;
  let canonicalStatus = 'MISSING_CANONICAL';
  let issue = null;
  
  if (httpStatus === 200) {
    const contentType = finalResponse.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await finalResponse.text();
      
      // Extract canonical
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      if (canonicalMatch) {
        canonical = canonicalMatch[1];
        canonicalStatus = classifyCanonical(finalUrl, canonical);
      }
      
      // Extract meta robots
      const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']+)["']/i);
      if (robotsMatch) {
        metaRobots = robotsMatch[1].toLowerCase();
        if (metaRobots.includes('noindex')) {
          indexable = 'NOINDEX';
        }
      }
      
      // Check X-Robots-Tag
      if (xRobotsTag && xRobotsTag.toLowerCase().includes('noindex')) {
        indexable = indexable === 'NOINDEX' ? 'NOINDEX_AND_ROBOTS_BLOCKED' : 'NOINDEX';
      }
    }
  } else if (httpStatus >= 400) {
    issue = `HTTP ${httpStatus}`;
  }
  
  // Check robots.txt blocking (simplified - would need robots.txt parser for full check)
  // For now, skip - would need to parse robots.txt
  
  return {
    http_status: httpStatus.toString(),
    final_url: finalUrl,
    redirect_count: redirectCount,
    redirect_chain: chain,
    canonical,
    canonical_status: canonicalStatus,
    indexable,
    robots_blocked: robotsBlocked,
    meta_robots: metaRobots,
    x_robots_tag: xRobotsTag,
    issue
  };
}

// ============ MAIN AUDIT ============
async function runAudit() {
  console.log('🚀 Starting Equsto Sitemap Audit...\n');
  
  // Step 1: Fetch sitemap index
  console.log('📋 Fetching sitemap index...');
  const sitemaps = await fetchSitemapIndex(CONFIG.sitemapIndexUrl);
  console.log(`Found ${sitemaps.length} child sitemaps\n`);
  
  // Step 2: Fetch all URLs from all sitemaps
  console.log('📥 Fetching all sitemap URLs...');
  const allUrls = [];
  for (const sitemap of sitemaps) {
    try {
      const urls = await fetchSitemapUrls(sitemap.loc);
      for (const u of urls) {
        allUrls.push({
          sitemap: sitemap.loc,
          url: u.loc,
          lastmod: u.lastmod
        });
      }
      console.log(`  ${sitemap.loc}: ${urls.length} URLs`);
    } catch (err) {
      console.error(`  Failed to fetch ${sitemap.loc}: ${err.message}`);
    }
  }
  console.log(`\nTotal URLs to audit: ${allUrls.length}\n`);
  
  // Step 3: Audit all URLs with concurrency control
  console.log('🔍 Auditing URLs...');
  const limiter = new RateLimiter(CONFIG.concurrency, CONFIG.rateLimitDelay);
  const results = [];
  
  // Process in batches with controlled concurrency
  const batchSize = 100;
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    console.log(`  Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allUrls.length/batchSize)} (${batch.length} URLs)...`);
    
    // Process batch with concurrency control using the limiter
    const batchResults = [];
    for (const u of batch) {
      await limiter.acquire();
      const promise = auditUrl(limiter, u.url, u.sitemap, u.lastmod).finally(() => {
        limiter.release();
        // Small delay to respect rate limit
        return new Promise(r => setTimeout(r, CONFIG.rateLimitDelay));
      });
      batchResults.push(promise);
    }
    const resolved = await Promise.all(batchResults);
    results.push(...resolved);
    
    const completed = Math.min(i + batchSize, allUrls.length);
    const progress = ((completed / allUrls.length) * 100).toFixed(1);
    console.log(`  Progress: ${completed}/${allUrls.length} (${progress}%)`);
  }
  
  console.log('\n✅ Audit complete. Generating reports...\n');
  
  // Step 4: Detect duplicates
  // Pass sitemaps to summary
  const sitemapCount = sitemaps.length;
  const urlMap = new Map();
  const canonicalMap = new Map();
  
  for (const r of results) {
    const norm = normalizeUrl(r.url);
    if (!urlMap.has(norm)) urlMap.set(norm, []);
    urlMap.get(norm).push(r.url);
    
    if (r.canonical) {
      const normCanon = normalizeUrl(r.canonical);
      if (!canonicalMap.has(normCanon)) canonicalMap.set(normCanon, []);
      canonicalMap.get(normCanon).push(r.url);
    }
  }
  
  // Add duplicate info to results
  for (const r of results) {
    const norm = normalizeUrl(r.url);
    const duplicates = urlMap.get(norm) || [];
    const canonDuplicates = r.canonical ? (canonicalMap.get(normalizeUrl(r.canonical)) || []) : [];
    
    r.is_duplicate_url = duplicates.length > 1;
    r.duplicate_urls = duplicates.filter(u => u !== r.url).join('; ');
    r.is_duplicate_canonical = canonDuplicates.length > 1;
    r.duplicate_canonical_urls = canonDuplicates.filter(u => u !== r.url).join('; ');
  }
  
  // Step 5: Generate output files
  await generateReports(results, sitemapCount);
  
  // Step 6: Print summary
  printSummary(results, sitemapCount);
}

async function generateReports(results, sitemapCount) {
  const fs = await import('fs');
  const path = await import('path');
  
  // Ensure output directory exists
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Helper to write TSV
  function writeTsv(filename, headers, rows) {
    const filePath = path.join(CONFIG.outputDir, filename);
    const ws = createWriteStream(filePath);
    ws.write(headers.join('\t') + '\n');
    for (const row of rows) {
      ws.write(headers.map(h => (row[h] ?? '').toString().replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t') + '\n');
    }
    ws.end();
    return new Promise(resolve => ws.on('finish', resolve));
  }
  
  // 01_SITEMAP_AUDIT.tsv - All URLs
  const auditHeaders = [
    'sitemap', 'url', 'url_type', 'lastmod',
    'http_status', 'final_url', 'redirect_count',
    'canonical', 'canonical_status',
    'indexable', 'robots_blocked', 'meta_robots', 'x_robots_tag',
    'is_duplicate_url', 'duplicate_urls',
    'is_duplicate_canonical', 'duplicate_canonical_urls',
    'issue'
  ];
  
  await writeTsv('01_SITEMAP_AUDIT.tsv', auditHeaders, results);
  
  // 02_SITEMAP_ERRORS.tsv - Problematic URLs
  const errorResults = results.filter(r => 
    r.http_status !== '200' || 
    r.canonical_status !== 'SELF_CANONICAL' || 
    r.indexable !== 'INDEXABLE' ||
    r.is_duplicate_url ||
    r.is_duplicate_canonical
  );
  const errorHeaders = ['url', 'issue_type', 'http_status', 'final_url', 'canonical', 'details'];
  const errorRows = errorResults.map(r => ({
    url: r.url,
    issue_type: r.http_status !== '200' ? `HTTP_${r.http_status}` : 
                r.canonical_status !== 'SELF_CANONICAL' ? r.canonical_status :
                r.indexable !== 'INDEXABLE' ? r.indexable :
                r.is_duplicate_url ? 'DUPLICATE_URL' : 'DUPLICATE_CANONICAL',
    http_status: r.http_status,
    final_url: r.final_url,
    canonical: r.canonical || '',
    details: r.issue || ''
  }));
  await writeTsv('02_SITEMAP_ERRORS.tsv', errorHeaders, errorRows);
  
  // 03_SITEMAP_REDIRECTS.tsv - Redirect URLs
  const redirectResults = results.filter(r => r.redirect_count > 0);
  const redirectHeaders = ['url', 'http_status', 'final_url', 'redirect_count', 'canonical'];
  const redirectRows = redirectResults.map(r => ({
    url: r.url,
    http_status: r.http_status,
    final_url: r.final_url,
    redirect_count: r.redirect_count,
    canonical: r.canonical || ''
  }));
  await writeTsv('03_SITEMAP_REDIRECTS.tsv', redirectHeaders, redirectRows);
  
  // 04_SITEMAP_CANONICAL_ISSUES.tsv - Canonical mismatches
  const canonicalResults = results.filter(r => r.canonical_status !== 'SELF_CANONICAL' && r.canonical_status !== 'MISSING_CANONICAL' && r.canonical_status !== 'ERROR');
  const canonicalHeaders = ['url', 'canonical', 'issue_type'];
  const canonicalRows = canonicalResults.map(r => ({
    url: r.url,
    canonical: r.canonical,
    issue_type: r.canonical_status
  }));
  await writeTsv('04_SITEMAP_CANONICAL_ISSUES.tsv', canonicalHeaders, canonicalRows);
  
  // 05_SITEMAP_NOINDEX.tsv - Noindex/robots blocked
  const noindexResults = results.filter(r => r.indexable !== 'INDEXABLE' && r.indexable !== 'ERROR');
  const noindexHeaders = ['url', 'http_status', 'robots', 'reason'];
  const noindexRows = noindexResults.map(r => ({
    url: r.url,
    http_status: r.http_status,
    robots: r.x_robots_tag || r.meta_robots || '',
    reason: r.indexable
  }));
  await writeTsv('05_SITEMAP_NOINDEX.tsv', noindexHeaders, noindexRows);
  
  // 06_SITEMAP_SUMMARY.json
  const summary = generateSummary(results, sitemapCount);
  const summaryPath = path.join(CONFIG.outputDir, '06_SITEMAP_SUMMARY.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  
  console.log(`\n📁 Reports saved to: ${CONFIG.outputDir}`);
}

function generateSummary(results, sitemapCount) {
  const total = results.length;
  const byStatus = {};
  const byCanonical = {};
  const byIndexable = {};
  const byType = {};
  
  let duplicateUrls = 0;
  let duplicateCanonicals = 0;
  
  for (const r of results) {
    // HTTP status
    byStatus[r.http_status] = (byStatus[r.http_status] || 0) + 1;
    
    // Canonical
    byCanonical[r.canonical_status] = (byCanonical[r.canonical_status] || 0) + 1;
    
    // Indexable
    byIndexable[r.indexable] = (byIndexable[r.indexable] || 0) + 1;
    
    // URL type
    byType[r.url_type] = (byType[r.url_type] || 0) + 1;
    
    if (r.is_duplicate_url) duplicateUrls++;
    if (r.is_duplicate_canonical) duplicateCanonicals++;
  }
  
  // Count unique duplicate groups
  const urlGroups = new Map();
  const canonGroups = new Map();
  for (const r of results) {
    const norm = normalizeUrl(r.url);
    if (!urlGroups.has(norm)) urlGroups.set(norm, 0);
    urlGroups.set(norm, urlGroups.get(norm) + 1);
    
    if (r.canonical) {
      const normCanon = normalizeUrl(r.canonical);
      if (!canonGroups.has(normCanon)) canonGroups.set(normCanon, 0);
      canonGroups.set(normCanon, canonGroups.get(normCanon) + 1);
    }
  }
  
  const duplicateUrlGroups = [...urlGroups.values()].filter(c => c > 1).length;
  const duplicateCanonGroups = [...canonGroups.values()].filter(c => c > 1).length;
  
  // Critical/High/Medium issues
  const critical = results.filter(r => 
    r.http_status === '404' || r.http_status === '500' || r.http_status === '502' || r.http_status === '503'
  ).length;
  const high = results.filter(r => 
    r.http_status.startsWith('3') || r.canonical_status === 'WRONG_CANONICAL'
  ).length;
  const medium = results.filter(r => 
    r.indexable === 'NOINDEX' || r.is_duplicate_url || r.is_duplicate_canonical
  ).length;
  
  return {
    total_sitemap_files: sitemapCount,
    total_urls: total,
    http_200: byStatus['200'] || 0,
    http_3xx: Object.keys(byStatus).filter(k => k.startsWith('3')).reduce((a, k) => a + byStatus[k], 0),
    http_404: byStatus['404'] || 0,
    http_410: byStatus['410'] || 0,
    http_500_plus: Object.keys(byStatus).filter(k => parseInt(k) >= 500).reduce((a, k) => a + (byStatus[k] || 0), 0),
    timeouts: byStatus['TIMEOUT'] || 0,
    connection_errors: byStatus['ERROR'] || 0,
    self_canonical: byCanonical['SELF_CANONICAL'] || 0,
    wrong_canonical: byCanonical['WRONG_CANONICAL'] || 0,
    missing_canonical: byCanonical['MISSING_CANONICAL'] || 0,
    indexable: byIndexable['INDEXABLE'] || 0,
    noindex: byIndexable['NOINDEX'] || 0,
    robots_blocked: byIndexable['ROBOTS_BLOCKED'] || 0,
    duplicate_urls: duplicateUrlGroups,
    duplicate_canonicals: duplicateCanonGroups,
    product_urls: byType['PRODUCT'] || 0,
    category_urls: byType['CATEGORY'] || 0,
    brand_urls: byType['BRAND'] || 0,
    department_urls: byType['DEPARTMENT'] || 0,
    blog_urls: byType['BLOG'] || 0,
    other_urls: byType['OTHER'] || 0,
    critical_issues: critical,
    high_issues: high,
    medium_issues: medium
  };
}

function printSummary(results, sitemapCount) {
  const summary = generateSummary(results, sitemapCount);
  
  console.log('\n═══════════════════════════════════════════════════');
  console.log('           SITEMAP AUDIT SONUCU');
  console.log('═══════════════════════════════════════════════════');
  
  console.log(`\nSitemap dosyaları: ${summary.total_sitemap_files || 'N/A'}`);
  console.log(`Toplam URL: ${summary.total_urls}`);
  
  console.log('\nHTTP:');
  console.log(`  200: ${summary.http_200}`);
  console.log(`  3xx: ${summary.http_3xx}`);
  console.log(`  404: ${summary.http_404}`);
  console.log(`  410: ${summary.http_410}`);
  console.log(`  500+: ${summary.http_500_plus}`);
  console.log(`  Timeout/Error: ${summary.timeouts + summary.connection_errors}`);
  
  console.log('\nCanonical:');
  console.log(`  Self: ${summary.self_canonical}`);
  console.log(`  Wrong: ${summary.wrong_canonical}`);
  console.log(`  Missing: ${summary.missing_canonical}`);
  
  console.log('\nIndexability:');
  console.log(`  Indexable: ${summary.indexable}`);
  console.log(`  Noindex: ${summary.noindex}`);
  console.log(`  Robots blocked: ${summary.robots_blocked}`);
  
  console.log('\nDuplicate:');
  console.log(`  URL groups: ${summary.duplicate_urls}`);
  console.log(`  Canonical groups: ${summary.duplicate_canonicals}`);
  
  console.log('\nURL türleri:');
  console.log(`  Product: ${summary.product_urls}`);
  console.log(`  Category: ${summary.category_urls}`);
  console.log(`  Brand: ${summary.brand_urls}`);
  console.log(`  Department: ${summary.department_urls}`);
  console.log(`  Blog: ${summary.blog_urls}`);
  console.log(`  Other: ${summary.other_urls}`);
  
  console.log('\nEN ÖNEMLİ HATALAR:');
  const errors = results.filter(r => r.http_status !== '200' || r.canonical_status !== 'SELF_CANONICAL' || r.indexable !== 'INDEXABLE')
    .slice(0, 5);
  errors.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.url} — ${e.issue || e.canonical_status || e.indexable} (${e.http_status})`);
  });
  
  console.log('\nOluşturulan dosyalar:');
  console.log('  01_SITEMAP_AUDIT.tsv');
  console.log('  02_SITEMAP_ERRORS.tsv');
  console.log('  03_SITEMAP_REDIRECTS.tsv');
  console.log('  04_SITEMAP_CANONICAL_ISSUES.tsv');
  console.log('  05_SITEMAP_NOINDEX.tsv');
  console.log('  06_SITEMAP_SUMMARY.json');
}

// ============ RUN ============
runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});