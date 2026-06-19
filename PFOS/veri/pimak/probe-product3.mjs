const url = "https://www.pimak.com/m098-elektrikli-krep-makinasi";
const html = await (await fetch(url)).text();

// breadcrumb
const bc = html.match(/breadcrumb[\s\S]{0,2000}/i)?.[0];
console.log("breadcrumb", bc?.slice(0, 800));

// category links in sidebar
const sidebar = html.match(/class="sidebar[\s\S]{0,5000}/gi);
console.log("sidebar blocks", sidebar?.length);

// links to urunler/
const catLinks = [...html.matchAll(/href="(urunler\/[^"]+)"/gi)].map((m) => m[1]);
console.log("cat links", [...new Set(catLinks)]);

// meta description
const desc = html.match(/name="description" content="([^"]+)"/i)?.[1];
console.log("meta desc", desc);
