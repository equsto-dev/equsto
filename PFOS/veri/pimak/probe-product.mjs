const url = process.argv[2] || "https://www.pimak.com/m098-elektrikli-krep-makinasi";
const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 PFOS-scraper/1.0" } });
const html = await r.text();
console.log("status", r.status, "len", html.length);

// title
const title = html.match(/<title>([^<]+)<\/title>/i)?.[1];
console.log("title:", title);

// h1
const h1 = [...html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi)].map((m) => m[1]);
console.log("h1:", h1);

// images
const imgs = [...new Set([...html.matchAll(/(?:src|data-src|data-lazy-src)="([^"]+\.(?:jpg|jpeg|png|webp)[^"]*)"/gi)].map((m) => m[1]))];
console.log("images sample:", imgs.filter((u) => !u.includes("icon")).slice(0, 8));

// og:image
const og = html.match(/property="og:image" content="([^"]+)"/i)?.[1];
console.log("og:image", og);

// sections keywords
for (const kw of ["Temel Özellik", "Teknik Detay", "teknik", "aciklama", "description", "product-detail", "urun-detay"]) {
  if (html.toLowerCase().includes(kw.toLowerCase())) console.log("has keyword:", kw);
}

// tables
const tables = html.match(/<table[\s\S]*?<\/table>/gi) || [];
console.log("tables", tables.length);
if (tables[0]) console.log("table0 snippet:", tables[0].slice(0, 500).replace(/\s+/g, " "));

// json-ld
const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
console.log("json-ld blocks", ld.length);
for (const m of ld.slice(0, 2)) {
  try {
    console.log("ld:", JSON.stringify(JSON.parse(m[1]), null, 2).slice(0, 800));
  } catch {}
}

// class hints
const classes = [...new Set([...html.matchAll(/class="([^"]{5,80})"/gi)].map((m) => m[1]))]
  .filter((c) => /urun|product|spec|teknik|ozellik|detay|aciklama/i.test(c))
  .slice(0, 20);
console.log("classes:", classes);
