import { readJsonFile } from "@/lib/legacy-data";
import type {
  PfosProjeProfil,
  PfosProjeRow,
  PfosProjelerResponse,
} from "./types";

type ArchiveProject = {
  id: string;
  folder?: string;
  baslik?: string;
  konsept?: string;
  dukkan?: string;
  zone_order?: string[];
  zones?: Record<string, { line_count?: number }>;
  zone_count?: number;
  file_count?: number;
  status?: string;
  files?: { line_count?: number }[];
};

type ReferansProject = {
  id: string;
  folder?: string;
  baslik?: string;
  konsept?: string;
  dukkan?: string;
  zone_order?: string[];
  status?: string;
};

let cache: PfosProjelerResponse | null = null;

function yilFromId(id: string): string {
  const m = id.match(/^(\d{4})/);
  return m ? m[1] : "—";
}

function inferFromFolder(folder: string): { konsept: string; dukkan: string } {
  const f = folder.toUpperCase();
  if (/HOTEL| OTEL|HILTON|SHERATON|HAMPTON|DOUBLETREE/.test(f)) {
    return { konsept: "Hotel", dukkan: "5 Yıldız Otel" };
  }
  if (/ESPRESSO|COFFEE|KAHWA|KAHVE DURA|STARKS|GLORIA JEANS/.test(f)) {
    return { konsept: "Restaurant", dukkan: "Coffee Shop" };
  }
  if (/PIZZA|PIZZACI/.test(f)) {
    return { konsept: "Restaurant", dukkan: "Pizzacı" };
  }
  if (/DÖNER|DONER|KEBAP|OCAKBAŞI|OCAKBASI/.test(f)) {
    return { konsept: "Restaurant", dukkan: "Kebap & Ortadoğu" };
  }
  if (/MEYHANE|BISTRO|STEAKHOUSE/.test(f)) {
    return { konsept: "Restaurant", dukkan: "Meyhane / Mezeli" };
  }
  if (/SÜTİŞ|SUTIS|TÜRK|TURK REST/.test(f)) {
    return { konsept: "Restaurant", dukkan: "Türk Restoran" };
  }
  if (/PASTANE|BÖREK|BOREK|MAGNOLIA/.test(f)) {
    return { konsept: "Pastane", dukkan: "Pastane" };
  }
  if (/YEMEKHANE|CATERING|AKADEMİ|OKUL|KOLEJ|ÜNİ|UNI\./.test(f)) {
    return { konsept: "Restaurant", dukkan: "All Dining Cafe (TheHouse Cafe, Happymoons vb)" };
  }
  return { konsept: "", dukkan: "" };
}

function bestProfile(
  zones: string[],
  profiles: PfosProjeProfil[],
): { label: string; score: number } | null {
  if (!zones.length || !profiles.length) return null;
  const set = new Set(zones);
  let best: { label: string; score: number } | null = null;
  for (const p of profiles) {
    const pZones = p.pfosZones ?? [];
    if (!pZones.length) continue;
    const hit = pZones.filter((z) => set.has(z)).length;
    const score = hit / Math.max(pZones.length, zones.length);
    if (hit === 0) continue;
    const label = `${p.konsept} · ${p.dukkan}`;
    if (!best || score > best.score) best = { label, score };
  }
  return best;
}

function lineCountFromProject(p: ArchiveProject): number {
  let n = 0;
  for (const f of p.files ?? []) {
    if (f.line_count) n += f.line_count;
  }
  if (n === 0 && p.zones) {
    for (const z of Object.values(p.zones)) {
      n += z.line_count ?? 0;
    }
  }
  return n;
}

type PilotProject = Omit<ArchiveProject, "files"> & {
  detail_json?: string;
  pfos_zones?: string[];
  bolum_m2?: Record<string, number>;
  m2_toplam?: number;
  files?: { path?: string; type?: string; name?: string; url?: string; line_count?: number }[];
  approved?: boolean;
};

function rowFromPilot(
  p: PilotProject,
  referansIds: Set<string>,
  profiles: PfosProjeProfil[],
): PfosProjeRow {
  const zones = p.zone_order ?? p.pfos_zones ?? Object.keys(p.zones ?? {});
  const match = bestProfile(zones, profiles);
  const dwg = (p.files ?? []).find((f) => f.type === "dwg");
  const referans = referansIds.has(p.id) || p.status === "referans-pilot";

  return {
    id: p.id,
    baslik: p.baslik ?? p.id,
    folder: p.folder ?? p.baslik ?? p.id,
    yil: yilFromId(p.id),
    konsept: p.konsept ?? "",
    dukkan: p.dukkan ?? "",
    zones,
    zoneCount: p.zone_count ?? zones.length,
    fileCount: p.file_count ?? p.files?.length ?? 0,
    lineCount: lineCountFromProject(p),
    status: p.status ?? "pilot",
    referans,
    profilOneri: match?.label ?? null,
    profilSkor: match ? Math.round(match.score * 100) : 0,
    kaynak: "pilot",
    detailAvailable: Boolean(p.detail_json),
    dwgUrl: dwg?.url ?? (dwg?.path ? `/data/${dwg.path}` : null),
  };
}

