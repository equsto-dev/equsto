const url = "https://www.pimak.com/urunler/kafeterya-ekipmanlari";
const html = await (await fetch(url)).text();
const rel = [...html.matchAll(/href="([a-z0-9][a-z0-9-]+)"/gi)].map((m) => m[1]);
const productSlugs = [...new Set(rel)].filter((s) => !["urunler","iletisim","kurumsal","haberler","index","anasayfa","projeler"].includes(s) && s.length > 5);
console.log("rel slugs count", productSlugs.length);
console.log(productSlugs.slice(0, 20).join("\n"));

// check for m098
console.log("has m098", html.includes("m098"));
