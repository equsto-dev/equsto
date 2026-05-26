/**
 * Yerel geliştirme: tek komutta API (3001) + Vite (5173).
 * Durdurmak: Ctrl+C
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const opts = { cwd: root, stdio: 'inherit', shell: true, env: { ...process.env } };

const api = spawn('npm', ['run', 'api'], opts);
const dev = spawn('npm', ['run', 'dev'], opts);

let exiting = false;
function shutdown() {
  if (exiting) return;
  exiting = true;
  try {
    api.kill('SIGTERM');
  } catch (_) {}
  try {
    dev.kill('SIGTERM');
  } catch (_) {}
  setTimeout(() => process.exit(0), 500).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

api.on('exit', (code) => {
  if (exiting) return;
  console.error('[equsto] api durdu. Vite kapatılıyor.');
  try {
    dev.kill('SIGTERM');
  } catch (_) {}
  process.exit(code == null ? 1 : code);
});

dev.on('exit', (code) => {
  if (exiting) return;
  console.error('[equsto] vite durdu. api kapatılıyor.');
  try {
    api.kill('SIGTERM');
  } catch (_) {}
  process.exit(code == null ? 1 : code);
});
