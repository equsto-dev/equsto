import https from "node:https";

function get(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0 EqustoProbe/1.0" }, rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf8");
          if ([301, 302].includes(res.statusCode || 0) && res.headers.location) {
            resolve(get(new URL(res.headers.location, url).href));
            return;
          }
          resolve({ status: res.statusCode, body });
        });
      })
      .on("error", (e) => resolve({ status: 0, err: e.message }));
  });
}

const urls = [
  "https://gorkemmutfak.com.tr/urun/1-1-31-setustu-benmari/",
  "https://gorkemmutfak.com.tr/urun/elektrikli-fritoz-8-litre-308/",
  "https://www.gorkemmutfakekipmanlari.com/urunler/",
];

for (const url of urls) {
  const r = await get(url);
  console.log("\n", url, r.status, r.err || "");
  const imgs = [...(r.body || "").matchAll(/https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi)].slice(0, 8);
  console.log("absolute imgs:", imgs.map((m) => m[0]));
  const rel = [...(r.body || "").matchAll(/(?:src|href)=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi)].slice(0, 8);
  console.log("rel imgs:", rel.map((m) => m[1]));
  const og = (r.body || "").match(/property="og:image"[^>]+content="([^"]+)"/i);
  if (og) console.log("og:image", og[1]);
}
