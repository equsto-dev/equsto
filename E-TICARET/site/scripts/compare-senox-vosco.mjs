#!/usr/bin/env node
/**
 * Senox (mutbex) ↔ Vosco (web+PDF) ortak ürün raporu
 *
 *   node scripts/compare-senox-vosco.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findPdfListPrice, loadVoscoPdfCatalog } from "./lib/vosco-pdf-prices.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SENOX_JSON = path.join(ROOT, "scripts/data/senox/mutbex/senox-mutbex-catalog.json");
const VOSCO_JSON = path.join(ROOT, "scripts/data/vosco/vosco-web-catalog.json");
const OUT_JSON = path.join(ROOT, "scripts/data/vosco/senox-vosco-overlap.json");
const OUT_MD = path.join(ROOT, "scripts/data/vosco/senox-vosco-overlap-rapor.md");

/** Kategori aileleri — aynı OEM segmenti */
const FAMILY = [
  { id: "buz", senox: /buz\s*mak|küp\s*buz|kup\s*buz/i, vosco: /buz\s*mak/i },
  { id: "teshir-sogutma", senox: /teşhir|teshir|soğutucu|sogutucu|şişe|sise|buzdolab|dondurucu|derin\s*dondur/i, vosco: /teşhir|teshir|soğutucu|sogutucu/i },
  { id: "dondurma", senox: /dondurma\s*mak/i, vosco: /dondurma\s*mak/i },
  { id: "slush", senox: /slush|granita/i, vosco: /slush|granita|buzla/i },
  { id: "kahve-degirmen", senox: /değirmen|degirmen|kahve\s*mak|espresso|filtre\s*kahve/i, vosco: /değirmen|degirmen|kahve/i },
  { id: "meyve-sikma", senox: /meyve\s*sık|meyve\s*sik|juice/i, vosco: /meyve\s*sık|meyve\s*sik|juice|dispanser/i },
  { id: "blender-bar", senox: /blender|bar\s*miks|mikser/i, vosco: /blender|mikser|kokteyl/i },
  { id: "fritoz", senox: /fritöz|fritoz/i, vosco: /fritöz|fritoz/i },
  { id: "waffle-krep", senox: /waffle|krep|tost|ekmek\s*kız/i, vosco: /waffle|krep|tost|ekmek/i },
  { id: "et-dilim", senox: /dilimle|doğray|dogray|kıyma|kiyma/i, vosco: /dilimle|doğray|dogray/i },
  { id: "su-sebil", senox: /su\s*sebil|su\s*arıt|su\s*arit|su\s*otom/i, vosco: /su\s*sebil|dispanser/i },
  { id: "isitici-lamba", senox: /ısıtıcı\s*lamba|isitici\s*lamba|heat\s*lamp/i, vosco: /ısıt|isit|lamba/i },
  { id: "vakum", senox: /vakum|paketle/i, vosco: /vakum|paketle/i },
];

function familyOf(text, side) {
  const out = [];
  for (const f of FAMILY) {
    const re = side === "senox" ? f.senox : f.vosco;
    if (re.test(String(text || ""))) out.push(f.id);
  }
  return out.length ? out : ["diger"];
}

function tokens(s) {
  return new Set(
    String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/[^a-z0-9çğıöşü\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !/^(vosco|senox|ve|ile|için|icin|tip|model)$/.test(w)),
  );
}

function jaccard(a, b) {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

function extractCapacity(text) {
  const s = String(text || "");
  const kg = s.match(/(\d+(?:[.,]\d+)?)\s*kg/i);
  const lt = s.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|l\b)/i);
  return {
    kg: kg ? Number(kg[1].replace(",", ".")) : null,
    lt: lt ? Number(lt[1].replace(",", ".")) : null,
  };
}

function capScore(a, b) {
  let score = 0;
  if (a.kg && b.kg && Math.abs(a.kg - b.kg) / Math.max(a.kg, b.kg) < 0.12) score += 0.35;
  if (a.lt && b.lt && Math.abs(a.lt - b.lt) / Math.max(a.lt, b.lt) < 0.12) score += 0.35;
  return score;
}

