const url = process.argv[2];
const html = await (await fetch(url)).text();
const img = html.match(/class="urunresim"[\s\S]*?<img[^>]+src="([^"]+)"/i)?.[1];
const tables = (html.match(/<table/gi) || []).length;
console.log({ img, tables, urundetay: /class="urundetay"/.test(html) });
