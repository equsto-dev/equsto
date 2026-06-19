const url = "https://www.pimak.com/urunler/kafeterya-ekipmanlari";
const html = await (await fetch(url)).text();
const links = [...html.matchAll(/href="(https:\/\/www\.pimak\.com\/[^"]+|\/[a-z0-9-]+)"/gi)].map((m) => m[1]);
const products = [...new Set(links)].filter((u) => u.includes("pimak.com/") && !u.includes("/urunler") && !u.includes("iletisim"));
console.log("products in category", products.length);
console.log(products.slice(0, 10).join("\n"));

// product card snippet
const card = html.match(/M098[\s\S]{0,500}/i)?.[0];
console.log("\ncard snippet", card);
