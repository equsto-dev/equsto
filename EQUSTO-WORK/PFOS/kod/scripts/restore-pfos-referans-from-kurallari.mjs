#!/usr/bin/env node
/** Kurallar + önceki kürasyon meta → pfos-referans-projeler.json (xlsx yokken) */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const kurPath = path.join(root, 'public/data/pfos-zone-proje-kurallari.json');
const outPath = path.join(root, 'public/data/pfos-referans-projeler.json');

const META = {
  '2017-050': {
    baslik: 'DoubleTree Hilton Topkapı',
    konsept: 'Hotel',
    dukkan: '5 Yıldız Otel',
    source_file: '2017-050 DOUBLETREE HILTON TOPKAPI/2017-050.xlsx',
    curated_note: 'Otel ana mutfak proforması — xlsx doğrulama bekliyor',
  },
  '2017-044': {
    baslik: 'THC Bakü',
    konsept: 'Restaurant',
    dukkan: 'All Dining Cafe (TheHouse Cafe, Happymoons vb)',
    dukkan_kisa: 'All Day Cafe',
    source_file: '2017-044 THC BAKÜ +/2017-044-6.1.xlsx',
    curated_note: 'THC Bakü — All Day Cafe (otel değil); xlsx doğrulama bekliyor',
  },
  '2017-120': {
    baslik: 'Sütiş Mersin',
    konsept: 'Restaurant',
    dukkan: 'Türk Restoran',
    source_file: '2017-120 SÜTİŞ MERSİN/2017-120.xlsx',
    curated_note: 'Sütiş Mersin — Türk restoran mutfağı; xlsx doğrulama bekliyor',
  },
  '2017-204': {
    baslik: 'Vadistanbul',
    konsept: 'Restaurant',
    dukkan: 'Food Court / Çoklu outlet',
    source_file: '2017-204 VADİİSTANBUL/2017-204-4.xlsx',
    curated_note: 'AVM merkezi mutfak — xlsx doğrulama bekliyor',
  },
};

const kur = JSON.parse(fs.readFileSync(kurPath, 'utf8'));
const projects = (kur.rules || [])
  .filter((r) => r.id && r.id.startsWith('referans-proje-'))
  .map((r) => {
    const id = r.when.referansProjeId;
    const m = META[id] || {};
    const zone_order = r.pfosZones || [];
    const zones = {};
    zone_order.forEach((zk) => {
      zones[zk] = { zone_key: zk, labels_found: [], typical_tip_kodu: [] };
    });
    return {
      id,
      ...m,
      status: 'manual_curated',
      zone_order,
      zones,
    };
  });

const zone_freq = {};
projects.forEach((p) => {
  (p.zone_order || []).forEach((z) => {
    zone_freq[z] = (zone_freq[z] || 0) + 1;
  });
});

const out = {
  version: 1,
  generated_at: new Date().toISOString(),
  note: 'manual_curated — xlsx bulununca extract-pfos-referans-projeler.py ile güncellenir',
  projects,
  aggregate: {
    zone_frequency: zone_freq,
    missing_files: projects.map((p) => p.source_file),
  },
};

fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Restored', outPath);
