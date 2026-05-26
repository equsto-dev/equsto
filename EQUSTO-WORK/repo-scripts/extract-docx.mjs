import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const file = process.argv[2];
if (!file) { console.error('usage: node extract-docx.mjs <file.docx>'); process.exit(1); }
const buf = fs.readFileSync(file);

function findCdr(buf) {
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) return i;
  }
  return -1;
}

const eocd = findCdr(buf);
if (eocd < 0) { console.error('Not a zip'); process.exit(2); }
const totalEntries = buf.readUInt16LE(eocd + 10);
const cdSize = buf.readUInt32LE(eocd + 12);
const cdOffset = buf.readUInt32LE(eocd + 16);

let p = cdOffset;
let target = null;
for (let i = 0; i < totalEntries; i++) {
  const sig = buf.readUInt32LE(p);
  if (sig !== 0x02014b50) break;
  const compMethod = buf.readUInt16LE(p + 10);
  const compSize = buf.readUInt32LE(p + 20);
  const uncompSize = buf.readUInt32LE(p + 24);
  const nameLen = buf.readUInt16LE(p + 28);
  const extraLen = buf.readUInt16LE(p + 30);
  const commentLen = buf.readUInt16LE(p + 32);
  const localOffset = buf.readUInt32LE(p + 42);
  const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
  if (name === 'word/document.xml') {
    target = { compMethod, compSize, uncompSize, localOffset, name };
  }
  p += 46 + nameLen + extraLen + commentLen;
}
if (!target) { console.error('document.xml not found'); process.exit(3); }
const lh = target.localOffset;
const lhNameLen = buf.readUInt16LE(lh + 26);
const lhExtraLen = buf.readUInt16LE(lh + 28);
const dataStart = lh + 30 + lhNameLen + lhExtraLen;
const data = buf.slice(dataStart, dataStart + target.compSize);
const xml = target.compMethod === 0 ? data : zlib.inflateRawSync(data);
const text = xml.toString('utf8');
const outXml = file.replace(/\.docx$/i, '') + '.xml';
fs.writeFileSync(outXml, text, 'utf8');
const plain = text
  .replace(/<w:tab[^>]*\/>/g, '\t')
  .replace(/<w:br[^>]*\/>/g, '\n')
  .replace(/<\/w:p>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
const outTxt = file.replace(/\.docx$/i, '') + '.txt';
fs.writeFileSync(outTxt, plain, 'utf8');
console.log('xml:', outXml, '(' + xml.length + ')');
console.log('txt:', outTxt, '(' + plain.length + ')');
