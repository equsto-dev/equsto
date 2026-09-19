/**
 * Ana ekipman / yan ürün. Büyük markada kategori öncelikli;
 * kelime yalnızca güvenlik ağı.
 */
export function classifyProduct(p, brandHint = "") {
  const name = String(p.name || "");
  const cat = String(p.category || p.category_path || "");
  const code = String(p.code || p.sku || "");
  const hay = `${name} ${cat}`.toLocaleLowerCase("tr-TR");
  const brand = String(brandHint || p.brand || "").toLocaleLowerCase("tr-TR");

  if (/rational/i.test(brand) || /rational/i.test(hay)) {
    return classifyRational(hay, name, code);
  }

  if (/robot\s*coupe/i.test(brand) || /robot\s*coupe/i.test(hay)) {
    return classifyRobotCoupe(hay, name, code);
  }

  if (/unox/i.test(brand) || /unox/i.test(hay)) {
    return classifyUnox(hay, name, code);
  }

  if (/[oö]ztiryakiler/i.test(brand) || /[oö]ztiryakiler/i.test(hay)) {
    return classifyOztiryakiler(hay, name, code);
  }

  if (/empero/i.test(brand) || /empero/i.test(hay)) {
    return classifyEmpero(hay, name, code);
  }

  if (/atalay/i.test(brand) || /atalay/i.test(hay)) {
    return classifyAtalay(hay, name, code);
  }

  if (/remta/i.test(brand) || /remta/i.test(hay)) {
    return classifyRemta(hay, name, code);
  }

  if (/\bkapp\b/i.test(brand) || /\bkapp\b/i.test(hay)) {
    return classifyKapp(hay, name, code);
  }

  if (/bilge/i.test(brand) || /bilge/i.test(hay)) {
    return classifyBilge(hay, name, code);
  }

  if (/karacasan/i.test(brand) || /karacasan/i.test(hay)) {
    return classifyKaracasan(hay, name, code);
  }

  if (/silver\s*[iı]nox|silver[iı]nox/i.test(brand) || /silver\s*[iı]nox|silver[iı]nox/i.test(hay)) {
    return classifyRemta(hay, name, code);
  }

  if (/\bcsa\b/i.test(brand) || /\bcsa\b/i.test(hay)) {
    return classifyCsaInox(hay, name, code);
  }

  if (/iceinox|ice\s*inox/i.test(brand) || /iceinox|ice\s*inox/i.test(hay)) {
    return classifyCsaInox(hay, name, code); // soğutma / buz / saladbar / dry aged
  }

  if (/ate[sş]e/i.test(brand) || /ate[sş]e/i.test(hay) || /me[sş]ale/i.test(brand) || /me[sş]ale/i.test(hay)) {
    return classifyAtese(hay, name, code);
  }

  if (!isCapacityTepsi(hay) && isAccessory(hay)) {
    return { verdict: "drop", reason: accessoryReason(hay), group: accessoryGroup(hay) };
  }

  if (looksLikeMachine(hay)) {
    return { verdict: "keep", reason: "makine / ana ekipman", group: machineGroup(hay) };
  }

  return { verdict: "review", reason: "grup belirsiz", group: "diger" };
}

function isCapacityTepsi(hay) {
  return /\d+\s*x\s*\d+.*tepsi|tepsi\s*kapasit|\d+\s*tepsili|adet\s*gn.*tepsi/i.test(hay);
}

