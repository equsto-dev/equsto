import { fetch } from 'undici';

async function test() {
  const urls = [
    'https://equsto.com/iletisim',
    'https://equsto.com/hakkimizda',
    'https://equsto.com/blog',
    'https://equsto.com/steakhouse-kurulumu',
    'https://equsto.com/rehber/dark-kitchen-bulut-mutfak-2026',
    'https://equsto.com/cafe-kurulumu',
    'https://equsto.com/catering-mutfagi',
    'https://equsto.com/fast-food-kurulumu',
    'https://equsto.com/fine-dining-kurulumu',
    'https://equsto.com/dunya-mutfak-kurulumu'
  ];
  
  for (const url of urls) {
    const start = Date.now();
    try {
      const res = await fetch(url, { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'Test' } });
      const html = await res.text();
      const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
      console.log(url, res.status, canonicalMatch ? canonicalMatch[1] : 'NO CANONICAL', Date.now() - start + 'ms');
    } catch (e) {
      console.log(url, 'ERROR:', e.message);
    }
  }
}

test().catch(console.error);