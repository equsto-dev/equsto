/** TR GEO gövde — düz metin 600–700 karakter. */
export const TR_BODY_MIN = 600;
export const TR_BODY_MAX = 700;

export const TR_CLOSING =
  "Detaylı ekipman listesi Proje Fabrikası veya iletişim hattı üzerinden tamamlanır; montaj planı satış mühendisliği ile yürütülür.";

export function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLOSING_VARIANTS = [TR_CLOSING];

export function dedupeClosing(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  for (const tail of CLOSING_VARIANTS.sort((a, b) => b.length - a.length)) {
    const escaped = tail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`(?:\\s*${escaped}\\.?)+`, "gi"), "");
  }
  t = t
    .replace(/\.\s*;\s*/g, ". ")
    .replace(/^\s*;\s*/g, "")
    .replace(/\s*;\s*;/g, "; ")
    .replace(/\s+/g, " ")
    .trim();
  return t;
}

function trimToMax(text, max) {
  if (text.length <= max) return text;
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [text];
  let out = "";
  for (const s of sentences) {
    const next = (out + s).trim();
    if (next.length > max) break;
    out = next;
  }
  if (out.length >= TR_BODY_MIN) return out.trim();
  let cut = text.slice(0, max).replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "").trim();
  if (!cut.endsWith(".")) cut += ".";
  return cut;
}

function padToMin(text, min, max) {
  let t = text;
  const hasPfos = /Proje Fabrikası/i.test(t);
  const extras = hasPfos
    ? [
        " Market reyon vitrinindeki SKU örnekleri katalogla bağlantılıdır.",
        " Teklif özeti yaklaşık beş dakikada oluşturulur.",
      ]
    : [
        ` ${TR_CLOSING}`,
        " Teklif özeti Proje Fabrikası'nda yaklaşık beş dakikada oluşturulur.",
        " Market reyon vitrinindeki SKU örnekleri bu rehberle bağlantılıdır.",
      ];
  for (const extra of extras) {
    if (t.length >= min) break;
    const chunk = extra.trim();
    if (t.includes(chunk)) continue;
    t = (t + extra).replace(/\s+/g, " ").trim();
  }
  if (t.length > max) t = trimToMax(t, max);
  return t;
}

/** 2–3 paragraf HTML */
export function normalizeGeoTrBody(html) {
  let t = dedupeClosing(plainText(html));
  if (t.length > TR_BODY_MAX) t = trimToMax(t, TR_BODY_MAX);
  if (t.length < TR_BODY_MIN) t = padToMin(t, TR_BODY_MIN, TR_BODY_MAX);
  if (t.length > TR_BODY_MAX) t = trimToMax(t, TR_BODY_MAX);

  const parts = t.match(/[^.!?]+[.!?]+/g) || [t];
  if (parts.length >= 3) {
    const mid = Math.ceil(parts.length / 2);
    const p1 = parts.slice(0, mid).join(" ").trim();
    const p2 = parts.slice(mid).join(" ").trim();
    let html = `<p>${p1}</p><p>${p2}</p>`;
    let n = plainText(html).length;
    if (n > TR_BODY_MAX) {
      t = trimToMax(t, TR_BODY_MAX);
      const p = t.match(/[^.!?]+[.!?]+/g) || [t];
      const mid = Math.ceil(p.length / 2);
      html = `<p>${p.slice(0, mid).join(" ").trim()}</p><p>${p.slice(mid).join(" ").trim()}</p>`;
    }
    return html;
  }
  return `<p>${t}</p>`;
}

export function assertGeoTrBody(key, html) {
  const n = plainText(html).length;
  if (n < TR_BODY_MIN || n > TR_BODY_MAX) {
    throw new Error(`${key}: ${n} karakter (gerekli ${TR_BODY_MIN}-${TR_BODY_MAX})`);
  }
  return html;
}
