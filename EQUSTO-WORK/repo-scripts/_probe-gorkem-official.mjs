import https from "node:https";
import http from "node:http";

function httpBuf(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    lib
      .get(
        url,
        {
          headers: { "User-Agent": "Mozilla/5.0 EqustoProbe/1.0", Accept: "text/html,image/*" },
          rejectUnauthorized: false,
        },
        (res) => {
          const chunks = [];
          res.on("data", (c) => chunks.push(c));
          res.on("end", () => {
            const code = res.statusCode || 0;
            if ([301, 302, 307, 308].includes(code) && res.headers.location) {
              resolve(httpBuf(new URL(res.headers.location, url).href));
              return;
            }
            resolve({ status: code, buf: Buffer.concat(chunks) });
          });
        },
      )
      .on("error", () => resolve({ status: 0, buf: Buffer.alloc(0) }));
  });
}

const bases = [
  "https://www.gorkemmutfakekipmanlari.com",
  "https://gorkemmutfakekipmanlari.com",
  "https://www.gorkemmutfak.com.tr",
];

for (const base of bases) {
  const { status, buf } = await httpBuf(base + "/");
  const html = buf.toString("utf8");
  console.log("\n===", base, status, buf.length);
  const paths = [
    ...html.matchAll(/href=["']([^"']+)["']/gi),
    ...html.matchAll(/src=["']([^"']+)["']/gi),
  ].map((m) => m[1]);
  const hits = paths.filter((p) => /202|3-goz|3-gozlu|taban|ocak|burner|sanayi-ocak/i.test(p));
  [...new Set(hits)].slice(0, 25).forEach((h) => console.log(" ", h));
}

const tries = [
  "/urun/gorkem-3-gozlu-taban-rafli-sanayi-ocagi-202",
  "/tr/urun/3-gozlu-taban-rafli-ocak",
  "/product/3-burner-floor-shelf-stove",
  "/wp-json/wp/v2/posts?search=202+ocak",
  "/wp-json/wp/v2/products?search=202",
];
const base = "https://www.gorkemmutfakekipmanlari.com";
for (const p of tries) {
  const { status, buf } = await httpBuf(base + p);
  console.log(p, status, buf.length);
  if (status === 200 && buf.length > 500) {
    const html = buf.toString("utf8");
    const imgs = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)/gi)].map((m) => m[0]);
    imgs.slice(0, 8).forEach((u) => console.log("  img", u.slice(0, 100)));
  }
}