function rowFromArchive(
  p: ArchiveProject,
  referansById: Map<string, ReferansProject>,
  referansIds: Set<string>,
  profiles: PfosProjeProfil[],
): PfosProjeRow {
  const ref = referansById.get(p.id);
  const folder = p.folder ?? p.baslik ?? p.id;
  const zones = p.zone_order ?? Object.keys(p.zones ?? {});
  const inferred = inferFromFolder(folder);

  let konsept = ref?.konsept || p.konsept || inferred.konsept;
  let dukkan = ref?.dukkan || p.dukkan || inferred.dukkan;

  const match = bestProfile(zones, profiles);
  if (!konsept && match) {
    const [k, ...rest] = match.label.split(" · ");
    konsept = k ?? "";
    dukkan = rest.join(" · ");
  }

  const referans = referansIds.has(p.id);

  return {
    id: p.id,
    baslik: ref?.baslik ?? p.baslik ?? folder,
    folder,
    yil: yilFromId(p.id),
    konsept,
    dukkan,
    zones,
    zoneCount: p.zone_count ?? zones.length,
    fileCount: p.file_count ?? p.files?.length ?? 0,
    lineCount: lineCountFromProject(p),
    status: p.status ?? ref?.status ?? "—",
    referans,
    profilOneri: match?.label ?? null,
    profilSkor: match ? Math.round(match.score * 100) : 0,
    kaynak: referans ? "referans" : "arsiv",
  };
}

export async function loadPfosProjects(): Promise<PfosProjelerResponse> {
  if (cache) return cache;

  const [archive, referans, kurallar, vitrin, pilot] = await Promise.all([
    readJsonFile<{ projects: ArchiveProject[] }>("pfos-archive-extract.json"),
    readJsonFile<{ projects: ReferansProject[] }>("pfos-referans-projeler.json"),
    readJsonFile<{ profiles: PfosProjeProfil[] }>("pfos-zone-proje-kurallari.json"),
    readJsonFile<{
      projects?: {
        id: string;
        baslik: string;
        match?: { konsept?: string; dukkan?: string };
        lines?: unknown[];
      }[];
    }>("pfos-projects.json"),
    readJsonFile<{ projects?: PilotProject[] }>("pfos-pilot-projeler.json"),
  ]);

  if (!archive || !referans || !kurallar) {
    cache = {
      projects: [],
      profiles: [],
      stats: {
        total: 0,
        referans: 0,
        yillar: [],
        konseptler: [],
        dukkanlar: [],
        zones: [],
      },
    };
    return cache;
  }

  const profiles = kurallar.profiles ?? [];
  const referansById = new Map(referans.projects.map((p) => [p.id, p]));
  const referansIds = new Set(referans.projects.map((p) => p.id));

  const byId = new Map<string, PfosProjeRow>();
  for (const p of archive.projects ?? []) {
    byId.set(p.id, rowFromArchive(p, referansById, referansIds, profiles));
  }

  for (const p of pilot?.projects ?? []) {
    byId.set(p.id, rowFromPilot(p, referansIds, profiles));
  }

  for (const v of vitrin?.projects ?? []) {
    if (byId.has(v.id)) continue;
    const zones = ["ana_mutfak", "bar", "bulasikhane"];
    const match = bestProfile(zones, profiles);
    byId.set(v.id, {
      id: v.id,
      baslik: v.baslik,
      folder: v.baslik,
      yil: yilFromId(v.id),
      konsept: v.match?.konsept ?? "",
      dukkan: v.match?.dukkan ?? "",
      zones,
      zoneCount: zones.length,
      fileCount: 0,
      lineCount: v.lines?.length ?? 0,
      status: "vitrin",
      referans: false,
      profilOneri: match?.label ?? null,
      profilSkor: match ? Math.round(match.score * 100) : 0,
      kaynak: "vitrin",
    });
  }

  const projects = [...byId.values()].sort((a, b) =>
    b.id.localeCompare(a.id, undefined, { numeric: true }),
  );

  const yillar = [...new Set(projects.map((p) => p.yil))].sort().reverse();
  const konseptler = [
    ...new Set(projects.map((p) => p.konsept).filter(Boolean)),
  ].sort();
  const dukkanlar = [
    ...new Set(projects.map((p) => p.dukkan).filter(Boolean)),
  ].sort();
  const zones = [
    ...new Set(projects.flatMap((p) => p.zones)),
  ].sort();

  cache = {
    projects,
    profiles,
    stats: {
      total: projects.length,
      referans: projects.filter((p) => p.referans).length,
      yillar,
      konseptler,
      dukkanlar,
      zones,
    },
  };
  return cache;
}