function matchProducts(senoxList, voscoList, pdfIndex, pdfProducts) {
  const pairs = [];
  for (const v of voscoList) {
    const vText = `${v.categoryPath} ${v.category} ${v.title} ${JSON.stringify(v.teknik_ozellikler || {})}`;
    const vFam = familyOf(vText, "vosco");
    const vCap = extractCapacity(vText);
    const vPdf = findPdfListPrice(v, pdfIndex, pdfProducts);

    let best = null;
    for (const s of senoxList) {
      const sText = `${s.categoryPath} ${s.category} ${s.title} ${s.description || ""}`;
      const sFam = familyOf(sText, "senox");
      if (!vFam.some((f) => sFam.includes(f))) continue;

      const titleSim = jaccard(s.title, v.title);
      const sCap = extractCapacity(sText);
      const score = titleSim * 0.45 + capScore(sCap, vCap) + (vFam[0] === sFam[0] ? 0.15 : 0);

      if (!best || score > best.score) {
        best = {
          score,
          senox: {
            code: s.mutbexCode,
            model: s.model,
            title: s.title,
            category: s.category,
            url: s.url,
          },
          vosco: {
            code: v.stockCode,
            title: v.title,
            category: v.category,
            url: v.url,
            pdfUsd: vPdf?.listeUsd || null,
          },
          family: vFam[0],
          titleSimilarity: Math.round(titleSim * 100),
        };
      }
    }
    if (best && best.score >= 0.28) pairs.push(best);
  }
  pairs.sort((a, b) => b.score - a.score);
  return pairs;
}

function main() {
  if (!fs.existsSync(SENOX_JSON)) {
    console.error("Senox katalog yok:", SENOX_JSON);
    process.exit(1);
  }
  if (!fs.existsSync(VOSCO_JSON)) {
    console.error("Vosco web katalog yok — önce: npm run catalog:vosco:scrape");
    process.exit(1);
  }

  const senox = JSON.parse(fs.readFileSync(SENOX_JSON, "utf8")).products || [];
  const vosco = JSON.parse(fs.readFileSync(VOSCO_JSON, "utf8")).products || [];
  const pdf = loadVoscoPdfCatalog();

  const pairs = matchProducts(senox, vosco, pdf.index, pdf.products);
  const high = pairs.filter((p) => p.score >= 0.5);
  const medium = pairs.filter((p) => p.score >= 0.35 && p.score < 0.5);

  const payload = {
    generatedAt: new Date().toISOString(),
    senoxCount: senox.length,
    voscoCount: vosco.length,
    overlapCount: pairs.length,
    highConfidence: high.length,
    mediumConfidence: medium.length,
    pairs,
  };
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(payload, null, 2), "utf8");

  const lines = [
    "# Senox ↔ Vosco ortak ürün raporu",
    "",
    "Vosco PDF'te Senox adı geçmiyor; eşleşme **kategori ailesi + kapasite + başlık benzerliği** ile yapıldı.",
    "",
    `| | Adet |`,
    `|---|------|`,
    `| Senox (Mutbex) | ${senox.length} |`,
    `| Vosco (web) | ${vosco.length} |`,
    `| Olası ortak ürün | **${pairs.length}** |`,
    `| Yüksek güven (≥50%) | ${high.length} |`,
    `| Orta güven (35–49%) | ${medium.length} |`,
    "",
    "## Yüksek güven eşleşmeleri",
    "",
    "| Vosco kod | Vosco ürün | Senox kod | Senox ürün | PDF USD | Skor |",
    "|-----------|------------|-----------|------------|---------|------|",
  ];
  for (const p of high.slice(0, 40)) {
    lines.push(
      `| ${p.vosco.code} | ${p.vosco.title.slice(0, 40)} | ${p.senox.code} | ${p.senox.title.slice(0, 40)} | ${p.vosco.pdfUsd ?? "—"} | ${Math.round(p.score * 100)}% |`,
    );
  }
  lines.push("", "## Orta güven (örnek 20)", "");
  for (const p of medium.slice(0, 20)) {
    lines.push(
      `- **${p.vosco.code}** ↔ **${p.senox.code}** (${Math.round(p.score * 100)}%) — ${p.family}`,
    );
    lines.push(`  - Vosco: ${p.vosco.title}`);
    lines.push(`  - Senox: ${p.senox.title}`);
  }

  fs.writeFileSync(OUT_MD, lines.join("\n") + "\n", "utf8");
  console.log(`Rapor: ${OUT_MD}`);
  console.log(`JSON: ${OUT_JSON}`);
  console.log(`Ortak: ${pairs.length} (yüksek: ${high.length}, orta: ${medium.length})`);
}

main();
