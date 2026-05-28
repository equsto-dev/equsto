const UA = "Mozilla/5.0 (Equsto)";
const q = process.argv[2] || "WMF 1500S";
const res = await fetch(`https://www.cafemarkt.com/arama?q=${encodeURIComponent(q)}`, {
  headers: { "User-Agent": UA },
});
const html = await res.text();
const urls = [...html.matchAll(/data-src="(https:\/\/witcdn\.cafemarkt\.com\/[^"]+)"/gi)].map((m) => m[1]);
console.log("status", res.status, "urls", urls.length);
if (urls[0]) {
  const ir = await fetch(urls[0], { headers: { "User-Agent": UA } });
  const b = Buffer.from(await ir.arrayBuffer());
  console.log("img", ir.status, b.length, urls[0].slice(0, 100));
}
