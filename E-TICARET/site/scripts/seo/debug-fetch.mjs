import { parseStringPromise } from 'xml2js';

async function test() {
  const res = await fetch('https://equsto.com/sitemap.xml');
  const xml = await res.text();
  console.log('XML length:', xml.length);
  console.log('First 500 chars:', xml.substring(0, 500));
  
  const parsed = await parseStringPromise(xml, { explicitArray: false, ignoreAttrs: true });
  console.log('Parsed:', JSON.stringify(parsed, null, 2));
}

test().catch(console.error);