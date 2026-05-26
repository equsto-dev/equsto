import https from "node:https";

function get(url) {
  return new Promise((r) => {
    https.get(url, { rejectUnauthorized: false, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => r(Buffer.concat(c).toString("utf8")));
    });
  });
}

const html = await get("https://www.kariyermutfak.com/gorkem-elektrikli-sos-benmari-alt-dolapli-40x71x85-cm-781");
const r1 = [...html.matchAll(/https:\/\/static\.ticimax\.cloud\/[^\s"'<>]*urunresimleri\/buyuk\/[^\s"'<>]+/gi)];
const r2 = [...html.matchAll(/\/3562\/uploads\/urunresimleri\/buyuk\/[^\s"'<>]+/gi)];
const r3 = [...html.matchAll(/uploads\/urunresimleri\/buyuk\/[a-z0-9._\-]+\.(?:jpg|jpeg|png|webp)/gi)];
console.log("r1", r1.length, r1[0]?.[0]?.slice(0, 80));
console.log("r2", r2.length, r2[0]?.[0]);
console.log("r3", r3.length, r3[0]?.[0]);
