const urls = [
  "https://www.pimak.com/urunler",
  "https://www.pimak.com/sitemap.xml",
  "https://www.pimak.com/robots.txt",
];

for (const url of urls) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 PFOS-scraper/1.0" } });
    const t = await r.text();
    console.log("\n===", url, r.status, "len", t.length);
    if (url.includes("robots")) console.log(t.slice(0, 500));
    if (url.includes("sitemap")) {
      const locs = [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      console.log("locs", locs.length);
      console.log(locs.slice(0, 30).join("\n"));
    } else {
      const hrefs = [...t.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
      const productish = [...new Set(hrefs)].filter(
        (u) =>
          /urun|product|600|700|900|firin|doner|kafe/i.test(u) &&
          !u.includes("javascript") &&
          !u.startsWith("#"),
      );
      console.log("productish links sample:", productish.slice(0, 40).join("\n"));
    }
  } catch (e) {
    console.log("ERR", url, e.message);
  }
}
