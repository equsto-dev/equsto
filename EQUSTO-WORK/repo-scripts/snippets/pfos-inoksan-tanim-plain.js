  function tanimBaslikPlain(r) {
    var stok = stokNoPlain(r);
    var ad = rowNamePlain(r);
    var parts = ['A.'];
    if (ad) parts.push(ad.toLocaleUpperCase('tr-TR'));
    if (stok && (!ad || ad.toLowerCase().indexOf(stok.toLowerCase()) === -1)) {
      parts.push(stok);
    } else if (stok && !ad) {
      parts.push(stok);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
