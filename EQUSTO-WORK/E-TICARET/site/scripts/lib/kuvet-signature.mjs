/**
 * Gastronorm küvet ürün adından eşleştirme anahtarı (Equsto ↔ Cafemarkt).
 */
export function parseKuvetSignature(name) {
  const raw = String(name || "").toUpperCase().replace(/İ/g, "I").replace(/Ş/g, "S");
  const s = raw.replace(/\s+/g, " ").trim();

  let variant = "std";
  if (/KAPAK/.test(s) && /POLIKARBON|POLICARBON/.test(s)) variant = "kapak-policarbon";
  else if (/KAPAK/.test(s) && /POLIPROPILEN/.test(s)) variant = "kapak-polipropilen";
  else if (/KAPAK/.test(s)) variant = "kapak";
  else if (/POLIKARBON|POLICARBON/.test(s)) variant = "polikarbon";
  else if (/POLIPROPILEN/.test(s)) variant = "polipropilen";
  else if (/YAPISMAZ/.test(s)) variant = "yapismaz";
  else if (/DELIKLI/.test(s) && /GNP/.test(s)) variant = "delikli-gnp";
  else if (/SAPLI/.test(s) && /\bGH\b/.test(s)) variant = "sapli-gh";
  else if (/KÖSE|KOSE/.test(s) && /DESEN/.test(s)) {
    if (/DELIKLI/.test(s)) variant = "delikli-gnp-kose";
    else if (/SAPLI/.test(s)) variant = "sapli-gh-kose";
    else variant = "std-kose";
  } else if (/DONDURMA/.test(s)) variant = "dondurma-pp";

  const gnM =
    s.match(/(?:\bGN|\bGNP|\bGH)\s*(\d+\s*\/\s*\d+)/) ||
    s.match(/(\d+\s*\/\s*\d+)(?:[\s-]+(\d{2,3}))?/);
  const gn = gnM ? gnM[1].replace(/\s+/g, "") : "";

  let depth = "";
  if (gnM?.[2]) depth = String(Number(gnM[2]));
  if (!depth) {
    const depthM =
      s.match(new RegExp(gn.replace("/", "\\/") + "[\\s-]+(\\d{2,3})\\b")) ||
      s.match(new RegExp(gn.replace("/", "\\/") + "-(\\d{2,3})\\b")) ||
      s.match(/-(\d{2,3})(?:\s|$|K)/);
    if (depthM) depth = String(Number(depthM[depthM.length - 1]));
  }

  const key = [variant, gn, depth].filter(Boolean).join("|");
  return { variant, gn, depth, key };
}

/** Cafemarkt başlığı → aynı anahtar */
export function parseCafemarktKuvetSignature(title) {
  const t = String(title || "");
  let variant = "std";
  if (/kapak/i.test(t) && /polikarbon|policarbon/i.test(t)) variant = "kapak-policarbon";
  else if (/kapak/i.test(t) && /polipropilen/i.test(t)) variant = "kapak-polipropilen";
  else if (/kapak/i.test(t)) variant = "kapak";
  else if (/polikarbon|policarbon/i.test(t)) variant = "polikarbon";
  else if (/polipropilen/i.test(t)) variant = "polipropilen";
  else if (/yapışmaz|yapismaz/i.test(t)) variant = "yapismaz";
  else if (/delikli/i.test(t)) {
    variant = /köşe|kose/i.test(t) ? "delikli-gnp-kose" : "delikli-gnp";
  } else if (/saplı|sapli/i.test(t)) {
    variant = /köşe|kose/i.test(t) ? "sapli-gh-kose" : "sapli-gh";
  } else if (/köşe|kose/i.test(t) && /desen/i.test(t)) variant = "std-kose";

  const gnM = t.match(/GN\s*(\d+\s*\/\s*\d+)/i);
  const gn = gnM ? gnM[1].replace(/\s+/g, "") : "";
  const depthM = t.match(/GN\s*\d+\s*\/\s*\d+-(\d+)\s*mm/i);
  const depth = depthM ? String(Number(depthM[1])) : "";
  if (!depth && gn) {
    const d2 = t.match(new RegExp(gn.replace("/", "\\/") + "-(\\d+)\\s*mm", "i"));
    if (d2) depth = String(Number(d2[1]));
  }

  return { variant, gn, depth, key: [variant, gn, depth].filter(Boolean).join("|") };
}

/** `public/images/catalog/cafemarkt-images/*.jpg` dosya adı → imza */
export function parseCafemarktImagesFile(filename) {
  const base = String(filename || "")
    .replace(/_\d+\.(jpe?g|png|webp|gif)$/i, "")
    .toLowerCase();

  if (base === "gastronom-dondurma-kuveti-polipropilen") {
    return { variant: "dondurma-pp", gn: "", depth: "", key: "dondurma-pp" };
  }

  const kapak = base.match(
    /^gastronom-kuvet-kapak-(policarbon|polipropilen)-(\d+)-(\d+)$/
  );
  if (kapak) {
    const variant = `kapak-${kapak[1] === "policarbon" ? "policarbon" : "polipropilen"}`;
    const gn = `${kapak[2]}/${kapak[3]}`;
    return { variant, gn, depth: "", key: [variant, gn].join("|") };
  }

  const body = base.match(
    /^gastronom-kuvet-(policarbon|polipropilen)-(\d+)-(\d+)-(\d+)$/
  );
  if (body) {
    const variant = body[1] === "policarbon" ? "polikarbon" : "polipropilen";
    const gn = `${body[2]}/${body[3]}`;
    const depth = String(Number(body[4]));
    return { variant, gn, depth, key: [variant, gn, depth].join("|") };
  }

  return { variant: "", gn: "", depth: "", key: "" };
}

/** Yerel cafemarkt-images klasörü indeksi (filename → imza) */
export function buildCafemarktImagesIndex(imageDir, readdirSync) {
  const byKey = new Map();
  if (!readdirSync) return byKey;
  let files = [];
  try {
    files = readdirSync(imageDir);
  } catch {
    return byKey;
  }
  for (const file of files) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
    const sig = parseCafemarktImagesFile(file);
    if (!sig.key) continue;
    if (!byKey.has(sig.key)) byKey.set(sig.key, file);
  }
  return byKey;
}
