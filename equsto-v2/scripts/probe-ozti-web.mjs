/**
 * Öztiryakiler / equsto görsel kaynağı keşfi
 */
import fs from "node:fs";

const kod = process.argv[2] || "7865.N1.80908.10";
const name = process.argv[3] || "kuzine firin";

const queries = [
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent("Öztiryakiler " + kod)}`,
  `https://duckduckgo.com/?q=${encodeURIComponent("Öztiryakiler " + kod)}&iax=images&ia=images`,
  `https://www.bing.com/images/search?q=${encodeURIComponent("oztiryakiler " + kod)}`,
];

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  const text = await res.text();
  return { status: res.status, url: res.url, len: text.length, text };
}

for (const q of queries) {
  try {
    const r = await fetchText(q);
    const imgs = [
      ...r.text.matchAll(/https?:\/\/[^\"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\"'\s>]*)?/gi),
    ].map((m) => m[0]);
    const ozti = imgs.filter((u) => /oztiryaki|ozti|equsto/i.test(u));
    console.log("\n---", q.slice(0, 60), "...");
    console.log("status", r.status, "imgs", imgs.length, "ozti-ish", ozti.length);
    console.log("sample", [...new Set(ozti)].slice(0, 5));
    console.log("any", [...new Set(imgs)].slice(0, 3));
  } catch (e) {
    console.log("FAIL", q, e.message);
  }
}
