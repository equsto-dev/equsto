/** EN GEO gövde — düz metin 600–700 karakter (HTML tek <p>). */
export const EN_BODY_MIN = 600;
export const EN_BODY_MAX = 700;

export const CLOSING =
  "Use Project Factory for the full list; sales engineering confirms pricing and installation.";

export function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const CLOSING_VARIANTS = [
  "Use Project Factory for the full list; sales engineering confirms pricing and installation.",
  "Use Project Factory for quote summaries in about five minutes; sales engineering confirms pricing and installation.",
  "Complete the equipment list in Project Factory or via our contact channel; installation is planned with sales engineering.",
];

/** Tekrarlayan kapanış cümlelerini temizle */
export function dedupeClosing(text) {
  let t = String(text || "").replace(/\s+/g, " ").trim();
  for (const tail of CLOSING_VARIANTS.sort((a, b) => b.length - a.length)) {
    const escaped = tail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    t = t.replace(new RegExp(`(?:\\s*${escaped}\\.?)+`, "gi"), "");
  }
  t = t.replace(/\s*Use Project F[a-z]*\s*$/i, "").trim();
  return t.replace(/\s+/g, " ").trim();
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
  if (out.length >= EN_BODY_MIN) return out.trim();
  let cut = text.slice(0, max).replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "").trim();
  if (!cut.endsWith(".")) cut += ".";
  return cut;
}

function padToMin(text, min, max) {
  let t = text;
  const extras = [
    ` ${CLOSING}`,
    " Request a quote summary in Project Factory in about five minutes.",
    " Sample SKU tables and FAQs appear on each linked guide page.",
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

export function normalizeGeoEnBody(html) {
  let t = dedupeClosing(plainText(html));
  if (t.length > EN_BODY_MAX) t = trimToMax(t, EN_BODY_MAX);
  if (t.length < EN_BODY_MIN) t = padToMin(t, EN_BODY_MIN, EN_BODY_MAX);
  if (t.length > EN_BODY_MAX) t = trimToMax(t, EN_BODY_MAX);
  if (t.length < EN_BODY_MIN) {
    throw new Error(`Could not normalize to ${EN_BODY_MIN}-${EN_BODY_MAX}: ${t.length} chars`);
  }
  return `<p>${t}</p>`;
}

export function assertGeoEnBody(key, html) {
  const n = plainText(html).length;
  if (n < EN_BODY_MIN || n > EN_BODY_MAX) {
    throw new Error(`${key}: ${n} chars (required ${EN_BODY_MIN}-${EN_BODY_MAX})`);
  }
  const raw = plainText(html);
  if (/Use Project Factory for the full list.*Use Project Factory for the full list/i.test(raw)) {
    throw new Error(`${key}: duplicate closing sentence`);
  }
  return html;
}

/** Multi-paragraph EN bodies — preserve <p> structure (blog hub, concept guides). */
export function normalizeGeoEnBodyStructured(html) {
  const raw = String(html || "").trim();
  const paras = [...raw.matchAll(/<p>([\s\S]*?)<\/p>/gi)].map((m) =>
    dedupeClosing(plainText(m[1])).replace(/\s+/g, " ").trim()
  );
  if (!paras.length) {
    return normalizeGeoEnBody(html);
  }
  return paras.map((t) => `<p>${t}</p>`).join("");
}

export function assertGeoEnBodyStructured(key, html, opts = {}) {
  const minParas = opts.minParas ?? 1;
  const minChars = opts.minChars ?? 150;
  const paras = [...String(html || "").matchAll(/<p>([\s\S]*?)<\/p>/gi)];
  if (paras.length < minParas) {
    throw new Error(`${key}: ${paras.length} paragraphs (required ≥${minParas})`);
  }
  const n = plainText(html).length;
  if (n < minChars) {
    throw new Error(`${key}: ${n} chars (required ≥${minChars})`);
  }
  return html;
}
