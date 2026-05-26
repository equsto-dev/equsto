/**
 * Sitemap + PFOS/Besos bildirimi (Google ping, Bing sitemap, IndexNow).
 * npm run seo:ping
 */
import { pfosBesosIndexNowBatch } from "./eq-pfos-besos-urls.mjs";

const ORIGIN = String(process.env.EQUSTO_SITE_ORIGIN || "https://equsto.com").replace(/\/$/, "");
const SITEMAP = `${ORIGIN}/sitemap.xml`;
const SITEMAP_PRIORITY = `${ORIGIN}/sitemap-priority.xml`;

async function pingGoogle() {
  const url = `https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP)}`;
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow" });
    console.log("[seo:ping] Google sitemap:", r.status, r.statusText || "");
    return r.ok;
  } catch (e) {
    console.warn("[seo:ping] Google ping hata:", e.message || e);
    return false;
  }
}

async function pingBingSitemap() {
  const url = `https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_PRIORITY)}`;
  try {
    const r = await fetch(url, { method: "GET", redirect: "follow" });
    console.log("[seo:ping] Bing sitemap-priority:", r.status, r.statusText || "");
  } catch (e) {
    console.warn("[seo:ping] Bing ping hata:", e.message || e);
  }
}

async function pingIndexNow() {
  const key = String(process.env.INDEXNOW_KEY || "").trim();
  if (!key) {
    console.log("[seo:ping] IndexNow atlandi (INDEXNOW_KEY yok — deploy/BING-PFOS-BESOS.md)");
    return;
  }
  const urlList = pfosBesosIndexNowBatch(ORIGIN, 100);
  try {
    const r = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(ORIGIN).hostname,
        key,
        keyLocation: `${ORIGIN}/${key}.txt`,
        urlList,
      }),
    });
    console.log("[seo:ping] IndexNow:", r.status, `(${urlList.length} URL, PFOS/Besos oncelikli)`);
  } catch (e) {
    console.warn("[seo:ping] IndexNow hata:", e.message || e);
  }
}

async function pingYandexSitemap() {
  for (const sm of [SITEMAP_PRIORITY, SITEMAP]) {
    const url = `https://webmaster.yandex.com/ping?sitemap=${encodeURIComponent(sm)}`;
    try {
      const r = await fetch(url, { method: "GET", redirect: "follow" });
      console.log("[seo:ping] Yandex:", sm.replace(ORIGIN + "/", ""), "→", r.status);
    } catch (e) {
      console.warn("[seo:ping] Yandex ping hata:", e.message || e);
    }
  }
}

console.log("[seo:ping] Oncelik sitemap:", SITEMAP_PRIORITY);
await pingBingSitemap();
await pingYandexSitemap();
await pingGoogle();
await pingIndexNow();
console.log("[seo:ping] Bing/Yandex panel → deploy/BING-PFOS-BESOS.md, deploy/YANDEX-KURULUM.md");
