/**
 * sparo.com.tr WooCommerce açıklama HTML → ölçü tablosu + özellik listesi
 */
export function decodeHtml(s) {
  return String(s || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&#215;/g, "×")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function stripTags(html) {
  return decodeHtml(String(html || "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "));
}

export function normalizeSprKod(k) {
  const m = String(k || "").match(/SPR\s*(\d+\.\d+)/i);
  if (!m) return String(k || "").replace(/\s+/g, "").toUpperCase();
  return `SPR${m[1]}`;
}

function numCm(s) {
  const raw = String(s || "").trim();
  if (!raw) return null;
  const m = raw.match(/(\d+(?:[.,]\d+)?)/);
  return m ? Number(m[1].replace(",", ".")) : null;
}

export function parseTableVariants(html) {
  const variants = [];
  const trs = [...String(html || "").matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const tr of trs) {
    if (/<th\b/i.test(tr[1])) continue;
    const tds = [...tr[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripTags(m[1]));
    if (!tds.length) continue;
    const kodRaw = tds[0].replace(/\s+/g, " ").trim();
    if (!/^SPR\s*\d+/i.test(kodRaw)) continue;
    const row = {
      kod: normalizeSprKod(kodRaw),
      uzunluk_cm: tds[1] || "",
      genislik_cm: tds[2] || "",
      yukseklik_cm: tds[3] || "",
      izgara_olcusu: tds[4] || "",
      dinlendirme_olcusu: tds[5] || "",
      agirlik_kg: tds[6] || "",
    };
    if (!row.agirlik_kg && tds.length === 6 && /^\d/.test(tds[5])) {
      row.agirlik_kg = tds[5];
      row.dinlendirme_olcusu = tds[4] || "";
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
  return [...String(html || "").matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((m) => stripTags(m[1]))
    .filter((t) => t.length > 1 && !/^SPR\s*\d/i.test(t));
}

export function variantToOlculer(v) {
  const L = numCm(v.uzunluk_cm);
  const W = numCm(v.genislik_cm);
  const H = numCm(v.yukseklik_cm);
  if (!L && !W && !H) return {};
  const label = [v.uzunluk_cm, v.genislik_cm, v.yukseklik_cm].filter(Boolean).join(" × ");
  return {
    olcu_etiket: label ? `${label} cm` : undefined,
    olculer: {
      ...(L ? { genislik_mm: Math.round(L * 10) } : {}),
      ...(W ? { derinlik_mm: Math.round(W * 10) } : {}),
      ...(H ? { yukseklik_mm: Math.round(H * 10) } : {}),
    },
  };
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
    lines.push("", "Ürün özellikleri");
    for (const f of features) lines.push(`• ${f}`);
  }
  lines.push("", "Kaynak: sparo.com.tr", sourceUrl || "", "Marka: Sparo");
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}

export function mapSparoCategory(_categories) {
  return { dept: "pisirme", category: "komurlu-izgara" };
}
