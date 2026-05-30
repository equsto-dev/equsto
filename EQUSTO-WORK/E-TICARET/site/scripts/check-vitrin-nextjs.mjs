/**
 * Canlı vitrin sayfaları Next.js mi, eski HTML mi?
 *   npm run vitrin:check
 */
const URLS = ["/", "/pfos", "/sss", "/shop/marka", "/arama", "/contact"];

async function probe(path) {
  const url = `https://equsto.com${path}`;
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const matched = res.headers.get("x-matched-path") || "";
  const rewritten = res.headers.get("x-nextjs-rewritten-path") || "";
  const isHtml = matched.endsWith(".html") || rewritten.endsWith(".html");
  const hasNext = html.includes("/_next/static") || html.includes("__NEXT_DATA__");
  const ok = hasNext && !isHtml;
  return { path, ok, matched, rewritten, hasNext, status: res.status };
}

const rows = [];
for (const path of URLS) {
  rows.push(await probe(path));
}

let failed = 0;
for (const r of rows) {
  const tag = r.ok ? "OK  " : "FAIL";
  if (!r.ok) failed++;
  console.log(
    `${tag} ${r.path.padEnd(16)} matched=${r.matched || "-"} next=${r.hasNext ? "yes" : "no"}`
  );
}

if (failed) {
  console.error(`\n${failed}/${rows.length} sayfa hâlâ eski HTML. Vercel deploy bitince tekrar dene.`);
  process.exit(1);
}

console.log(`\nTüm vitrin sayfaları Next.js (${rows.length}/${rows.length}).`);
