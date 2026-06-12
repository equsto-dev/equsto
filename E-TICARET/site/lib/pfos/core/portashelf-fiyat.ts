/** Portashelf 4 katlı raf — liste (EUR), satış = listenin %45'i (%55 iskonto) */
export const PORTASHELF_SATIS_ORAN = 0.45;

export const PORTASHELF_ALT_KATEGORI_BASE = "KATLI RAFLAR · TIER SHELVING";

export const PORTASHELF_INOX304_ALT_KATEGORI =
  `${PORTASHELF_ALT_KATEGORI_BASE} · INOX 304`;
export const PORTASHELF_INOX304L_ALT_KATEGORI =
  `${PORTASHELF_ALT_KATEGORI_BASE} · INOX 304 LIGHT`;
export const PORTASHELF_INOX201_ALT_KATEGORI =
  `${PORTASHELF_ALT_KATEGORI_BASE} · INOX 201`;
export const PORTASHELF_INOX201_ALT_KATEGORI_LIGHT =
  `${PORTASHELF_ALT_KATEGORI_BASE} · INOX 201 LIGHT`;

/** @deprecated use PORTASHELF_INOX201_ALT_KATEGORI_LIGHT */
export const PORTASHELF_INOX201_ALT_KATEGORI_LEGACY =
  PORTASHELF_INOX201_ALT_KATEGORI_LIGHT;

export type PortashelfVariantKey = "304" | "304L" | "201" | "201L";

export type PortashelfKatliRafRow = {
  depthCm: number;
  widthCm: number;
  heightCm: number;
  listeEur: number;
  variant: PortashelfVariantKey;
};

const CATALOG_4KAT: Array<[number, number, number, number, number, number, number]> = [
  [46, 91, 183, 488, 424, 372, 336],
  [46, 107, 183, 532, 464, 408, 356],
  [46, 122, 183, 560, 480, 432, 372],
  [46, 137, 183, 628, 536, 484, 416],
  [46, 152, 183, 680, 576, 516, 440],
  [46, 183, 183, 764, 632, 572, 492],
  [53, 91, 183, 528, 452, 408, 356],
  [53, 107, 183, 568, 480, 432, 376],
  [53, 122, 183, 672, 568, 508, 432],
  [53, 137, 183, 716, 620, 540, 460],
  [53, 152, 183, 768, 636, 580, 492],
  [53, 183, 183, 868, 744, 660, 568],
  [61, 91, 183, 588, 508, 440, 380],
  [61, 107, 183, 632, 544, 488, 416],
  [61, 122, 183, 724, 600, 540, 460],
  [61, 137, 183, 768, 636, 580, 492],
  [61, 152, 183, 832, 688, 632, 528],
  [61, 183, 183, 952, 776, 716, 584],
];

const VARIANT_META: Record<
  PortashelfVariantKey,
  { skuSuffix: string; priceIdx: number; altKategori: string }
> = {
  "304": { skuSuffix: "-304", priceIdx: 3, altKategori: PORTASHELF_INOX304_ALT_KATEGORI },
  "304L": {
    skuSuffix: "-304L",
    priceIdx: 4,
    altKategori: PORTASHELF_INOX304L_ALT_KATEGORI,
  },
  "201": { skuSuffix: "-201", priceIdx: 5, altKategori: PORTASHELF_INOX201_ALT_KATEGORI },
  "201L": {
    skuSuffix: "",
    priceIdx: 6,
    altKategori: PORTASHELF_INOX201_ALT_KATEGORI_LIGHT,
  },
};

function buildVariantTable(variant: PortashelfVariantKey): PortashelfKatliRafRow[] {
  const { priceIdx } = VARIANT_META[variant];
  return CATALOG_4KAT.map((row) => ({
    depthCm: row[0],
    widthCm: row[1],
    heightCm: row[2],
    listeEur: row[priceIdx],
    variant,
  }));
}

/** Yüksel 2025 katalog — 4 katlı raf malzeme sütunları */
export const PORTASHELF_INOX304_4KAT = buildVariantTable("304");
export const PORTASHELF_INOX304L_4KAT = buildVariantTable("304L");
export const PORTASHELF_INOX201_4KAT = buildVariantTable("201");
export const PORTASHELF_INOX201L_4KAT = buildVariantTable("201L");

/** @deprecated use PORTASHELF_INOX201L_4KAT */
export type PortashelfInox201Row = Omit<PortashelfKatliRafRow, "variant">;

/** @deprecated use PORTASHELF_INOX201L_4KAT */
export const PORTASHELF_INOX201_4KAT_LEGACY: PortashelfInox201Row[] =
  PORTASHELF_INOX201L_4KAT.map(({ depthCm, widthCm, heightCm, listeEur }) => ({
    depthCm,
    widthCm,
    heightCm,
    listeEur,
  }));

export function portashelfVariantFromSku(
  sku: string | null | undefined,
): PortashelfVariantKey | null {
  const s = String(sku ?? "").trim().toUpperCase();
  if (/-304L$/i.test(s)) return "304L";
  if (/-304$/i.test(s)) return "304";
  if (/-201$/i.test(s)) return "201";
  if (/^\d+-X-\d+-X-\d+$/i.test(s)) return "201L";
  return null;
}

export function portashelfSkuFromCm(
  depthCm: number,
  widthCm: number,
  heightCm: number,
  variant: PortashelfVariantKey = "201L",
): string {
  const suffix = VARIANT_META[variant].skuSuffix;
  return `${depthCm}-X-${widthCm}-X-${heightCm}${suffix}`;
}

export function isPortashelfSku(sku: string | null | undefined): boolean {
  return portashelfVariantFromSku(sku) !== null;
}

