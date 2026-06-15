import { existsSync } from "node:fs";

export const EKIPMANLAR_JSON = "ekipmanlar.json";

const SITE_ROOT_MARKERS = ["public/data", "var/catalog"] as const;

/** Monorepo + Docker — site kökü */
export function resolveSiteRoot(): string | null {
  const cwd = process.cwd().replace(/\\/g, "/");
  const candidates = [
    cwd,
    `${cwd}/E-TICARET/site`,
    `${cwd}/../E-TICARET/site`,
    "/var/task",
  ];
  for (const root of candidates) {
    if (SITE_ROOT_MARKERS.some((m) => existsSync(`${root}/${m}`))) {
      return root;
    }
  }
  return null;
}

function dataRel(...parts: string[]): string {
  return parts
    .flatMap((p) => p.split(/[/\\]+/))
    .filter(Boolean)
    .join("/");
}

/** Sunucu-yalnız katalog (public dışı) */
export function privateCatalogPath(...parts: string[]): string {
  const root = resolveSiteRoot() ?? process.cwd().replace(/\\/g, "/");
  return `${root}/var/catalog/${dataRel(...parts)}`;
}

export function publicDataFilePath(...parts: string[]): string {
  const root = resolveSiteRoot() ?? process.cwd().replace(/\\/g, "/");
  return `${root}/public/data/${dataRel(...parts)}`;
}

/** ekipmanlar.json — önce gizli konum, geçiş için eski public yolu */
export function ekipmanlarJsonReadPaths(): string[] {
  return [
    privateCatalogPath(EKIPMANLAR_JSON),
    publicDataFilePath(EKIPMANLAR_JSON),
  ];
}

export const PUBLIC_BLOCKED_DATA_PATHS = [
  "/data/ekipmanlar.json",
  "/data/ekipmanlar-full-archive.json",
] as const;
