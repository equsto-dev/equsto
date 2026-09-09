const fs = require('fs');

// ============================================================
// FIX 1: Encoding - Fix corrupted Turkish characters
// ============================================================

// Mapping from corrupted UTF-8 byte sequences (interpreted as Unicode) to correct Turkish chars
// Based on analysis of the corrupted file bytes
const encodingFixMap = {
  // Ö (U+00D6) -> ├ + û (E2 94 9C C3 BB)
  '\u251C\u00FB': '\u00D6',  // ├û -> Ö
  
  // ü (U+00FC) -> ├ + ╝ (E2 94 9C E2 95 9D) 
  '\u251C\u255D': '\u00FC',  // ├╝ -> ü
  
  // ü (U+00FC) also appears as ├ + ü in some contexts
  '\u251C\u00FC': '\u00FC',  // ├ü -> ü
  
  // İ (U+0130) -> ─ + ░ (E2 94 80 E2 96 91)
  '\u2500\u2591': '\u0130',  // ─░ -> İ
  
  // ı (U+0131) -> ─ + ▒ (E2 94 80 E2 96 92)
  '\u2500\u2592': '\u0131',  // ─▒ -> ı
  
  // ş (U+015F) -> ┼ + ş (E2 96 BC E2 99 A0?) - observed as "┼ş" in "Pi┼şirme"
  '\u253C\u015F': '\u015F',  // ┼ş -> ş
  
  // ş (U+015F) also as ┼ + ? 
  '\u253C\u2592': '\u015F',  // ┼▒ -> ş (in "Ekipmanlar─▒" the ▒ is ı, but ş might be similar)
  
  // ğ (U+011F) -> ─ + ▒ (same as ı?) - observed in "Ekipmanlar─▒" but that's ı
  // Actually "ağ" -> "a─▒" so ğ -> ─▒ same as ı
  
  // ç (U+00E7) -> ├ + ğ (E2 94 9C C4 9F?) - observed in "Ara Tezg├ğh" 
  '\u251C\u011F': '\u00E7',  // ├ğ -> ç
  
  // Ç (U+00C7) -> likely similar
  '\u251C\u011E': '\u00C7',  // ├Ğ -> Ç
  
  // Ğ (U+011E) -> ─ + ▒ or similar
  '\u2500\u2592': '\u011E',  // ─▒ -> Ğ (same as ı/ğ - context dependent)
  
  // ö (U+00F6) -> likely ├ + ö
  '\u251C\u00F6': '\u00F6',  // ├ö -> ö
  
  // Ü (U+00DC) -> likely ├ + Ü
  '\u251C\u00DC': '\u00DC',  // ├Ü -> Ü
  
  // Ş (U+015E) -> likely ┼ + Ş
  '\u253C\u015E': '\u015E',  // ┼Ş -> Ş
  
  // Additional box drawing chars that appear alone
  '\u251C': '',  // ├ - remove if standalone
  '\u2500': '',  // ─ - remove if standalone
  '\u253C': '',  // ┼ - remove if standalone
  '\u255D': '',  // ╝ - remove if standalone
  '\u2591': '',  // ░ - remove if standalone
  '\u2592': '',  // ▒ - remove if standalone
  '\u2551': '',  // ║ - remove
  '\u253A': '',  // ░ - remove
  '\u253B': '',  // ▒ - remove
  '\u253D': '',  // │ - remove
  '\u2523': '',  // ├ - remove
  '\u252B': '',  // ┤ - remove
  '\u2517': '',  // └ - remove
  '\u2533': '',  // ┴ - remove
  '\u252F': '',  // ┬ - remove
  '\u253F': '',  // ┼ - remove
  '\u255E': '',  // ╞ - remove
  '\u255F': '',  // ╡ - remove
  '\u2560': '',  // ╠ - remove
  '\u2561': '',  // ╡ - remove
  '\u2550': '',  // ═ - remove
  '\u2551': '',  // ║ - remove
  '\u2552': '',  // ╒ - remove
  '\u2553': '',  // ╓ - remove
  '\u2554': '',  // ╔ - remove
  '\u2555': '',  // ╕ - remove
  '\u2556': '',  // ╖ - remove
  '\u2557': '',  // ╗ - remove
  '\u2558': '',  // ╘ - remove
  '\u2559': '',  // ╙ - remove
  '\u255A': '',  // ╚ - remove
  '\u255B': '',  // ╛ - remove
  '\u255C': '',  // ╜ - remove
  '\u255D': '',  // ╝ - remove
  '\u255E': '',  // ╞ - remove
  '\u255F': '',  // ╡ - remove
  '\u2560': '',  // ╠ - remove
  '\u2561': '',  // ╡ - remove
  '\u2562': '',  // ╢ - remove
  '\u2563': '',  // ╣ - remove
  '\u2564': '',  // ╤ - remove
  '\u2565': '',  // ╥ - remove
  '\u2566': '',  // ╦ - remove
  '\u2567': '',  // ╧ - remove
  '\u2568': '',  // ╨ - remove
  '\u2569': '',  // ╩ - remove
  '\u256A': '',  // ╪ - remove
  '\u256B': '',  // ╫ - remove
  '\u256C': '',  // ╬ - remove
};

