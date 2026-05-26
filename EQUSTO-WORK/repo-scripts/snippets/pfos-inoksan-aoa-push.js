      var r = ln.r;
      var dims = parseDimParts(r);
      var birimEur = eurFromTl(ln.birim, c);
      var lineEur = eurFromTl(ln.line, c);
      aoa.push([
        ln.bol, ln.grup, ln.poz, ln.ek || '',
        stokNoPlain(r), tanimBaslikPlain(r), kaynakPlain(r),
        dims ? String(dims.boy) + ' X' : '',
        dims ? String(dims.en) + ' X' : '',
        dims ? String(dims.yuk) : '',
        ln.adet,
        pfosFmtProformaMoney(birimEur, 'EUR'),
        pfosFmtProformaMoney(lineEur, 'EUR'),
        'EUR',
      ]);
