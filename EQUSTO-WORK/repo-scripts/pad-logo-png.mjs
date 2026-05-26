/**
 * Logo PNG sağ kenarına padding ekle (O kesilmesin).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'images');
const padRight = 12;

const src =
  process.argv[2] ||
  join(
    root,
    '..',
    '..',
    'Users',
    'User',
    '.cursor',
    'projects',
    'c-D-Disk-EQUSTO-mutbex-scraping',
    'assets',
    'c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_equsto-logo-v10-487bf27e-5eb0-44f5-b4b5-ed47dde3b884.png'
  );

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.log('sharp yok — CSS düzeltmesi yeterli');
    process.exit(0);
  }
  if (!existsSync(src)) {
    console.log('kaynak yok:', src);
    process.exit(0);
  }
  for (const name of ['equsto-logo.png', 'equsto-logo-white.png']) {
    const p = join(outDir, name);
    const meta = await sharp(p).metadata();
    const buf = await sharp(p)
      .extend({ right: padRight, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    writeFileSync(p, buf);
    console.log(name, meta.width, '→', (meta.width || 0) + padRight);
  }
}

main();
