import https from "node:https";

function get(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if ([301, 302].includes(res.statusCode || 0) && res.headers.location) {
            resolve(get(new URL(res.headers.location, url).href));
            return;
          }
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") });
        });
      })
      .on("error", (e) => resolve({ status: 0, err: e.message }));
  });
}

const tries = [
  "https://www.dampak.com.tr/urunler/22dbf2s-gn-iki-kapili-dik-tip-buzdolabi",
  "https://www.dampak.com.tr/urunler/22dbf2s-gn-iki-kapili-dik-tip-derin-dondurucu",
  "https://www.dampak.com.tr/urun/22dbf2s-gn",
  "https://www.dampak.com.tr/urunler?search=22DBF2S",
];

for (const url of tries) {
  const r = await get(url);
  const hashes = [...(r.body || "").matchAll(/uploads\/images\/full\/([a-f0-9]+\.(?:jpg|jpeg|png|webp))/gi)].map((m) => m[1]);
  console.log(url, "status", r.status, "images", [...new Set(hashes)].length, [...new Set(hashes)].slice(0, 2));
  const links = [...(r.body || "").matchAll(/href="(\/urunler\/[^"]+22dbf[^"]+)"/gi)].slice(0, 5).map((m) => m[1]);
  if (links.length) console.log("  links", links);
}
