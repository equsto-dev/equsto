import fs from "node:fs";
import path from "node:path";
import { DEPT_DIR, normCode, stripDistributorPrefix } from "./shared.mjs";

export function loadEqustoRows(brandRe) {
  const out = [];
  for (const file of fs.readdirSync(DEPT_DIR).filter((f) => f.endsWith(".json") && !f.includes("_items"))) {
    let rows;
    try {
      rows = JSON.parse(fs.readFileSync(path.join(DEPT_DIR, file), "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(rows)) continue;
    for (const r of rows) {
      const blob = `${r.brand || ""} ${r.name || ""} ${r.oem_brand || ""} ${r.sku || ""}`;
      if (brandRe && !brandRe.test(blob)) continue;
      out.push({ ...r, _deptFile: file.replace(/\.json$/, "") });
    }
  }
  return out;
}

const YUKSEL_REF_BY_OZTI = {
  "9860.MP160.VV": "34740",
  "9860.MP190.VV": "34750",
  "9860.MP190.C0": "34770",
  "9860.MP240.VV": "34760",
  "9860.MP250.C0": "34300B",
  "9810.MP350.U0": "34800L",
  "9810.MP350.CU": "34860L",
  "9810.MP450.UL": "34810L",
  "9860.MP450.C0": "34870L",
  "9860.MP550.A0": "34820LH",
  "9860.MP600.A0": "34830LH",
  "9810.MP800.UL": "34890L",
  "9840.CL50D.00": "24440",
  "9840.CL52D.00": "24490",
  "9840.CL55D.00": "2245",
  "9840.CL60D.00": "2325F",
  "9840.R201E.00": "2129D",
  "9840.R301C.00": "2525",
  "9860.000R2.00": "22100D",
  "9860.000R5.00": "24608M",
  "9860.00J80.00": "56000B",
};

export function buildMatchIndex(rows) {
  const byNorm = new Map();
  const add = (k, row) => {
    const n = normCode(k);
    if (n.length >= 4) byNorm.set(n, row);
  };
  for (const row of rows) {
    add(row.sku, row);
    add(row.model, row);
    add(row.marka_urun_kodu, row);
    add(row.equsto_kod, row);
    add(stripDistributorPrefix(row.sku), row);
    const sku = String(row.sku || "");
    const tail = sku.replace(/^\d{4}\./, "");
    if (tail && tail !== sku) add(tail, row);
    const tm = sku.replace(/^TM/i, "");
    if (tm !== sku) {
      add(tm, row);
      add(tm.replace(/L$/i, ""), row);
    }
    const yRef = YUKSEL_REF_BY_OZTI[sku];
    if (yRef) {
      add(yRef, row);
      add(`TM${yRef}`, row);
      add(yRef.replace(/L$/i, ""), row);
    }
    for (const k of unoxMatchKeys(sku)) add(k, row);
  }
  return { byNorm, rows };
}

/** 061.XEVC.1011.EPRM ↔ 9890.X1011.EP ; 061.XEBC.10EU.EPRM ↔ 9890.XBC10.EP */
export function unoxMatchKeys(code) {
  let s = String(code || "")
    .toUpperCase()
    .replace(/^T1\./, "")
    .replace(/^061\./, "")
    .replace(/^9890\./, "");
  const compact = s.replace(/[^A-Z0-9]/g, "");
  const keys = [s, compact];
  const shortSuf = (suf) => {
    if (suf.startsWith("E1")) return "E1";
    if (suf.startsWith("EP")) return "EP";
    if (suf.startsWith("GP") || suf.startsWith("EG")) return suf.startsWith("GP") ? "GP" : "EG";
    if (suf.startsWith("EZ")) return "EZ";
    return suf.slice(0, 2);
  };
  let m = compact.match(/^XEV[CL](\d{4})([A-Z0-9]+)/);
  if (m) {
    const short = shortSuf(m[2]);
    keys.push(`X${m[1]}${short}`, `${m[1]}${short}`);
    if (short === "GP") keys.push(`X${m[1]}EG`);
  }
  m = compact.match(/^XEBC(\d{2})EU([A-Z0-9]+)/);
  if (m) {
    const short = shortSuf(m[2]);
    keys.push(`XBC${m[1]}${short}`);
  }
  m = compact.match(/^(XEFT|XESW|XEBDC|XECC|XEFT)([A-Z0-9]+)/);
  if (m) keys.push(compact);
  m = compact.match(/^(XESW\d{2}HS)/);
  if (m) keys.push(m[1]);
  m = compact.match(/^(XEFT\d{2}EU)/);
  if (m) keys.push(m[1]);
  m = compact.match(/^(XF\d{3})/);
  if (m) keys.push(m[1], `${m[1]}00`);
  m = compact.match(/^XEKPT0?(\d+)EU([A-Z])/);
  if (m) keys.push(`XEKPT${m[1]}EU${m[2]}`, `XEKPT${Number(m[1])}EUC`);
  m = compact.match(/^(XEBDC\d{2})/);
  if (m) keys.push(m[1]);
  return keys;
}

export function findMatch(cm, index) {
  const raw = stripDistributorPrefix(cm.code || cm.sku || "");
  const ref = raw.replace(/^057\.?/i, "");
  const dashed = raw.replace(/\./g, "-");
  const dotted = raw.replace(/-/g, ".");
  const slashAlt = raw.replace(/\//g, "-").replace(/-/g, "/");
  const candidates = [
    raw,
    String(cm.code || ""),
    raw.replace(/^\d{4}\./, ""),
    ref,
    `TM${ref}`,
    ref.replace(/L$/i, ""),
    dashed,
    dotted,
    slashAlt,
    dashed.replace(/\//g, "-"),
    // Atalay: ADK.10.2 ↔ ADK-10/2
    raw.replace(/\./g, "-").replace(/-(\d+)$/, "/$1"),
    dashed.replace(/-(\d+)$/, "/$1"),
  ];
  for (const c of [...candidates, ...unoxMatchKeys(cm.code || cm.sku || "")]) {
    const n = normCode(c);
    if (n && index.byNorm.has(n)) return { row: index.byNorm.get(n), via: "code" };
  }
  const n0 = normCode(ref);
  if (n0.length >= 5) {
    for (const [k, row] of index.byNorm) {
      if (k === n0 || k.startsWith(n0) || n0.startsWith(k)) {
        if (Math.abs(k.length - n0.length) <= 2) return { row, via: "code-prefix" };
      }
    }
  }
  return null;
}
