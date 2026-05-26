import https from "node:https";
import fs from "node:fs";

function get(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const c = [];
        res.on("data", (x) => c.push(x));
        res.on("end", () => resolve({ s: res.statusCode, body: Buffer.concat(c).toString("utf8") }));
      })
      .on("error", (e) => resolve({ e: e.message }));
  });
}

const paths = [
  "/gorkem-11-31-setustu-benmari-515-10353",
  "/gorkem-1-1-3-1-setustu-benmari-515",
  "/gorkem-elektrikli-fritoz-8-litre-33x53x33-cm-308",
];
for (const p of paths) {
  const x = await get(`https://www.kariyermutfak.com${p}`);
  const buyuk = [...(x.body || "").matchAll(/urunresimleri\/buyuk\/[^"'\s<>]+/gi)].slice(0, 3);
  console.log(p, "status", x.s, "buyuk", buyuk.length, buyuk[0]?.[0]?.slice(0, 80));
}
