/**
 * cPanel Node API paketi — üye girişi + mevcut /api uçları.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outZip = path.join(root, 'equsto-api-canli.zip');
const stage = path.join(root, '.deploy-stage-api');

const copyFiles = [
  { src: path.join(root, 'scripts', 'claude-api-proxy.mjs'), rel: 'claude-api-proxy.mjs' },
  { src: path.join(root, 'scripts', 'lib', 'equsto-auth.mjs'), rel: 'lib/equsto-auth.mjs' },
  { src: path.join(root, 'deploy', 'node-api', 'server.mjs'), rel: 'server.mjs' },
  { src: path.join(root, 'deploy', 'CPANEL-UYE-API.md'), rel: 'CPANEL-UYE-API.md' },
  { src: path.join(root, 'deploy', 'KURULUM-CPANEL-NODE.md'), rel: 'KURULUM-CPANEL-NODE.md' },
  { src: path.join(root, '.env.example'), rel: '.env.example' },
];

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

rmrf(stage);
fs.mkdirSync(stage, { recursive: true });
fs.mkdirSync(path.join(stage, 'lib'), { recursive: true });
fs.mkdirSync(path.join(stage, 'data'), { recursive: true });

const authStoreSrc = path.join(root, 'scripts', 'data', 'equsto-auth-store.json');
const authStoreDst = path.join(stage, 'data', 'equsto-auth-store.json');
if (fs.existsSync(authStoreSrc)) {
  fs.copyFileSync(authStoreSrc, authStoreDst);
} else {
  fs.writeFileSync(authStoreDst, JSON.stringify({ users: [], sessions: [] }, null, 2), 'utf8');
}

const mainStoreSrc = path.join(root, 'scripts', 'data', 'equsto-store.json');
if (fs.existsSync(mainStoreSrc)) {
  fs.copyFileSync(mainStoreSrc, path.join(stage, 'data', 'equsto-store.json'));
}

const pkg = {
  name: 'equsto-api-canli',
  private: true,
  type: 'module',
  scripts: { start: 'node server.mjs' },
  dependencies: { jose: '^6.0.11', pg: '^8.20.0', undici: '^6.21.0' },
};
fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(pkg, null, 2));

for (const f of copyFiles) {
  if (!fs.existsSync(f.src)) {
    if (f.rel === '.env.example') {
      console.warn('[pack-api] Atlandi:', f.rel);
      continue;
    }
    console.error('[pack-api] Eksik:', f.src);
    process.exit(1);
  }
  const dst = path.join(stage, f.rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(f.src, dst);
  console.log('[pack-api]', f.rel);
}

if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
const ps = `Compress-Archive -Path '${stage.replace(/'/g, "''")}\\*' -DestinationPath '${outZip.replace(/'/g, "''")}' -Force`;
execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'inherit' });
const kb = (fs.statSync(outZip).size / 1024).toFixed(0);
console.log(`\n[pack-api] Hazir: ${outZip} (${kb} KB)`);
console.log('[pack-api] cPanel Node.js → server.mjs, .env yukle, npm install && npm start');
rmrf(stage);
