import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const jsonPath = path.join(root, "public/data/ekipmanlar.json");
const imgRoot = path.join(root, "public/data");

const items = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
const list = Array.isArray(items) ? items : items.items || [];
const sog = list.filter((x) => x?.category === "sogutma-ekipmanlari");

let ok = 0,
  miss = 0,
  encodingSuspect = 0,
  placeholder = 0,
  ozti = 0,
  http = 0;

const missReasons = { notFound: 0, encoding: 0, placeholder: 0 };

for (const x of sog) {
  const img = x.images?.[0] || x.localImage || "";
  if (!img) continue;
  if (/^https?:/i.test(img)) {
    http++;
    continue;
  }
  const norm = String(img).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^data\//, "");
  if (/evyeli-tezgah_1|davlumbaz_1|calisma-tezgahi_1/i.test(norm)) placeholder++;

  const disk = path.join(imgRoot, norm);
  if (fs.existsSync(disk)) {
    ok++;
    continue;
  }
  miss++;
  // ASCII-only alternate?
  const ascii = norm
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
  if (ascii !== norm && fs.existsSync(path.join(imgRoot, ascii))) {
    encodingSuspect++;
    missReasons.encoding++;
  } else {
    missReasons.notFound++;
  }
}

// dept json images field
const deptPath = path.join(root, "public/data/dept/sogutma.json");
let deptStats = null;
if (fs.existsSync(deptPath)) {
  const dept = JSON.parse(fs.readFileSync(deptPath, "utf8"));
  const ditems = Array.isArray(dept) ? dept : dept.items || [];
  let dok = 0,
    dmiss = 0;
  for (const x of ditems) {
    const img = x.images?.[0] || "";
    if (!img) continue;
    const norm = String(img).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^data\//, "");
    if (fs.existsSync(path.join(imgRoot, norm))) dok++;
    else dmiss++;
  }
  deptStats = { count: ditems.length, diskOk: dok, diskMiss: dmiss };
}

console.log(
  JSON.stringify(
    {
      sogutmaProducts: sog.length,
      diskOk: ok,
      diskMissing: miss,
      pctMissing: ((miss / sog.length) * 100).toFixed(1) + "%",
      encodingFixable: encodingSuspect,
      externalHttp: http,
      suspiciousPlaceholderPaths: placeholder,
      deptJson: deptStats,
      deployNote: "npm run build varsayilan olarak dist/data/images KOPYALAMAZ",
    },
    null,
    2
  )
);