export function isOztiIstifSku(sku: string | null | undefined): boolean {
  return /^8897\.|^7897\./i.test(String(sku ?? "").trim());
}

export function portashelfSatisEurFromListe(listeEur: number): number {
  return Math.round(listeEur * PORTASHELF_SATIS_ORAN * 100) / 100;
}

/** Portashelf paslanmaz çöp arabası — Yüksel MB126X */
export const PORTASHELF_COP_ARABASI_SKU = "MB126X";
export const PORTASHELF_COP_ARABASI_LISTE_EUR = 358;

export function portashelfCopArabasiSatisEur(): number {
  return portashelfSatisEurFromListe(PORTASHELF_COP_ARABASI_LISTE_EUR);
}

export function isPortashelfCopArabasiSku(sku: string | null | undefined): boolean {
  return normSku(String(sku ?? "").trim()) === "MB126X";
}

function normSku(s: string): string {
  return s.replace(/\s+/g, "").toUpperCase();
}

function parsePortashelfSku(sku: string): {
  depthCm: number;
  widthCm: number;
  heightCm: number;
  variant: PortashelfVariantKey;
} | null {
  const variant = portashelfVariantFromSku(sku);
  if (!variant) return null;
  const m = /^(\d+)-x-(\d+)-x-(\d+)/i.exec(String(sku ?? "").trim());
  if (!m) return null;
  return {
    depthCm: Number(m[1]),
    widthCm: Number(m[2]),
    heightCm: Number(m[3]),
    variant,
  };
}

function tableForVariant(variant: PortashelfVariantKey): PortashelfKatliRafRow[] {
  switch (variant) {
    case "304":
      return PORTASHELF_INOX304_4KAT;
    case "304L":
      return PORTASHELF_INOX304L_4KAT;
    case "201":
      return PORTASHELF_INOX201_4KAT;
    default:
      return PORTASHELF_INOX201L_4KAT;
  }
}

/** Müşteri / teklif adı — malzeme kodu (INOX 201 vb.) yazılmaz */
export function portashelfDisplayName(
  depthCm: number,
  widthCm: number,
  heightCm: number,
): string {
  return `Portashelf 4 Katlı Raf ${depthCm}×${widthCm}×${heightCm} cm`;
}

/** Portashelf 4 katlı raf — tek takım paslanmaz istif rafı görseli (tüm malzeme/ölçü SKU'ları). */
export const PORTASHELF_304_GORSEL_REL =
  "images/catalog/yuksel/portashelf-inox-4katli-raf.jpg";

/** Portashelf ölçü SKU → kanonik tel raf görseli */
export function portashelfGorselRelFromSku(
  sku: string | null | undefined,
): string | null {
  if (!isPortashelfSku(sku)) return null;
  return PORTASHELF_304_GORSEL_REL;
}

function olcuNums(olcu: string): number[] {
  return [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
}

function dimDistance(a: [number, number, number], b: [number, number, number]): number {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
}

function permutations3(nums: number[]): Array<[number, number, number]> {
  if (nums.length < 3) return [];
  const [a, b, c] = nums.slice(0, 3);
  return [
    [a, b, c],
    [a, c, b],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [c, b, a],
  ];
}

function findPortashelfByOlcuInTable(
  olcu: string,
  table: PortashelfKatliRafRow[],
  variant: PortashelfVariantKey,
): (PortashelfKatliRafRow & { sku: string; satisEur: number }) | null {
  const nums = olcuNums(olcu);
  if (nums.length < 2) return null;

  let best: (PortashelfKatliRafRow & { dist: number }) | null = null;
  for (const row of table) {
    const catalog: [number, number, number] = [
      row.depthCm,
      row.widthCm,
      row.heightCm,
    ];
    const perms = permutations3(nums);
    if (!perms.length) continue;
    const dist = Math.min(...perms.map((p) => dimDistance(p, catalog)));
    if (!best || dist < best.dist) {
      best = { ...row, dist };
    }
  }
  if (!best || best.dist > 80) return null;

  const sku = portashelfSkuFromCm(best.depthCm, best.widthCm, best.heightCm, variant);
  return {
    depthCm: best.depthCm,
    widthCm: best.widthCm,
    heightCm: best.heightCm,
    listeEur: best.listeEur,
    variant,
    sku,
    satisEur: portashelfSatisEurFromListe(best.listeEur),
  };
}

/** Referans ölçüsüne en yakın INOX 201 LIGHT 4 katlı raf (PFOS varsayılan) */
export function findPortashelfInox201ByOlcu(
  olcu: string,
): (PortashelfKatliRafRow & { sku: string; satisEur: number }) | null {
  return findPortashelfByOlcuInTable(olcu, PORTASHELF_INOX201L_4KAT, "201L");
}

export function portashelfBySku(
  sku: string,
): (PortashelfKatliRafRow & { sku: string; satisEur: number }) | null {
  const parsed = parsePortashelfSku(sku);
  if (!parsed) return null;
  const row = tableForVariant(parsed.variant).find(
    (r) =>
      r.depthCm === parsed.depthCm &&
      r.widthCm === parsed.widthCm &&
      r.heightCm === parsed.heightCm,
  );
  if (!row) return null;
  const resolvedSku = portashelfSkuFromCm(
    parsed.depthCm,
    parsed.widthCm,
    parsed.heightCm,
    parsed.variant,
  );
  return {
    ...row,
    sku: resolvedSku,
    satisEur: portashelfSatisEurFromListe(row.listeEur),
  };
}

/** @deprecated use portashelfBySku */
export function portashelfInox201BySku(
  sku: string,
): (PortashelfKatliRafRow & { sku: string; satisEur: number }) | null {
  return portashelfBySku(sku);
}