function isAccessory(hay) {
  if (/deterjan|temizleyici|temizlik|bak[ıi]m tableti|tablet|cleaner|rinse|care tablet|kire[cç]\s*[cç][oö]z/i.test(hay))
    return true;
  if (/yedek\s*par[cç]a|spare|conta seti/i.test(hay)) return true;
  if (/granit\s*f[ıi]r[ıi]n\s*teps|f[ıi]r[ıi]n\s*tepsisi|gn\s*tepsi(?!.*kapasit)/i.test(hay)) return true;
  if (/\bkal[ıi]p\b/.test(hay) && !/makine|makina|d[oö]ner\s*oca/i.test(hay)) return true;
  if (/tabakl[ıi]k|tabak\s*raf|tepsi\s*raf|tepsi\s*ask|disk seti|b[ıi][cç]ak seti/i.test(hay)) return true;
  if (/mobil\s*tepsi|mobil\s*tabak|[oö]rt[uü]|k[ıi]zartma teli|pizza tavas[ıi]/i.test(hay)) return true;
  if (/aksesuar|insert|sepet(?!.*frit)/i.test(hay) && !/makine|makina|f[ıi]r[ıi]n/i.test(hay)) return true;
  return false;
}

function accessoryReason(hay) {
  if (/deterjan|tablet|cleaner|rinse|kire[cç]/i.test(hay)) return "temizlik / kimyasal";
  if (/yedek|conta|pompa/i.test(hay)) return "yedek parça";
  if (/tepsi/i.test(hay)) return "tepsi / GN tepsi";
  if (/kal[ıi]p/i.test(hay)) return "kalıp";
  if (/tabakl[ıi]k/i.test(hay)) return "tabaklık / aksesuar";
  return "aksesuar";
}

function accessoryGroup(hay) {
  if (/deterjan|tablet|cleaner|kire[cç]/i.test(hay)) return "temizlik";
  if (/tepsi/i.test(hay)) return "tepsi";
  if (/yedek|pompa/i.test(hay)) return "yedek";
  return "aksesuar";
}

function classifyRational(hay, name, code) {
  const codeU = String(code || "").toUpperCase();
  if (/5RRX/.test(codeU) || /^022\./.test(codeU) || /083\.5RRX/.test(codeU)) {
    return { verdict: "drop", reason: "Rational aksesuar / kimyasal kod", group: "aksesuar" };
  }
  if (!isCapacityTepsi(hay) && isAccessory(hay)) {
    return { verdict: "drop", reason: accessoryReason(hay), group: accessoryGroup(hay) };
  }
  if (/patates\s*pi[sş]irme\s*[uü]nite/i.test(hay)) {
    return { verdict: "drop", reason: "fırın içi ünite / aksesuar", group: "aksesuar" };
  }
  if (/tabakl[ıi]k/i.test(hay)) {
    return { verdict: "drop", reason: "banket tabaklık", group: "aksesuar" };
  }
  if (/icombi|ivario|selfcooking|combi\s*master|\bcmp\b|scc|buhar\s*konveksiyon|kombi\s*f[ıi]r[ıi]n/i.test(hay)) {
    const group = /ivario/i.test(hay)
      ? "ivario"
      : /icombi\s*pro/i.test(hay)
        ? "icombi-pro"
        : /icombi\s*classic/i.test(hay)
          ? "icombi-classic"
          : /cmp|combi\s*master/i.test(hay)
            ? "cmp"
            : /selfcooking|scc/i.test(hay)
              ? "scc"
              : "kombi-firin";
    return { verdict: "keep", reason: "Rational ana fırın / iVario", group, name };
  }
  if (isAccessory(hay)) {
    return { verdict: "drop", reason: accessoryReason(hay), group: accessoryGroup(hay) };
  }
  if (/9890\./.test(codeU)) {
    return { verdict: "keep", reason: "Rational 9890 makine kodu", group: "kombi-firin", name };
  }
  return { verdict: "drop", reason: "Rational — ana fırın değil", group: "diger" };
}

