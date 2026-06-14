/** Urban Bar — içki / alkollü ürün tespiti (Equsto'da satış yasak) */

const SPIRIT_TAGS = new Set([
  "spirits",
  "gin",
  "whisky",
  "rum",
  "tequila",
  "cognac",
  "vermouth",
  "english-sparkling-wines",
  "other-spirits-&-liqueurs",
  "bitters-syrups-condiments",
  "cocktail-bitters",
]);

const ALCOHOL_COLLECTIONS = new Set([
  "drinks-more",
  "spirits-liquors",
  "gin",
  "whisky",
  "rum",
  "tequila",
  "vermouth",
]);

const ALCOHOL_NAME =
  /\b(whisky|whiskey|scotch|single malt|blended malt|sparkling wine|champagne|prosecco|cognac|vermouth|liqueur|blanc de noirs|cuv[eé]e|negroni|espresso martini|gin martini|london dry gin|mancino|doorly'?s|glenfarclas|ben riach|sheep dip|all angels|roebuck|decanter and glass|whisky and glass|wine and glass|wine bundle|sparkling bundle|pre-mixed|premixed|spirit\b|75cl|70cl|50cl|35cl)\b/i;

const ALCOHOL_KIT = /\b(cocktail making kit|cocktail kit)\b/i;

function normTags(product) {
  return (product.catTags || product.urbanbar_cat_tags || product.tags || []).map((t) =>
    String(t || "")
      .trim()
      .toLowerCase()
      .replace(/^cat:/, ""),
  );
}

function normCollections(product) {
  return (product.collections || product.urbanbar_collections || []).map((c) =>
    String(typeof c === "string" ? c : c?.handle || "")
      .trim()
      .toLowerCase(),
  );
}

function haystack(product) {
  return [
    product.title,
    product.name,
    product.description,
    product.aciklama,
    product.specs,
    product.collectionPath,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Şişe hacmi + içki anahtar kelimesi (cam/bar ekipmanı değil) */
function isSpiritBottle(title) {
  const t = String(title || "").toLowerCase();
  if (!/\b(75cl|70cl|50cl|35cl|1\s*litre|1l)\b/.test(t)) return false;
  if (/\b(glass|coupe|tumbler|shaker|stopper|jigger|spoon|strainer|bundle pack)\b/.test(t)) {
    return ALCOHOL_NAME.test(t);
  }
  return true;
}

function isBarwareAccessory(title, hay) {
  const t = String(title || "").toLowerCase();
  if (/\b(blanc de noirs|cuv[eé]e|roebuck|all angels|ben riach|glenfarclas|sheep dip|doorly)\b/.test(hay)) {
    return false;
  }
  if (/\b(stopper|stoppers|jigger|shaker|strainer|spoon|bucket|ice mould|ice mold|mixing glass)\b/.test(t)) {
    return true;
  }
  if (/\b(cocktail bar kit|bar kit and glasses|home bartender|starter pack|piece cocktail bar kit)\b/.test(t)) {
    return true;
  }
  if (/\b(glass|glasses|coupe|tumbler|flute|highball|martini glass|wine glass)\b/.test(t)) {
    return !/\b(whisky|whiskey|scotch|single malt|sparkling wine bundle|wine bundle|gin martini|negroni|espresso martini|blended malt|blanc de noirs|cuv[eé]e)\b/.test(
      hay,
    );
  }
  return false;
}

export function isUrbanBarAlcoholProduct(product) {
  const tags = normTags(product);
  const cols = normCollections(product);
  const hay = haystack(product);
  const title = String(product.title || product.name || "");

  if (isBarwareAccessory(title, hay)) return false;

  if (tags.some((t) => SPIRIT_TAGS.has(t))) return true;
  if (cols.some((c) => ALCOHOL_COLLECTIONS.has(c))) return true;

  if (isSpiritBottle(title)) return true;
  if (ALCOHOL_NAME.test(hay)) return true;

  if (/\bbob'?s\b.*\bbitters\b/i.test(hay)) return true;

  if (ALCOHOL_KIT.test(title) && ALCOHOL_NAME.test(hay)) return true;

  if (tags.includes("b2c-bundle") && ALCOHOL_NAME.test(hay)) return true;

  if (cols.includes("cocktail-kits") && ALCOHOL_NAME.test(hay)) return true;

  return false;
}

export function isUrbanBarAlcoholRow(row) {
  return isUrbanBarAlcoholProduct({
    title: row.name,
    name: row.name,
    description: row.aciklama,
    specs: row.specs,
    catTags: row.urbanbar_cat_tags,
    collections: row.urbanbar_collections,
    collectionPath: row.specs,
  });
}
