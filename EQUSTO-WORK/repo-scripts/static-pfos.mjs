/**
 * Bağımlılıksız statik sunucu (sadece Node). public/ → http://127.0.0.1:3333/
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'public');
const port = Number(process.env.PFOS_STATIC_PORT || 3333);
const host = process.env.PFOS_STATIC_HOST || '127.0.0.1';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function safeJoin(base, reqPath) {
  const rel = path.normalize(decodeURIComponent(reqPath.split('?')[0])).replace(/^(\.\.(\/|\\|$))+/, '');
  const abs = path.join(base, rel);
  if (!abs.startsWith(base)) return null;
  return abs;
}

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    res.end();
    return;
  }
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = safeJoin(root, reqPath);
  if (!filePath) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Dosya yok: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const type = mime[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(filePath).pipe(res);
  });
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('\nPort', port, 'dolu. Başka terminalde pfos:static çalışıyor olabilir veya kapatıp tekrar deneyin.\n');
  } else {
    console.error(e);
  }
  process.exit(1);
});

server.listen(port, host, () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  PFOS için bu pencereyi AÇIK BIRAKIN  (Ctrl+C = dur)
  Ana sayfa:   http://${host}:${port}/
  PFOS:        http://${host}:${port}/pfos.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
});
