/** /yonetim/* → admin.html sekme (hash + isteğe bağlı E-Ticaret alt panel) */

export type YonetimAdminTarget = {
  hash: string;
  et?: string;
  /** Konsept Tipleri alt sekme: konsept | sorular | setkural */
  pa?: string;
  /** İlk açılışta Ant Design Pro kanonik veriyi yükle */
  sync?: boolean;
};

const PATH_MAP: Record<string, YonetimAdminTarget> = {
  "": { hash: "pdfimport" },
  pfos: { hash: "proje-akis", pa: "konsept", sync: true },
  "proje-akis": { hash: "proje-akis", pa: "konsept", sync: true },
  eticaret: { hash: "eticaret", et: "et-ozet" },
  ozet: { hash: "eticaret", et: "et-ozet" },
  urunler: { hash: "eticaret", et: "et-urunler" },
  katalog: { hash: "products" },
  arama: { hash: "products" },
  kontrol: { hash: "export" },
  yayin: { hash: "eticaret", et: "et-vitrin" },
  sorular: { hash: "sorular" },
  "akis-sorular": { hash: "proje-akis", pa: "sorular" },
  konsept: { hash: "proje-akis", pa: "konsept" },
  kurallar: { hash: "rules" },
  setler: { hash: "sets" },
  export: { hash: "export" },
  sogukoda: { hash: "sogukoda" },
};

export function yonetimPathToAdminTarget(pathSegments: string[]): YonetimAdminTarget {
  const key = pathSegments.filter(Boolean).join("/");
  const first = pathSegments.filter(Boolean)[0] ?? "";
  return PATH_MAP[key] ?? PATH_MAP[first] ?? { hash: "pdfimport" };
}

export function yonetimPathToAdminSrc(pathSegments: string[]): string {
  const { hash, et, pa, sync } = yonetimPathToAdminTarget(pathSegments);
  const q = new URLSearchParams();
  q.set("from", "yonetim");
  if (et) q.set("et", et);
  if (pa) q.set("pa", pa);
  if (sync) q.set("sync", "pro");
  return `/admin.html?${q.toString()}#${hash}`;
}
