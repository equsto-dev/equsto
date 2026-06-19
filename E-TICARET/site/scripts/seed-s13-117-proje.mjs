/**
 * S13-117 pilot → pfos-pilot-projeler.json + pfos-referans-projeler.json kaydı
 * Kullanım: node scripts/seed-s13-117-proje.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const pilotPath = join(root, "public/data/referans-pilot/S13-117-steakhouse-pilot.json");
const pilot = JSON.parse(readFileSync(pilotPath, "utf8"));

const zoneOrder = pilot.pfos_zones ?? [];
const zones = {};
let lineTotal = 0;
for (const key of zoneOrder) {
  const z = pilot.zones?.[key];
  const items = z?.items ?? [];
  lineTotal += items.length;
  zones[key] = {
    zone_key: key,
    labels_found: z?.title ? [z.title] : [],
    line_count: items.length,
    sample_lines: items.slice(0, 8).map((i) => String(i.name ?? "")),
  };
}

const pilotEntry = {
  id: pilot.id,
  folder: "S13-117 Steakhouse",
  baslik: pilot.baslik,
  konsept: pilot.konsept,
  dukkan: pilot.dukkan,
  zone_order: zoneOrder,
  zones,
  zone_count: zoneOrder.length,
  file_count: 3,
  status: "referans-pilot",
  approved: pilot.approved,
  approved_at: pilot.approved_at,
  detail_json: "referans-pilot/S13-117-steakhouse-pilot.json",
  files: [
    {
      path: "pfos-projeler/S13-117/S13-117-8.dwg",
      type: "dwg",
      name: "S13-117-8.dwg",
      status: "ok",
      url: "/data/pfos-projeler/S13-117/S13-117-8.dwg",
    },
    ...((pilot.source_files ?? []).map((name) => ({
      path: `referans-pilot/${name}`,
      type: name.endsWith(".pdf") ? "pdf" : "other",
      name,
      status: "ok",
    }))),
  ],
  alan_m2: pilot.alan_m2,
  bolum_m2: pilot.alan_m2?.zones ?? {},
  m2_toplam: pilot.alan_m2?.pfos_alan ?? pilot.alan_m2?.brut_toplam ?? 270,
  pfos_zones: zoneOrder,
};

const pilotRegistryPath = join(root, "public/data/pfos-pilot-projeler.json");
writeFileSync(
  pilotRegistryPath,
  JSON.stringify(
    {
      version: 1,
      updated_at: new Date().toISOString(),
      projects: [pilotEntry],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);

const refPath = join(root, "public/data/pfos-referans-projeler.json");
const refRaw = JSON.parse(readFileSync(refPath, "utf8"));
const refProjects = refRaw.projects ?? [];
const refIdx = refProjects.findIndex((p) => p.id === pilot.id);
const refEntry = {
  id: pilot.id,
  baslik: pilot.baslik,
  konsept: "Steakhouse",
  dukkan: "Steakhouse",
  source_file: "pfos-projeler/S13-117/S13-117-8.dwg",
  status: "referans-pilot",
  path: "public/data/pfos-projeler/S13-117/S13-117-8.dwg",
  zone_order: zoneOrder,
  zones,
  approved_at: pilot.approved_at,
  note: pilot.alan_m2?.note,
};
if (refIdx >= 0) refProjects[refIdx] = refEntry;
else refProjects.unshift(refEntry);
refRaw.projects = refProjects;
refRaw.updated_at = new Date().toISOString();
writeFileSync(refPath, JSON.stringify(refRaw, null, 2) + "\n", "utf8");

console.log(`S13-117 kaydedildi: ${zoneOrder.length} zone, ${lineTotal} kalem, DWG → /data/pfos-projeler/S13-117/S13-117-8.dwg`);