function classifyRobotCoupe(hay, name, code) {
  if (/\bdisk|\bdil[iı]mleyici|\brendeleyici|\bk[uü]b[iı]k|\bwaffle|\bparmak patates|\bf[ıi]rlatma|\btemizleme aleti|destek|ezici ekipman|[iı]tmel[iı] kafa|otomatik kafa|e[gğ]ik t[uü]pl/i.test(hay)) {
    return { verdict: "drop", reason: "Robot Coupe disk / kafa / destek", group: "aksesuar" };
  }
  if (/b[ıi][cç]ak/i.test(hay) && !/b[ıi][cç]aks[ıi]z/i.test(hay)) {
    return { verdict: "drop", reason: "Robot Coupe bıçak", group: "aksesuar" };
  }
  if (/yedek|aksesuar|disk seti/i.test(hay) && !/makine|makina|blender|mikser|blixer|do[gğ]rama/i.test(hay)) {
    return { verdict: "drop", reason: "Robot Coupe bıçak / disk / yedek", group: "aksesuar" };
  }
  if (!isCapacityTepsi(hay) && isAccessory(hay)) {
    return { verdict: "drop", reason: accessoryReason(hay), group: accessoryGroup(hay) };
  }
  if (
    /blixer|el blender|el mikser|mini mp|micromix|sebze do[gğ]rama|par[cç]alama|mutfak robot|robot cook|s[ıi]kac|pres|bar blender|dik tip/i.test(
      hay,
    )
  ) {
    const group = /blixer/i.test(hay)
      ? "blixer"
      : /robot cook/i.test(hay)
        ? "robot-cook"
        : /el blender|el mikser|mini mp|micromix|cmp\s*\d/i.test(hay)
          ? "el-blender"
          : /s[ıi]kac|pres|j\s*\d|c\s*40/i.test(hay)
            ? "sikacak"
            : /cl\s*\d|sebze do[gğ]rama/i.test(hay)
              ? "sebze-dograma"
              : "parcalama";
    return { verdict: "keep", reason: "Robot Coupe ana makine", group, name };
  }
  if (/^057\./.test(String(code || "")) && /makine|makina|blender|mikser|robot/i.test(hay)) {
    return { verdict: "keep", reason: "Robot Coupe 057 makine", group: "makine", name };
  }
  return { verdict: "drop", reason: "Robot Coupe — ana ekipman değil", group: "diger" };
}

function classifyUnox(hay, name, code) {
  const codeU = String(code || "").toUpperCase();
  const blob = `${hay} ${codeU}`;
  if (/deterjan|rinse|spray&|db101|db104/i.test(blob)) {
    return { verdict: "drop", reason: "Unox temizlik / kimyasal", group: "aksesuar" };
  }
  if (/spatula|fan kapa|[iı][cç] cam|d[iı][sş] cam|kvt11/i.test(blob)) {
    return { verdict: "drop", reason: "Unox yedek / aksesuar", group: "aksesuar" };
  }
  if (/f[ıi]r[ıi]n arabas[ıi]|xevtc|xcb1001|xebtl/i.test(blob)) {
    return { verdict: "drop", reason: "Unox fırın arabası", group: "aksesuar" };
  }
  if (
    /cheftop|bakertop|bakerlux|cheflux|evereo|speed|linemicro|mayalama|mayaland[ıi]r|konveksiyon|f[ıi]r[ıi]n|arianna|anna|roberta|rossella|stefania|lisa|camilla|vittoria|domenica/i.test(
      hay,
    )
  ) {
    const group = /evereo/i.test(hay)
      ? "evereo"
      : /speed/i.test(hay)
        ? "speed"
        : /mayalama|mayaland[ıi]r/i.test(hay)
          ? "mayalama"
          : /cheftop/i.test(hay)
            ? "cheftop"
            : /bakertop/i.test(hay)
              ? "bakertop"
              : /bakerlux|cheflux|linemicro/i.test(hay)
                ? "konveksiyon"
                : "firin";
    return { verdict: "keep", reason: "Unox ana fırın / kabin", group, name };
  }
  return { verdict: "drop", reason: "Unox — ana ekipman değil", group: "diger" };
}

function isOztiMachine(hay) {
  return /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|[ıi]zgara|kuzine|kombi|konveksiyon|buzdolab|so[gğ]utucu|dondurucu|davlumbaz|d[oö]ner\s*oca|kaynatma|kazan|benmari|bula[sş][ıi]k|bardak y[ıi]kama|espresso|kahve mak/i.test(
    hay,
  );
}

