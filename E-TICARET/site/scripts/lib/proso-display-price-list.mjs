/**
 * Proso Display Cabinets 2025 xlsx → liste EUR + eşleştirme anahtarı
 */
import ExcelJS from "exceljs";

export const PROSO_XLSX_DEFAULT =
  "c:/D Disk/FİYAT LİSTELERİ/RRRr_PROSO DISPLAY CABINETS PRICE LıST WITH ALL OPTIONS 2023 03.10.2025.xlsx";

export const PROSO_ISKONTO = 0.45;
export const PROSO_NET_MULT = 1 - PROSO_ISKONTO;
export const PROSO_KAYNAK = "proso-display-2025-xlsx";
export const PROSO_LISTE_ADI = "PROSO Display Cabinets 2025";

function norm(s) {
  return String(s || "")
    .toUpperCase()
    .replace(/\s+V2\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellNum(v) {
  if (v == null || v === "") return NaN;
  if (typeof v === "object" && v.result != null) return Number(v.result);
  return Number(v);
}

/** Excel açıklamasından aile adı (SLD/DGD dahil). */
function familyFromDesc(desc) {
  const head = desc.match(
    /^([A-Z][A-Z0-9][A-Z0-9\s/\-]*?)\s+(?:Open|Semi|Plug|Multideck|Refrigerated|With|DGD|SLD|TGD|OCC|Pastry|Display|Cabinet|Frozen|Vertical|Self|Serve|Kebab|Wall|Counter|Island|Promotion|Combi|Meat|Deli|Cheese|Salad|Bakery|Fridge|Freezer|Chest|Bottle|Remote|Split|Unit|Evaporator|Condensing|Cold|Room|Modular|Remote|TK)/i
  );
  if (!head) return "";
  let fam = head[1].trim().replace(/\s+/g, " ");
  if (/\bSLD\b/.test(desc) && !/\bSLD\b/.test(fam)) fam += " SLD";
  if (/\bDGD\b/.test(desc) && !/\bDGD\b/.test(fam)) fam += " DGD";
  if (/\bTGD\b/.test(desc) && !/\bTGD\b/.test(fam)) fam += " TGD";
  return norm(fam);
}

export async function loadProsoPriceIndex(xlsxPath) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(xlsxPath);
  const index = new Map();

  for (const ws of wb.worksheets) {
    ws.eachRow((row) => {
      const price = cellNum(row.getCell(4).value);
      if (!Number.isFinite(price) || price < 100) return;
      const desc = String(row.getCell(2).value || "").trim();
      if (!desc || /PRODUCT EXPLANATION/i.test(desc)) return;
      const wm = desc.match(/L:\s*(\d+)\s*mm/i);
      if (!wm) return;
      const width = Number(wm[1]);
      const fam = familyFromDesc(desc);
      if (!fam) return;
      const key = `${fam}|${width}`;
      if (!index.has(key)) {
        index.set(key, { listEur: price, desc, fam, width, sheet: ws.name });
      }
    });
  }
  return index;
}

export function parseRowDims(row) {
  const name = String(row.name || "");
  const m = name.match(/(\d{3,4})\s*[×x]\s*(\d{3,4})\s*mm/i);
  return {
    w: Number(row.olculer?.genislik_mm) || (m ? Number(m[1]) : 0),
    h: Number(row.olculer?.yukseklik_mm) || (m ? Number(m[2]) : 0),
  };
}

function hCode(h) {
  if (!h || h < 100) return 0;
  return Math.round(h / 10);
}

/** Katalog satırı → olası Excel aile adları. */
export function excelFamilyCandidates(row) {
  const kod = String(row.prosoModelKod || "")
    .replace(/\s+V2\s+/gi, " ")
    .trim();
  const name = String(row.name || "");
  const { h } = parseRowDims(row);
  const out = new Set();
  const add = (f) => {
    if (f) out.add(norm(f));
  };

  const dgd = /DGD|Double Glazed/i.test(name);
  const sld = /SLD|Sliding/i.test(name);

  let m = kod.match(/^([A-Z]+)\s+(FV|DP|MT)\/(\d+)$/i);
  if (m) {
    const [, b, t, d] = m;
    const hc = hCode(h) || 205;
    add(`${b} ${t} ${d}/${hc}`);
    if (t === "FV") add(`${b} DP ${d}/${hc}`);
  }

  m = kod.match(/^([A-Z]+)\s+DP\/(\d+)\/(\d+)$/i);
  if (m) {
    const [, b, d, rest] = m;
    const hc = Number(rest) >= 200 ? Number(rest) : Math.round(Number(rest) / 10);
    add(`${b} DP ${d}/${hc}`);
    if (dgd) add(`${b} DP ${d}/${hc} DGD`);
  }

  m = kod.match(/^([A-Z]+)\s+(DP|MT)\s+SLD\/(\d+)$/i);
  if (m) {
    const [, b, t, d] = m;
    for (const hc of [205, 220, 150, 160, 170, 180]) add(`${b} ${t} ${d}/${hc} SLD`);
  }

  m = kod.match(/^([A-Z]+)\s+(DP|MT)\s+TGD\/(\d+)$/i);
  if (m) {
    const [, b, t, d] = m;
    for (const hc of [205, 220]) add(`${b} ${t} ${d}/${hc} TGD`);
  }

  m = kod.match(/^BUTTERFLY\s+PR\/CG\/(\d+)\/(\d+)$/i);
  if (m) {
    add(`BUTTERFLY PR ${m[1]}/${m[2]}`);
    add(`BUTTERFLY PR CG ${m[1]}/${m[2]}`);
    add(`BUTTERFLY PR/CG/${m[1]}/${m[2]}`);
  }

  m = kod.match(/^FALCON\s+DP\/SLD\/(\d+)\/(\d+)$/i);
  if (m) add(`FALCON DP ${m[1]}/${m[2]} SLD`);

  m = kod.match(/^FALCON\s+DP\/(\d+)\/(\d+)$/i);
  if (m) add(`FALCON DP ${m[1]}/${m[2]}`);

  if (sld && !kod.includes("SLD")) {
    const base = kod.replace(/^([A-Z]+)\s+/, "");
    if (base) add(`${kod.split(/\s+/)[0]} ${base} SLD`);
  }

  return [...out];
}

function widthCandidates(w) {
  const bases = [w, 937, 1037, 1040, 1250, 1350, 1875, 2500, 2812, 3125, 3750];
  const out = new Set();
  for (const b of bases) {
    if (!b) continue;
    out.add(b);
    if (Math.abs(b - w) <= 120) out.add(b);
  }
  return [...out];
}

export function lookupProsoListPrice(index, row) {
  if (!row.prosoModelKod) return null;
  const { w } = parseRowDims(row);
  if (!w) return null;

  const cands = excelFamilyCandidates(row);
  if (!cands.length) return null;

  for (const fam of cands) {
    for (const width of widthCandidates(w)) {
      const hit = index.get(`${fam}|${width}`);
      if (hit) return hit;
    }
  }

  for (const fam of cands) {
    let best = null;
    let bestDiff = Infinity;
    for (const [key, val] of index) {
      if (!key.startsWith(`${fam}|`)) continue;
      const kw = Number(key.split("|")[1]);
      const diff = Math.abs(kw - w);
      if (diff < bestDiff && diff <= 150) {
        bestDiff = diff;
        best = val;
      }
    }
    if (best) return best;
  }
  return null;
}

export function fmtTry(n) {
  const parts = n.toFixed(2).split(".");
  const int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${int},${parts[1]}`;
}

export function buildProsoPriceFields(row, listEur, eurTry) {
  const netEur = +(listEur * PROSO_NET_MULT).toFixed(2);
  const netTry = netEur * eurTry;
  const kdvDahil = Math.round(netTry * 1.2);

  const specsLines = [
    row.name,
    "",
    `Kaynak: ${PROSO_LISTE_ADI}`,
    row.prosoModelKod ? `Model: ${row.prosoModelKod}` : "",
    `Liste fiyatı (EUR): ${listEur}`,
    `Equsto satış (%${Math.round(PROSO_ISKONTO * 100)} iskonto, EUR): ${netEur.toFixed(2)}`,
    `Formül: liste × ${PROSO_NET_MULT} (müşteri listenin %55'ini öder)`,
    `Kur: 1 EUR = ${eurTry} TRY (KDV %20)`,
    `Equsto satış (TL, KDV dahil): ₺${fmtTry(kdvDahil)}`,
  ].filter(Boolean);

  const baseSpecs = String(row.specs || "").split("\n");
  const kaynakIdx = baseSpecs.findIndex((l) => /^Kaynak:/i.test(l));
  const tail = kaynakIdx >= 0 ? baseSpecs.slice(0, kaynakIdx) : baseSpecs;
  const specs = [...tail.filter((l) => l.trim()), "", ...specsLines.slice(1)].join("\n").trim();

  return {
    price: `₺${fmtTry(kdvDahil)} KDV dahil`,
    fiyat_tl: kdvDahil,
    liste_fiyati_eur: listEur,
    satis_eur_indirimli: netEur,
    iskonto_oran: Math.round(PROSO_ISKONTO * 100),
    kaynak_fiyat_listesi: PROSO_KAYNAK,
    fiyat_bekleniyor: undefined,
    specs,
  };
}
