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

const q = encodeURIComponent("Görkem 3 lü taban raflı ocak 202");
for (const site of [
  `https://www.globalmutfak.com/arama?kelime=${q}`,
  `https://www.cafemarkt.com/arama?q=${q}`,
]) {
  const { status, buf } = await httpBuf(site);
  const html = buf.toString("utf8");
  const links = [...html.matchAll(/href="(\/[^"]*gorkem[^"]*)"/gi)].map((m) => m[1]);
  console.log(site, status, "links", [...new Set(links)].slice(0, 8));
  const imgs = [...html.matchAll(/https?:\/\/[^\s"'<>]+\.(?:jpg|png|webp)/gi)]
    .map((m) => m[0])
    .filter((u) => !/logo|icon|banner|kariyer/i.test(u));
  console.log(" imgs", imgs.slice(0, 5));
}