function classifyOztiryakiler(hay, name, code) {
  const codeU = String(code || "").toUpperCase();
  if (/9890\.(SCC|CMP|IC|X)/i.test(codeU) || /ozti\s*&\s*rational|rational\s*f[ıi]r[ıi]n/i.test(hay)) {
    return { verdict: "drop", reason: "Özti — Rational/Unox ayrı marka", group: "oem" };
  }
  if (/kire[cç]\s*[cç][oö]z|ya[gğ]\s*[cç][oö]z|parlat[ıi]c[ıi]s[ıi]|deterjan[ıi]|temizleyici tablet|power\s*(limex|rinse|grill|t-?9)/i.test(hay)) {
    return { verdict: "drop", reason: "Özti kimyasal", group: "aksesuar" };
  }
  if (/yedek\s*par[cç]a|conta seti/i.test(hay) && !isOztiMachine(hay)) {
    return { verdict: "drop", reason: "Özti yedek", group: "aksesuar" };
  }
  if (/silindirik tencere|helvane|ka[cç]arola|ka[cç]erola|sos tenceres|d[oö]k[uü]m tencere|\btava\b|sa[cç] tava|makarna pi[sş]irme tencere/i.test(hay)) {
    return { verdict: "drop", reason: "Özti tencere / tava / helvane", group: "cookware" };
  }
  if (/tencere/i.test(hay) && !/kaynatma|kazan|makine|makina|ocak|indirekt/i.test(hay)) {
    return { verdict: "drop", reason: "Özti tencere (cookware)", group: "cookware" };
  }
  if (/servis gere[cç]|kesme taht|gurmeaid|b[ıi][cç]ak seti|kep[cç]e|k[eé]vgir|s[uü]zge[cç]|buz kovas|[ıi]zgara f[ıi]r[cç]a|frit[oö]z sepeti|d[oö]ner b[ıi][cç]a[gğ]|d[oö]ner k[uü]re[gğ]|d[oö]ner makinesi motoru|dondurmal[ıi]k|k[uü]ll[uü]k|sosluk|[cç]orbal[ıi]k(?!.*elektrik)|shaker|servis ka[sş][ıi][gğ]|servis spatula|ekmek sepet|power hand/i.test(hay)) {
    return { verdict: "drop", reason: "Özti servis gereç / aksesuar", group: "aksesuar" };
  }
  if (/tabldot|self\s*servis|yemekhane|neutrale|s[ıi]cak.?so[gğ]uk servis|s[ıi]cak servis|servis [uü]nite/i.test(hay)) {
    return { verdict: "drop", reason: "Özti tabldot / yemekhane", group: "tabldot" };
  }
  if (/chafing|gn k[uü]vet|pres tepsi/i.test(hay) || (/\bgn\s*[0-9¼½⅓]/i.test(hay) && !isOztiMachine(hay))) {
    return { verdict: "drop", reason: "Özti GN / chafing / tepsi", group: "aksesuar" };
  }
  if (/[cç]al[ıi][sş]ma tezgah|evyeli tezgah|(^| )evye( |$)/i.test(hay) && !/so[gğ]ut|buzdolab|dondur|bula[sş][ıi]k/i.test(hay)) {
    return { verdict: "drop", reason: "Özti tezgah / evye", group: "tezgah" };
  }
  if (/set alt[ıi] dolap|taban raf|f[ıi]r[ıi]n alt tezgah/i.test(hay) && !/so[gğ]ut/i.test(hay)) {
    return { verdict: "drop", reason: "Özti set altı dolap / mobilya", group: "tezgah" };
  }
  if (/istif\s*raf|istif raf/i.test(hay)) {
    return { verdict: "review", reason: "Özti istif rafı — karar bekliyor", group: "istif" };
  }
  if (/(servis|banket|ta[sş][ıi]ma)\s*arabas[ıi]|\baraba\b/i.test(hay) && !/f[ıi]r[ıi]n|d[oö]ner/i.test(hay)) {
    return { verdict: "review", reason: "Özti servis / banket arabası — karar bekliyor", group: "araba" };
  }
  if (
    /ocak|[ıi]zgara|frit[oö]z|kuzine|f[ıi]r[ıi]n|salamander|d[oö]ner\s*oca|kaynatma|kazan|benmari|bain\s*marie/i.test(
      hay,
    ) && !/frit[oö]z sepet|[ıi]zgara f[ıi]r[cç]a/i.test(hay)
  ) {
    return { verdict: "keep", reason: "Özti pişirme makinesi", group: "pisirme", name };
  }
  if (/bula[sş][ıi]k|bardak y[ıi]kama|kazan y[ıi]kama/i.test(hay) && /makine|makina/i.test(hay)) {
    return { verdict: "keep", reason: "Özti yıkama makinesi", group: "yikama", name };
  }
  if (/so[gğ]utucu|so[gğ]uk oda|buz mak|dondurucu|buzdolab|[sş]i[sş]e so[gğ]ut/i.test(hay)) {
    return { verdict: "keep", reason: "Özti soğutma", group: "sogutma", name };
  }
  if (/tezgah\s*(alt[ıi]|tip).{0,24}(so[gğ]ut|buzdolab|dondur)/i.test(hay)) {
    return { verdict: "keep", reason: "Özti tezgah tipi / altı soğutucu", group: "sogutma", name };
  }
  if (/davlumbaz/i.test(hay)) {
    return { verdict: "keep", reason: "Özti davlumbaz", group: "davlumbaz", name };
  }
  if (/espresso|kahve mak|[cç]orbal[ıi]k.*elektrik/i.test(hay)) {
    return { verdict: "keep", reason: "Özti kahve / ısıtma makinesi", group: /kahve|espresso/i.test(hay) ? "kahve" : "pisirme", name };
  }
  if (/tost makine|soyma makine|s[ıi]kma makine|sebze y[ıi]kama|d[oö]ner kesme|pelet|humus/i.test(hay)) {
    return { verdict: "keep", reason: "Özti hazırlık makinesi", group: "hazirlik", name };
  }
  if (/te[sş]hir dolab|saladbar|salad\s*bar/i.test(hay)) {
    return { verdict: "keep", reason: "Özti teşhir / saladbar", group: "sogutma", name };
  }
  if (/hamur|dilimleme|do[gğ]rama|mikser|par[cç]alama/i.test(hay) && /makine|makina/i.test(hay)) {
    return { verdict: "keep", reason: "Özti hazırlık makinesi", group: "hazirlik", name };
  }
  return { verdict: "review", reason: "Özti — grup belirsiz", group: "diger" };
}

