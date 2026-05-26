import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ps1 = join(root, 'scripts', 'kill-vite-ports.ps1');
const viteBin =
  process.platform === 'win32'
    ? join(root, 'node_modules', 'vite', 'bin', 'vite.js')
    : join(root, 'node_modules', '.bin', 'vite');

console.log('[dev:fresh] Eski Vite portlari temizleniyor (5173-5199)...');

await new Promise((resolve) => {
  const k = spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', ps1],
    { cwd: root, stdio: 'inherit', shell: false }
  );
  k.on('close', () => resolve());
  k.on('error', () => resolve());
});

const portBusy = await new Promise((resolve) => {
  const check = spawn(
    'powershell',
    [
      '-NoProfile',
      '-Command',
      "(Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0",
    ],
    { cwd: root, shell: false }
  );
  let out = '';
  check.stdout?.on('data', (d) => {
    out += String(d);
  });
  check.on('close', () => resolve(/true/i.test(out.trim())));
  check.on('error', () => resolve(false));
});

if (portBusy) {
  console.error('');
  console.error('[dev:fresh] Port 5173 hala dolu. Baska terminaldeki Vite/node kapatilmadi.');
  console.error('[dev:fresh] Task Manager → Node.js JavaScript Runtime veya: taskkill /F /T /PID <pid>');
  process.exit(1);
}

if (!existsSync(viteBin)) {
  console.error('[dev:fresh] vite bulunamadi. Once: npm install');
  process.exit(1);
}

console.log('[dev:fresh] Vite baslatiliyor → http://127.0.0.1:5173/');
console.log('[dev:fresh] Pisirme PLP: http://127.0.0.1:5173/shop/pisirme');
console.log('');

const vite = spawn(process.execPath, [viteBin, '--port', '5173', '--host', '127.0.0.1', '--strictPort'], {
  cwd: root,
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, FORCE_COLOR: '1' },
});

vite.on('close', (code) => process.exit(code ?? 0));
