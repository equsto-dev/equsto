const fs = require('fs');
const content = fs.readFileSync('E-TICARET/site/lib/shop/brand-hub.ts', 'utf8');
const bremaMatch = content.match(/brema:\s*\{[\s\S]*?facet:\s*"([^"]+)"/);
console.log('Brema facet:', bremaMatch ? bremaMatch[1] : 'NOT FOUND');