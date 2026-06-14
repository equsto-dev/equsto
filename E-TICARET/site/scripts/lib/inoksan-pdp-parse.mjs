/**
 * İnoksan PDP HTML → açıklama + teknik satırlar
 * inoksan.com (#enerji tablolar + #urunacikla) ve shop PDP sekmeleri
 */
import { foldTr } from "./ozti-enrich.mjs";

function isSectionHeader(line) {
  const n = foldTr(line).replace(/\s/g, "");
  return n === "genelozellikler" || n === "teknikozellikler";
}

const NAMED_ENTITIES = {
  nbsp: " ",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  ouml: "ö",
  Ouml: "Ö",
  uuml: "ü",
  Uuml: "Ü",
  ccedil: "ç",
  Ccedil: "Ç",
  gbreve: "ğ",
  Gbreve: "Ğ",
  scedil: "ş",
  Scedil: "Ş",
  icirc: "î",
  Icirc: "Î",
};

export function decodeHtmlEntities(s) {
  return String(s || "")
    .replace(/&([a-zA-Z]+);/g, (_, name) => NAMED_ENTITIES[name] ?? `&${name};`)
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
}

export function stripHtml(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

function panelSection(html, panelId) {
  const start = html.search(new RegExp(`id="${panelId}"`, "i"));
  if (start < 0) return "";
  const slice = html.slice(start);
  const bodyStart = slice.search(/<div class="panel-body">/i);
  if (bodyStart < 0) return "";
  const afterBody = slice.slice(bodyStart + '<div class="panel-body">'.length);
  const nextPanel = afterBody.search(/<div class="panel panel-default">/i);
  return nextPanel >= 0 ? afterBody.slice(0, nextPanel) : afterBody;
}

/** #enerji — Özellikleri Keşfedin tabloları */
export function parseInoksanComSpecTables(html) {
  const block = panelSection(html, "enerji");
  if (!block) return [];

  const bullets = [];
  for (const tr of block.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const row = tr[1];
    const key = stripHtml(row.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] || "");
    const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => stripHtml(c[1]));
    if (!key || tds.length < 2) continue;
    const val = stripHtml(tds[tds.length - 1]);
    if (!val || /özellikler$/i.test(key)) continue;
    bullets.push(`${key}: ${val}`);
  }
  return [...new Set(bullets)];
}

/** #urunacikla — Ürün Hakkında madde listesi */
export function parseInoksanComDescBullets(html) {
  const block = panelSection(html, "urunacikla");
  if (!block) return [];

  const bullets = [];
  for (const p of block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    let line = stripHtml(p[1]).replace(/^\*\s*/, "").trim();
    if (!line || isSectionHeader(line)) continue;
    if (line.length > 3) bullets.push(line);
  }

  if (!bullets.length) {
    const text = stripHtml(block)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const ln of text) {
      const line = ln.replace(/^\*\s*/, "").trim();
      if (!line || isSectionHeader(line)) continue;
      if (line.length > 3 && !/^[A-ZÇĞİÖŞÜ ]{4,}$/.test(line)) bullets.push(line);
    }
  }

  return [...new Set(bullets)];
}

export function parseInoksanComPdpHtml(html) {
  const specBullets = parseInoksanComSpecTables(html);
  const descBullets = parseInoksanComDescBullets(html);
  if (!specBullets.length && !descBullets.length) return null;

  const description =
    descBullets.length > 0
      ? descBullets.map((b) => `• ${b}`).join("\n")
      : specBullets.map((b) => `• ${b}`).join("\n");

  const bullets = [...new Set([...specBullets, ...descBullets])];
  return {
    description,
    bullets,
    specBullets,
    descBullets,
    source: "inoksan.com",
  };
}

export function parseShopPdpHtml(html) {
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd);
      const nodes = Array.isArray(data) ? data : [data];
      for (const node of nodes) {
        if (node?.["@type"] === "Product" && node.description) {
          const desc = stripHtml(node.description);
          if (desc.length > 20) {
            return {
              description: desc,
              bullets: desc.split(/\n+/).filter(Boolean),
              source: "inoksanshop-jsonld",
            };
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  const tabBlocks = [
    html.match(/id="[^"]*aciklama[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1],
    html.match(/class="[^"]*tab-content[^"]*"[^>]*>([\s\S]{200,8000}?)<\/div>/i)?.[1],
    html.match(/Ürün Açıklaması[\s\S]{0,200}?<\/h[^>]+>([\s\S]{100,12000}?)(?:<h[1-6]|<div class="tab|$)/i)?.[1],
    html.match(/Ürün Hakkında[\s\S]{0,200}?<\/h[^>]+>([\s\S]{100,12000}?)(?:<h[1-6]|<div class="tab|$)/i)?.[1],
  ].filter(Boolean);

  for (const raw of tabBlocks) {
    const text = stripHtml(raw)
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
    if (text.length < 2) continue;
    const bullets = text
      .map((l) => l.replace(/^\*\s+/, "").trim())
      .filter((l) => !/^(stok|fiyat|taksit|kargo)/i.test(l));
    if (bullets.length >= 2) {
      return {
        description: bullets.map((b) => `• ${b}`).join("\n"),
        bullets,
        source: "inoksanshop-html",
      };
    }
  }

  return null;
}
