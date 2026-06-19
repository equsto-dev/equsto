export function decodeHtml(s) {
  return String(s ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&bull;/gi, "•")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&([a-z]+);/gi, (m) => {
      const map = {
        Oslash: "Ø",
        oslash: "ø",
        ouml: "ö",
        Ouml: "Ö",
        uuml: "ü",
        Uuml: "Ü",
        ccedil: "ç",
        Ccedil: "Ç",
        scedil: "ş",
        Scedil: "Ş",
        igrave: "ı",
        Igrave: "İ",
        gbreve: "ğ",
        Gbreve: "Ğ",
      };
      const k = m.slice(1, -1);
      return map[k] ?? m;
    });
}

export function stripTags(html) {
  return decodeHtml(
    String(html ?? "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

export function absUrl(base, href) {
  if (!href) return null;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  const b = new URL(base);
  if (href.startsWith("/")) return `${b.origin}${href}`;
  return `${b.origin}/${href.replace(/^\.\//, "")}`;
}

export function firstMatch(html, re) {
  const m = html.match(re);
  return m ? m[1] : null;
}

/** TD içindeki iç içe <table> bloklarını kaldır (Piliç çevirme vb.) */
function stripNestedTables(tableHtml) {
  let t = tableHtml;
  for (let i = 0; i < 20; i++) {
    const next = t.replace(/(<t[dh][^>]*>[\s\S]*?)<table[\s\S]*?<\/table>/gi, "$1");
    if (next === t) break;
    t = next;
  }
  return t;
}

export function parseTable(html) {
  const table = html.match(/<table[\s\S]*<\/table>/i)?.[0];
  if (!table) return { headers: [], rows: [] };
  const clean = stripNestedTables(table);

  const headers = [...clean.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => {
    const raw = stripTags(m[1]);
    const tr = raw.split("\n")[0].trim();
    const en = raw.split("\n")[1]?.trim() || "";
    return { tr, en, key: tr || en };
  });

  const rows = [];
  const tbody = clean.match(/<tbody>([\s\S]*)<\/tbody>/i)?.[1] || clean;
  for (const row of tbody.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const cells = [...row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((c) => {
        const cell = c[1];
        const img = cell.match(/<img[^>]+src="([^"]+)"/i)?.[1];
        const text = stripTags(cell);
        if (img && !text) return { type: "image", value: img, text: "" };
        if (img && text) return { type: "mixed", value: img, text };
        return { type: "text", value: text, text };
      });
      if (cells.length) {
        const obj = {};
        headers.forEach((h, i) => {
          obj[h.key] = cells[i] ?? { type: "text", value: "", text: "" };
        });
        rows.push(obj);
      }
  }
  return { headers: headers.map((h) => h.key), rows };
}

/** tenikdetay bölümündeki tüm tabloları birleştir */
export function parseAllTeknikTables(html) {
  const section = html.match(/class="tenikdetay"[\s\S]*?(?=class="footer|<footer)/i)?.[0] || html;
  const tables = [...section.matchAll(/<table[\s\S]*<\/table>/gi)].map((m) => m[0]);
  const allRows = [];
  let headers = [];
  for (const t of tables) {
    const parsed = parseTable(t);
    if (parsed.headers.length > headers.length) headers = parsed.headers;
    allRows.push(...parsed.rows);
  }
  return { headers, rows: allRows };
}
