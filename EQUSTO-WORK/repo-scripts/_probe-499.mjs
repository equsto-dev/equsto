import https from "node:https";

function get(url) {
  return new Promise((r) => {
    https.get(url, { rejectUnauthorized: false, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => r({ s: res.statusCode, body: Buffer.concat(c).toString("utf8") }));
    });
  });
}

const x = await get("https://www.kariyermutfak.com/doner-sarma-ayagi-paslanmaz-gorkem");
const urls = [...x.body.matchAll(/urunresimleri\/(?:buyuk|thumb)\/[^"'\s<>]+/gi)].map((m) => m[0]);
console.log("urls", urls);
for (const u of urls.slice(0, 3)) {
  const full = u.startsWith("http") ? u : `https://static.ticimax.cloud/3562/Uploads/UrunResimleri/${u.split("urunresimleri/")[1]}`.replace(/uploads/i, "Uploads").replace(/urunresimleri/i, "UrunResimleri");
  const img = await get(full);
  console.log(u.slice(-40), img.s, img.body?.length || (typeof img.body === "string" ? 0 : "buf?"));
}