function classifyEmpero(hay, name, code) {
  if (/deterjan|temizleyici|kire[cç]|parlat[ıi]c[ıi] s[ıi]v[ıi]|kimyasal/i.test(hay) && !/makine|makina|parlat[ıi]c[ıi],/i.test(hay)) {
    return { verdict: "drop", reason: "Empero kimyasal", group: "aksesuar" };
  }
  if (/vac-?norm.*(conta|k[uü]vet|kapak|s[uü]bap)|conta|s[uü]bap/i.test(hay) && !/makine|makina/i.test(hay)) {
    return { verdict: "drop", reason: "Empero Vac-Norm aksesuar", group: "aksesuar" };
  }
  if (/el y[ıi]kama evye|mobil el y[ıi]kama|dezenfektan [iı]stasyon/i.test(hay)) {
    return { verdict: "drop", reason: "Empero evye / istasyon", group: "tezgah" };
  }
  if (/\bstand\b|alt stand|makine tezgah[ıi]|lokma.*tezgah/i.test(hay) && !/so[gğ]ut|buzdolab|dondur/i.test(hay)) {
    return { verdict: "drop", reason: "Empero stand / mobilya", group: "tezgah" };
  }
  if (/servis arabas[ıi]|\baraba\b/i.test(hay) && !/f[ıi]r[ıi]n|d[oö]ner/i.test(hay)) {
    return { verdict: "review", reason: "Empero servis arabası — karar bekliyor", group: "araba" };
  }
  if (
    /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|[ıi]zgara|bula[sş][ıi]k|bardak y[ıi]kama|vakum|hamur|do[gğ]rama|dilim|s[ıi]kma|pizza|pide|tand[ıi]r|kumpir|lokma|tester|saladbar|te[sş]hir|dondurucu|so[gğ]utucu|buzdolab|buz mak|davlumbaz|blender|mikser|espresso|kahve|tost|waffle|pelet|benmari/i.test(
      hay,
    )
  ) {
    const group = /bula[sş][ıi]k|bardak y[ıi]kama/i.test(hay)
      ? "yikama"
      : /dondurucu|so[gğ]utucu|buzdolab|buz mak|te[sş]hir|saladbar/i.test(hay)
        ? "sogutma"
        : /espresso|kahve/i.test(hay)
          ? "kahve"
          : /hamur|do[gğ]rama|dilim|vakum|s[ıi]kma|tester|blender|mikser/i.test(hay)
            ? "hazirlik"
            : /davlumbaz/i.test(hay)
              ? "davlumbaz"
              : "pisirme";
    return { verdict: "keep", reason: "Empero ana ekipman", group, name };
  }
  if (/[cç]atal ka[sş][ıi]k parlat/i.test(hay)) {
    return { verdict: "keep", reason: "Empero yıkama yardımcı makine", group: "yikama", name };
  }
  return { verdict: "review", reason: "Empero — grup belirsiz", group: "diger" };
}

