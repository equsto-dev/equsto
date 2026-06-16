import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";

type TipRule = {
  tip: string;
  test: (n: string, poz: string, olcu?: string) => boolean;
};

function isBuroTipiDerinDondurucuOlcu(olcu: string): boolean {
  const nums = [...String(olcu).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 8);
  if (nums.length < 2) return false;
  const [w, d, h] = [nums[0], nums[1], nums[2] ?? 0];
  return w >= 55 && w <= 65 && d >= 55 && d <= 65 && h >= 75 && h <= 95;
}

function norm(s: string): string {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ");
}

/** Referans satır adı → shop/zone tip_kodu (URUN_TIPI_ALIASES ile uyumlu) */
const TIP_RULES: TipRule[] = [
  {
    tip: "panel-derin-dondurucu-oda",
    test: (n, poz) =>
      /panel tip derin dondurucu|panel tipi derin dondurucu|panel tip dondurucu oda/.test(
        n,
      ) ||
      (poz.startsWith("F") &&
        /derin dondurucu|dondurucu oda|deep freeze/.test(n)),
  },
  {
    tip: "panel-soguk-oda",
    test: (n, poz) =>
      /panel tip soguk oda|panel tipi soguk oda/.test(n) ||
      (poz.startsWith("C") && /soguk oda|soğuk oda|cold room/.test(n)),
  },
  {
    tip: "montaj-nakliye",
    test: (n) => n.includes("nakliye") || n.includes("montaj"),
  },
  {
    tip: "espresso-2-grup",
    test: (n) =>
      n.includes("espresso") &&
      (n.includes("makina") || n.includes("makin") || n.includes("gruplu")),
  },
  {
    tip: "soguk-tesir-dolabi-pastane",
    test: (n) =>
      n.includes("teshir") ||
      n.includes("teşhir") ||
      (n.includes("soguk") && n.includes("pasta")),
  },
  {
    tip: "sise-sogutucu-3-kapili",
    test: (n) =>
      n.includes("sise") &&
      n.includes("sogut") &&
      (n.includes("uc kapili") || n.includes("3 kapili")),
  },
  {
    tip: "sise-sogutucu-2-kapili",
    test: (n) =>
      n.includes("sise") &&
      n.includes("sogut") &&
      (n.includes("iki kapili") || n.includes("2 kapili")),
  },
  {
    tip: "tezgah-buzdolabi-3-kapili",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("derin") &&
      !n.includes("make up") &&
      !n.includes("saladette") &&
      !n.includes("hazirlik buzdolab") &&
      (n.includes("uc kapili") || n.includes("3 kapili") || n.includes("üç kapili")) &&
      (n.includes("tezgah") || n.includes("yatay")),
  },
  {
    tip: "tezgah-tip-buzdolabi",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("derin") &&
      !n.includes("derindonduruc") &&
      (n.includes("tezgah tip") ||
        n.includes("cam kapili") ||
        n.includes("hazirlik buzdolab") ||
        n.includes("saladette") ||
        n.includes("pizza prep")),
  },
  {
    tip: "bar-buzdolabi",
    test: (n) => n.includes("sise") && n.includes("sogut"),
  },
  {
    tip: "kahve-degirmeni",
    test: (n) => n.includes("degirmen") && !n.includes("makina"),
  },
  {
    tip: "filter-coffee-makinesi",
    test: (n) => n.includes("filtre") && n.includes("kahve"),
  },
  {
    tip: "kahve-makinasi-turk",
    test: (n) =>
      (n.includes("turk kahve") || n.includes("türk kahve") || n.includes("atkm")) &&
      n.includes("makina"),
  },
  {
    tip: "karbuz-makinesi",
    test: (n) => n.includes("karbuz") && n.includes("makin"),
  },
  {
    tip: "buz-makinesi-brema-cb425",
    test: (n) => /brema/.test(n) && /cb425|425/.test(n),
  },
  {
    tip: "buz-makinesi-brema-cb416",
    test: (n) =>
      /brema/.test(n) &&
      (/cb416|416|42\s*kg|44\s*kg/.test(n) || !/cb425|425/.test(n)),
  },
  {
    tip: "buz-makinesi-90kg",
    test: (n) =>
      /(?:^|\s|,)buz\s+makin/.test(n) &&
      !n.includes("karbuz") &&
      !n.includes("brema"),
  },
  {
    tip: "glass-washer",
    test: (n) => n.includes("bardak yik") || n.includes("bardak yık"),
  },
  {
    tip: "kiyma-makinasi-no32",
    test: (n) =>
      /(?:^|\s)(?:et\s*)?(?:kiyma|kıyma)(?:\s*makin|\s*makine|\s*mincer|\s*grinder|$)/.test(
        n,
      ),
  },
  {
    tip: "kemik-testere",
    test: (n) => n.includes("kemik") && n.includes("testere"),
  },
  {
    tip: "dilimleme-makinesi",
    test: (n) =>
      n.includes("dilimleme") ||
      n.includes("gida dilim") ||
      n.includes("gıda dilim") ||
      n.includes("ekmek dilim"),
  },
  {
    tip: "vakum-makinesi",
    test: (n) => n.includes("vakum") && n.includes("makin"),
  },
  {
    tip: "spiral-mikser-hamur",
    test: (n) =>
      (n.includes("hamur") &&
        (n.includes("yogur") || n.includes("spiral") || n.includes("planet"))) ||
      n.includes("hamur yogurma"),
  },
  {
    tip: "hamur-acma",
    test: (n) => n.includes("hamur") && (n.includes("acma") || n.includes("açma")),
  },
  {
    tip: "patates-soyma",
    test: (n) => n.includes("patates") && n.includes("soy"),
  },
  {
    tip: "portakal-sikacagi",
    test: (n) =>
      /portakal|narenciye|citrus|greyfurt|mandalina|motorlu portakal/.test(n) &&
      (n.includes("sik") || n.includes("sık") || n.includes("mak")),
  },
  {
    tip: "kati-meyve-sikacagi",
    test: (n) =>
      n.includes("meyve") &&
      (n.includes("sik") || n.includes("sık")) &&
      !/portakal|narenciye|citrus/.test(n),
  },
  {
    tip: "calisma-tezgahi-kasa-kahve",
    test: (n) =>
      n.includes("calisma tezgah") &&
      (n.includes("kasa") || n.includes("kahve cekmece")),
  },
  {
    tip: "calisma-tezgahi-dolapli",
    test: (n) => n.includes("calisma tezgah") && n.includes("dolap"),
  },
  {
    tip: "calisma-tezgahi-taban-ara",
    test: (n) => n.includes("calisma tezgah") && n.includes("ara raf"),
  },
  {
    tip: "calisma-tezgahi",
    test: (n) =>
      (n.includes("evyeli") || n.includes("evye")) &&
      n.includes("tezgah") &&
      (n.includes("giris") ||
        n.includes("calisma tezgah") ||
        n.includes("çalışma tezgah")),
  },
  {
    tip: "calisma-tezgahi",
    test: (n) => n.includes("calisma tezgah") || n.includes("çalışma tezgah"),
  },
  {
    tip: "evye-tezgahi-dolapli",
    test: (n) =>
      n.includes("evye tezgah") ||
      (n.includes("evyeli") &&
        n.includes("tezgah") &&
        !n.includes("giris") &&
        !n.includes("calisma tezgah") &&
        !n.includes("çalışma tezgah")),
  },
  {
    tip: "cop-tezgahi",
    test: (n) => n.includes("cop tezgah") || n.includes("çöp tezgah"),
  },
  {
    tip: "cop-arabasi",
    test: (n) => n.includes("cop araba") || n.includes("çöp araba"),
  },
  {
    tip: "rinser-evyesi",
    test: (n) => n.includes("rinser") || n.includes("rincer") || n.includes("durulama"),
  },
  {
    tip: "bar-kuvet",
    test: (n) => n.includes("kuvet"),
  },
  {
    tip: "firin-standi-taban-rafli",
    test: (n) =>
      /firin\s*stand|fırın\s*stand|firin\s*alt\s*tezgah|fırın\s*alt\s*tezgah/.test(n) ||
      (/konveksiyonlu\s*firin\s*stand|setustu\s*konveksiyonlu\s*firin\s*stand/.test(n) &&
        /tepsi|istif|raf/.test(n)),
  },
  {
    tip: "tas-firin",
    test: (n) =>
      n.includes("tas firin") ||
      n.includes("taş fırın") ||
      n.includes("tas taban") ||
      n.includes("taş taban"),
  },
  {
    tip: "tost-makinasi",
    test: (n) => n.includes("tost mak"),
  },
  {
    tip: "mikrodalga-firin",
    test: (n) => n.includes("mikrodalga"),
  },
  {
    tip: "pide-pizza-firin",
    test: (n) =>
      /pide\s*pizza|pizza\s*firin|pizza\s*fırın|pide\s*firin/.test(n),
  },
  {
    tip: "patisserie-firin",
    test: (n) => /patisserie|pâtisserie|pastane\s*firin/.test(n),
  },
  {
    tip: "firin-tezgahi",
    test: (n) =>
      /firin\s*tezgah|fırın\s*tezgah/.test(n) &&
      !/alt\s*tezgah/.test(n) &&
      !/patisserie|pizza|pide/.test(n),
  },
  {
    tip: "konveksiyon-firin-unox",
    test: (n) =>
      (n.includes("firin") || n.includes("fırın")) &&
      (n.includes("unox") || n.includes("jet firin")),
  },
  {
    tip: "konveksiyon-firin-pastane",
    test: (n) =>
      (n === "firin" || n === "fırın") &&
      !n.includes("pizza") &&
      !n.includes("tas") &&
      !n.includes("taş"),
  },
  {
    tip: "speed-oven-merry-chef",
    test: (n) => n.includes("merrychef") || n.includes("merry chef"),
  },
  {
    tip: "bar-blender",
    test: (n) => n.includes("blender"),
  },
  {
    tip: "bar-mikser",
    test: (n) => n.includes("bar mikser") || n.includes("milk frother"),
  },
  {
    tip: "kokteyl-tezgah",
    test: (n) => n.includes("kokteyl istasyon") || n.includes("kokteyl tezgah"),
  },
  {
    tip: "portakal-sikacagi",
    test: (n) =>
      /portakal|narenciye|citrus|greyfurt|motorlu portakal/.test(n) &&
      (n.includes("sik") || n.includes("sık") || n.includes("mak")),
  },
  {
    tip: "kati-meyve-sikacagi",
    test: (n) =>
      (n.includes("meyve sik") || n.includes("meyve sık") || n.includes("kati meyve")) &&
      !/portakal|narenciye|citrus/.test(n),
  },
  {
    tip: "yer-izgara-kucuk",
    test: (n) => n.includes("yer izgar") || n.includes("yer ızgar"),
  },
  {
    tip: "icecek-havuzu-soguk",
    test: (n) => n.includes("icecek havuzu") || n.includes("içecek havuzu"),
  },
  {
    tip: "setalti-buzdolabi-tek",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("derin") &&
      !n.includes("derindonduruc") &&
      (n.includes("setalti") ||
        n.includes("set alti") ||
        n.includes("cihazalti") ||
        n.includes("tezgahalti")),
  },
  {
    tip: "depo-buzdolabi-tek-kapili",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("tezgah") &&
      !n.includes("setalti") &&
      (n.includes("depo") || n.includes("dik tip")),
  },
  {
    tip: "buro-tipi-derin-dondurucu",
    test: (n, _poz, olcu = "") =>
      (/derin donduruc|derindonduruc|dondurucu/.test(n) &&
        (/buro tip|office type|slim buzdolab|tezgah alti slim/.test(n) ||
          isBuroTipiDerinDondurucuOlcu(olcu))) ||
      false,
  },
  {
    tip: "setalti-derin-dondurucu",
    test: (n) =>
      (n.includes("derin donduruc") || n.includes("derindonduruc")) &&
      !n.includes("depo") &&
      (n.includes("setalti") ||
        n.includes("set alti") ||
        n.includes("cihazalti") ||
        n.includes("60*60")),
  },
  {
    tip: "depo-derin-dondurucu",
    test: (n) =>
      (n.includes("derin donduruc") || n.includes("derindonduruc")) &&
      !n.includes("setalti") &&
      !n.includes("cihazalti"),
  },
  {
    tip: "servis-rafi",
    test: (n) =>
      (n.includes("servis rafi") || n.includes("servis rafı")) &&
      !n.includes("arab") &&
      !n.includes("banko") &&
      !n.includes("unite") &&
      !n.includes("ünite"),
  },
  {
    tip: "istif-rafi",
    test: (n) => n.includes("istif raf"),
  },
  {
    tip: "firin-davlumbazi-dekoratif",
    test: (n) => /firin\s*davlumbaz|fırın\s*davlumbaz/.test(n),
  },
  {
    tip: "kombi-firin-6t",
    test: (n) =>
      n.includes("kombi") ||
      n.includes("konveksiyon") ||
      (n.includes("firin") &&
        !n.includes("unox") &&
        !n.includes("tas") &&
        !n.includes("taş") &&
        !/firin\s*alt\s*tezgah|fırın\s*alt\s*tezgah|firin\s*stand|fırın\s*stand/.test(n) &&
        !/firin\s*davlumbaz|fırın\s*davlumbaz/.test(n) &&
        n.length > 12),
  },
  {
    tip: "yer-yikama-hortumu",
    test: (n) =>
      /yer yikama hortum|118\.ht|ht-\d{2}\b/.test(n) ||
      (/geri toplam/.test(n) &&
        /on yik|ön yik|du[sş]|\d+\s*m\b|\d+\s*mt|118\.ht/.test(n)),
  },
  {
    tip: "on-yikama-dusu",
    test: (n) =>
      (/on yikama dus|ön yikama duş|sprey unitesi|sprey ünitesi|du[sş] sprey|pre.?rinse/.test(
        n,
      ) &&
        !/geri toplam|118\.ht|yer yikama hortum/.test(n)) ||
      (/ara musluk/.test(n) && /sprey|on yik|ön yik/.test(n)),
  },
  {
    tip: "duvar-rafi",
    test: (n) =>
      /basket\s*raf/.test(n) || (/duvar\s*raf/.test(n) && !/davlumbaz/.test(n)),
  },
  {
    tip: "cop-siyirma-tezgahi",
    test: (n) =>
      /bulasik\s*siyirma|bulaşık\s*sıyır|cop\s*siyirma/.test(n) ||
      ((/siyirma|sıyırma|hunili/.test(n) || n.includes("siyirma")) &&
        /tezgah|alma/.test(n)),
  },
  {
    tip: "bulasik-makinesi-setalti",
    test: (n) =>
      (n.includes("bulasik") || n.includes("bulaşık")) &&
      (n.includes("setalti") ||
        n.includes("set alti") ||
        n.includes("500 tb") ||
        n.includes("neo dw")),
  },
  {
    tip: "bulasik-makinesi-giyotin",
    test: (n) =>
      n.includes("giyotin") ||
      ((n.includes("bulasik") || n.includes("bulaşık")) &&
        n.includes("1000 tb")),
  },
  {
    tip: "bulasik-makinesi-giyotin",
    test: (n) =>
      (n.includes("bulasik") || n.includes("bulaşık")) &&
      !n.includes("setalti") &&
      !n.includes("bardak") &&
      !n.includes("500 tb") &&
      !/siyirma|sıyır|hunili/.test(n) &&
      !/tezgah|alma/.test(n),
  },
  {
    tip: "davlumbaz-duvar",
    test: (n) =>
      n.includes("davlumbaz") && !/firin\s*davlumbaz|fırın\s*davlumbaz/.test(n),
  },
  {
    tip: "fritoz-dolapli-elk",
    test: (n) =>
      (n.includes("fritoz") || n.includes("fritöz")) &&
      n.includes("dolap") &&
      (/elektrik|elk\.|\belk\b|elek/.test(n)) &&
      !/gazli|gazlı|\bgaz\b/.test(n),
  },
  {
    tip: "fritoz-dolapli-gaz",
    test: (n) =>
      (n.includes("fritoz") || n.includes("fritöz")) &&
      n.includes("dolap") &&
      (/gazli|gazlı|\bgaz\b/.test(n)),
  },
  {
    tip: "fritoz-cift-hazne-elk",
    test: (n) =>
      (n.includes("fritoz") || n.includes("fritöz")) &&
      (n.includes("cift") ||
        n.includes("çift") ||
        n.includes("iki hazne") ||
        n.includes("2 x") ||
        n.includes("2×")),
  },
  {
    tip: "fritoz-tek",
    test: (n) => n.includes("fritoz") || n.includes("fritöz"),
  },
  {
    tip: "komurlu-izgara",
    test: (n) =>
      (n.includes("komurlu") || n.includes("kömürlü")) && n.includes("izgar"),
  },
  {
    tip: "yer-izgara",
    test: (n) => n.includes("yer izgar") || n.includes("yer ızgar"),
  },
  {
    tip: "dokum-izgara-gazli",
    test: (n) =>
      n.includes("izgar") &&
      (n.includes("dokum") || n.includes("döküm")) &&
      !n.includes("lavatas"),
  },
  {
    tip: "plate-izgara-gazli",
    test: (n) => n.includes("izgar") && n.includes("plate"),
  },
  {
    tip: "izgara-gazli",
    test: (n) =>
      n.includes("izgara") &&
      !n.includes("istif") &&
      !n.includes("davlumbaz") &&
      !n.includes("tabla"),
  },
];

/**
 * Excel referans satırından katalog tip_kodu üretir.
 * Eşleşme yoksa eski pfos_{poz}_{slug} yedeği (manuel link için).
 */
export function inferUrunTipiFromReferansSatir(s: PfosEkipmanSatir): string {
  const n = norm(s.ad);
  const poz = String(s.poz || "").trim().toUpperCase();
  const olcu = String(s.olcu || "").trim();

  for (const rule of TIP_RULES) {
    if (rule.test(n, poz, olcu)) return rule.tip;
  }

  const base = s.ad
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
  return `pfos_${s.poz.toLowerCase()}_${base || "kalem"}`;
}