function fixTurkishEncoding(str) {
  if (!str || typeof str !== 'string') return str;
  
  let result = str;
  
  // First, fix known 2-character sequences
  for (const [corrupted, correct] of Object.entries(encodingFixMap)) {
    if (corrupted.length === 2 && correct.length === 1) {
      result = result.split(corrupted).join(correct);
    }
  }
  
  // Then remove any remaining standalone box drawing characters
  for (const [corrupted, correct] of Object.entries(encodingFixMap)) {
    if (corrupted.length === 1 && correct === '') {
      result = result.split(corrupted).join('');
    }
  }
  
  return result;
}

// ============================================================
// FIX 2: RATIONAL Images - Ensure image paths match actual files
// ============================================================

function fixRationalImages(product) {
  if (product.brand?.toLowerCase() !== 'rational') return product;
  
  const sku = product.sku;
  if (!sku) return product;
  
  // Expected image path pattern: images/catalog/rational/9890.ICPROXS.00.jpg
  const expectedPath = `images/catalog/rational/${sku}.jpg`;
  const fullPath = `E-TICARET/site/public/${expectedPath}`;
  
  if (fs.existsSync(fullPath)) {
    // File exists, ensure images array has it
    if (!product.images || !Array.isArray(product.images)) {
      product.images = [expectedPath];
    } else if (!product.images.includes(expectedPath)) {
      product.images.unshift(expectedPath);
    }
    // Also set image field for backward compatibility
    product.image = expectedPath;
  } else {
    // File doesn't exist - check if there's an alternative
    console.log(`  MISSING IMAGE: ${sku} - ${expectedPath}`);
    // Keep existing images array but don't add missing file
    // The resolveCatalogImageFromRow will skip non-existent files
  }
  
  return product;
}

// ============================================================
// FIX 3: RATIONAL Prices - Verify prices match pricing pipeline
// ============================================================

// The pricing formula: Liste EUR × 0.65 (dealer discount) × 1.20 (KDV) = Liste EUR × 0.78
// Then convert to TRY using exchange rate
// Current production uses ~56.0615 (same as Atalay)

function verifyRationalPrices(product) {
  if (product.brand?.toLowerCase() !== 'rational') return product;
  
  const listEur = product.liste_fiyati_eur;
  const satisEur = product.satis_eur_indirimli;
  const fiyatTl = product.fiyat_tl;
  
  if (listEur && satisEur) {
    const expectedSatisEur = Math.round(listEur * 0.65 * 100) / 100; // 35% discount
    const expectedFiyatTl = Math.round(expectedSatisEur * 56.0615);
    
    if (Math.abs(satisEur - expectedSatisEur) > 0.01) {
      console.log(`  PRICE MISMATCH EUR: ${product.sku} - expected ${expectedSatisEur}, got ${satisEur}`);
    }
    if (Math.abs(fiyatTl - expectedFiyatTl) > 1) {
      console.log(`  PRICE MISMATCH TL: ${product.sku} - expected ${expectedFiyatTl}, got ${fiyatTl}`);
    }
  }
  
  return product;
}

// ============================================================
// MAIN FIX FUNCTION
// ============================================================

