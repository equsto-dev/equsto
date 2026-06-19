import { readJsonFile } from "@/lib/legacy-data";

export type PfosProjeDosya = {
  name: string;
  type: string;
  url?: string;
  path?: string;
};

export type PfosProjeZoneOzet = {
  zoneKey: string;
  title: string;
  lineCount: number;
  m2?: number;
};

export type PfosProjeDetail = {
  id: string;
  baslik: string;
  konsept: string;
  dukkan: string;
  pfosZones: string[];
  bolumM2: Record<string, number>;
  m2Toplam: number;
  files: PfosProjeDosya[];
  zones: PfosProjeZoneOzet[];
  approved?: boolean;
  approvedAt?: string;
  note?: string;
};

type PilotProjectRow = {
  id: string;
  baslik?: string;
  konsept?: string;
  dukkan?: string;
  detail_json?: string;
  pfos_zones?: string[];
  bolum_m2?: Record<string, number>;
  m2_toplam?: number;
  files?: PfosProjeDosya[];
  alan_m2?: { note?: string; pfos_alan?: number; brut_toplam?: number };
  approved?: boolean;
  approved_at?: string;
};

type PilotDetailJson = {
  id: string;
  baslik?: string;
  konsept?: string;
  dukkan?: string;
  pfos_zones?: string[];
  alan_m2?: {
    zones?: Record<string, number>;
    pfos_alan?: number;
    brut_toplam?: number;
    note?: string;
  };
  zones?: Record<
    string,
    { zone_key?: string; title?: string; items?: unknown[] }
  >;
  approved?: boolean;
  approved_at?: string;
  source_files?: string[];
};

async function loadPilotRegistry(): Promise<PilotProjectRow[]> {
  const reg = await readJsonFile<{ projects?: PilotProjectRow[] }>(
    "pfos-pilot-projeler.json",
  );
  return reg?.projects ?? [];
}

export async function loadPfosProjectDetail(
  id: string,
): Promise<PfosProjeDetail | null> {
  const key = id.trim();
  if (!key) return null;

  const registry = await loadPilotRegistry();
  const row = registry.find((p) => p.id === key);
  if (!row) return null;

  let detail: PilotDetailJson | null = null;
  if (row.detail_json) {
    detail = await readJsonFile<PilotDetailJson>(row.detail_json);
  }

  const pfosZones =
    row.pfos_zones ?? detail?.pfos_zones ?? Object.keys(detail?.zones ?? {});
  const bolumM2 =
    row.bolum_m2 ??
    detail?.alan_m2?.zones ??
    {};
  const m2Toplam =
    row.m2_toplam ??
    detail?.alan_m2?.pfos_alan ??
    detail?.alan_m2?.brut_toplam ??
    Object.values(bolumM2).reduce((s, v) => s + Number(v), 0);

  const files: PfosProjeDosya[] = (row.files ?? []).map((f) => ({
    name: f.name,
    type: f.type,
    url:
      f.url ??
      (f.path?.startsWith("pfos-projeler/")
        ? `/data/${f.path}`
        : f.path?.startsWith("data/")
          ? `/${f.path}`
          : undefined),
    path: f.path,
  }));

  const zones: PfosProjeZoneOzet[] = pfosZones.map((zoneKey) => {
    const z = detail?.zones?.[zoneKey];
    return {
      zoneKey,
      title: z?.title ?? zoneKey,
      lineCount: Array.isArray(z?.items) ? z.items.length : 0,
      m2: bolumM2[zoneKey],
    };
  });

  return {
    id: key,
    baslik: row.baslik ?? detail?.baslik ?? key,
    konsept: row.konsept ?? detail?.konsept ?? "",
    dukkan: row.dukkan ?? detail?.dukkan ?? "",
    pfosZones,
    bolumM2,
    m2Toplam,
    files,
    zones,
    approved: row.approved ?? detail?.approved,
    approvedAt: row.approved_at ?? detail?.approved_at,
    note: row.alan_m2?.note ?? detail?.alan_m2?.note,
  };
}

/** Konsept slug veya etiket → referans proje listesi (pilot kayıtları) */
export async function loadPfosProjectsForKonsept(
  konseptSlug: string,
  konseptLabel?: string,
): Promise<{ id: string; baslik: string; zoneCount: number }[]> {
  const slug = konseptSlug.trim().toLowerCase();
  const label = (konseptLabel ?? "").trim().toLowerCase();
  const registry = await loadPilotRegistry();
  return registry
    .filter((p) => {
      const k = (p.konsept ?? "").toLowerCase();
      const d = (p.dukkan ?? "").toLowerCase();
      return (
        k === label ||
        d === label ||
        k.includes(slug) ||
        d.includes(slug) ||
        slug.includes(k) ||
        (slug === "steakhouse" && (k.includes("steak") || d.includes("steak")))
      );
    })
    .map((p) => ({
      id: p.id,
      baslik: p.baslik ?? p.id,
      zoneCount: (p.pfos_zones ?? []).length,
    }));
}
