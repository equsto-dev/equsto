import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const p = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'admin.html');
let h = fs.readFileSync(p, 'utf8');
h = h.replace(/<nav class="topnav"[\s\S]*?<\/nav>\s*/m, '');
fs.writeFileSync(p, h);
console.log(h.includes('topnav-item') ? 'WARN: topnav items remain' : 'OK: topnav removed');
