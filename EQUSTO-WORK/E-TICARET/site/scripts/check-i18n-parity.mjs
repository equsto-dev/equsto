import tr from "../public/i18n/tr.json" with { type: "json" };
import en from "../public/i18n/en.json" with { type: "json" };

function leaves(o, p, acc) {
  for (const [k, v] of Object.entries(o)) {
    if (k === "$meta") continue;
    const x = p ? `${p}.${k}` : k;
    if (typeof v === "string") acc.push(x);
    else if (v && typeof v === "object") leaves(v, x, acc);
  }
  return acc;
}

const tl = leaves(tr, "", []);
const el = leaves(en, "", []);
const missing = tl.filter((k) => !el.includes(k));
const extra = el.filter((k) => !tl.includes(k));
console.log("tr", tl.length, "en", el.length, "missing", missing.length, "extra", extra.length);
if (missing.length) console.log("missing:", missing.join(", "));
