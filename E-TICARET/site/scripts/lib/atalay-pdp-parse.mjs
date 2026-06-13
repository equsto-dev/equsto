/**
 * atalay.com.tr — Özellikler (tab1) + Teknik Özellikler (tab2) parse
 */

export function decodeHtmlEntities(s) {
  return String(s || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  );
}

/** tab1 — • ile başlayan özellik maddeleri */
export function parseAtalayOzelliklerBullets(tabHtml) {
  const raw = stripHtml(tabHtml);
  if (!raw) return [];
  const parts = raw
    .split(/\n+/)
    .flatMap((line) => line.split(/\s*•\s+/))
    .map((l) => l.replace(/^[•·\-–—*]+\s*/, "").trim())
    .filter((l) => l.length > 4);
  return [...new Set(parts)];
}

/** tab2 — tableozellik satırları */
export function parseAtalaySpecsTable(html) {
  const specs = [];
  const seen = new Set();
  const table = String(html || "").match(/id="tab2"[\s\S]*?<table[\s\S]*?<\/table>/i)?.[0] || html;
  for (const tr of table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const tds = [...tr[1].matchAll(/<td[^>]*class="tableozellik"[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      stripHtml(m[1]).replace(/^:$/, "").trim(),
    );
    if (tds.length < 2) continue;
    const key = tds[0].replace(/:$/, "").trim();
    const val = tds[tds.length - 1].trim();
    if (!key || !val || key === ":") continue;
    const line = `${key}: ${val}`;
    const lk = key.toLocaleLowerCase("tr");
    if (seen.has(lk)) continue;
    seen.add(lk);
    specs.push(line);
  }
  return specs;
}

export function formatAtalayDescription(bullets) {
  if (!bullets?.length) return "";
  return bullets.map((b) => `* ${b}`).join("\n");
}

export function parseAtalayPdpHtml(html, url) {
  const src = String(html || "");
  const title = decodeHtmlEntities(src.match(/<h2[^>]*>([^<]+)</i)?.[1] || "");
  if (!title) return null;

  const tab1 = src.match(/id="tab1"[^>]*class="tab_content"[^>]*>([\s\S]*?)<\/div>\s*<!--\s*Tab Bitti/i)?.[1] || "";
  const bullets = parseAtalayOzelliklerBullets(tab1);
  const specs = parseAtalaySpecsTable(src);
  if (!bullets.length && !specs.length) return null;

  const id = url?.match(/[?&]I=(\d+)/i)?.[1] || "";
  const slug = url?.match(/urun-detay\/([^/?]+)/i)?.[1] || "";

  return {
    title,
    bullets,
    specs,
    description: formatAtalayDescription(bullets),
    url: url || "",
    id,
    slug,
    source: "atalay.com.tr",
  };
}
