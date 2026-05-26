/**
 * Çalışma tezgahı / davlumbaz ürün adları — marka önekini kaldır, tür + ölçü/model kalsın.
 */
export function simplifyTezgahDavlumbazName(name, opts = {}) {
  const dept = String(opts.dept || '').trim();
  let n = String(name ?? '').trim();
  if (!n) return n;

  const allowDav = dept === 'davlumbaz' || opts.allowDavlumbaz;
  const allowTezg = dept === 'tezgah' || opts.allowCalismaTezgah;

  if (allowDav && !/davlumbazlı|davlumbazli/i.test(n)) {
    const dm = n.match(/\bdavlumbaz\b/i);
    if (dm && dm.index != null) {
      const tail = n.slice(dm.index + dm[0].length).trim();
      return `Davlumbaz${tail ? ` ${tail}` : ''}`.replace(/\s+/g, ' ').trim();
    }
  }

  if (allowTezg) {
    const cm = n.match(/çalışma\s*(tezgah[ıi]?|demonte)|calisma\s*(tezgah[ıi]?|demonte)/i);
    if (cm && cm.index != null) {
      let after = n.slice(cm.index + cm[0].length).trim().replace(/^tezgah[ıi]?\s*/i, '');
      const demonte = /demonte/i.test(cm[0]) || /demonte/i.test(after);
      if (demonte) after = after.replace(/(\s*\bdemonte\b\s*)+/gi, ' ').replace(/\s+/g, ' ').trim();
      const label = demonte ? 'Çalışma Tezgahı Demonte' : 'Çalışma Tezgahı';
      return `${label}${after ? ` ${after}` : ''}`.replace(/\s+/g, ' ').trim();
    }
  }

  return n;
}

/** @param {Record<string, unknown>} p */
export function simplifyCatalogProductName(p) {
  if (!p || typeof p !== 'object' || !p.name) return false;
  const dept = String(p.dept || '').trim();
  if (dept !== 'tezgah' && dept !== 'davlumbaz') return false;
  const next = simplifyTezgahDavlumbazName(p.name, { dept });
  if (next === p.name) return false;
  p.name = next;
  return true;
}
