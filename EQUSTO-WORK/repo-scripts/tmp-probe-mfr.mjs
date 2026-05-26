import https from "node:https";

function get(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
      const c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => resolve(Buffer.concat(c).toString("utf8")));
    }).on("error", () => resolve(""));
  });
}

const d = await get("https://www.dampak.com.tr/arama?q=22DDF2S");
console.log("dampak arama len", d.length);
const links = [...d.matchAll(/href="([^"]*22ddf[^"]*)"/gi)].map((m) => m[1]);
console.log("links", [...new Set(links)].slice(0, 10));

const v = await get("https://vosco.com.tr/arama?kelime=VBBC");
console.log("vosco arama len", v.length);
const vlinks = [...v.matchAll(/href="(\/[^"]+)"/gi)]
  .map((m) => m[1])
  .filter((p) => /urun|vbbc|bar/i.test(p));
console.log("vosco filtered", [...new Set(vlinks)].slice(0, 15));

// JSON product data in page?
const jsonLd = [...v.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
console.log("jsonLd blocks", jsonLd.length);

const ticimax = [...v.matchAll(/urunresimleri\/buyuk\/[^"'\s<>]+/gi)];
console.log("ticimax buyuk in search", ticimax.length, ticimax[0]?.[0]);