function classifyAtalay(hay, name, code) {
  if (/yedek|conta|deterjan|temizleyici/i.test(hay) && !/makine|makina/i.test(hay)) {
    return { verdict: "drop", reason: "Atalay yedek / kimyasal", group: "aksesuar" };
  }
  if (/tabldot|self\s*servis/i.test(hay)) {
    return { verdict: "drop", reason: "Atalay tabldot", group: "tabldot" };
  }
  if (/[sş][ıi]rtlı? evye|el y[ıi]kama evye|(^| )evye( |$)/i.test(hay) && !/buzdolab|so[gğ]ut/i.test(hay)) {
    return { verdict: "drop", reason: "Atalay evye", group: "tezgah" };
  }
  if (/ara tezgah|setalt[ıi] tezgah|set alt[ıi] tezgah|setalt[ıi] tezgah/i.test(hay)) {
    return { verdict: "drop", reason: "Atalay tezgah / mobilya", group: "tezgah" };
  }
  if (/d[oö]ner (sarma|kal[ıi]b)/i.test(hay) || /\bkal[ıi]p\b/i.test(hay)) {
    return { verdict: "drop", reason: "Atalay döner kalıp / aparat", group: "aksesuar" };
  }
  if (/(servis|tepsi ta[sş][ıi]ma)\s*arabas[ıi]|\baraba\b/i.test(hay)) {
    return { verdict: "review", reason: "Atalay araba — karar bekliyor", group: "araba" };
  }
  if (
    /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|[ıi]zgara|kuzine|d[oö]ner|kaynatma|benmari|bain|devrilir|salamander|pizza|pide|patates|wok|steriliz|do[gğ]rama|dilim|kesme|hamur|vakum|bula[sş][ıi]k|so[gğ]ut|dondurucu|buzdolab|davlumbaz|tost|waffle/i.test(
      hay,
    )
  ) {
    const group = /bula[sş][ıi]k|steriliz/i.test(hay)
      ? "yikama"
      : /so[gğ]ut|dondurucu|buzdolab/i.test(hay)
        ? "sogutma"
        : /do[gğ]rama|dilim|kesme|hamur|vakum/i.test(hay)
          ? "hazirlik"
          : /davlumbaz/i.test(hay)
            ? "davlumbaz"
            : "pisirme";
    return { verdict: "keep", reason: "Atalay ana ekipman", group, name };
  }
  return { verdict: "review", reason: "Atalay — grup belirsiz", group: "diger" };
}

