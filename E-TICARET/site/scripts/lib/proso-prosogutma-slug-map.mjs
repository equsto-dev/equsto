/**
 * prosogutma.com ürün slug → Excel model ailesi eşlemesi.
 * Kaynak: prosogutma.com ürün sayfaları + Display Cabinets 2025 xlsx.
 */

/** @typedef {{ modelKod: string, excelFam?: string[], defaultWidth?: number, note?: string }} SlugMapEntry */

/** @type {Record<string, SlugMapEntry>} */
export const PROSO_SLUG_MAP = {
  "tiger-cg": { modelKod: "TIGER 800 CG/CB", excelFam: ["TIGER 800 CG/CB - OF"], defaultWidth: 1250 },
  "tiger-fg": { modelKod: "TIGER 800 FG/CB", excelFam: ["TIGER 800 FG/CB - OF"], defaultWidth: 1250 },
  "tiger-dp": { modelKod: "TIGER 800 DP/OF", excelFam: ["TIGER 800 DP/OF"], defaultWidth: 1250 },
  "tiger-wfg": { modelKod: "TIGER 800 WFG/CB", excelFam: ["TIGER 800 WFG/CB"], defaultWidth: 1250 },
  "tiger-ifg": { modelKod: "TIGER 800 IFG/CB", note: "Excel'de IFG satırı yok" },
  rhino: { modelKod: "RHINO 125/160", excelFam: ["RHINO 125/160"], defaultWidth: 1250 },
  quokka: { modelKod: "QUOKKA", excelFam: ["QUOKKA"], defaultWidth: 1250 },
  kangaroo: { modelKod: "KANGAROO 800 CG/CB", excelFam: ["KANGAROO 800 CG/CB"], defaultWidth: 1250 },
  leopard: { modelKod: "LEOPARD 800 FG/CB", excelFam: ["LEOPARD 800 FG/CB"], defaultWidth: 1350 },
  whale: { modelKod: "WHALE G50/150", excelFam: ["WHALE G50/150 DOUBLE"], defaultWidth: 1875 },
  crab: { modelKod: "CRAB 800/1050", excelFam: ["CRAB 800/1050"], defaultWidth: 1050 },
  spider: { modelKod: "SPIDER 800/1050", excelFam: ["SPIDER 800/1050"], defaultWidth: 1050 },
  panther: { modelKod: "PANTHER DP 75/205", excelFam: ["PANTHER DP 75/205"], defaultWidth: 1350 },
  "panther-sgd": { modelKod: "PANTHER DP 75/205 SGD", excelFam: ["PANTHER DP 75/205 SGD"], defaultWidth: 1350 },
  "panther-dgd-sld": { modelKod: "PANTHER DP 75/205 DGD", note: "Excel'de DGD+SLD kombinasyonu yok" },
  puma: { modelKod: "PUMA DP 80/205", excelFam: ["PUMA DP 80/205"], defaultWidth: 1350 },
  "puma-sgd": { modelKod: "PUMA DP 80/205 SGD", excelFam: ["PUMA DP 80/205 SGD"], defaultWidth: 1350 },
  "puma-dgd-sld": { modelKod: "PUMA DP 80/205 DGD", note: "Excel'de DGD+SLD kombinasyonu yok" },
  cobra: { modelKod: "COBRA 800 FG/CB", excelFam: ["COBRA 800-900 FG/CB-OF"], defaultWidth: 1250 },
  "cobra-tower": { modelKod: "COBRA TOWER 800 FG/CB", excelFam: ["COBRA TOWER 800-900 FG/CB-OF UPRIGHT"], defaultWidth: 937 },
  scorpion: { modelKod: "SCORPION 75/205", excelFam: ["SCORPION 75/205 1D UPRIGHT"], defaultWidth: 795 },
  "scorpion-max": { modelKod: "SCORPION MAX", note: "Excel'de MAX serisi yok" },
  octopus: { modelKod: "OCTOPUS 110", excelFam: ["OCTOPUS 110"], defaultWidth: 1500 },
  "octopus-sld": { modelKod: "OCTOPUS 110 SLD", note: "Excel'de OCTOPUS SLD yok" },
  orca: { modelKod: "ORCA", note: "Excel'de ORCA yok" },
  "orca-plugin": { modelKod: "ORCA PLG", note: "Excel'de ORCA plug-in yok" },
  phoenix: { modelKod: "PHOENIX DP 75/140", excelFam: ["PHOENIX DP 75-90/140"], defaultWidth: 1030 },
  "dolphin-is": { modelKod: "DOLPHIN IS G20/110", excelFam: ["DOLPHIN IS G20/110 SINGLE"], defaultWidth: 1875 },
  "dolphin-wa": { modelKod: "DOLPHIN WA G50/110", excelFam: ["DOLPHIN WA G50/110"], defaultWidth: 1875 },
  dragon: { modelKod: "DRAGON 75/205", excelFam: ["DRAGON 75/205 2D"], defaultWidth: 1562 },
  fox: { modelKod: "FOX 90/117", excelFam: ["FOX 90/117 PI"], defaultWidth: 1350 },
  iguana: { modelKod: "IGUANA 75/205", excelFam: ["IGUANA 75/205 2D"], defaultWidth: 1350 },
  rabbit: { modelKod: "RABBIT PR/PR 90/145", excelFam: ["RABBIT PR/PR 90/145"], defaultWidth: 1035 },
  "firefly-pr": { modelKod: "FIREFLY PR 75/130", excelFam: ["FIREFLY PR 75/130"], defaultWidth: 1250 },
  "firefly-pn": { modelKod: "FIREFLY PN 75/130", excelFam: ["FIREFLY PN 75/130"], defaultWidth: 1250 },
  "firefly-br": { modelKod: "FIREFLY BR 75/130", excelFam: ["FIREFLY BR 75/130"], defaultWidth: 1250 },
  "firefly-corners": { modelKod: "FIREFLY PR 75/130/OC90", excelFam: ["FIREFLY PR 75/130/OC90"], defaultWidth: 2540 },
  "butterfly-pr": { modelKod: "BUTTERFLY PR 75/130", excelFam: ["BUTTERFLY PR 75/130"], defaultWidth: 1250 },
  "butterfly-pn": { modelKod: "BUTTERFLY PN 75/130", excelFam: ["BUTTERFLY PN 75/130"], defaultWidth: 1250 },
  "butterfly-ba": { modelKod: "BUTTERFLY BA 75/130", note: "Excel'de BA yok (BM/HP var)" },
  "butterfly-bm": { modelKod: "BUTTERFLY BM 75/130", excelFam: ["BUTTERFLY BM 75/130 BAIN-MARIE TYPE HEATED HOT MEAL"], defaultWidth: 1250 },
  "butterfly-br": { modelKod: "BUTTERFLY BR 75/130", excelFam: ["BUTTERFLY BR 75/130 NEUTRAL BREAD"], defaultWidth: 1250 },
  "butterfly-dp": { modelKod: "BUTTERFLY DP/SS 75/130", excelFam: ["BUTTERFLY DP/SS 75/130"], defaultWidth: 1250 },
  "butterfly-hp": { modelKod: "BUTTERFLY HP 75/130", excelFam: ["BUTTERFLY HP 75/130 DRY HOT PLATE HEATED"], defaultWidth: 1250 },
  "butterfly-mft": { modelKod: "BUTTERFLY MFT PR 75/150", excelFam: ["BUTTERFLY MFT PR 75/150"], defaultWidth: 1250 },
  "butterfly-sb": { modelKod: "BUTTERFLY SB 75/130", excelFam: ["BUTTERFLY SB 75/130"], defaultWidth: 1250 },
  "butterfly-sp": { modelKod: "BUTTERFLY SP 75/170", excelFam: ["BUTTERFLY SP 75/170"], defaultWidth: 1250 },
  "butterfly-dvn-pr-pn": { modelKod: "BUTTERFLY PR DVN PR - PR SS 75/130", note: "Excel'de DVN varyantı sınırlı" },
  "butterfly-tk": { modelKod: "BUTTERFLY TK", note: "Excel'de TK serisi yok" },
  "lion-dgd": { modelKod: "LION DP 75/205 DGD", excelFam: ["LION DP 75/205 DGD"], defaultWidth: 1250, note: "Landing — detay varyantlar lion sayfasında" },
  "lion-lgd": { modelKod: "LION DP 75/205 LGD", excelFam: ["LION DP 75/205 LGD"], defaultWidth: 1250, note: "Landing" },
  "lion-pgd": { modelKod: "LION DP 75/205 PGD", excelFam: ["LION DP 75/205 PGD"], defaultWidth: 1250, note: "Landing" },
  "lion-sgd": { modelKod: "LION DP 75/205 SGD", excelFam: ["LION DP 75/205 SGD"], defaultWidth: 1250, note: "Landing" },
  "lion-cc": { modelKod: "LION CC", note: "Excel'de CC serisi yok" },
  "lion-fva": { modelKod: "LION FVA", note: "Excel'de FVA serisi yok" },
  "lion-max": { modelKod: "LION MAX", note: "Excel'de MAX serisi yok" },
  "falcon-plug-in": { modelKod: "FALCON PLG DP 75/150", note: "Excel'de PLG ayrı satır yok" },
  "barracuda-frozen": { modelKod: "BARRACUDA", note: "Excel'de yok" },
  buffalo: { modelKod: "BUFFALO", note: "Excel'de yok" },
  flamingo: { modelKod: "FLAMINGO", note: "Excel'de yok" },
  penguin: { modelKod: "PENGUIN", note: "Excel'de yok" },
  "cift-rejimli-merkezi-sogutma": { modelKod: "CIFT REJIMLI", note: "Excel'de yok — sistem ürünü" },
  "endu%cc%88striyel-sog%cc%86utma-sistemi": { modelKod: "ENDUSTRIYEL SOGUTMA", note: "Excel'de yok" },
  "soguk-hava-deposu": { modelKod: "SOGUK HAVA DEPOSU", note: "Excel'de yok — ayrı fiyat listesi" },
  "split-sogutma-sistemi": { modelKod: "SPLIT SOGUTMA", note: "Excel'de yok" },
};

export function slugFromCatalogRow(row) {
  if (row.prosoModelSlug) return row.prosoModelSlug;
  const id = String(row.id || "");
  if (id.startsWith("proso__")) return id.slice(7);
  return "";
}

export function resolveSlugMap(slug) {
  if (!slug) return null;
  return PROSO_SLUG_MAP[slug] || null;
}
