/**
 * DATABASE_URL / DIRECT_URL içindeki şifreyi URL-encode eder.
 * Özel karakter: / $ # @ % vb. — Supabase Copy URI yapmazsa gerekir.
 */
import fs from "node:fs";
import path from "node:path";

const HOST = "aws-1-ap-northeast-1.pooler.supabase.com";

function fixUrl(raw) {
  if (!raw) return raw;
  let val = raw.trim();
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }

  const re = new RegExp(
    `^postgresql://([^:]+):(.+)@(${HOST.replace(/\./g, "\\.")}:\\d+/postgres(\\?pgbouncer=true)?)$`
  );
  const m = val.match(re);
  if (!m) return null;

  const user = m[1];
  let pass = m[2];
  try {
    pass = decodeURIComponent(pass);
  } catch {
    /* zaten decode edilmemiş olabilir */
  }
  const tail = m[3];
  return `postgresql://${user}:${encodeURIComponent(pass)}@${tail}`;
}

function fixFile(file) {
  if (!fs.existsSync(file)) {
    console.error("yok:", file);
    return false;
  }
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  let changed = 0;
  const out = lines.map((line) => {
    for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
      const prefix = `${key}=`;
      if (!line.startsWith(prefix)) continue;
      let val = line.slice(prefix.length).trim();
      const quoted =
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"));
      const quote = quoted ? val[0] : '"';
      const inner = quoted ? val.slice(1, -1) : val;
      const fixed = fixUrl(inner);
      if (!fixed) {
        console.error(path.basename(file), key, "parse edilemedi");
        return line;
      }
      if (fixed !== inner) changed++;
      return `${prefix}${quote}${fixed}${quote}`;
    }
    return line;
  });
  if (changed) fs.writeFileSync(file, out.join("\n"), "utf8");
  console.log(path.basename(file), changed ? `${changed} satır düzeltildi` : "zaten encode'lu");
  return true;
}

const files = [
  "c:/D Disk/EQUSTO-WORK/equsto-v2/.env.local",
  "c:/D Disk/EQUSTO-WORK/E-TICARET/site/.env.local",
];

for (const f of files) fixFile(f);
