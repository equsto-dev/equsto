import https from 'https';

https.get('https://equsto.com/shop/pisirme/9890-icproxs-00', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const turkishChars = data.match(/[İıĞğŞşÇçÖöÜü]/g);
    console.log('Turkish chars:', turkishChars ? turkishChars.length : 0);
    const mojibake = data.match(/Ã§|Ã|ÄŸ|Ä|Ä±|Ä°|Ã¶|Ã|Ã¼|Ã|ÅŸ|Å|â€|â€/g);
    console.log('Mojibake:', mojibake ? mojibake.length : 0);
    // Extract product name from HTML
    const nameMatch = data.match(/<h1[^>]*>([^<]+)<\/h1>/);
    if (nameMatch) console.log('Product name:', nameMatch[1]);
    const brandMatch = data.match(/Marka:?\s*([^<\n]+)/);
    if (brandMatch) console.log('Brand:', brandMatch[1].trim());
  });
}).on('error', console.error);