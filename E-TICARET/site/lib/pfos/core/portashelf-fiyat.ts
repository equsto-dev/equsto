/** Portashelf 4 katlı raf — INOX 201 LIGHT liste (EUR), satış = listenin %45'i */
export const PORTASHELF_SATIS_ORAN = 0.45;

export const PORTASHELF_INOX201_ALT_KATEGORI =
  "KATLI RAFLAR · TIER SHELVING · INOX 201 LIGHT";

export type PortashelfInox201Row = {
  depthCm: number;
  widthCm: number;
  heightCm: number;
  listeEur: number;
};

/** Yüksel 2025 katalog — 4 katlı raf, INOX 201 LIGHT sütunu (AISI ibaresi kullanılmaz) */
export const PORTASHELF_INOX201_4KAT: PortashelfInox201Row[] = [
  { depthCm: 46, widthCm: 91, heightCm: 183, listeEur: 336 },
  { depthCm: 46, widthCm: 107, heightCm: 183, listeEur: 356 },
  { depthCm: 46, widthCm: 122, heightCm: 183, listeEur: 372 },
  { depthCm: 46, widthCm: 137, heightCm: 183, listeEur: 416 },
  { depthCm: 46, widthCm: 152, heightCm: 183, listeEur: 440 },
  { depthCm: 46, widthCm: 183, heightCm: 183, listeEur: 492 },
  { depthCm: 53, widthCm: 91, heightCm: 183, listeEur: 356 },
  { depthCm: 53, widthCm: 107, heightCm: 183, listeEur: 376 },
  { depthCm: 53, widthCm: 122, heightCm: 183, listeEur: 432 },
  { depthCm: 53, widthCm: 137, heightCm: 183, listeEur: 460 },
  { depthCm: 53, widthCm: 152, heightCm: 183, listeEur: 492 },
  { depthCm: 53, widthCm: 183, heightCm: 183, listeEur: 568 },
  { depthCm: 61, widthCm: 91, heightCm: 183, listeEur: 380 },
  { depthCm: 61, widthCm: 107, heightCm: 183, listeEur: 416 },
  { depthCm: 61, widthCm: 122, heightCm: 183, listeEur: 460 },
  { depthCm: 61, widthCm: 137, heightCm: 183, listeEur: 492 },
  { depthCm: 61, widthCm: 152, heightCm: 183, listeEur: 528 },
  { depthCm: 61, widthCm: 183, heightCm: 183, listeEur: 584 },
];

export function portashelfSkuFromCm(
  depthCm: number,
  widthCm: number,
  heightCm: number,
): string {
  return `${depthCm}-X-${widthCm}-X-${heightCm}`;
}

export function isPortashelfSku(sku: string | null | undefined): boolean {
  return /^\d+-x-\d+-x-\d+$/i.test(String(sku ?? "").trim());
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

/** Müşteri / teklif adı — malzeme kodu (INOX 201 vb.) yazılmaz */
export function portashelfDisplayName(
  depthCm: number,
  widthCm: number,
  heightCm: number,
): string {
  return `Portashelf 4 Katlı Raf ${depthCm}×${widthCm}×${heightCm} cm`;
}

/** Portashelf 4 katlı raf — kanonik 304 kalite tel raf görseli (tüm ölçü SKU'ları). */
export const PORTASHELF_304_GORSEL_REL =
  "images/catalog/yuksel/yuksel-46-x-152-x-183_1.jpg";

/** Portashelf ölçü SKU → her zaman 304 kalite referans görseli */
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

/** Referans ölçüsüne en yakın INOX 201 LIGHT 4 katlı raf */
export function findPortashelfInox201ByOlcu(
  olcu: string,
): (PortashelfInox201Row & { sku: string; satisEur: number }) | null {
  const nums = olcuNums(olcu);
  if (nums.length < 2) return null;

  let best: (PortashelfInox201Row & { dist: number }) | null = null;
  for (const row of PORTASHELF_INOX201_4KAT) {
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

  const sku = portashelfSkuFromCm(best.depthCm, best.widthCm, best.heightCm);
  return {
    depthCm: best.depthCm,
    widthCm: best.widthCm,
    heightCm: best.heightCm,
    listeEur: best.listeEur,
    sku,
    satisEur: portashelfSatisEurFromListe(best.listeEur),
  };
}

export function portashelfInox201BySku(
  sku: string,
): (PortashelfInox201Row & { sku: string; satisEur: number }) | null {
  const m = /^(\d+)-x-(\d+)-x-(\d+)$/i.exec(String(sku ?? "").trim());
  if (!m) return null;
  const depthCm = Number(m[1]);
  const widthCm = Number(m[2]);
  const heightCm = Number(m[3]);
  const row = PORTASHELF_INOX201_4KAT.find(
    (r) =>
      r.depthCm === depthCm &&
      r.widthCm === widthCm &&
      r.heightCm === heightCm,
  );
  if (!row) return null;
  return {
    ...row,
    sku: portashelfSkuFromCm(depthCm, widthCm, heightCm),
    satisEur: portashelfSatisEurFromListe(row.listeEur),
  };
}
