/** EN GEO gövde — düz metin 600–700 karakter (HTML tek <p>). */
export const EN_BODY_MIN = 600;
export const EN_BODY_MAX = 700;

const CLOSING =
  " Use Project Factory for the full list; sales engineering confirms pricing and installation.";

export function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tekrarlayan kapanış cümlelerini temizle */
export function dedupeClosing(text) {
  const tail =
    "Complete the equipment list in Project Factory or via our contact channel; installation is planned with sales engineering.";
  let t = text;
  while (t.includes(tail + " " + tail)) {
    t = t.replace(tail + " " + tail, tail);
  }
  return t.replace(new RegExp(`(?:\\s*${tail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})+`, "g"), ` ${tail}`);
}

export function normalizeGeoEnBody(html) {
  let t = dedupeClosing(plainText(html));
  if (t.length < EN_BODY_MIN) {
    t = (t + CLOSING).replace(/\s+/g, " ").trim();
  }
  if (t.length > EN_BODY_MAX) {
    const sentences = t.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [t];
    let out = "";
    for (const s of sentences) {
      const next = (out + s).trim();
      if (next.length > EN_BODY_MAX) break;
      out = next;
    }
    t = out.trim() || t.slice(0, EN_BODY_MAX);
  }
  while (t.length < EN_BODY_MIN) {
    const add = CLOSING.slice(0, EN_BODY_MIN - t.length);
    if (!add.trim()) break;
    t = (t + add).trim();
  }
  if (t.length > EN_BODY_MAX) {
    t = t.slice(0, EN_BODY_MAX).replace(/\s+\S*$/, "").trim();
    if (!t.endsWith(".")) t += ".";
  }
  if (t.length < EN_BODY_MIN) {
    t = (t + CLOSING).replace(/\s+/g, " ").trim().slice(0, EN_BODY_MAX);
  }
  return `<p>${t}</p>`;
}

export function assertGeoEnBody(key, html) {
  const n = plainText(html).length;
  if (n < EN_BODY_MIN || n > EN_BODY_MAX) {
    throw new Error(`${key}: ${n} chars (required ${EN_BODY_MIN}-${EN_BODY_MAX})`);
  }
  return html;
}