function classifyRemta(hay, name, code) {
  if (/[cç]elik demlik|demlik no|yedek|conta|kapak(?!.*makine)/i.test(hay) && !/makine|makina|oca[kğ]|kazan/i.test(hay)) {
    return { verdict: "drop", reason: "Remta demlik / aksesuar", group: "aksesuar" };
  }
  if (/servis arabas[ıi]|\baraba\b/i.test(hay)) {
    return { verdict: "review", reason: "Remta araba — karar bekliyor", group: "araba" };
  }
  if (
    /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|waffle|tost|krep|kornet|d[oö]ner|[cç]ay|[cç]ikolata|sahlep|[sş]erbet|ayran|pizza|pide|sos[iı]s|hamburger|ha[sş]lama|kazan|[cç]orba|seb[iı]l|so[gğ]utucu|buz|dispenser|roller|pleyt|m[ıi]s[ıi]r|lokanta|patates|benmari/i.test(
      hay,
    )
  ) {
    const group = /[sş]erbet|ayran|seb[iı]l|so[gğ]utucu|buz|dispenser/i.test(hay)
      ? "icecek"
      : /[cç]ay|[cç]ikolata|sahlep/i.test(hay)
        ? "icecek"
        : /kahve|espresso/i.test(hay)
          ? "kahve"
          : /waffle|tost|krep|kornet|sos[iı]s|ha[sş]lama|m[ıi]s[ıi]r|hamburger/i.test(hay)
            ? "pisirme"
            : "pisirme";
    return { verdict: "keep", reason: "Remta ana ekipman", group, name };
  }
  return { verdict: "review", reason: "Remta — grup belirsiz", group: "diger" };
}

/** Kapp: yalnızca küvet + chafing */
function classifyKapp(hay, name, code) {
  if (/chafing|küvet|kuvet|gn\s*[0-9¼½⅓]|gastronorm/i.test(hay)) {
    return { verdict: "keep", reason: "Kapp küvet / chafing", group: "servis", name };
  }
  return { verdict: "drop", reason: "Kapp — küvet/chafing dışı", group: "diger" };
}

/** Bilge: yalnızca küvet */
function classifyBilge(hay, name, code) {
  if (/kapak|conta|izgara teli|[ıi]zgara teli|s[uü]zge[cç]/i.test(hay)) {
    return { verdict: "drop", reason: "Bilge küvet aksesuarı", group: "aksesuar" };
  }
  if (/küvet|kuvet/i.test(hay) || (/gastronorm|gn\s*[0-9¼½⅓]/i.test(hay) && /mm|lt|l\b|hacim/i.test(hay))) {
    return { verdict: "keep", reason: "Bilge küvet", group: "servis", name };
  }
  if (/gn\s*[0-9¼½⅓].*\d+\s*mm/i.test(hay)) {
    return { verdict: "keep", reason: "Bilge GN küvet", group: "servis", name };
  }
  return { verdict: "drop", reason: "Bilge — küvet dışı", group: "diger" };
}

function classifyKaracasan(hay, name, code) {
  if (/yedek|conta|kapak seti/i.test(hay) && !/makine|makina/i.test(hay)) {
    return { verdict: "drop", reason: "Karacasan aksesuar", group: "aksesuar" };
  }
  if (/servis arabas[ıi]|\baraba\b/i.test(hay)) {
    return { verdict: "review", reason: "Karacasan araba — karar bekliyor", group: "araba" };
  }
  if (
    /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|[ıi]zgara|tost|krep|pankek|sos[iı]sl[ıi]k|yer oca[gğ]|patates|te[sş]hir|steriliz|benmari|waffle|d[oö]ner|kuzine|salamander/i.test(
      hay,
    )
  ) {
    const group = /steriliz/i.test(hay)
      ? "yikama"
      : /te[sş]hir|so[gğ]ut/i.test(hay)
        ? "sogutma"
        : "pisirme";
    return { verdict: "keep", reason: "Karacasan ana ekipman", group, name };
  }
  return { verdict: "review", reason: "Karacasan — grup belirsiz", group: "diger" };
}

