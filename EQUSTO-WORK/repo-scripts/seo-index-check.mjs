/**
 * Canlı indekslenebilirlik kontrolü (robots, sitemap, örnek URL'ler).
 * npm run seo:index-check
 */
const HOST = String(process.env.EQUSTO_VERIFY_HOST || "https://equsto.com").replace(/\/$/, "");

async function get(url) {
  const r = await fetch(url, { redirect: "follow" });
  const text = r.status === 200 ? await r.text() : "";
  return { status: r.status, text, url: r.url };
}

async function head(url) {
  const r = await fetch(url, { method: "HEAD", redirect: "follow" });
  return r.status;
}

function hasNoindex(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
}

const samples = [
  "/",
  "/shop/pisirme",
  "/shop/sogutma",
  "/pfos",
  "/besos",
  "/besos/modul/the-manhattan",
  "/robots.txt",
  "/sitemap.xml",
  "/sitemap-priority.xml",
];

console.log("[seo:check] Host:", HOST, "\n");

let ok = true;
for (const p of samples) {
  const isXml = p.endsWith(".xml") || p.endsWith(".txt");
  const st = isXml ? (await get(HOST + p)).status : await head(HOST + p);
  const mark = st === 200 ? "OK" : "FAIL";
  if (st !== 200) ok = false;
  console.log(`${mark} ${st} ${p}`);
}

const home = await get(HOST + "/");
if (home.status === 200 && hasNoindex(home.text)) {
  console.log("FAIL ana sayfa noindex");
  ok = false;
} else if (home.status === 200) {
  console.log("OK ana sayfa index,follow");
}

const robots = await get(HOST + "/robots.txt");
if (robots.status === 200 && !/Sitemap:\s*https?:\/\//i.test(robots.text)) {
  console.log("WARN robots.txt icinde Sitemap satiri yok");
  ok = false;
} else if (robots.status === 200) {
  console.log("OK robots.txt Sitemap satiri var");
}

const sm = await get(HOST + "/sitemap.xml");
const urlCount = (sm.text.match(/<loc>/g) || []).length;
console.log(`OK sitemap.xml — ${urlCount} URL`);

const prodUrl =
  HOST + "/shop/sogutma/oztiryakiler-gn-600-nmv-tek-kapili-dik-tip-buzdolabi-k-tip-79k406nmv00";
const prod = await get(prodUrl);
if (prod.status === 200) {
  const canon = prod.text.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  console.log("OK ornek urun 200", canon ? "canonical=" + canon[1].slice(0, 60) + "…" : "(canonical yok)");
  if (canon && /product\.html$/i.test(canon[1])) {
    console.log("WARN urun canonical hala product.html — product.html head script guncel mi?");
    ok = false;
  }
} else {
  console.log("FAIL ornek urun", prod.status, prodUrl.slice(0, 70));
  ok = false;
}

if (!ok) process.exit(1);
console.log("\n[seo:check] Temel kontroller gecti. GSC: deploy/GOOGLE-INDEX-KURULUM.md");
