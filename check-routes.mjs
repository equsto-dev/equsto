import fs from 'fs';
import path from 'path';

console.log('Current route files:');
console.log('[dept]/page.tsx exists:', fs.existsSync('E-TICARET/site/app/(shop)/shop/[dept]/page.tsx'));
console.log('[dept]/[slug]/page.tsx exists:', fs.existsSync('E-TICARET/site/app/(shop)/shop/[dept]/[slug]/page.tsx'));
console.log('[dept]/seri/[kod]/page.tsx exists:', fs.existsSync('E-TICARET/site/app/(shop)/shop/[dept]/seri/[kod]/page.tsx'));

console.log('\nNext.js route precedence:');
console.log('1. Static routes (exact match)');
console.log('2. Dynamic routes with fixed segments');
console.log('3. Dynamic routes with catch-all');
console.log('4. Optional catch-all');

console.log('\nCurrent route structure analysis:');
console.log('PDP: /shop/[dept]/[slug] -> dynamic segment [slug]');
console.log('Subcategory: /shop/[dept]/kategori/[subCategory] -> fixed "kategori" + dynamic [subCategory]');
console.log('');
console.log('Next.js route matching priority:');
console.log('1. /shop/pisirme (exact)');
console.log('2. /shop/pisirme/kategori/konveksiyonel-firinlar (fixed segment "kategori" wins over [slug])');
console.log('3. /shop/pisirme/some-product-slug (falls to [slug])');