function classifyCsaInox(hay, name, code) {
  if (/yedek|conta|raf seti/i.test(hay) && !/dolab|buz|dondur/i.test(hay)) {
    return { verdict: "drop", reason: "CSA aksesuar", group: "aksesuar" };
  }
  if (
    /buzdolab|dondurucu|so[gğ]utucu|[sş]i[sş]e so[gğ]ut|dinlendirme|mayalama|dolab|buz mak|tezgah tipi|cihaz alt[ıi]|saladbar|dry\s*aged|gurme buz/i.test(
      hay,
    )
  ) {
    return { verdict: "keep", reason: "soğutma / dolap", group: "sogutma", name };
  }
  return { verdict: "review", reason: "CSA — grup belirsiz", group: "diger" };
}

/** Ateşe / Meşale: çay kazanı → içecek; demlik/damlalık → drop */
function classifyAtese(hay, name, code) {
  if (/porselen.*demlik|bak[ıi]r.*demlik|demlik(?!li)|damlal[ıi]k|yedek|conta/i.test(hay) && !/kazan|makine|makina|oca[kğ]/i.test(hay)) {
    return { verdict: "drop", reason: "Ateşe demlik / aksesuar", group: "aksesuar" };
  }
  if (/[cç]ay\s*kazan|[cç]ay\s*makine|[cç]ay\s*oca[kğ]|su [iı]s[ıi]t[ıi]c|semaver/i.test(hay)) {
    return { verdict: "keep", reason: "Ateşe çay / ısıtma — içecek", group: "icecek", name };
  }
  if (/makine|makina|kazan|oca[kğ]|frit|waffle|tost|d[oö]ner/i.test(hay)) {
    return { verdict: "keep", reason: "Ateşe makine", group: /[cç]ay|su [iı]s[ıi]t/i.test(hay) ? "icecek" : "pisirme", name };
  }
  return { verdict: "review", reason: "Ateşe — grup belirsiz", group: "diger" };
}

function looksLikeMachine(hay) {
  return /makine|makina|f[ıi]r[ıi]n|ocak|frit[oö]z|[ıi]zgara|dolab|buzdolab|buz\s*mak|buz mak|ice\s*maker|bula[sş][ıi]k|blender|mikser|do[gğ]rama|espresso|kuzine|davlumbaz|de[gğ]irmen|grinder|kahve|filtre|brew|s[ıi]kac|juicer|dilim|slicer|tost|waffle|mikrodalga|pacojet|slush|granita|dispenser|[oö][gğ][uü]t|kombi|mangal|d[oö]ner|pelet|sote|benmari|mayalama|dinlendirme|chafing|tezgah alt[ıi] so[gğ]ut|dondurucu|so[gğ]utucu/i.test(
    hay,
  );
}

function machineGroup(hay) {
  if (/bula[sş][ıi]k|y[ıi]kama/i.test(hay)) return "yikama";
  if (/buz|ice|so[gğ]ut|dondur/i.test(hay)) return "sogutma";
  if (/espresso|kahve|de[gğ]irmen|filtre kahve|brew/i.test(hay)) return "kahve";
  if (/s[ıi]kac|smoothie|slush|granita|dispenser/i.test(hay)) return "icecek";
  if (/f[ıi]r[ıi]n|kombi|ocak|frit|[ıi]zgara|kuzine|mangal/i.test(hay)) return "firin";
  if (/blender|mikser|do[gğ]rama|dilim|haz[ıi]rl/i.test(hay)) return "hazirlik";
  return "makine";
}
