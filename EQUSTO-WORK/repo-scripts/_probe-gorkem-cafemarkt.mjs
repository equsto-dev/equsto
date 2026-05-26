import https from "node:https";
import http from "node:http";

function httpBuf(url) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    lib
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location) {
            resolve(httpBuf(new URL(res.headers.location, url).href));
            return;
          }
          resolve({ status: res.statusCode, buf: Buffer.concat(chunks) });
        });
      })
      .on("error", () => resolve({ status: 0, buf: Buffer.alloc(0) }));
  });
}

const searches = [
  "https://www.cafemarkt.com/arama?kelime=gorkem+202+ocak",
  "https://www.cafemarkt.com/arama?kelime=gorkem+taban+rafli",
  "https://www.globalmutfak.com/gorkem-3-gozlu-taban-rafli-sanayi-ocagi",
  "https://www.globalmutfak.com/arama?kelime=gorkem+202",
];

for (const url of searches) {
  const { status, buf } = await httpBuf(url);
  const html = buf.toString("utf8");
  const detail = [...html.matchAll(/href="(\/[^"]*gorkem[^"]*)"/gi)].map((m) => m[1]).slice(0, 6);
  const imgs = [...new Set([...html.matchAll(/https:\/\/witcdn[^\s"'<>]+/gi)].map((m) => m[0]))].slice(0, 8);
  console.log("\n", url, status, "detail", detail.length, "witcdn", imgs.length);
  detail.forEach((d) => console.log("  ", d));
  imgs.forEach((i) => console.log("  img", i.slice(0, 90)));
}
