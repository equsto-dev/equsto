#!/usr/bin/env node
/**
 * pfos-referans-projeler.json → pfos-zone-proje-kurallari.json
 * Çalıştır: node scripts/build-pfos-zone-kurallari.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const referansPath = path.join(root, 'public/data/pfos-referans-projeler.json');
const outPath = path.join(root, 'public/data/pfos-zone-proje-kurallari.json');

const KONSEPT_DEFAULTS = {
  Hotel: ['ana_mutfak', 'sebze_hazirlik', 'et_hazirlik', 'soguk_oda', 'derin_dondurucu', 'pastane', 'bulasikhane', 'bar', 'acik_bufe', 'show_mutfagi'],
  Restaurant: ['ana_mutfak', 'sebze_hazirlik', 'et_hazirlik', 'soguk_oda', 'derin_dondurucu', 'kuru_depo', 'bulasikhane', 'bar', 'acik_bufe'],
  'Pastane & Patisserie': ['pastane', 'sebze_hazirlik', 'soguk_oda', 'derin_dondurucu', 'kuru_depo', 'bulasikhane'],
};

const DUKKAN_DEFAULTS = {
  'All Dining Cafe (TheHouse Cafe, Happymoons vb)': [
    'ana_mutfak', 'sebze_hazirlik', 'soguk_oda', 'bulasikhane', 'bar', 'acik_bufe', 'kuru_depo', 'derin_dondurucu',
  ],
  'Türk Restoran': [
    'ana_mutfak', 'izgara_meze', 'sebze_hazirlik', 'et_hazirlik', 'soguk_oda', 'pastane', 'derin_dondurucu', 'kuru_depo', 'bulasikhane',
  ],
};

function readReferans() {
  if (!fs.existsSync(referansPath)) {
    return { version: 1, projects: [], aggregate: { zone_frequency: {} } };
  }
  return JSON.parse(fs.readFileSync(referansPath, 'utf8'));
}

function mergeZones(konsept, dukkan, fromProjects) {
  const base = new Set(
    (dukkan && DUKKAN_DEFAULTS[dukkan]) ||
      KONSEPT_DEFAULTS[konsept] ||
      KONSEPT_DEFAULTS.Restaurant
  );
  fromProjects.forEach((zk) => base.add(zk));
  const order = [
    'ana_mutfak',
    'sebze_hazirlik',
    'et_hazirlik',
    'izgara_meze',
    'kuru_depo',
    'soguk_oda',
    'derin_dondurucu',
    'bulasikhane',
    'pastane',
    'bar',
    'acik_bufe',
    'show_mutfagi',
  ];
  return order.filter((z) => base.has(z));
}

function main() {
  const ref = readReferans();
  const byProfile = {};

  const usable = (p) =>
    (p.status === 'ok' || p.status === 'manual_curated') && p.zone_order?.length;

  function profileKey(p) {
    const k = p.konsept || 'Restaurant';
    const d = p.dukkan || '';
    return d ? `${k}|${d}` : k;
  }

  for (const p of ref.projects || []) {
    if (!usable(p)) continue;
    const key = profileKey(p);
    if (!byProfile[key]) {
      byProfile[key] = {
        konsept: p.konsept || 'Restaurant',
        dukkan: p.dukkan || '',
        projects: [],
        zones: new Set(),
      };
    }
    byProfile[key].projects.push(p.id);
    p.zone_order.forEach((z) => byProfile[key].zones.add(z));
  }

  const profiles = Object.values(byProfile).map((data) => ({
    konsept: data.konsept,
    dukkan: data.dukkan || undefined,
    source_projects: data.projects,
    pfos_zones: mergeZones(data.konsept, data.dukkan, [...data.zones]),
  }));

  const rules = [];
  for (const prof of profiles) {
    const slug = [prof.konsept, prof.dukkan]
      .filter(Boolean)
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const when = prof.dukkan
      ? { konseptEq: prof.konsept, dukkanEq: prof.dukkan }
      : { konseptEq: prof.konsept };
    rules.push({
      id: `referans-zones-${slug}`,
      priority: prof.dukkan ? 780 : 750,
      when,
      pfosZones: prof.pfos_zones,
      note: `Referans proformalar: ${prof.source_projects.join(', ')}`,
    });
  }

  // Proje bazlı ince ayar
  for (const p of ref.projects || []) {
    if (!usable(p)) continue;
    const whenProj = { referansProjeId: p.id };
    if (p.konsept) whenProj.konseptEq = p.konsept;
    if (p.dukkan) whenProj.dukkanEq = p.dukkan;
    rules.push({
      id: `referans-proje-${p.id}`,
      priority: 820,
      when: whenProj,
      pfosZones: p.zone_order,
      note: p.baslik,
    });
  }

  const out = {
    version: 1,
    source: 'pfos-referans-projeler.json',
    generated_at: new Date().toISOString(),
    profiles,
    rules,
    station_label_map: {
      'Ana Mutfak': 'ana_mutfak',
      'Sıcak Mutfak': 'ana_mutfak',
      'Soğuk Mutfak': 'soguk_oda',
      'Hazırlık Mutfağı': 'sebze_hazirlik',
      'Et Hazırlık': 'et_hazirlik',
      'Bulaşıkhane': 'bulasikhane',
      'Pastane': 'pastane',
      'Bar': 'bar',
      'Açık Büfe': 'acik_bufe',
      'Banket': 'acik_bufe',
      'Show Mutfak': 'show_mutfagi',
      'Üretim': 'pastane',
      'Paketleme': 'kuru_depo',
    },
  };

  fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote', outPath, '—', rules.length, 'rules,', profiles.length, 'profiles');
}

main();
