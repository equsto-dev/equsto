/** SEO geo / rehber slug listesi — next.config ile senkron tutulmalı */
export const GEO_TR_SLUGS = [
  "steakhouse-kurulumu",
  "balik-restorani-mutfak-projesi-kurulumu",
  "bulut-mutfak-kurulumu",
  "cafe-kurulumu",
  "catering-mutfagi",
  "fine-dining-kurulumu",
  "dunya-mutfak-kurulumu",
  "italyan-restoran-kurulumu",
  "all-day-dining-kurulumu",
  "all-day-casual-cafe-kurulumu",
  "fast-food-kurulumu",
  "market-kasap-sarkuteri-kurulumu",
  "endustriyel-mutfak-ekipmani-turkiye",
  "restoran-mutfak-teklif",
  "otel-mutfak-ekipman-tedarik",
  "oztiryakiler-ekipmani-tedarik",
  "soguk-oda-teklif",
  "havuzlu-dolap-tedarik",
  "endustriyel-pisirme-ekipmanlari",
  "mutfak-teklif-platformu",
  "bar-tasarimi-turkiye",
  "blog",
] as const;

export const GEO_EN_SLUGS = [
  "steakhouse-kitchen-setup",
  "fish-restaurant-kitchen-project-and-equipment",
  "cloud-kitchen-setup",
  "cafe-setup",
  "catering-kitchen",
  "fast-food-kitchen-setup",
  "fine-dining-kitchen-setup",
  "all-day-dining-kitchen-setup",
  "all-day-casual-cafe-setup",
  "market-butcher-deli-setup",
  "world-cuisine-kitchen-setup",
  "italian-restaurant-kitchen-setup",
  "industrial-kitchen-equipment-turkey",
  "industrial-kitchen-supplier-turkey",
  "commercial-kitchen-quotation",
  "restaurant-kitchen-quote",
  "hotel-kitchen-equipment",
  "oztiryakiler-equipment-supply",
  "cold-room-quote",
  "deli-counter-refrigeration",
  "industrial-cooking-equipment",
  "kitchen-quote-platform",
  "bar-design-turkey",
] as const;

export const GEO_TR_PREFIX_ROUTES = ["projeler", "rehber"] as const;

export function isGeoTrPath(segments: string[]): boolean {
  if (!segments.length) return false;
  const [a, b] = segments;
  if (GEO_TR_SLUGS.includes(a as (typeof GEO_TR_SLUGS)[number])) return true;
  if (a === "projeler") return true;
  if (a === "rehber" && b) return true;
  return false;
}

export function isGeoEnPath(segments: string[]): boolean {
  if (!segments.length) return false;
  const [a, b] = segments;
  if (a === "blog" || a === "projects") return true;
  if (a === "guides" && b) return true;
  return GEO_EN_SLUGS.includes(a as (typeof GEO_EN_SLUGS)[number]);
}