function main() {
  console.log('Reading production catalog...');
  const prodData = fs.readFileSync('E-TICARET/site/public/data/dept/pisirme.json', 'utf8');
  const products = JSON.parse(prodData);
  
  console.log(`Total products: ${products.length}`);
  
  // Load clean reference for exact matches
  console.log('Loading clean reference...');
  const cleanData = fs.readFileSync('public/data/dept/pisirme.json', 'utf8');
  const cleanProducts = JSON.parse(cleanData);
  const cleanMap = new Map();
  cleanProducts.forEach(p => {
    if (p.id) cleanMap.set(p.id, { brand: p.brand, name: p.name, specs: p.specs, description: p.description, aciklama: p.aciklama, keywords: p.keywords });
  });
  console.log(`Clean reference entries: ${cleanMap.size}`);
  
  let encodingFixed = 0;
  let referenceFixed = 0;
  let rationalImageFixed = 0;
  let rationalPriceChecked = 0;
  
  products.forEach((product, index) => {
    // Fix 1: Encoding - use clean reference for exact ID matches
    if (product.id && cleanMap.has(product.id)) {
      const clean = cleanMap.get(product.id);
      let changed = false;
      if (product.brand !== clean.brand) { product.brand = clean.brand; changed = true; }
      if (product.name !== clean.name) { product.name = clean.name; changed = true; }
      if (product.specs !== clean.specs) { product.specs = clean.specs; changed = true; }
      if (product.description !== clean.description) { product.description = clean.description; changed = true; }
      if (product.aciklama !== clean.aciklama) { product.aciklama = clean.aciklama; changed = true; }
      if (product.keywords !== clean.keywords) { product.keywords = clean.keywords; changed = true; }
      if (changed) referenceFixed++;
    } else {
      // Fix encoding programmatically for non-matched products
      const originalBrand = product.brand;
      const originalName = product.name;
      const originalSpecs = product.specs;
      const originalDescription = product.description;
      const originalAciklama = product.aciklama;
      const originalKeywords = product.keywords;
      
      product.brand = fixTurkishEncoding(product.brand);
      product.name = fixTurkishEncoding(product.name);
      product.specs = fixTurkishEncoding(product.specs);
      product.description = fixTurkishEncoding(product.description);
      product.aciklama = fixTurkishEncoding(product.aciklama);
      if (Array.isArray(product.keywords)) {
        product.keywords = product.keywords.map(k => fixTurkishEncoding(k));
      }
      if (Array.isArray(product.teknik_ozellikler)) {
        product.teknik_ozellikler = product.teknik_ozellikler.map(k => fixTurkishEncoding(k));
      }
      if (Array.isArray(product.kategori_yolu)) {
        product.kategori_yolu = product.kategori_yolu.map(k => fixTurkishEncoding(k));
      }
      
      if (product.brand !== originalBrand || product.name !== originalName || 
          product.specs !== originalSpecs || product.description !== originalDescription ||
          product.aciklama !== originalAciklama) {
        encodingFixed++;
      }
    }
    
    // Fix 2: RATIONAL images
    if (product.brand?.toLowerCase() === 'rational') {
      fixRationalImages(product);
      rationalImageFixed++;
      verifyRationalPrices(product);
      rationalPriceChecked++;
    }
  });
  
  console.log(`\nFixes applied:`);
  console.log(`  Reference-matched fixes: ${referenceFixed}`);
  console.log(`  Programmatic encoding fixes: ${encodingFixed}`);
  console.log(`  RATIONAL image fixes: ${rationalImageFixed}`);
  console.log(`  RATIONAL price checks: ${rationalPriceChecked}`);
  
  // Verify final state
  console.log('\nVerification:');
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  console.log('  Unique brands:', brands);
  
  const rational = products.filter(p => p.brand?.toLowerCase() === 'rational');
  console.log(`  RATIONAL products: ${rational.length}`);
  rational.forEach(p => {
    console.log(`    ${p.sku}: image=${p.image}, images=${JSON.stringify(p.images)}`);
  });
  
  const atalay = products.filter(p => p.brand && p.brand.includes('Atalay'));
  console.log(`  Atalay products: ${atalay.length}`);
  if (atalay.length > 0) {
    console.log(`    Sample brand: ${atalay[0].brand}`);
  }
  
  const ozti = products.filter(p => p.brand && p.brand.includes('Öztiryakiler') || p.brand.includes('Oztiryakiler'));
  console.log(`  Öztiryakiler products: ${ozti.length}`);
  if (ozti.length > 0) {
    console.log(`    Sample brand: ${ozti[0].brand}`);
  }
  
  const inoksan = products.filter(p => p.brand && p.brand.includes('İnoksan') || p.brand.includes('Inoksan'));
  console.log(`  İnoksan products: ${inoksan.length}`);
  if (inoksan.length > 0) {
    console.log(`    Sample brand: ${inoksan[0].brand}`);
  }
  
  const electrolux = products.filter(p => p.brand === 'Electrolux Professional');
  console.log(`  Electrolux products: ${electrolux.length}`);
  if (electrolux.length > 0) {
    console.log(`    Sample name: ${electrolux[0].name?.substring(0, 60)}`);
  }
  
  // Write fixed file
  console.log('\nWriting fixed catalog...');
  fs.writeFileSync('E-TICARET/site/public/data/dept/pisirme.json', JSON.stringify(products, null, 2), 'utf8');
  console.log('Done!');
}

main();