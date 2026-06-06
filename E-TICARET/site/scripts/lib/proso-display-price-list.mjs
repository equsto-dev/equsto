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

  m = kod.match(/^TIGER\s+800\s+(CG|FG|WFG|IFG)\/CB$/i);
  if (m) add(`TIGER 800 ${m[1]}/CB - OF`);

  m = kod.match(/^TIGER\s+800\s+DP\/OF$/i);
  if (m) add("TIGER 800 DP/OF");

  m = kod.match(/^WHALE\s+G50\/150$/i);
  if (m) {
    add("WHALE G50/150 DOUBLE");
    add("WHALE G50/200 DOUBLE");
  }

  m = kod.match(/^CRAB\s+(\d+\/\d+)(?:\s+SLD)?$/i);
  if (m) {
    add(`CRAB ${m[1]}`);
    if (/SLD/i.test(kod)) add(`CRAB ${m[1]} SLD`);
  }

  m = kod.match(/^SPIDER\s+(\d+\/\d+)(?:\s+SLD)?$/i);
  if (m) {
    add(`SPIDER ${m[1]}`);
    if (/SLD/i.test(kod)) add(`SPIDER ${m[1]} SLD`);
  }

  m = kod.match(/^([A-Z]+)\s+DP\s+(\d+\/\d+)(?:\s+(SGD|DGD|LGD|PGD))?$/i);
  if (m) {
    const [, brand, dims, suffix] = m;
    add(`${brand} DP ${dims}${suffix ? ` ${suffix}` : ""}`);
  }

  m = kod.match(/^PUMA\s+DP\s+(\d+\/\d+)(?:\s+(SGD|DGD))?$/i);
  if (m) add(`PUMA DP ${m[1]}${m[2] ? ` ${m[2]}` : ""}`);

  if (/^COBRA\s+TOWER/i.test(kod)) add("COBRA TOWER 800-900 FG/CB-OF UPRIGHT");
  m = kod.match(/^COBRA\s+800\s+FG\/CB$/i);
  if (m) add("COBRA 800-900 FG/CB-OF");

  m = kod.match(/^RHINO\s+(\d+\/\d+)$/i);
  if (m) add(`RHINO ${m[1]}`);

  if (/^QUOKKA$/i.test(kod)) add("QUOKKA");

  m = kod.match(/^KANGAROO\s+800\s+CG\/CB$/i);
  if (m) add("KANGAROO 800 CG/CB");

  m = kod.match(/^LEOPARD\s+800\s+FG\/CB$/i);
  if (m) add("LEOPARD 800 FG/CB");

  m = kod.match(/^OCTOPUS\s+110(?:\s+SLD)?$/i);
  if (m) add(/SLD/i.test(kod) ? "OCTOPUS 110 SLD" : "OCTOPUS 110");

  m = kod.match(/^SCORPION\s+(\d+\/\d+)/i);
  if (m) {
    for (const d of ["1D", "2D", "3D", "4D"]) add(`SCORPION ${m[1]} ${d} UPRIGHT`);
  }

  m = kod.match(/^PHOENIX\s+DP\s+(\d+)\/(\d+)$/i);
  if (m) add(`PHOENIX DP 75-90/${m[2]}`);

  m = kod.match(/^(DOLPHIN\s+(?:IS|WA)\s+G\d+\/\d+(?:\s+SINGLE)?)/i);
  if (m) add(m[1].replace(/\s+SINGLE$/i, " SINGLE"));

  m = kod.match(/^DRAGON\s+(\d+\/\d+)/i);
  if (m) {
    for (const d of ["2D", "3D", "4D", "5D"]) add(`DRAGON ${m[1]} ${d}`);
  }

  m = kod.match(/^FOX\s+(\d+\/\d+)/i);
  if (m) add(`FOX ${m[1]} PI`);

  m = kod.match(/^IGUANA\s+(\d+\/\d+)/i);
  if (m) {
    for (const d of ["2D", "3D", "4D"]) add(`IGUANA ${m[1]} ${d}`);
  }

  m = kod.match(/^RABBIT\s+PR\/PR\s+(\d+\/\d+)/i);
  if (m) add(`RABBIT PR/PR ${m[1]}`);

  m = kod.match(/^FIREFLY\s+(PR|PN|BR)\s+(\d+\/\d+)/i);
  if (m) add(`FIREFLY ${m[1]} ${m[2]}`);

  m = kod.match(/^BUTTERFLY\s+(PR|PN|BA|BM|BR|HP|SB|SP)\s+(\d+\/\d+)/i);
  if (m) {
    const [, t, dims] = m;
    const suffix = {
      BA: " BAIN-MARIE TYPE HEATED HOT MEAL",
      BM: " BAIN-MARIE TYPE HEATED HOT MEAL",
      BR: " NEUTRAL BREAD",
      HP: " DRY HOT PLATE HEATED",
    }[t.toUpperCase()];
    add(`BUTTERFLY ${t} ${dims}${suffix || ""}`);
  }

  m = kod.match(/^BUTTERFLY\s+DP\/SS\s+(\d+\/\d+)/i);
  if (m) add(`BUTTERFLY DP/SS ${m[1]}`);

  m = kod.match(/^BUTTERFLY\s+MFT\s+PR\s+(\d+\/\d+)/i);
  if (m) add(`BUTTERFLY MFT PR ${m[1]}`);

  if (sld && !kod.includes("SLD")) {
    const base = kod.replace(/^([A-Z]+)\s+/, "");
    if (base) add(`${kod.split(/\s+/)[0]} ${base} SLD`);
  }

  const slugFam = row.prosoExcelFam;
  if (Array.isArray(slugFam)) slugFam.forEach((f) => add(f));

  return [...out];
}

function rowWidth(row) {
  const { w } = parseRowDims(row);
  if (w) return w;
  const dw = Number(row.prosoDefaultWidth);
  if (Number.isFinite(dw) && dw > 0) return dw;
  return 0;
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
  const w = rowWidth(row);
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
