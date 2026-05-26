// scripts/seed-schema.mjs
// L1a + L1b seed: admin.html DEFAULT_QUESTIONS (22 soru) + pfos-rule-engine.js DEFAULT_RULES_DOC.rules (40+ kural)
// → backend /api/proje-akis'e tek POST ile push.
// Mevcut shopTypes / eqSets / products korunur (body'de yoksa backend dokunmuyor).
// Çalıştırma: node scripts/seed-schema.mjs

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const API_BASE = process.env.API_BASE || 'http://127.0.0.1:3001/api';

function extractAdminDefaultQuestions() {
  const adminPath = path.join(ROOT, 'public', 'admin.html');
  const src = fs.readFileSync(adminPath, 'utf8');
  const startIdx = src.indexOf('const PFOS_Q_MESLEK');
  if (startIdx < 0) throw new Error('PFOS_Q_MESLEK not found in admin.html');
  const endIdx = src.indexOf('// ── State', startIdx);
  if (endIdx < 0) throw new Error('// ── State marker not found in admin.html');
  // Node vm: top-level const/let aren't exposed on context globals; convert to var.
  const block = src.substring(startIdx, endIdx).replace(/^const /gm, 'var ');
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(block, ctx, { filename: 'admin-extracted.js' });
  if (!Array.isArray(ctx.DEFAULT_QUESTIONS)) {
    throw new Error('DEFAULT_QUESTIONS not produced after eval (got ' + typeof ctx.DEFAULT_QUESTIONS + ')');
  }
  return ctx.DEFAULT_QUESTIONS;
}

function extractRules() {
  const enginePath = path.join(ROOT, 'public', 'pfos-rule-engine.js');
  const src = fs.readFileSync(enginePath, 'utf8');
  const ctx = { window: {}, localStorage: undefined, fetch: undefined, console };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'pfos-rule-engine.js' });
  const eng = ctx.window && ctx.window.EqustoPfosRuleEngine;
  if (!eng || typeof eng.getRulesDoc !== 'function') {
    throw new Error('EqustoPfosRuleEngine not exposed on window after eval');
  }
  const doc = eng.getRulesDoc();
  if (!doc || !Array.isArray(doc.rules)) throw new Error('rulesDoc.rules not array');
  return doc.rules;
}

async function fetchCurrent() {
  const r = await fetch(API_BASE + '/proje-akis');
  if (!r.ok) throw new Error('GET /proje-akis HTTP ' + r.status);
  const j = await r.json();
  if (!j.success) throw new Error('GET /proje-akis returned !success');
  return j.data;
}

async function pushSchema(payload) {
  const r = await fetch(API_BASE + '/proje-akis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const txt = await r.text();
  let j;
  try { j = JSON.parse(txt); } catch { throw new Error('POST returned non-JSON: ' + txt.slice(0, 200)); }
  if (!r.ok || !j.success) throw new Error('POST failed: ' + txt.slice(0, 400));
  return j;
}

async function main() {
  console.log('[seed-schema] extracting DEFAULT_QUESTIONS from admin.html…');
  const questions = extractAdminDefaultQuestions();
  console.log('[seed-schema] → questions.length = ' + questions.length);
  console.log('[seed-schema] → first 5 ids: ' + questions.slice(0, 5).map(q => q.id).join(', '));

  console.log('[seed-schema] extracting rules from pfos-rule-engine.js…');
  const rules = extractRules();
  console.log('[seed-schema] → rules.length = ' + rules.length);
  console.log('[seed-schema] → priorities: ' + [...new Set(rules.map(r => r.priority))].sort((a, b) => b - a).join(', '));

  console.log('[seed-schema] fetching current schema…');
  const before = await fetchCurrent();
  console.log(`[seed-schema] BEFORE: q=${before.questions.length} st=${before.shopTypes.length} r=${before.rules.length} es=${before.eqSets.length} p=${before.products.length} proj=${(before.projeler || []).length}`);

  console.log('[seed-schema] POST /api/proje-akis { questions, rules }…');
  const res = await pushSchema({ questions, rules });
  console.log('[seed-schema] → counts: ' + JSON.stringify(res.counts));

  const after = await fetchCurrent();
  console.log(`[seed-schema] AFTER : q=${after.questions.length} st=${after.shopTypes.length} r=${after.rules.length} es=${after.eqSets.length} p=${after.products.length} proj=${(after.projeler || []).length}`);
  console.log('[seed-schema] DONE.');
}

main().catch((e) => {
  console.error('[seed-schema] FAIL:', e && e.message ? e.message : e);
  process.exit(1);
});
