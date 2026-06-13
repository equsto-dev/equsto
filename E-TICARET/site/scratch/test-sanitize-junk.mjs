// Standalone proforma junk strip test (mirrors sanitize-tanim.ts logic)
const PROFORMA_FLOAT_NUM = String.raw`\d+(?:[.,]\d+)?`;
const PROFORMA_S_MULT_RE = /\s+S\d{1,3}\*[\d.,]+/gi;
const PROFORMA_RATE_342_TAIL_RE = new RegExp(
  String.raw`\s+342\s+${PROFORMA_FLOAT_NUM}\s*$`,
  "i",
);
const INLINE_PROFORMA_RATE_342_RE = new RegExp(
  String.raw`\s+342\s+${PROFORMA_FLOAT_NUM}`,
  "gi",
);
const INLINE_PROFORMA_QTY_PRICE_RE = new RegExp(
  String.raw`\s+\d{1,3}\s+\d{2,5}\s+\d{2,5}(?:\s+S\d{1,3}\*[\d.,]+)?(?:\s+342\s+${PROFORMA_FLOAT_NUM})?`,
  "gi",
);
const PROFORMA_FLOAT_JUNK_RE = /\s+\d+[.,]\d{6,}\s*$/i;
const PROFORMA_COMMA_FLOAT_JUNK_RE = /[.,]\d{6,}\s*$/i;

function strip(s) {
  let out = String(s ?? "").replace(/[\u00a0\u202f\u2007\u2009\u2060]/g, " ");
  for (let i = 0; i < 8; i++) {
    const prev = out;
    out = out
      .replace(INLINE_PROFORMA_QTY_PRICE_RE, " ")
      .replace(INLINE_PROFORMA_RATE_342_RE, " ")
      .replace(PROFORMA_S_MULT_RE, " ")
      .replace(PROFORMA_FLOAT_JUNK_RE, "")
      .replace(PROFORMA_COMMA_FLOAT_JUNK_RE, "")
      .replace(PROFORMA_RATE_342_TAIL_RE, "")
      .replace(/\s+342\s*$/i, "")
      .replace(/\s+/g, " ")
      .trim();
    if (out === prev) break;
  }
  return out;
}

const badRe = /342|393[.,]\d{3,}|S\d+\*|[.,]\d{6,}/;

const cases = [
  "İSTİF RAFI, 4 KATLI, DEMONTE 3 310 930 S22*1.15 342 393.29999999999995",
  "PANEL TİP SOĞUK ODA 1 5000 5000 S24*1.15 342 393.29999999999995",
  "TEZGAH TİPİ BUZDOLABI, ÜÇ KAPILI 1 1250 1250 342 393.29999999999995",
  "ÇALIŞMA TEZGAHI, TABAN VE ARA RAFLI 1 250 250 342 393.29999999999995",
  "TEZGAH TİPİ BUZDOLABI, ÜÇ KAPILI 1 1250 1250 342 393,29999999999995",
  "ÇALIŞMA TEZGAHI, TABAN RAFLI 1 250 250 342 393.29999999999995",
];

let failed = 0;
for (const c of cases) {
  const out = strip(c);
  const bad = badRe.test(out);
  if (bad) failed++;
  console.log(bad ? "FAIL" : "OK ", out);
}
process.exit(failed ? 1 : 0);
