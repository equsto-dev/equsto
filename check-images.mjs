import https from 'https';

const images = [
  '9890.ICCLS10.1E.jpg', '9890.ICCLS10.1G.jpg', '9890.ICCLS10.2E.jpg', '9890.ICCLS10.2G.jpg',
  '9890.ICCLS20.1E.jpg', '9890.ICCLS20.1G.jpg', '9890.ICCLS20.2E.jpg', '9890.ICCLS20.2G.jpg',
  '9890.ICCLS61.0G.jpg', '9890.ICCLS61.E0.jpg', '9890.ICCLS62.E0.jpg', '9890.ICCLS62.G0.jpg',
  '9890.ICPRO10.1E.jpg', '9890.ICPRO10.1G.jpg', '9890.ICPRO10.2E.jpg', '9890.ICPRO10.2G.jpg',
  '9890.ICPRO20.1E.jpg', '9890.ICPRO20.1G.jpg', '9890.ICPRO20.2E.jpg', '9890.ICPRO20.2G.jpg',
  '9890.ICPRO61.0G.jpg', '9890.ICPRO61.E0.jpg', '9890.ICPRO62.E0.jpg', '9890.ICPRO62.G0.jpg',
  '9890.ICPROXS.00.jpg'
];

async function checkImage(img) {
  return new Promise((resolve) => {
    https.get(`https://equsto.com/images/catalog/rational/${img}`, { method: 'HEAD' }, (res) => {
      resolve({ 
        img, 
        status: res.statusCode, 
        type: res.headers['content-type'],
        size: parseInt(res.headers['content-length'] || '0'),
        isImage: res.headers['content-type']?.startsWith('image/')
      });
    }).on('error', e => resolve({ img, status: 'error', error: e.message }));
  });
}

async function main() {
  let ok = 0;
  for (const img of images) {
    const result = await checkImage(img);
    if (result.status === 200 && result.isImage) {
      console.log(`✓ ${img} (${(result.size/1024).toFixed(1)} KB)`);
      ok++;
    } else {
      console.log(`✗ ${img} (status: ${result.status}, type: ${result.type})`);
    }
  }
  console.log(`\nImages OK: ${ok}/${images.length}`);
}

main();