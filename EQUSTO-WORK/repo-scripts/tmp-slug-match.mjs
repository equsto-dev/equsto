/** Compare PLP href slug vs slug computed from dept JSON */

function eqProductSlug(row) {
  const tr = {
    'ğ': 'g', 'ü': 'u', 'ş': 's', 'ı': 'i', 'ö': 'o', 'ç': 'c', 'â': 'a', 'î': 'i', 'û': 'u',
    'Ğ': 'g', 'Ü': 'u', 'Ş': 's', 'İ': 'i', 'Ö': 'o', 'Ç': 'c', 'Â': 'a', 'Î': 'i', 'Û': 'u',
  };
  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[ğüşıöçâîûĞÜŞİÖÇÂÎÛ]/g, (c) => tr[c] || c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  const b = slugify(row.brand || row.b || '');
  const n = slugify(row.name || row.n || '');
  return (b ? b + '-' : '') + n;
}

const DEPTS = ['pisirme', 'sogutma', 'kahve', 'yikama', 'hazirlik', 'icecek', 'tezgah'];

for (const dept of DEPTS) {
  const html = await fetch(`https://equsto.com/shop/${dept}?t=${Date.now()}`).then((r) => r.text());
  const m = html.match(/href="(\/shop\/[^"]+\/[^"]+)"/);
  const href = m?.[1];
  const pathSlug = href?.split('/').pop()?.toLowerCase();
  const j = await fetch(`https://equsto.com/data/dept/${dept}.json`).then((r) => ({
    ok: r.ok,
    status: r.status,
    data: r.ok ? r.json() : null,
  }));
  const items = j.data ? (Array.isArray(j.data) ? j.data : j.data.items || []) : [];
  let match = null;
  for (const it of items) {
    if (eqProductSlug(it) === pathSlug) {
      match = it;
      break;
    }
  }
  const firstSlug = items[0] ? eqProductSlug(items[0]) : null;
  console.log(
    JSON.stringify({
      dept,
      deptJson: j.status,
      items: items.length,
      plpHref: href,
      pathSlug,
      firstItemSlug: firstSlug,
      match: !!match,
      brand: match?.brand || match?.b,
      name: (match?.name || match?.n || '').slice(0, 50),
    })
  );
}
