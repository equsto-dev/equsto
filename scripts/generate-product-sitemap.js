#!/usr/bin/env node
/**
 * Product Sitemap Generator for Equsto.com
 * Reads all department JSON files and generates sitemap with canonical PDP URLs
 * Uses equstoPage as the single canonical source
 */

const fs = require('fs');
const path = require('path');

const DEPT_DIR = path.join(__dirname, '..', 'E-TICARET', 'site', 'public', 'data', 'dept');
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'sitemap-products.xml');
const BASE_URL = 'https://equsto.com';

function slugifyEq(s) {
  const tr = {
    'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u',
    'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c', 'Â': 'a', 'Î': 'i', 'Û': 'u'
  };
  return String(s || '').toLowerCase()
    .replace(/[ğüşıöçâîûĞÜŞİÖÇÂÎÛ]/g, c => tr[c] || c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
}

function getDeptFiles() {
  return fs.readdirSync(DEPT_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('.bak') && !f.includes('.py'))
    .map(f => path.join(DEPT_DIR, f));
}

function loadProducts() {
  const allProducts = [];
  const deptFiles = getDeptFiles();

  for (const file of deptFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const products = JSON.parse(content);
      if (Array.isArray(products)) {
        allProducts.push(...products);
      }
    } catch (e) {
      console.warn(`Failed to load ${file}:`, e.message);
    }
  }
  return allProducts;
}

function generateProductSitemap() {
  const products = loadProducts();
  console.log(`Loaded ${products.length} products from ${getDeptFiles().length} departments`);

  const seenCanonical = new Set();
  const urlEntries = [];
  let skipped = 0;

  for (const p of products) {
    // Use equstoPage as canonical source
    let canonPath = p.equstoPage;

    if (!canonPath) {
      // Fallback: generate from category + slug
      const cat = p.category || '';
      const deptSeg = cat === 'market-reyonlari' ? 'market-reyon' :
                      cat === 'kuvetler' ? 'set-ustu-mutfak' : cat;
      const slug = p.slug || p.id;
      if (deptSeg && slug) {
        canonPath = `/shop/${deptSeg}/${slug}`;
      } else {
        skipped++;
        continue;
      }
    }

    // Normalize path
    canonPath = canonPath.replace(/^\/en\//i, '/').replace(/\/+$/, '');
    if (!canonPath.startsWith('/')) canonPath = '/' + canonPath;

    // Deduplicate by canonical path
    if (seenCanonical.has(canonPath)) {
      skipped++;
      continue;
    }
    seenCanonical.add(canonPath);

    // TR URL
    const trUrl = BASE_URL + canonPath;
    // EN URL
    const enUrl = BASE_URL + '/en' + canonPath;

    const lastmod = p.lastmod || new Date().toISOString().split('T')[0];

    urlEntries.push({
      loc: trUrl,
      lastmod,
      changefreq: 'weekly',
      priority: 0.65,
      alternates: [
        { hreflang: 'tr', href: trUrl },
        { hreflang: 'en', href: enUrl },
        { hreflang: 'x-default', href: trUrl }
      ]
    });
  }

  console.log(`Generated ${urlEntries.length} unique canonical product URLs (skipped ${skipped} duplicates/missing)`);

  // Generate XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';

  for (const entry of urlEntries) {
    xml += '  <url>\n';
    xml += `    <loc>${escapeXml(entry.loc)}</loc>\n`;
    xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
    xml += `    <priority>${entry.priority}</priority>\n`;
    for (const alt of entry.alternates) {
      xml += `    <xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>\n`;
    }
    xml += '  </url>\n';
  }

  xml += '</urlset>\n';

  fs.writeFileSync(OUTPUT_FILE, xml, 'utf8');
  console.log(`Product sitemap written to ${OUTPUT_FILE}`);
  console.log(`Total URLs: ${urlEntries.length}`);
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&apos;');
}

generateProductSitemap();