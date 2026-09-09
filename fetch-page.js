const https = require('https');

https.get('https://equsto.com/shop/pisirme/9890-icpro61-0g', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        // Find image URLs
        const matches = data.match(/src="([^"]*)"/g);
        if (matches) {
            matches.forEach(m => console.log(m));
        }
    });
}).on('error', console.error);