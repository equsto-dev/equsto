import https from "node:https";
const files = [
  "vosco-bar-arkası-şişe-soğutucu-i̇ki-kapılı-vbbc250s_1.png",
  "dampak-i̇ki-kapılı-dik-tip-derin-dondurucu-139x82x210-22ddf2sgn_1.png",
  "dampak-i̇ki-kapılı-dik-tip-derin-dondurucu-139x82x210-22ddf2sgn_2.jpg",
];
for (const f of files) {
  const url = `https://equsto.com/data/images/${encodeURI(f)}`;
  const r = await new Promise((resolve) => {
    https.get(url, { rejectUnauthorized: false, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      const c = [];
      res.on("data", (x) => c.push(x));
      res.on("end", () => resolve({ s: res.statusCode, n: Buffer.concat(c).length }));
    }).on("error", () => resolve({ s: 0, n: 0 }));
  });
  console.log(f.slice(0, 55), r.s, r.n);
}
