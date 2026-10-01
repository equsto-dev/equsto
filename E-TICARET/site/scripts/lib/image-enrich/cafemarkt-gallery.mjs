/**
 * CafeMarkt PDP HTML → ürün galeri witcdn URL’leri (-B tercih).
 */
import { CAFE_UA } from "../cafemarkt-fetch.mjs";

const SIZE_RANK = { B: 3, O: 2, K: 1 };

export function productSlugFromUrl(url) {
  try {
    const u = new URL(url);
    const seg = u.pathname.replace(/\/+$/, "").split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(seg).toLowerCase();
  } catch {
    return String(url || "")
      .split("?")[0]
      .replace(/\/+$/, "")
      .split("/")
      .pop()
      ?.toLowerCase() || "";
  }
}

/**
 * @returns {{ id: string, size: string, url: string, file: string }[]}
 * her image id için en iyi boyut (B>O>K)
 */
function collectWitFilesFromHtml(html) {
  const files = [
    ...String(html || "").matchAll(/https?:\/\/witcdn\.cafemarkt\.com\/([^"'\\\s<>]+)/gi),
  ].map((m) => m[1]);

  // JSON-LD Product.image (kaçırılmış escaped URL’ler)
  for (const m of String(html || "").matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data)
        ? data
        : Array.isArray(data?.["@graph"])
          ? data["@graph"]
          : [data];
      for (const node of nodes) {
        if (!node || node["@type"] !== "Product") continue;
        const imgs = Array.isArray(node.image)
          ? node.image
          : node.image
            ? [node.image]
            : [];
        for (const u of imgs) {
          const fm = String(u || "").match(/witcdn\.cafemarkt\.com\/([^?#]+)/i);
          if (fm) files.push(fm[1]);
        }
      }
    } catch {
      /* ignore bad json-ld */
    }
  }
  return files;
}

export function extractCafemarktGallery(html, pageUrl) {
  const slug = productSlugFromUrl(pageUrl);
  if (!slug) return [];

  const files = collectWitFilesFromHtml(html);

  /** @type {Map<string, { id: string, size: string, file: string, rank: number }>} */
  const best = new Map();

  for (const file of files) {
    const fl = file.toLowerCase();
    if (fl.includes("data/") || fl.includes("menu_item") || fl.includes("editorfiles")) continue;
    if (!fl.includes(slug)) continue;
    const m = fl.match(/-(\d+)-(\d+)-([bok])\.(jpe?g|png|webp)$/i);
    if (!m) continue;
    const id = m[1];
    const size = m[3].toUpperCase();
    const rank = SIZE_RANK[size] || 0;
    const prev = best.get(id);
    if (!prev || rank > prev.rank) {
      // canonical file casing from first match
      best.set(id, { id, size, file: decodeURIComponent(file), rank });
    }
  }

  return [...best.values()]
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((x) => ({
      id: x.id,
      size: x.size,
      file: x.file,
      url: `https://witcdn.cafemarkt.com/${x.file}`,
    }));
}

/** Prefer -B download URL even if page only exposed -K/-O */
export function preferBUrl(entry) {
  if (!entry?.file) return entry?.url || "";
  if (entry.size === "B") return entry.url;
  const bFile = entry.file.replace(/-([bok])\.(jpe?g|png|webp)$/i, "-B.$2");
  return `https://witcdn.cafemarkt.com/${bFile}`;
}

export async function fetchCafemarktHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": CAFE_UA,
      "Accept-Language": "tr-TR,tr;q=0.9",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function localRelFromWitFile(file) {
  const base = String(file || "")
    .split("/")
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .toLowerCase();
  return `images/catalog/cafemarkt/${base}`;
}

/** Aynı CafeMarkt image id → tek dosya adı (-B) */
export function canonicalLocalRelFromGalleryEntry(entry) {
  const file = String(entry?.file || "").split("/").pop() || "";
  const normalized = file.replace(/-([bok])\.(jpe?g|png|webp)$/i, "-B.$2");
  return localRelFromWitFile(normalized);
}

/** images/catalog/cafemarkt/...-46077-12-O.jpg → 46077 */
export function cafemarktImageIdFromRel(rel) {
  const m = String(rel || "")
    .toLowerCase()
    .match(/-(\d+)-\d+-[bok]\.(jpe?g|png|webp)$/);
  return m ? m[1] : "";
}
