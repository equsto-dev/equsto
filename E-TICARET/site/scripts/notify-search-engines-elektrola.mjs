#!/usr/bin/env node
/**
 * Elektrola sous-vide URL'lerini arama motorlarına bildir.
 * Google Indexing API ürün sayfası için resmi desteklemiyor;
 * sitemap ping + IndexNow (Bing) + GSC talimatı.
 *
 *   node scripts/notify-search-engines-elektrola.mjs
 */
const URLS = [
  "https://equsto.com/shop/set-ustu-mutfak/esv2gac2ex",
  "https://equsto.com/shop/set-ustu-mutfak/esv2gac2ex-kit18",
];
const SITEMAP = "https://equsto.com/sitemap.xml";

async function ping(url) {
  const r = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: { "User-Agent": "EqustoBot/1.0" },
  });
  return { url, status: r.status };
}

async function indexNow(urls) {
  // IndexNow key file must be hosted at equsto.com/{key}.txt — skip if no key
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return { skipped: true, reason: "INDEXNOW_KEY yok" };
  }
  const body = {
    host: "equsto.com",
    key,
    keyLocation: `https://equsto.com/${key}.txt`,
    urlList: urls,
  };
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  return { status: r.status, text: (await r.text()).slice(0, 200) };
}

async function main() {
  console.log("[notify] pages");
  for (const u of URLS) {
    const r = await fetch(u, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });
    console.log(" ", r.status, u);
  }

  // Legacy Google sitemap ping (çoğu ortamda artık no-op; zarar vermez)
  for (const endpoint of [
    `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`,
    `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`,
  ]) {
    try {
      const p = await ping(endpoint);
      console.log("[ping]", p.status, p.url.slice(0, 80));
    } catch (e) {
      console.log("[ping] err", e instanceof Error ? e.message : e);
    }
  }

  const now = await indexNow(URLS);
  console.log("[indexnow]", now);

  console.log("\n[GSC] Search Console → URL Denetimi → Dizine eklenmesini iste:");
  for (const u of URLS) {
    const inspect = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent("sc-domain:equsto.com")}&id=${encodeURIComponent(u)}`;
    console.log(" ", u);
    console.log("   →", inspect);
  }
  console.log("\n[GMC] Feed (Shopping): https://equsto.com/feeds/google-products.xml");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
