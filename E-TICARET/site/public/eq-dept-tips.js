/**
 * Departman alt kategorileri (?tip=) — FRONTEND v2 + vitrin tile eşlemesi.
 * generate-category-seo-data.mjs ile aynı tip slug listesi.
 */
;(function () {
  "use strict";

  var RAW = [
    { tip: "firinlar", dept: "pisirme", label: "Fırınlar", search: "fırın|firin|konveksiyon|kombi|kombili|combi|pizza|mayalama|mikrodalga|microwave|pastane fırın" },
    { tip: "kombi-firin", dept: "pisirme", label: "Kombi Fırınlar", search: "kombi|kombili|icombi|combi" },
    { tip: "konveksiyonlu-firin", dept: "pisirme", label: "Konveksiyonlu Fırınlar", search: "konveksiyon|konveksiyonel" },
    { tip: "jet-mikrodalga-firin", dept: "pisirme", label: "Jet ve Mikrodalga Fırınlar", search: "mikrodalga|jet|microwave" },
    { tip: "komurlu-firin", dept: "pisirme", label: "Kömürlü Fırınlar", search: "kömür|komur|taş fırın|tas firin|lahmacun|pide" },
    { tip: "pizza-firinlari", dept: "pisirme", label: "Pizza Fırınları", search: "pizza|kubbe|taş taban" },
    { tip: "mayalama-dolabi", dept: "pisirme", label: "Mayalama Dolapları", search: "mayalama|prover|ferment" },
    { tip: "induksiyonlu-ocak", dept: "pisirme", label: "İndüksiyonlu Ocaklar", search: "indüksiyon|induksiyon|induction" },
    { tip: "asansorlu-izgara", dept: "pisirme", label: "Asansörlü Izgaralar", search: "salamander|gratin|üst ızgara|ust izgara|gratinator|broiler" },
    { tip: "doner-ocaklari", dept: "pisirme", label: "Döner Ocakları", search: "döner|doner|kebab|kebap" },
    { tip: "pilic-cevirme", dept: "pisirme", label: "Piliç Çevirme Makineleri", search: "piliç|pilic|rotisserie|çevirme|cevirme" },
    { tip: "lavtasli_izgara", dept: "pisirme", label: "Lavtaşlı Izgara", search: "lavta|lavtaş|griddle|plancha" },
    { tip: "char_izgara", dept: "pisirme", label: "Char Izgara", search: "char|kömür|komur|ocakbaşı|ocakbasi" },
    { tip: "salamander", dept: "pisirme", label: "Salamander", search: "salamander|gratin|üst ızgara|ust izgara" },
    { tip: "patates_dinlendirme", dept: "pisirme", label: "Patates Dinlendirme", search: "patates|dinlendirme|holding" },
    { tip: "setustu-bain-marie", dept: "pisirme", label: "Set Üstü Bain Marie", slug: "setustu-bain-marie" },
    { tip: "hareketli-bain-marie", dept: "pisirme", label: "Hareketli Bain Marie", slug: "hareketli-bain-marie" },
    { tip: "sanayi-ocaklari", dept: "pisirme", label: "Endüstriyel Ocaklar", slug: "sanayi-ocaklari" },
    {
      tip: "ocak-vitrini",
      dept: "pisirme",
      label: "Ocaklar",
      search: "set üstü ocak|setustu ocak|wok ocak|kuzine|indüksiyon|induksiyon|döner ocak|doner ocak",
    },
    { tip: "sanayi-tipi-izgaralar", dept: "pisirme", label: "Endüstriyel Izgaralar", slug: "sanayi-tipi-izgaralar" },
    { tip: "kuzineler", dept: "pisirme", label: "Kuzineler", slug: "kuzineler" },
    { tip: "fritozler", dept: "pisirme", label: "Fritözler", slug: "fritozler" },
    { tip: "doner-ocaklari-", dept: "pisirme", label: "Döner Ocakları", slug: "doner-ocaklari-" },
    { tip: "tost-makineleri", dept: "pisirme", label: "Tost Makineleri", slug: "tost-makineleri" },
    { tip: "pilic-cevirme-makineleri", dept: "pisirme", label: "Piliç Çevirme", slug: "pilic-cevirme-makineleri" },
    { tip: "ocakbasi-izgara", dept: "pisirme", label: "Ocakbaşı Izgaralar", slug: "ocakbasi-izgara" },
    { tip: "sogutma-ekipmanlari", dept: "sogutma", label: "Tüm Soğutma Ekipmanları", slug: "sogutma-ekipmanlari" },
    { tip: "tezgah-tipi-buzdolabi", dept: "sogutma", label: "Tezgah Tipi Buzdolapları", search: "tezgah tip|tezgahalt|counter" },
    { tip: "make-up-dolabi", dept: "sogutma", label: "Make Up Dolapları", search: "make up|make-up|makyaj" },
    { tip: "dik-tip-buzdolap", dept: "sogutma", label: "Dik Tip Buzdolaplar", search: "dik tip|dik buzdolab|upright" },
    {
      tip: "buz-makinesi",
      dept: "sogutma",
      label: "Buz Makineleri",
      slug: "icecek-berrak-buz-makineleri",
      search: "buz mak|ice maker|ice machine|berrak buz|küp buz|kup buz",
    },
    { tip: "derin-dondurucu", dept: "sogutma", label: "Derin Dondurucular", search: "derin dondur|freezer|dondurucu" },
    { tip: "dry_age_dolabi", dept: "sogutma", label: "Dry-Age Dolabı", search: "dry age|dry-age|olgunlaştır" },
    { tip: "blast-chiller", dept: "sogutma", label: "Blast Chiller", search: "blast|şok|sok|chiller|shock" },
    { tip: "soguk-oda", dept: "sogutma", label: "Soğuk Odalar", search: "soğuk oda|soguk oda|cold room" },
    { tip: "balik-teshir", dept: "sogutma", label: "Balık Teşhir Reyonları", search: "balık|balik|fish|teşhir" },
    { tip: "sarap-dolabi", dept: "sogutma", label: "Şarap Dolapları", search: "şarap|sarap|wine" },
    {
      tip: "espresso-makinesi",
      dept: "kahve",
      label: "Espresso Kahve Makineleri",
      search:
        "espresso|gruplu kahve|gruplu tam otomatik|tam otomatik kahve mak|barista kahve mak|çekirdekten fincan|bean to cup|appia|linea|aurelia|faema kahve mak|sanremo kahve",
    },
    { tip: "kahve-degirmeni", dept: "kahve", label: "Kahve Değirmenleri", search: "değirmen|degirmen|grinder|öğüt|ogut" },
    {
      tip: "filtre-kahve",
      dept: "kahve",
      label: "Filtre Kahve Makineleri",
      search: "filtre kahve|filtre kahve mak|fm250|ftl120|ftl|bravilor|batch brew|demleme",
    },
    {
      tip: "kahve-sut-potlari",
      dept: "kahve",
      label: "Kahve Süt Potları",
      search: "kahve süt pot|kahve sut pot|8534|süt potu|sut potu",
    },
    { tip: "turk-kahve", dept: "kahve", label: "Türk Kahve Makineleri", search: "türk|turk|cezve" },
    { tip: "bardak-yikama", dept: "yikama", label: "Bardak Yıkama Makineleri", search: "bardak yıkama|bardak yikama|oby 35|oby 40|073m|074m" },
    {
      tip: "bulasik-makineleri",
      dept: "yikama",
      label: "Bulaşık Yıkama Makineleri",
      search:
        "oky|ux10|fx10|amx|9710|071t|075t|076r|076l|072r|077r|07al|07ar|obm|oby 50|oby 500|otomatik yikama|hobart",
    },
    { tip: "setalti-bulasik", dept: "yikama", label: "Setaltı Bulaşık Makineleri", search: "setaltı|set altı|tezgah altı|undercounter|075t|oby 50" },
    { tip: "giyotin-bulasik", dept: "yikama", label: "Giyotin Tip Bulaşık Makineleri", search: "giyotin|hood type|071t|obm" },
    { tip: "konveyorlu-bulasik", dept: "yikama", label: "Konveyörlü Bulaşık Makineleri", search: "konveyör|konveyor|tunnel|konveyörlü|076r|076l|072r|072l|077r|077l" },
    { tip: "flight-bulasik", dept: "yikama", label: "Flight Tip Bulaşık Makineleri", search: "flight tip|07al|07ar|07bl|07br|07cl|07cr|07el|07er|07fl|07fr" },
    { tip: "tirnakli-bulasik", dept: "yikama", label: "Tırnaklı Bulaşık Makineleri", search: "tırnaklı|tirnakli|rack" },
    { tip: "kazan-yikama", dept: "yikama", label: "Kazan Yıkama Makineleri", search: "kazan yıkama|kettle|pot wash" },
    {
      tip: "bulasik-makinesi-giris-ve-cikis-tezgahlari",
      dept: "yikama",
      label: "Giriş / Çıkış Tezgahları (B.Y.M.)",
      slug: "bulasik-makinesi-giris-ve-cikis-tezgahlari",
    },
    {
      tip: "calisma-tezgahlari-bulasik-makinesi-tezgahlari",
      dept: "yikama",
      label: "Bulaşık Makinesi Üstü Tezgahlar",
      slug: "calisma-tezgahlari-bulasik-makinesi-tezgahlari",
    },
    {
      tip: "el-yikama-evyeleri",
      dept: "yikama",
      label: "El Yıkama Evyeleri",
      slug: "el-yikama-evyeleri",
    },
    { tip: "et-hazirlik", dept: "hazirlik", label: "Et Hazırlık Ekipmanları", search: "et hazırlık|et hazirlik|kasap" },
    { tip: "et_kutugu", dept: "hazirlik", label: "Et Kütüğü", search: "kütük|kutuk|butcher block" },
    { tip: "kiyma_makinesi", dept: "hazirlik", label: "Et Kıyma Makinesi", search: "kıyma|kiyma|mincer" },
    { tip: "et_kemik_testeresi", dept: "hazirlik", label: "Et Kemik Testeresi", search: "kemik testere|bone saw" },
    { tip: "sebze-dograma", dept: "hazirlik", label: "Sebze Doğrama Makineleri", search: "sebze|doğrama|dograma|vegetable" },
    {
      tip: "hamur-hazirlik",
      dept: "hazirlik",
      label: "Hamur Hazırlık",
      search: "hamur|spiral|planet|yoğur|tulumba|şekillendirme|sekillendirme|pastane|patisserie|köfte şekil|kofte sekil",
    },
    { tip: "vakum-makinesi", dept: "hazirlik", label: "Vakum Makineleri", search: "vakum|vacuum" },
    { tip: "sous-vide", dept: "hazirlik", label: "Sous Vide", search: "sous vide|sous-vide" },
    { tip: "bar-blender", dept: "icecek", label: "Bar Blenderlar", search: "bar blender|blender|smoothie|buz kırıcı bar|buz kirici bar" },
    { tip: "portakal-sikma", dept: "icecek", label: "Portakal & Narenciye Sıkma", search: "portakal|narenciye|nar sık|nar sik|meyve suyu|juice|sıkma mak|sikma mak|sıkma pres|sikma pres" },
    { tip: "kati-meyve-sikacagi", dept: "icecek", label: "Katı Meyve Sıkacakları", search: "katı meyve|kati meyve|meyve presi|cold press" },
    { tip: "soguk-dispenser", dept: "icecek", label: "Soğuk İçecek Dispenseri", search: "soğuk içecek|soguk icecek|fıskiyeli|fiskiyeli|soğuk disp|soguk disp" },
    { tip: "limonata-serbet", dept: "icecek", label: "Limonata & Şerbet", search: "limonata|şerbet|serbet" },
    { tip: "ayran-makinesi", dept: "icecek", label: "Ayran Makineleri", search: "ayran|köpüklü ayran|kopuklu ayran" },
    { tip: "granita-slush", dept: "icecek", label: "Granita & Slush", search: "granita|slush|buzlaş|buzlas|ice slush" },
    { tip: "sicak-cikolata", dept: "icecek", label: "Sıcak Çikolata & Sahlep", search: "çikolata|cikolata|sahlep|salep|hot chocolate" },
    { tip: "sicak-icecek-disp", dept: "icecek", label: "Sıcak İçecek Dispenseri", search: "sıcak içecek|sicak icecek|sıcak disp|sicak disp" },
    { tip: "cay-makinesi", dept: "icecek", label: "Çay Makineleri", search: "çay mak|cay mak|çay makinesi|cay makinesi|demlik|hibrit çay|hibrit cay|smart çay|compact çay|turbo çay" },
    { tip: "cay-kazani", dept: "icecek", label: "Çay Kazanları", search: "çay kazan|cay kazan|çay kulesi|cay kulesi|çay kule" },
    {
      tip: "kahveci-demlik",
      dept: "icecek",
      label: "Kahveci Demlikleri",
      search: "kahveci demlik|8573.000|demlik no",
    },
    { tip: "cay-otomat", dept: "icecek", label: "Çay Otomatları", search: "çay otomat|cay otomat" },
    { tip: "cay-ocagi", dept: "icecek", label: "Çay Ocakları & Semaverler", search: "çay ocağ|cay ocag|semaver|çay sema|cay sema" },
    { tip: "cay-sunum", dept: "icecek", label: "Çay Sunum & Jelli", search: "jelli çay|jelli cay|çay sunum|cay sunum|mini çay" },
    { tip: "su-aritma", dept: "icecek", label: "Su Arıtma & Filtre", search: "su filt|arıtma|aritma|reverse osmos|su arıt" },
    { tip: "su-otomat", dept: "icecek", label: "Su Otomatları", search: "su otomat|içme suyu otomat|icme suyu otomat" },
    { tip: "icecek-otomat", dept: "icecek", label: "İçecek Otomatları", search: "içecek otomat|icecek otomat|yiyecek otomat|vending" },
    { tip: "kahve-sunum", dept: "icecek", label: "Kahve Sunum & Bardak Isıtıcı", search: "kahve fincan|bardak ısıt|bardak isit|sunum arabası|sunum arabasi|kahveci güzeli" },
    { tip: "cafe-ankastre", dept: "icecek", label: "Sıcak / Soğuk Ankastre", search: "ankastre|self servis|servis bankosu|nefeslik|sıcak self|soguk self" },
    { tip: "cafe-aksesuar", dept: "icecek", label: "Cafe Tezgah & Aksesuar", search: "ahşap ön|ahsap on|baza paslanmaz|küver|kuver|şampanya kovası|sampanya kovasi|tepsi kaydır" },
    { tip: "slug-cay", dept: "icecek", label: "Çay Ekipmanları (diğer)", slug: "cay-kazanlari-cay-makineleri-cay-otomatlari" },
    { tip: "slug-otom", dept: "icecek", label: "Yiyecek & İçecek Hattı", slug: "yiyecek-ve-icecek-otomatlari-" },
    { tip: "taban-rafli", dept: "tezgah", label: "Taban Raflı", search: "taban raf|taban-raf" },
    { tip: "taban-ve-ara-rafli", dept: "tezgah", label: "Taban ve Ara Raflı", search: "taban raf|ara raf" },
    { tip: "dolapli-tezgah", dept: "tezgah", label: "Dolaplı", search: "dolapli|dolaplı|setalti dolap" },
    { tip: "proso-tumu", dept: "market-reyon", label: "Proso", search: "proso profesyonel|prosogutma" },
    { tip: "proso-sutluk", dept: "market-reyon", label: "Proso Sütlükler", search: "proso-sutluk|sütlük|sutluk|lion|rhino|falcon|puma|panther" },
    { tip: "proso-kisa-sutluk", dept: "market-reyon", label: "Proso Kısa Sütlük", search: "proso-kisa|kısa sütlük|kisa sutluk" },
    { tip: "proso-sarkuteri", dept: "market-reyon", label: "Proso Şarküteri", search: "proso-sarkuteri|şarküteri|sarkuteri|tiger|cobra|dragon" },
    { tip: "proso-dikey-dondurucu", dept: "market-reyon", label: "Proso Dikey Dondurucu", search: "proso-dikey|dikey dondurucu|scorpion|orca|whale|kangaroo" },
    { tip: "proso-ada-tipi", dept: "market-reyon", label: "Proso Ada Tipi", search: "proso-ada|ada tipi|phoenix|dolphin|barracuda" },
    { tip: "proso-plugin", dept: "market-reyon", label: "Proso Plug-in", search: "proso-plugin|plug-in|plugin|falcon-plug" },
    { tip: "proso-butik", dept: "market-reyon", label: "Proso Butik", search: "proso-butik|butik|butterfly|firefly|flamingo" },
    { tip: "proso-soguk-hava", dept: "market-reyon", label: "Proso Soğuk Hava Deposu", search: "proso-soguk-hava|soğuk hava deposu|soguk hava" },
    { tip: "proso-sogutma-sistemleri", dept: "market-reyon", label: "Proso Soğutma Sistemleri", search: "proso-sogutma|soğutma sistemi|split|endüstriyel" },
    { tip: "proso-sise-sogutucu", dept: "market-reyon", label: "Proso Şişe Soğutucu", search: "proso-sise|şişe soğutucu|sise sogutucu" },
    { tip: "caglayan-tumu", dept: "market-reyon", label: "Çağlayan", search: "çağlayan|caglayan refrigeration" },
    { tip: "caglayan-nilufer", dept: "market-reyon", label: "Nilüfer", search: "nilüfer|nilufer" },
    { tip: "caglayan-lotus", dept: "market-reyon", label: "Lotus", search: "lotus" },
    { tip: "caglayan-nergis", dept: "market-reyon", label: "Nergis", search: "nergis" },
    { tip: "caglayan-lale", dept: "market-reyon", label: "Lale", search: "lale" },
    { tip: "caglayan-inci", dept: "market-reyon", label: "İnci", search: "inci" },
    { tip: "caglayan-hercai", dept: "market-reyon", label: "Hercai", search: "hercai" },
    { tip: "caglayan-reyhan", dept: "market-reyon", label: "Reyhan", search: "reyhan" },
    { tip: "caglayan-sardunya", dept: "market-reyon", label: "Sardunya", search: "sardunya" },
    { tip: "caglayan-gardenya", dept: "market-reyon", label: "Gardenya", search: "gardenya" },
    { tip: "caglayan-anemon", dept: "market-reyon", label: "Anemon", search: "anemon" },
    { tip: "caglayan-akasya", dept: "market-reyon", label: "Akasya", search: "akasya" },
    { tip: "caglayan-begonvil", dept: "market-reyon", label: "Begonvil", search: "begonvil|begonvıl" },
    { tip: "caglayan-defne", dept: "market-reyon", label: "Defne", search: "defne" },
    { tip: "caglayan-erguvan", dept: "market-reyon", label: "Erguvan", search: "erguvan" },
    { tip: "caglayan-leylak", dept: "market-reyon", label: "Leylak", search: "leylak" },
    { tip: "caglayan-manolya", dept: "market-reyon", label: "Manolya", search: "manolya" },
    { tip: "caglayan-krizantem", dept: "market-reyon", label: "Krizantem", search: "krizantem" },
    { tip: "soguk-teshir", dept: "market-reyon", label: "Soğuk Teşhir", search: "soguk-teshir|saladbar|salad bar|soğuk büfe|soguk bufe|büfe" },
    { tip: "dondurma-reyon", dept: "market-reyon", label: "Dondurma Reyonu", search: "dondurma-reyon|dondurma|freezer|frozen" },
    { tip: "balik-sarkuteri", dept: "market-reyon", label: "Balık & Şarküteri", search: "balik-sarkuteri|balık|balik|şarküteri|sarkuteri|sardunya|et|fish" },
    { tip: "camli-dolap", dept: "market-reyon", label: "Camlı Teşhir", search: "camli-dolap|camlı|camli|vitrin|teşhir buzdolab" },
    { tip: "set-ustu", dept: "market-reyon", label: "Set Üstü", search: "set-ustu|set üstü" },
    { tip: "self-servis", dept: "market-reyon", label: "Self Servis", search: "self-servis|self servis" },
    { tip: "icecek-vitrin", dept: "market-reyon", label: "İçecek & Süt", search: "icecek-vitrin|içecek|icecek|süt|sut|drink|milk" },
    { tip: "servis-gerecleri", dept: "set-ustu-mutfak", label: "Servis Gereçleri", search: "servis gereç" },
    { tip: "chafing-dish", dept: "set-ustu-mutfak", label: "Chafing Dishler", search: "chafing" },
    { tip: "helvane-sig-tencere", dept: "set-ustu-mutfak", label: "Helvane ve Sığ Tencereler", search: "helvane|sığ tencere" },
    { tip: "silindirik-tencere", dept: "set-ustu-mutfak", label: "Silindirik Tencereler", search: "silindirik tencere" },
    { tip: "kaserola-buharli", dept: "set-ustu-mutfak", label: "Kaçarola ve Buharlı Pişiriciler", search: "kaçarola|buharlı pişirici" },
    { tip: "tavalar", dept: "set-ustu-mutfak", label: "Tavalar", search: "tava" },
    { tip: "bakir-sunum", dept: "set-ustu-mutfak", label: "Bakır Sunum", search: "bakır sunum" },
    { tip: "dokum-tencere-tava", dept: "set-ustu-mutfak", label: "Döküm Tencere ve Tavalar", search: "döküm tencere|lava döküm" },
    { tip: "masaustu-ekipman", dept: "set-ustu-mutfak", label: "Masaüstü Ekipmanları", search: "masaüstü" },
    { tip: "gastronorm-kuvet", dept: "set-ustu-mutfak", label: "Gastronorm Küvetler", search: "gastronorm|gn küvet" },
    { tip: "pres-baski-tepsi", dept: "set-ustu-mutfak", label: "Pres Baskı Tepsiler", search: "pres baskı" },
    { tip: "tasima-ekipman", dept: "set-ustu-mutfak", label: "Taşıma Ekipmanları", search: "taşıma ekipman|servis arab" },
    { tip: "bain-marie-kap", dept: "set-ustu-mutfak", label: "Bain Marie Kapları", slug: "bain-marie-celik-saklama-kaplari" },
    { tip: "melamin-sunum", dept: "set-ustu-mutfak", label: "Melamin Sunum", search: "melamin sunum" },
    { tip: "karistirma-suzgec", dept: "set-ustu-mutfak", label: "Karıştırma Kapları", search: "karıştırma kap|süzgeç" },
    { tip: "pp-pc-gn", dept: "set-ustu-mutfak", label: "Polipropilen / Polikarbonat GN", search: "polipropilen|polikarbonat" },
    { tip: "kesme-tahtasi", dept: "set-ustu-mutfak", label: "Kesme Tahtaları", search: "kesme tahta" },
    { tip: "gurmeaid-bicak", dept: "set-ustu-mutfak", label: "Gurmeaid Bıçaklar", search: "gurmeaid.*bıçak" },
    { tip: "gurmeaid-aksesuar", dept: "set-ustu-mutfak", label: "Gurmeaid Aksesuarlar", search: "gurmeaid.*aksesuar" },
    { tip: "mutfak-aksesuar", dept: "set-ustu-mutfak", label: "Mutfak Aksesuarları", search: "mutfak aksesuar" },
    { tip: "sinek-oldurucu", dept: "set-ustu-mutfak", label: "Sinek Öldürücü", search: "sinek öldürücü" },
    { tip: "sicak-soguk-servis", dept: "set-ustu-mutfak", label: "Sıcak / Soğuk Servis", search: "sıcak.*soğuk servis" },
    { tip: "isitici-lamba", dept: "set-ustu-mutfak", label: "Isıtıcı Lambalar", search: "ısıtıcı lamba" },
    { tip: "patlamis-pamuk", dept: "set-ustu-mutfak", label: "Patlamış Mısır / Pamuk Şeker", search: "mısır patlatma|pamuk şeker" },
    { tip: "gastronorm-kuvet", dept: "kuvetler", label: "Gastronorm Küvetler", search: "gastronorm|gn küvet|gn kuvet" },
    { tip: "pp-pc-gn", dept: "kuvetler", label: "Polipropilen / Polikarbonat GN", search: "polipropilen|polikarbonat|pp gn" },
    {
      tip: "bain-marie-kap",
      dept: "kuvetler",
      label: "Bain Marie Çelik Saklama Kapları",
      slug: "bain-marie-celik-saklama-kaplari",
    },
    {
      tip: "karistirma-suzgec",
      dept: "kuvetler",
      label: "Karıştırma Kapları ve Süzgeçler",
      search: "karıştırma kap|karistirma kap|süzgeç|suzgec",
    },
  ];

  var byDept = {};
  var byTip = {};
  var labelIndex = {};

  /** Market reyon PLP — soğutmalı reyonlarda «Sıcak Teşhir» filtresi yok (eski geniş eşleşme SICAKLIK vb.). */
  var MARKET_REYON_HIDDEN_TIPS = { "sicak-teshir": true };

  function filterMarketReyonTiles(tiles) {
    return (tiles || []).filter(function (t) {
      return t && t.id && !MARKET_REYON_HIDDEN_TIPS[t.id];
    });
  }

  function parseKeys(row) {
    if (!row.search) return null;
    var s = row.search;
    return String(s)
      .split("|")
      .map(function (p) {
        return p.trim();
      })
      .filter(Boolean);
  }

  function toTile(row) {
    var tile = { id: row.tip, label: row.label };
    if (row.slug) tile.slug = row.slug;
    var keys = parseKeys(row);
    if (keys && keys.length) tile.keys = keys;
    return tile;
  }

  RAW.forEach(function (row) {
    var tile = toTile(row);
    byTip[row.dept + ":" + row.tip] = tile;
    if (!byDept[row.dept]) byDept[row.dept] = [];
    byDept[row.dept].push(tile);
    var lk = String(row.label || "")
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, " ")
      .trim();
    if (lk) {
      if (!labelIndex[row.dept]) labelIndex[row.dept] = {};
      labelIndex[row.dept][lk] = row.tip;
    }
  });

  function lc(s) {
    return String(s || "").toLocaleLowerCase("tr");
  }

  function productHaystack(u) {
    return (
      lc((u && u.n) || (u && u.name) || "") +
      " " +
      lc((u && u.b) || (u && u.brand) || "") +
      " " +
      lc((u && u.c) || (u && u.category) || (u && u.raw && u.raw.category) || "") +
      " " +
      lc((u && u.raw && u.raw.specs) || "")
    );
  }

  /**
   * Et kıyma makineleri soğutmalı olsa hazırlık kategorisindedir (kategori-kurallari-KILIT.txt).
   */
  function isEtKiymaProduct(u) {
    var hay = productHaystack(u);
    if (!hay) return false;
    if (/\b(kıyma|kiyma)\b/.test(hay) && /\b(makine|makinası|makinas|mincer|grinder)\b/.test(hay)) return true;
    if (/soğutmalı\s*kıyma|sogutmali\s*kiyma|soğutmalı\s*kiyma\s*mak|sogutmali\s*kiyma\s*mak/.test(hay)) return true;
    if (/\bkıyma\s*mak|\bkiyma\s*mak/.test(hay)) return true;
    return false;
  }

  /**
   * Servis & teşhir — sıcak büfe / ısıtıcı / benmari (kategori-kurallari-KILIT.txt).
   * Soğuk teşhir (balık, soğutmalı vitrin) bu kapsama girmez.
   */
  function productName(u) {
    return lc((u && u.n) || (u && u.name) || "").trim();
  }

  /**
   * Mutfak süzgeçleri (pişirme ocak kategorisinde yanlış sınıflanmış) — hazırlık/tezgah aksesuarı.
   * Sadece ürün adına bakılır; sıkma makinesi vb. açıklamadaki «süzgeç» eşleşmez.
   */
  function isSuzgecProduct(u) {
    var name = productName(u);
    if (!name) return false;
    if (name === "süzgeç" || name.indexOf("süzgeç tencere") === 0) return true;
    if (name.indexOf("süzgeç") === -1) return false;
    if (/sıkacağı|sıkma\s*presi|meyve\s*sık|portakal\s*sık|kokteyl|shaker/.test(name)) return false;
    if (/süzgeçli\s+huni|endüstriyel\s+süzgeç|mini\s+süzgeç|çelik\s+süzgeç/.test(name)) return true;
    if (/süzgeç\s+\d+\s*cm/.test(name)) return true;
    if (/süzgeç/.test(name) && /cm|çelik|bakır|huni|tencere/.test(name)) return true;
    return false;
  }

  /** Döküm tencere, süzgeç tencere vb. — pişirme ocak/fırın değil; yardımcı mutfak gereci. */
  function isMutfakTencereGereci(u) {
    var name = productName(u);
    if (!name || name.indexOf("tencere") === -1) return false;
    if (
      /makine|ocak|kuzine|kaynatma|doğrama|dograma|parçalama|parcalama|öğütücü|ogutucu|zırh|zirh|çorba|corba|soğan|sogan|çorbamatik|corbamatik|pres\b|firın\b|fırın\b|endüstriyel\s+kaynatma/.test(
        name
      )
    )
      return false;
    if (/fritöz\s*teli|fritoz\s*teli/.test(name)) return true;
    if (/döküm\s+.*tencere|dokum\s+.*tencere/.test(name)) return true;
    if (/^süzgeç\s+tencere|^suzgec\s+tencere/.test(name)) return true;
    if (/\b(mini|yayvan|oval|yuvarlak|sığ|sig|dikdörtgen|dikdortgen|helvane)\s+tencere\b/.test(name)) return true;
    if (/\btencere\b/.test(name) && /döküm|dokum|çelik|celik|demir|gurmeaid/.test(name)) return true;
    return false;
  }

  /** Oyacak / soyacak (Gurmeaid vb.) — el mutfak gereci. */
  function isOyacakSoyacakProduct(u) {
    var name = productName(u);
    if (!name) return false;
    return /\boyacak\b|\bsoyacak\b|\boyaç\b/.test(name);
  }

  /** Yer ızgarası (sifonlu zemin ızgarası) — pişirme ızgarası değil. */
  function isYerIzgaraProduct(u) {
    var name = productName(u);
    if (!name) return false;
    return /yer\s*ızgar|yer\s*izgar/i.test(name);
  }

  function productModelCode(u) {
    var raw = (u && u.raw) || u || {};
    return String(raw.model || raw.sku || u.model || u.sku || "")
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /** Atalay gerçek ızgara modelleri (AEI, AGI, ALI …). */
  function isAtalayGrillModelCode(model) {
    if (!model) return false;
    return /^(E\s+)?(AEI|AGI|AGL|AEGL|AEGI|AAIE|AAIG|ALI|ALIG|AAI[^MTKSB])([\s\-/]|$)/i.test(model);
  }

  /** PDF/Seri 600 — yanlış sanayi-tipi-izgaralar eşlemesini engelle. */
  function atalayPisirmeTipFromModel(u) {
    var m = productModelCode(u);
    if (!m) return "";
    if (/^ATKM[\s\-]?/.test(m)) return "cay-makineleri";
    if (/^ATM[\s\-]?/.test(m)) return "tost-makineleri";
    if (/^ADR-C/.test(m)) return "adr-seri-doner-robotu";
    if (/^ADG|^ADE|^ADGC/.test(m)) return "doner-ocaklari-";
    if (/^ATA[\s\-]|^ADTA/.test(m)) return "taban-raflari";
    if (/^AKF|^ABA/.test(m)) return "banket-arabalari";
    if (/^APFM|^ABS\s/.test(m)) return "firinlar";
    if (/^AST[\s\-]|^E\s+AST/.test(m)) return "dolaplar-ve-taban-raflari-ara-tezgahlar";
    if (/^AAT[\s\-]|^E\s+AAT/.test(m)) return "dolaplar-ve-taban-raflari-ara-tezgahlar";
    if (/^AYOG|^AGO[\s\-]|^E\s+AGO|^AEO[\s\-]|^E\s+AEO|^AYOE/.test(m)) return "ocaklar";
    if (/^AMPG[\s\-]|^E\s+AMP|^AMP[\s\-]/.test(m)) return "makarna-hafllamalar";
    if (/^AEF[\s\-]|^E\s+AEF/.test(m)) return "fritozler";
    if (/^APD[\s\-]|^E\s+APD/.test(m)) return "patates-dinlendirme";
    if (/^APF[\s\-]/.test(m)) return "pizza-firinlari";
    if (/^APMG|^APME/.test(m)) return "pilic-cevirme-makineleri";
    if (/^AWMC|^AWM[\s\-]/.test(m)) return "waffle-krep-makineleri";
    if (/^ADTG|^ADTE[\s\-]/.test(m)) return "devrilir-tava";
    if (/^ADTS|^ADSA|^ADSK|^ADKM|^AKC[\s\-]|^AKA[\s\-]/.test(m)) return "yardimci-ekipmanlar";
    if (/^AKTE|^AKTG|^AKIE|^AKEK|^AYEK[\s\-]/.test(m)) return "kaynatma-tenceresi";
    if (/^AKE[\s\-]/.test(m)) return "dolaplar-ve-taban-raflari-ara-tezgahlar";
    if (/^ATN[\s\-]|^ATI[\s\-]|^ATIA|^ASA[\s\-]/.test(m)) return "taban-raflari";
    if (/^ACIE/.test(m)) return "ocakbasi-izgara";
    if (/^GN[\s\-/]|^E\s+GN/.test(m)) return "benmariler";
    if (/^ASBM|^ASSB|^ASB|^E\s+ASB/.test(m)) return "benmariler";
    if (/^ASM[\s\-]/.test(m)) return "benmariler";
    return "";
  }

  function isExcludedFromSanayiIzgaraTile(u) {
    var alt = atalayPisirmeTipFromModel(u);
    if (alt && alt !== "sanayi-tipi-izgaralar") return true;
    var hay = productHaystack(u);
    if (/tost\s*mak|\batm[\s\-]?\d|çay\s*mak|cay\s*mak|türk\s*kahve|turk\s*kahve/i.test(hay)) return true;
    if (/döner\s*mak|doner\s*mak|döner\s*kalıp|doner\s*kalip/i.test(hay)) return true;
    if (/tepsi\s*taşı|tepsi\s*tasi|taşıma\s*arab|tasima\s*arab|istif\s*raf/i.test(hay)) return true;
    if (/banket|kumpir\s*fır|kumpir\s*fir/i.test(hay)) return true;
    if (/makarna\s*piş|makarna\s*pis|ara\s*tezgah|nötr\s*ara|notr\s*ara/i.test(hay)) return true;
    if (/waffle|krep\s*mak|benmari|bain\s*marie|pizza\s*fır|pizza\s*fir/i.test(hay)) return true;
    if (/devrilir\s*tava|kaynatma\s*tencere|piliç\s*çevir|pilic\s*cevir/i.test(hay)) return true;
    if (/servis\s*arab|ısıtmalı\s*tabak|isitmali\s*tabak|tabak\s*lıft|tabak\s*lift/i.test(hay)) return true;
    var cat = productCategorySlug(u);
    var model = productModelCode(u);
    if (cat === "sanayi-tipi-izgaralar" && model && !isAtalayGrillModelCode(model)) return true;
    if (cat === "ocaklar" && model && !/^AYOG|^AGO|^AEO|^AYOE|^E AGO|^E AEO|^AIO|^ACAG|^AMAY/i.test(model))
      return true;
    return false;
  }

  /** Döküm/servis tava & tepsi — fırın kapasitesi (N tepsi 600×400) hariç. */
  function isMutfakTavaServisTepsi(u) {
    var name = productName(u);
    if (!name) return false;
    if (isYerIzgaraProduct(u)) return true;
    if (/\d+\s*tepsi\s*(\*|x|×|600)|tepsi\s*\d+\s*(\*|x|×)|\(\d+\s*tepsi\)/i.test(name)) return false;
    if (/bakertop|konveksiyon|kombi\s*fırın|kombi\s*firin|mayalama\s*dolab|fırın\s*kapasite/i.test(name) && /tepsi/i.test(name))
      return false;
    if (/döküm.*tava|dokum.*tava|izgara\s*tavası|izgara\s*tava|wok\s*tava|mini\s*ızgara\s*tava/i.test(name)) return true;
    if (/gastrolley.*tepsi|servis\s*tepsi|self\s*servis\s*tepsi|servis\s*tepsisi/i.test(name)) return true;
    if (/\btepsi\b/i.test(name) && !/ocak|fırın|firin|unox|bongard|ekmek|kombi/i.test(name)) return true;
    return false;
  }

  /** Süzgeç, döküm tencere, oyacak/soyacak, tava — yardımcı (pişirme vitrininde değil). Yer ızgarası → yıkama. */
  function isYardimciEkipmanProduct(u) {
    return (
      isSuzgecProduct(u) ||
      isMutfakTencereGereci(u) ||
      isOyacakSoyacakProduct(u) ||
      isMutfakTavaServisTepsi(u)
    );
  }

  /**
   * Buz makineleri soğutma departmanına aittir; içecek vitrininde gösterilmez.
   */
  function isBuzMakinesiProduct(u) {
    var hay = productHaystack(u);
    if (!hay) return false;
    var c = lc((u && u.c) || (u && u.category) || "");
    if (c === "icecek-berrak-buz-makineleri") return true;
    if (/\bbuz\s*makin/.test(hay)) return true;
    if (/\bice\s*maker\b|\bice\s*machine\b/.test(hay)) return true;
    return false;
  }

  /** İzolasyonlu buz konteyneri — buz makinesi aksesuarı; soğutma PLP / marka buzdolabı vitrininde gösterme */
  function isBuzKonteynerProduct(u) {
    var hay = productHaystack(u);
    if (!hay) return false;
    if (/\bbuz\s*konteyner|insulated\s*ice\s*container\b/i.test(hay)) return true;
    var kod = String((u && u.raw && u.raw.urun_kodu) || (u && u.sku) || (u && u.model) || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (/^8959\.BK|^7506\.0B390/i.test(kod)) return true;
    return false;
  }

  /** Panel / split tip soğuk oda — Öztiryakiler marka filtresinde değil; ?tip=soguk-oda */
  function isSogukOdaProduct(u) {
    var cat = productCategorySlug(u);
    if (cat === "soguk-oda") return true;
    var hay = productHaystack(u);
    if (/\bsoğuk\s*oda\b|\bsoguk\s*oda\b|\bcold\s*room\b/i.test(hay)) return true;
    var kod = String((u && u.raw && u.raw.urun_kodu) || (u && u.sku) || (u && u.model) || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (/^7919\.CR/i.test(kod)) return true;
    return false;
  }

  /** Servis rafı aksesuarı — Excel «TEZGAH TİPİ SOĞUTUCULAR» altında yanlış sınıflanmış */
  function isOztiServisRafiProduct(u) {
    var name = productName(u);
    if (!name || !/servis\s*raf/.test(name)) return false;
    var kod = String((u && u.raw && u.raw.urun_kodu) || (u && u.sku) || (u && u.model) || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    if (/^7897\.\d+30\./.test(kod)) return true;
    if (/servis\s*raf/.test(name)) return true;
    return false;
  }

  function isServisTeshirProduct(u) {
    var hay = productHaystack(u);
    if (!hay) return false;
    var isHot =
      /\b(ısıt|isit|sıcak|sicak|nemlendir|benmari|bain\s*marie|chafing|yemeklik)\b/.test(hay);
    var isCold =
      /\b(soğutmalı|sogutmali|buzdolab|derin\s*dondurucu|şok\s*soğut|sok\s*sogut|blast\s*chill|freezer)\b/.test(
        hay
      ) && !isHot;
    if (isCold && !/\bbalık\s*teşhir\b|\bbalik\s*teshir\b/.test(hay)) {
      if (!/\b(ısıt|isit|nemlendir)\b/.test(hay)) return false;
    }
    if (/\bpili[cç]\b/.test(hay) && /\b(ısıt|isit|nemlendir)\b/.test(hay)) return true;
    if (/\bnemlendir(meli)?\b/.test(hay) && /\b(ısıt|isit)\b/.test(hay)) return true;
    if (/\bsıcak\s*teşhir|\bsicak\s*teshir|\bısıtmalı\s*teşhir|\bisitmali\s*teshir/.test(hay)) return true;
    if (/\bbenmari\b|\bbain\s*marie\b|\bchafing\b/.test(hay)) return true;
    if (/\bservis\s*(ünitesi|unitesi|hattı|hatti|bankosu|banko)\b/.test(hay)) return true;
    if (/\bset\s*üstü\b|\bset\s*ustu\b/.test(hay) && isHot && !/\b(buzdolab|soğut|sogut|dondur)\b/.test(hay))
      return true;
    if (/\byemeklik\b/.test(hay) && /\b(ısıt|isit)\b/.test(hay)) return true;
    if (/\btabak\s*(ısıt|isit)|\bdish\s*warmer\b/.test(hay)) return true;
    if (/\bsalad\s*bar\b|\bsaladbar\b|\bsoğuk\s*büfe\b|\bsoguk\s*bufe\b/.test(hay)) {
      if (/\b(ısıt|isit|benmari|chafing)\b/.test(hay) && !/\bsoğuk\b|\bsoguk\b/.test(hay)) return false;
      var d = lc((u && u.raw && u.raw.dept) || (u && u.dept) || "");
      var cat = lc((u && u.c) || (u && u.raw && u.raw.category) || (u && u.category) || "");
      if (d === "market-reyon" || cat === "market-reyonlari") return true;
    }
    return false;
  }

  var DEPT_PLP_IDS = [
    "pisirme",
    "sogutma",
    "kahve",
    "yikama",
    "hazirlik",
    "icecek",
    "tezgah",
    "dolap",
    "davlumbaz",
    "tasima",
    "araba",
    "istif",
  ];

  /** Departman vitrininde gösterme (JSON category farklı olsa bile). */
  function isOztiBainMarieKapRow(u) {
    var cat = productCategorySlug(u);
    if (cat === "bain-marie-celik-saklama-kaplari") return true;
    var hay = productHaystack(u);
    if (/bain\s*marie\s*(kapak|kuvet|küvet)/.test(hay)) return true;
    return false;
  }

  function isOztiBainMarieMachineRow(u) {
    if (isOztiBainMarieKapRow(u)) return false;
    var hay = productHaystack(u);
    if (/kaplar\s*haric/.test(hay) && /bain\s*marie/.test(hay)) return true;
    if (/set\s*ustu\s*bain\s*marie/.test(hay)) return true;
    if (/hareketli\s*bain\s*marie/.test(hay)) return true;
    var cat = productCategorySlug(u);
    if (/elektrikli-bain|gazli-elektrikli-bain|hareketli-bain|setustu-bain/.test(cat)) return true;
    return false;
  }

  /** Döner ocakları — pişirme dept (set üstü vitrininde gösterme) */
  function isOztiSetUstuDonerRow(u) {
    var hay = productHaystack(u);
    if (/doner\s*ocag|doner\s*ocagi|doner\s*makin|doner\s*kebap/i.test(hay)) return true;
    var cat = productCategorySlug(u);
    if (/doner-makin|doner-ocak/.test(cat)) return true;
    return false;
  }

  /** ARABALAR / et askı arabası — taşıma dept (set üstü vitrininde gösterme) */
  function isOztiSetUstuArabaRow(u) {
    var hay = productHaystack(u);
    if (/et\s*aski\s*arab|tabak\s*tasima\s*arab|yuk\s*tasima\s*arab/.test(hay)) return true;
    var cat = productCategorySlug(u);
    if (cat === "arabalar" || /et-aski-arab|servis-arab|banket-arab/.test(cat)) return true;
    return false;
  }

  /** Kahve PLP'de gösterilmemeli — İçecek dept (çay makinası / çay kazanı). */
  function isOztiCayNotKahveProduct(u) {
    var raw = (u && u.raw) || u || {};
    var kod = String(raw.urun_kodu || raw.sku || raw.model || "")
      .replace(/\s+/g, "")
      .toUpperCase();
    var hay = productHaystack(u);
    if (/^8574\.CM/i.test(kod)) return true;
    if (/^8573\./.test(kod) && !/^8573\.000/.test(kod)) return true;
    if (/^8573\.000/.test(kod)) return true;
    if (/çay\s*mak|cay\s*mak/.test(hay)) return true;
    if (/çay\s*kazan|cay\s*kazan/.test(hay)) return true;
    if (/kahveci\s*deml/.test(hay)) return true;
    return false;
  }

  function excludeFromDeptView(dept, u) {
    if (dept === "kahve" && isOztiCayNotKahveProduct(u)) return true;
    if (dept === "sogutma" && isEtKiymaProduct(u)) return true;
    if (dept === "sogutma" && (isOztiServisRafiProduct(u) || isBuzKonteynerProduct(u))) return true;
    if (dept === "pisirme" && (isYardimciEkipmanProduct(u) || isYerIzgaraProduct(u))) return true;
    if (dept === "icecek" && isBuzMakinesiProduct(u)) return true;
    if (dept === "set-ustu-mutfak" && isOztiBainMarieMachineRow(u)) return true;
    if (dept === "set-ustu-mutfak" && isOztiSetUstuArabaRow(u)) return true;
    if (dept === "set-ustu-mutfak" && isOztiSetUstuDonerRow(u)) return true;
    if (isServisTeshirProduct(u) && DEPT_PLP_IDS.indexOf(String(dept || "")) >= 0) return true;
    return false;
  }

  /** Mutbex/Cafemarkt: önce vitrin tipi, sonra slug — alfabetik değil. */
  var DONER_CAT_SLUGS = {
    "doner-ocaklari-": true,
    "doner-ocaklari": true,
    "doner-makineleri": true,
    "doner-makineleri-duvara-monte": true,
    "compact-seri-doner-robotu": true,
    "adr-seri-doner-robotu": true,
  };

  /** Öztiryakiler soğutma — Excel kategori slug → ?tip= (buz makinesi satırları) */
  var SOGUTMA_CAT_ALIASES = {
    "buz-makineleri": "buz-makinesi",
    "icecek-berrak-buz-makineleri": "buz-makinesi",
    "soguk-odalar": "soguk-oda",
  };

  /** Eski build: Türkçe slugify bozuk category → kanonik ?tip= */
  /** Öztiryakiler yıkama — Excel kategori slug → ?tip= (makine satırları) */
  var YIKAMA_CAT_ALIASES = {
    "setalti-bulasik": "setalti-bulasik",
    "konveyorlu-bulasik": "konveyorlu-bulasik",
    "giyotin-bulasik": "giyotin-bulasik",
    "tirnakli-bulasik": "tirnakli-bulasik",
    "kazan-yikama": "kazan-yikama",
    "bulasik-makineleri": "bulasik-makineleri",
    "bardak-yikama": "bardak-yikama",
    "bulasik-makinesi-giris-ve-cikis-tezgahlari": "bulasik-makinesi-giris-ve-cikis-tezgahlari",
    "calisma-tezgahlari-bulasik-makinesi-tezgahlari": "calisma-tezgahlari-bulasik-makinesi-tezgahlari",
    "calisma-tezgahlari-siyirma-hunili-bulasik-alma-tezgahi":
      "calisma-tezgahlari-siyirma-hunili-bulasik-alma-tezgahi",
    "el-yikama-evyeleri": "el-yikama-evyeleri",
  };

  /** «Bulaşık Yıkama Makineleri» üst filtresi — tezgah/evye hariç makine tipleri */
  var BULASIK_MAKINE_GROUP = {
    "setalti-bulasik": true,
    "giyotin-bulasik": true,
    "konveyorlu-bulasik": true,
    "flight-bulasik": true,
    "tirnakli-bulasik": true,
    "bulasik-makineleri": true,
  };

  var YIKAMA_STRICT_CAT = {
    "bardak-yikama": true,
    "setalti-bulasik": true,
    "giyotin-bulasik": true,
    "konveyorlu-bulasik": true,
    "flight-bulasik": true,
    "tirnakli-bulasik": true,
    "kazan-yikama": true,
    "bulasik-makineleri": true,
    "bulasik-makinesi-giris-ve-cikis-tezgahlari": true,
    "calisma-tezgahlari-bulasik-makinesi-tezgahlari": true,
    "calisma-tezgahlari-siyirma-hunili-bulasik-alma-tezgahi": true,
    "el-yikama-evyeleri": true,
  };

  function isYikamaProduct(u) {
    return !!(u && u.raw && u.raw.dept === "yikama");
  }

  var SET_USTU_CAT_ALIASES = {
    "servis-gere-leri": "servis-gerecleri",
    "servis-gere-leri-dondurma-makaslar": "servis-gerecleri",
    "gn-servis-tepsileri": "gastronorm-kuvet",
    "silindirik-tencereler": "silindirik-tencere",
    "silindirik-tencere-kapaklar": "silindirik-tencere",
    "buharl-pi-iriciler": "kaserola-buharli",
    "gurmea-d-profesyonel-b-aklar": "gurmeaid-bicak",
    "aksesuarlar": "mutfak-aksesuar",
    "bar-aksesuarlar": "mutfak-aksesuar",
    "bar-aksesuarlar-tepsiler": "mutfak-aksesuar",
    "arabalar": "tasima-ekipman",
    "banket-arabalar": "tasima-ekipman",
    "ta-ma-ekipmanlar": "tasima-ekipman",
    "ta-ma-ekipmanlar-yemek-ta-ma-kaplar": "tasima-ekipman",
    "ok-ama-l-arabalar": "tasima-ekipman",
    "ok-ama-l-arabalar-katl-tabak-arabalar": "tasima-ekipman",
    "ok-ama-l-arabalar-plate-mate-katl-tabak-arabalar": "tasima-ekipman",
    "ok-ama-l-arabalar-termo-k-l-f": "tasima-ekipman",
    "delikli-gastronom-k-vetler": "gastronorm-kuvet",
    "sinek-ld-r-c-cihazlar": "sinek-oldurucu",
    "kombi-konveksiyonlu-f-r-n-aksesuarlar": "mutfak-aksesuar",
    "kombi-konveksiyonlu-firin-aksesuarlar": "mutfak-aksesuar",
    "gurmeaid-profesyonel-bicaklar": "gurmeaid-bicak",
    "banket-arabalari": "tasima-ekipman",
    "cok-amacli-arabalar": "tasima-ekipman",
    "cok-amacli-arabalar-katli-tabak-arabalari": "tasima-ekipman",
    "cok-amacli-arabalar-plate-mate-katli-tabak-arabalari": "tasima-ekipman",
    "cok-amacli-arabalar-termo-kilif": "tasima-ekipman",
    "delikli-gastronom-kuvetler": "gastronorm-kuvet",
    "bar-aksesuarlari": "mutfak-aksesuar",
    "bar-aksesuarlari-tepsiler": "mutfak-aksesuar",
  };

  /** Öztiryakiler küvet PLP — JSON category → vitrin ?tip= */
  var KUVET_CAT_TIP = {
    "gastronom-kuvetler": "gastronorm-kuvet",
    kuvet: "gastronorm-kuvet",
    "standart-gastronorm-kuvetler": "gastronorm-kuvet",
    "kose-desenli-gastronorm-kuvetler": "gastronorm-kuvet",
    "gastronorm-kapaklar": "gastronorm-kuvet",
    "delikli-gastronom-kuvetler": "gastronorm-kuvet",
    "delikli-kose-desenli-gastronorm-kuvetler": "gastronorm-kuvet",
    "gn-kuvetler-yapismaz-kaplamali": "gastronorm-kuvet",
    "sapli-gastronorm-kuvetler": "gastronorm-kuvet",
    "sapli-kose-desenli-gastronorm-kuvetler": "gastronorm-kuvet",
    "polipropilen-gastronorm-kuvetler": "pp-pc-gn",
    "polikarbonat-gastronorm-kuvetler": "pp-pc-gn",
    "bain-marie-celik-saklama-kaplari": "bain-marie-kap",
    "karistirma-kaplari-ve-suzgecler": "karistirma-suzgec",
    "helvane-ve-sig-tenceler-celik-suzgecler": "karistirma-suzgec",
  };

  function kuvetTipForCategory(cat) {
    if (KUVET_CAT_TIP[cat]) return KUVET_CAT_TIP[cat];
    var alias = SET_USTU_CAT_ALIASES[cat];
    if (alias && byTip["kuvetler:" + alias]) return alias;
    return "";
  }

  function productCategorySlug(u) {
    var c = (u && u.c) || (u && u.category) || (u && u.raw && u.raw.category) || "";
    if (SOGUTMA_CAT_ALIASES[c]) return SOGUTMA_CAT_ALIASES[c];
    if (YIKAMA_CAT_ALIASES[c]) return YIKAMA_CAT_ALIASES[c];
    if (SET_USTU_CAT_ALIASES[c]) return SET_USTU_CAT_ALIASES[c];
    return c;
  }

  /** Gastronorm küvet, GN kapak ve ilgili saklama ürünleri (buzdolabı/bain marie makinesi hariç). */
  function isKuvetProduct(u) {
    if (!u) return false;
    var c = productCategorySlug(u);
    if (c === "gastronom-kuvetler" || c === "kuvet") return true;
    if (
      c === "kombi-konveksiyonlu-firin-aksesuarlar" ||
      c === "kombi-konveksiyonlu-f-rin-aksesuarlar"
    ) {
      var tEarly = productHaystack(u);
      if (!/küvet|kuvet|gastronom|gn\s*\d|bain\s*marie\s*kapak/i.test(tEarly)) return false;
    }
    var t = productHaystack(u);
    if (/buzdolab|buz dolab|donduruc|soğuk oda/.test(t) && !/küvet(?!li)|kuvet(?!li)/.test(t)) return false;
    if (/bain\s*marie|bainmarie|küvetli|kuvetli|küvetsiz|kuvetsiz|küvet\s*kapasiteli|kuvet\s*kapasiteli/i.test(t)) return false;
    if (/küvet\s*ta[sş]|kuvet\s*ta[sş]|banket\s*arab.*kapasiteli/i.test(t)) return false;
    if (/benmari/i.test(t) && !/gastronom\s*küvet|gastronom\s*kuvet/i.test(t)) return false;
    if (/küvet\s*kapak|kuvet\s*kapak/i.test(t)) return true;
    if (/küvet(?!li)|kuvet(?!li)/.test(t)) return true;
    if (/gastronom(?!\s*seri)/.test(t)) return true;
    if (/\bgn\s*\d{1,2}\s*\/\s*\d{1,2}/.test(t)) return true;
    if (isOztiBainMarieKapRow(u)) return true;
    if (c === "bain-marie-celik-saklama-kaplari") return true;
    if (/polipropilen|polikarbonat|pp\s*gn/.test(t)) return true;
    if (/karıştırma kap|karistirma kap|süzgeç|suzgec/.test(t)) return true;
    return false;
  }

  /** Asansörlü ızgara = salamander (üst ızgara); lavta/char/endüstriyel ızgara değil. */
  function isSalamanderProduct(u) {
    var cat = productCategorySlug(u);
    if (cat === "salamander") return true;
    var hay = productHaystack(u);
    if (!hay) return false;
    if (
      /salat\s*bar.*asans|asans.*salat\s*bar|sicak\s*tutucu\s*lamba|ısıtıcı\s*lamba.*asans|isitici\s*lamba.*asans|krep\s*mak|waffle/.test(
        hay
      ) &&
      !/\bsalamander\b/.test(hay)
    ) {
      return false;
    }
    if (/\bsalamander\b/.test(hay)) return true;
    if (/\bgratin\b|\bgratinator\b|\bbroiler\b/.test(hay) && !/\bfırın\b|\bfirin\b|\bkuzine\b/.test(hay)) return true;
    if (/üst\s*ızgara|ust\s*izgara|overhead\s*grill|elevator\s*grill/.test(hay)) return true;
    var kod = String(
      (u && u.raw && u.raw.urun_kodu) ||
        (u && u.raw && u.raw.sku) ||
        (u && u.sku) ||
        (u && u.raw && u.raw.model) ||
        ""
    )
      .replace(/\s+/g, "")
      .toUpperCase();
    if (/^7850\.(58575|N1\.58575)/.test(kod)) return true;
    return false;
  }

  function tezgahStructureMatch(u, tileId) {
    var hay = productHaystack(u);
    var cat = productCategorySlug(u);
    var blob = hay + " " + cat;
    var hasTabanRaf = /taban[\s\-_]*raf|taban-raf/.test(blob) && !/taban[\s\-_]*rafsiz|taban-rafsiz/.test(blob);
    var hasAraRaf = /ara[\s\-_]*raf|ara-raf/.test(blob);
    var hasDolap =
      /\bdolapli\b|dolaplı|setalti-dolap|set-alti-dolap|aratezgah-ve-dolap|dolapli-calisma/.test(blob);
    if (tileId === "dolapli-tezgah") return hasDolap;
    if (tileId === "taban-ve-ara-rafli") return hasTabanRaf && hasAraRaf && !hasDolap;
    if (tileId === "taban-rafli") return hasTabanRaf && !hasAraRaf && !hasDolap;
    return false;
  }

  function isOcakVitriniProduct(u) {
    if (!u) return false;
    if (isSuzgecProduct(u) || isMutfakTencereGereci(u) || isOyacakSoyacakProduct(u)) return false;
    var cat = productCategorySlug(u);
    if (cat && /ocak|kuzine|wok|induksiyon|indüksiyon/.test(cat)) return true;
    var hay = productHaystack(u);
    if (/fırın|firin|fritöz|fritoz|salamander|tost\s*mak|benmari|bain\s*marie/.test(hay)) {
      if (!/ocak|kuzine|wok|indüksiyon|induksiyon/.test(hay)) return false;
    }
    return /ocak|kuzine|wok|indüksiyon|induksiyon|set üstü ocak|setustu ocak|döner ocak|doner ocak/.test(hay);
  }

  function tileMatchProduct(u, tile) {
    if (!tile) return false;
    if (tile.id === "ocak-vitrini") return isOcakVitriniProduct(u);
    if (isSogukOdaProduct(u)) return tile.id === "soguk-oda";
    var cat = productCategorySlug(u);

    if (tile.id === "taban-rafli" || tile.id === "taban-ve-ara-rafli" || tile.id === "dolapli-tezgah") {
      return tezgahStructureMatch(u, tile.id);
    }

    if (tile.id === "asansorlu-izgara" || tile.id === "salamander") {
      return isSalamanderProduct(u);
    }

    if (
      (tile.id === "sanayi-tipi-izgaralar" || tile.slug === "sanayi-tipi-izgaralar") &&
      isExcludedFromSanayiIzgaraTile(u)
    ) {
      return false;
    }

    if (tile.id === "bain-marie-kap") {
      return isOztiBainMarieKapRow(u);
    }

    if (tile.id === "tezgah-tipi-buzdolabi" && isOztiServisRafiProduct(u)) return false;
    if (tile.id === "buz-makinesi" && isBuzKonteynerProduct(u)) return false;
    if (
      (tile.id === "dik-tip-buzdolap" ||
        tile.id === "tezgah-tipi-buzdolabi" ||
        tile.id === "derin-dondurucu") &&
      (isOztiServisRafiProduct(u) || isBuzKonteynerProduct(u))
    ) {
      return false;
    }

    var kuvetTip = kuvetTipForCategory(cat);
    if (kuvetTip) return tile.id === kuvetTip;

    if (isYikamaProduct(u) && cat && YIKAMA_STRICT_CAT[cat]) {
      if (tile.id === "bulasik-makineleri") return !!BULASIK_MAKINE_GROUP[cat];
      return tile.id === cat;
    }

    if (tile.id && cat === tile.id) return true;
    if (tile.slug === "doner-ocaklari-" && DONER_CAT_SLUGS[u.c]) return true;
    if (tile.slug && (cat === tile.slug || u.c === tile.slug || u.category === tile.slug)) return true;
    if (tile.keys && tile.keys.length) {
      var hay = productHaystack(u);
      for (var ki = 0; ki < tile.keys.length; ki++) {
        if (hay.indexOf(lc(tile.keys[ki])) !== -1) return true;
      }
    }
    if (tile.id && u.raw && u.raw.tileId === tile.id) return true;
    if (tile.id === "proso-tumu" && u.raw && u.raw.kaynak === "prosogutma") return true;
    if (tile.id === "caglayan-tumu" && u.raw && u.raw.kaynak === "caglayan-refrigeration") return true;
    return false;
  }

  function productRank(dept, u) {
    var tiles = byDept[dept] || [];
    for (var i = 0; i < tiles.length; i++) {
      if (tileMatchProduct(u, tiles[i])) return i;
    }
    return 1e6;
  }

  function hashDeptSeed(str) {
    var h = 2166136261;
    var s = String(str || "");
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function deptRng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  /** Departman + tuz ile kararlı karışık sıra (sayfalama/filtre tutarlı). */
  function shuffleDeptList(dept, list, salt) {
    var arr = list.slice();
    var rnd = deptRng(hashDeptSeed(dept + ":" + (salt || "products")));
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  /** Kahve: espresso → değirmen → filtre → türk; yıkama: bulaşık makineleri önce; diğerleri karışık. */
  function sortProductsDefault(dept, list) {
    if (dept === "kahve" || dept === "yikama") {
      return list.slice().sort(function (a, b) {
        var ra = productRank(dept, a);
        var rb = productRank(dept, b);
        if (ra !== rb) return ra - rb;
        if (dept === "yikama") {
          var ba = lc(a.c) === "bulasik-makineleri" ? 0 : 1;
          var bb = lc(b.c) === "bulasik-makineleri" ? 0 : 1;
          if (ba !== bb) return ba - bb;
        }
        return String(a.n || "").localeCompare(String(b.n || ""), "tr");
      });
    }
    return shuffleDeptList(dept, list, "products");
  }

  /** Vitrin sırası önce (Mutbex menü), sayfa tile'ları sonra. */
  function mergeTiles(dept, catalogTiles) {
    var out = [];
    var seen = {};
    (byDept[dept] || []).forEach(function (t) {
      if (t && t.id && !seen[t.id]) {
        out.push(t);
        seen[t.id] = true;
      }
    });
    (catalogTiles || []).forEach(function (t) {
      if (t && t.id && !seen[t.id]) {
        out.push(t);
        seen[t.id] = true;
      }
    });
    if (dept === "kahve" || dept === "yikama" || dept === "tezgah") return out;
    if (dept === "market-reyon") return filterMarketReyonTiles(shuffleDeptList(dept, out, "tiles-merge"));
    return shuffleDeptList(dept, out, "tiles-merge");
  }

  function tile(dept, tipId) {
    return byTip[dept + ":" + tipId] || null;
  }

  function tilesFor(dept) {
    var tiles = byDept[dept] || [];
    if (dept === "kahve" || dept === "yikama" || dept === "tezgah") return tiles.slice();
    if (dept === "market-reyon") return filterMarketReyonTiles(shuffleDeptList(dept, tiles, "tiles"));
    return shuffleDeptList(dept, tiles, "tiles");
  }

  function resolveTipId(dept, label) {
    if (!dept || !label) return "";
    var lk = String(label)
      .toLocaleLowerCase("tr")
      .replace(/\s+/g, " ")
      .trim();
    var idx = labelIndex[dept];
    if (idx && idx[lk]) return idx[lk];
    if (lk.indexOf("tost") >= 0 || /\batm[\s-]?\d/.test(lk)) return "tost-makineleri";
    if (/\batkm[\s-]?\d/.test(lk) || (lk.indexOf("çay") >= 0 && lk.indexOf("mak") >= 0)) return "cay-makineleri";
    if (lk.indexOf("döner") >= 0 || lk.indexOf("doner") >= 0) return "doner-ocaklari-";
    if (/\badr-c\d/.test(lk)) return "adr-seri-doner-robotu";
    if (/\bast[\s-]?\d/.test(lk) && lk.indexOf("izgara") < 0) return "dolaplar-ve-taban-raflari-ara-tezgahlar";
    if ((/\bayog|\bago[\s-]?\d|\baeo[\s-]/).test(lk) && lk.indexOf("izgara") < 0) return "ocaklar";
    if (/\bamp[\s-]?\d|makarna\s*piş|makarna\s*pis/.test(lk)) return "makarna-hafllamalar";
    if (/\baat[\s-]?\d|ara\s*tezgah/.test(lk)) return "dolaplar-ve-taban-raflari-ara-tezgahlar";
    if (/\bgn\s+\d|\bgn\s*1\//.test(lk)) return "benmariler";
    if (/\bapf[\s\-]|pizza\s*fır|pizza\s*fir/.test(lk)) return "pizza-firinlari";
    if (/\bawmc|waffle|krep\s*mak/.test(lk)) return "waffle-krep-makineleri";
    if (/\badtg|\badte[\s\-]|devrilir\s*tava/.test(lk)) return "devrilir-tava";
    if (/\bakte|kaynatma\s*tencere/.test(lk)) return "kaynatma-tenceresi";
    if (/\bapmg|piliç\s*çevir|pilic\s*cevir/.test(lk)) return "pilic-cevirme-makineleri";
    if (/\batn[\s\-]|\bati[\s\-]|ısıtmalı|isitmali|servis\s*arab/.test(lk)) return "taban-raflari";
    if (/\badsa|\badsk|\bakc[\s\-]|yardımcı|yardimci/.test(lk)) return "yardimci-ekipmanlar";
    if (/benmari|bain\s*marie/.test(lk)) return "benmariler";
    if (
      lk.indexOf("taşıma") >= 0 ||
      lk.indexOf("tasima") >= 0 ||
      lk.indexOf("tepsi taşı") >= 0 ||
      lk.indexOf("banket") >= 0 ||
      /\badta\b/.test(lk) ||
      (/\bata\b/.test(lk) && lk.indexOf("izgara") < 0)
    )
      return lk.indexOf("banket") >= 0 || lk.indexOf("kumpir") >= 0
        ? "banket-arabalari"
        : "taban-raflari";
    if (lk.indexOf("ızgara") >= 0 || lk.indexOf("izgara") >= 0) {
      if (/istif\s*raf|izgara\s*tabl|4\s*izgara\s*tabl/.test(lk)) return "taban-raflari";
      if (lk.indexOf("ocakbaşı") >= 0 || lk.indexOf("ocakbasi") >= 0) return "ocakbasi-izgara";
      if (lk.indexOf("lavta") >= 0) return "lavtasli_izgara";
      if (lk.indexOf("char") >= 0) return "char_izgara";
      if (!/\b(aei|agi|ali|aaie|aaig|agl|aegl)\b/.test(lk)) return "";
      return "sanayi-tipi-izgaralar";
    }
    if (lk.indexOf("fırın") >= 0 || lk.indexOf("firin") >= 0) return "firinlar";
    if (lk.indexOf("ocak") >= 0 && lk.indexOf("döner") < 0 && lk.indexOf("doner") < 0) return "sanayi-ocaklari";
    if (lk.indexOf("fritöz") >= 0 || lk.indexOf("fritoz") >= 0) return "fritozler";
    if (lk.indexOf("kuzine") >= 0) return "kuzineler";
    if (lk.indexOf("piliç") >= 0 || lk.indexOf("pilic") >= 0) return "pilic-cevirme-makineleri";
    if (lk.indexOf("buzdolab") >= 0 && lk.indexOf("tezgah") >= 0) return "tezgah-tipi-buzdolabi";
    if (lk.indexOf("bulaşık") >= 0 || lk.indexOf("bulasik") >= 0) return "bulasik-makineleri";
    if (lk.indexOf("espresso") >= 0) return "espresso-makinesi";
    if (lk.indexOf("filtre kahve") >= 0 || lk.indexOf("fm250") >= 0 || lk.indexOf("ftl") >= 0 || lk.indexOf("bravilor") >= 0)
      return "filtre-kahve";
    if (lk.indexOf("kahve süt pot") >= 0 || lk.indexOf("kahve sut pot") >= 0 || lk.indexOf("8534") >= 0)
      return "kahve-sut-potlari";
    if (lk.indexOf("kahveci deml") >= 0) return "kahveci-demlik";
    if (lk.indexOf("değirmen") >= 0 || lk.indexOf("degirmen") >= 0) return "kahve-degirmeni";
    if (lk.indexOf("blender") >= 0) return "bar-blender";
    if (lk.indexOf("portakal") >= 0 || lk.indexOf("narenciye") >= 0 || lk.indexOf("sıkma") >= 0)
      return "portakal-sikma";
    if (lk.indexOf("limonata") >= 0 || lk.indexOf("şerbet") >= 0 || lk.indexOf("serbet") >= 0)
      return "limonata-serbet";
    if (lk.indexOf("ayran") >= 0) return "ayran-makinesi";
    if (lk.indexOf("granita") >= 0 || lk.indexOf("slush") >= 0) return "granita-slush";
    if (lk.indexOf("çikolata") >= 0 || lk.indexOf("cikolata") >= 0 || lk.indexOf("sahlep") >= 0)
      return "sicak-cikolata";
    if (lk.indexOf("buz mak") >= 0 || lk.indexOf("berrak") >= 0) return "buz-makinesi";
    if (lk.indexOf("soğuk oda") >= 0 || lk.indexOf("soguk oda") >= 0) return "soguk-oda";
    if (lk.indexOf("çay kazan") >= 0 || lk.indexOf("cay kazan") >= 0) return "cay-kazani";
    if (lk.indexOf("çay mak") >= 0 || lk.indexOf("cay mak") >= 0) return "cay-makinesi";
    if (lk.indexOf("çay") >= 0 || lk.indexOf("cay") >= 0) return "cay-makinesi";
    if (lk.indexOf("polipropilen") >= 0 || lk.indexOf("polikarbonat") >= 0) return "pp-pc-gn";
    if (lk.indexOf("bain marie") >= 0 && lk.indexOf("kap") >= 0) return "bain-marie-kap";
    if (lk.indexOf("karıştırma") >= 0 || lk.indexOf("karistirma") >= 0 || lk.indexOf("süzgeç") >= 0 || lk.indexOf("suzgec") >= 0)
      return "karistirma-suzgec";
    if (lk.indexOf("gastronorm") >= 0 && (lk.indexOf("küvet") >= 0 || lk.indexOf("kuvet") >= 0)) return "gastronorm-kuvet";
    return "";
  }

  function foldTrSeries(s) {
    return String(s || "")
      .toLocaleLowerCase("tr")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/ı/g, "i")
      .replace(/İ/g, "i")
      .trim();
  }

  function caglayanSeriesTipId(labelOrQ) {
    var f = foldTrSeries(labelOrQ);
    if (!f) return "";
    return "caglayan-" + f.replace(/\s+/g, "-");
  }

  function resolveCaglayanSeriesTip(q) {
    var id = caglayanSeriesTipId(q);
    if (!id) return "";
    return byTip["market-reyon:" + id] ? id : "";
  }

  function resolveProsoSeriesTip(q) {
    var f = foldTrSeries(q);
    if (!f) return "";
    if (f.indexOf("proso") >= 0) return byTip["market-reyon:proso-tumu"] ? "proso-tumu" : "";
    var tiles = byDept["market-reyon"] || [];
    for (var i = 0; i < tiles.length; i++) {
      var tile = tiles[i];
      if (!tile.id || tile.id.indexOf("proso-") !== 0) continue;
      if (tile.keys && tile.keys.length) {
        for (var ki = 0; ki < tile.keys.length; ki++) {
          if (f.indexOf(tile.keys[ki]) >= 0) return tile.id;
        }
      }
      var slug = tile.id.replace(/^proso-/, "").replace(/-/g, " ");
      if (slug && f.indexOf(slug) >= 0) return tile.id;
    }
    return "";
  }

  function marketReyonHref(tipId) {
    var base = "market-reyonlari.html";
    if (!tipId) return base;
    return base + "?tip=" + encodeURIComponent(tipId);
  }

  function deptPageHref(dept, tipId) {
    var base = dept === "market-reyon" ? "market-reyonlari.html" : dept + ".html";
    if (!tipId) return base;
    return base + "?tip=" + encodeURIComponent(tipId);
  }

  /** Eski GEO linkleri (?tip=tezgah_tipi_buzdolabi) → kanonik tip slug */
  var TIP_PARAM_ALIASES = {
    "set-ustu-mutfak": {
      "servis-gere-leri": "servis-gerecleri",
    },
    sogutma: {
      tezgah_tipi_buzdolabi: "tezgah-tipi-buzdolabi",
      "tezgah-tipi-buzdolabi": "tezgah-tipi-buzdolabi",
      blast_chiller: "blast-chiller",
      "blast-chiller": "blast-chiller",
      derin_dondurucu: "derin-dondurucu",
      sogutma_ekipmanlari: "sogutma-ekipmanlari",
      "sogutma-ekipmanlari": "sogutma-ekipmanlari",
    },
  };

  function normalizeTipParam(dept, tip) {
    if (!tip) return "";
    var t = String(tip).trim();
    if (dept === "market-reyon" && MARKET_REYON_HIDDEN_TIPS[t]) return "";
    var map = TIP_PARAM_ALIASES[dept];
    if (map && map[t]) return map[t];
    if (byTip[dept + ":" + t]) return t;
    var hy = t.replace(/_/g, "-");
    if (byTip[dept + ":" + hy]) return hy;
    return t;
  }

  window.EqDeptTips = {
    mergeTiles: mergeTiles,
    tile: tile,
    tilesFor: tilesFor,
    tileMatchProduct: tileMatchProduct,
    productRank: productRank,
    sortProductsDefault: sortProductsDefault,
    resolveTipId: resolveTipId,
    normalizeTipParam: normalizeTipParam,
    deptPageHref: deptPageHref,
    marketReyonHref: marketReyonHref,
    caglayanSeriesTipId: caglayanSeriesTipId,
    resolveCaglayanSeriesTip: resolveCaglayanSeriesTip,
    resolveProsoSeriesTip: resolveProsoSeriesTip,
    isEtKiymaProduct: isEtKiymaProduct,
    isSuzgecProduct: isSuzgecProduct,
    isMutfakTencereGereci: isMutfakTencereGereci,
    isOyacakSoyacakProduct: isOyacakSoyacakProduct,
    isYerIzgaraProduct: isYerIzgaraProduct,
    isYardimciEkipmanProduct: isYardimciEkipmanProduct,
    isBuzMakinesiProduct: isBuzMakinesiProduct,
    isSogukOdaProduct: isSogukOdaProduct,
    isOztiServisRafiProduct: isOztiServisRafiProduct,
    isServisTeshirProduct: isServisTeshirProduct,
    excludeFromDeptView: excludeFromDeptView,
    isKuvetProduct: isKuvetProduct,
    all: RAW,
  };
})();
