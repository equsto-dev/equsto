import https from "node:https";

function httpBuf(url) {
  return new Promise((resolve) => {
    https
      .get(url, { headers: { "User-Agent": "Mozilla/5.0" }, rejectUnauthorized: false }, (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, len: Buffer.concat(chunks).length }));
      })
      .on("error", (e) => resolve({ err: e.message }));
  });
}

const urls = [
  "https://static.ticimax.cloud/3562/Uploads/UrunResimleri/buyuk/gorkem-40-lik-dolapli-sos-benmari-elektr-eec1.jpg",
  "https://static.ticimax.cloud/cdn-cgi/image/width=-,quality=99/3562/uploads/urunresimleri/buyuk/gorkem-40-lik-dolapli-sos-benmari-elektr-eec1.jpg",
];
for (const u of urls) {
  const r = await httpBuf(u);
  console.log(u.slice(-50), r);
}
