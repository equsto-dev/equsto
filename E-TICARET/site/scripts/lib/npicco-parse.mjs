/**
 * npicco.com WooCommerce açıklama HTML → ölçü tablosu + özellik listesi
 */
import { decodeHtml, stripTags, variantToOlculer } from "./sparo-parse.mjs";

export { decodeHtml, stripTags, variantToOlculer };

export function normalizeNpiccoKod(k) {
  const m = String(k || "").match(/NPICCO\s*(\d+\.\d+)/i);
  if (!m) return String(k || "").replace(/\s+/g, "").toUpperCase();
  return `NPICCO${m[1]}`;
}

export function parseTableVariants(html) {
  const variants = [];
  const trs = [...String(html || "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trs) {
    if (/<th\b/i.test(tr[1])) continue;
    const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]));
    if (!tds.length) continue;
    const kodRaw = tds[0].replace(/\s+/g, " ").trim();
    if (!/^NPICCO\s*\d+/i.test(kodRaw)) continue;
    const row = {
      kod: normalizeNpiccoKod(kodRaw),
      uzunluk_cm: tds[1] || "",
      genislik_cm: tds[2] || "",
      yukseklik_cm: tds[3] || "",
      izgara_olcusu: tds[4] || "",
      dinlendirme_olcusu: "",
      agirlik_kg: tds[5] || tds[6] || "",
    };
    if (!row.agirlik_kg && tds.length === 5 && /^\d/.test(tds[4])) {
      row.agirlik_kg = tds[4];
      row.izgara_olcusu = "";
    }
    variants.push(row);
  }
  const seen = new Set();
  return variants.filter((v) => {
    if (seen.has(v.kod)) return false;
    seen.add(v.kod);
    return true;
  });
}

export function parseFeatureList(html) {
  const features = [];
  const preTable = String(html || "").split(/<table/i)[0] || html;
  for (const m of preTable.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
    for (const part of String(m[1]).split(/<br\s*\/?>/gi)) {
      const t = stripTags(part)
        .replace(/^[•\-*–]\s*/, "")
        .trim();
      if (!t || t.length < 3) continue;
      if (/^teknik\s*özellik/i.test(t)) continue;
      if (/^ürün\s*özellik/i.test(t)) continue;
      if (/^NPICCO\s*\d/i.test(t)) continue;
      features.push(t);
    }
  }
  for (const m of String(html || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)) {
    const t = stripTags(m[1]);
    if (t.length > 2 && !/^NPICCO\s*\d/i.test(t)) features.push(t);
  }
  return [...new Set(features)];
}

export function formatVariantSpecs(baseName, v, features, sourceUrl) {
  const lines = [baseName, v.kod ? `Model: ${v.kod}` : ""];
  if (v.uzunluk_cm || v.genislik_cm || v.yukseklik_cm) {
    lines.push(
      "",
      "Ölçüler (cm)",
      v.uzunluk_cm ? `Uzunluk: ${v.uzunluk_cm}` : "",
      v.genislik_cm ? `Genişlik: ${v.genislik_cm}` : "",
      v.yukseklik_cm ? `Yükseklik: ${v.yukseklik_cm}` : "",
    );
  }
  if (v.izgara_olcusu) lines.push(`Izgara ölçüsü: ${v.izgara_olcusu}`);
  if (v.dinlendirme_olcusu) lines.push(`Dinlendirme ölçüsü: ${v.dinlendirme_olcusu}`);
  if (v.agirlik_kg) lines.push(`Ağırlık: ${v.agirlik_kg} kg`);
  if (features.length) {
    lines.push("", "Teknik özellikler");
    for (const f of features) lines.push(`• ${f}`);
  }
  lines.push("", "Kaynak: npicco.com", sourceUrl || "", "Marka: Npicco");
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

export function mapNpiccoCategory(_categories) {
  return { dept: "pisirme", category: "kati-yakitli-izgaralar" };
}

export function npiccoCategoryLabel(categories) {
  const root = (categories || []).find((c) =>
    [
      "barbekuler",
      "davlumbazli-barbekuler",
      "komurlu-firinlar",
      "setustu-barbekuler",
      "tutsuleme-firinlari",
      "yakitori",
      "multi-set-barbekuler",
      "elektrikli-gazli-izgaralar",
    ].includes(c.slug),
  );
  return root?.name?.replace(/&amp;/g, "&") || "";
}
