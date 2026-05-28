#!/usr/bin/env python3
"""Fix marka.html UTF-8 by copying header/topnav from sss.html."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public"
MARKA = ROOT / "marka.html"
SSS = ROOT / "sss.html"
CACHE = "20260531marka7"

HEADER_START = '<header class="hdr">'
HEADER_END = '</nav>\n'
PG_START = "  <div class=\"pg\">"


def extract_block(text: str, start: str, end: str) -> str:
    a = text.index(start)
    b = text.index(end, a) + len(end.rstrip("\n"))
    return text[a:b]


def indent_for_marka(block: str) -> str:
    lines = block.splitlines()
    out: list[str] = []
    for line in lines:
        s = line.strip()
        if not s:
            out.append("")
            continue
        if s.startswith("<header") or s.startswith("</header>"):
            out.append("  " + s)
        elif s.startswith("<nav") or s.startswith("</nav>"):
            if s.startswith("<nav"):
                out.append("")
            out.append("  " + s)
        else:
            out.append("    " + s)
    return "\n".join(out) + "\n"


REPLACEMENTS = {
    "Markalar?m?z ? End?striyel Mutfak Markalar? ? Equsto": "Markalarımız · Endüstriyel Mutfak Markaları · Equsto",
    "?ztiryakiler, Animo, Altuntop ve 230+ uluslararas? gastronomi markas?. End?striyel mutfak ekipman?, kahve makineleri, so?utma, y?kama, haz?rl?k ve i?ecek ekipman markalar? ? Equsto bayisi olarak orijinal ?r?n ve servis garantisiyle teklif al.": (
        "Öztiryakiler, Animo, Altuntop ve 230+ uluslararası gastronomi markası. Endüstriyel mutfak ekipmanı, kahve makineleri, soğutma, yıkama, hazırlık ve içecek ekipman markaları — Equsto bayisi olarak orijinal ürün ve servis garantisiyle teklif al."
    ),
    "end?striyel mutfak markalar?, ?ztiryakiler bayisi, Animo, Altuntop, kahve makinesi markalar?, so?utma markalar?, gastronomi markalar?, restoran ekipman markalar?": (
        "endüstriyel mutfak markaları, öztiryakiler bayisi, Animo, Altuntop, kahve makinesi markaları, soğutma markaları, gastronomi markaları, restoran ekipman markaları"
    ),
    "Markalar?m?z ? Equsto": "Markalarımız · Equsto",
    "230+ uluslararas? gastronomi markas?.": "230+ uluslararası gastronomi markası.",
    "?ztiryakiler, Animo, Altuntop ve 230+ uluslararas? gastronomi markas?.": (
        "Öztiryakiler, Animo, Altuntop ve 230+ uluslararası gastronomi markası."
    ),
    "?ztiryakiler ve uluslararas? gastronomi markalar? ?zerinden ?r?n ke?fi ve teklif.": (
        "Öztiryakiler ve uluslararası gastronomi markaları üzerinden ürün keşfi ve teklif."
    ),
    "Markalar?m?z": "Markalarımız",
    "?? ortaklar?m?z": "İş ortaklarımız",
    "Ana Sayfa</a> ? <span": "Ana Sayfa</a> › <span",
    "document.title = (displayName || 'Marka') + ' ? Equsto';": "document.title = (displayName || 'Marka') + ' · Equsto';",
    'data-i18n-attr="aria-label:common.close">?</button>': 'data-i18n-attr="aria-label:common.close">×</button>',
    "20260531marka6": CACHE,
    "20260531marka5": CACHE,
}

CAT_FIXES = {
    "'sanayi-ocaklari': 'End?striyel Ocaklar'": "'sanayi-ocaklari': 'Endüstriyel Ocaklar'",
    "'sanayi-tipi-izgaralar': 'End?striyel Izgaralar'": "'sanayi-tipi-izgaralar': 'Endüstriyel Izgaralar'",
    "'fritozler': 'Frit?zler'": "'fritozler': 'Fritözler'",
    "'doner-ocaklari-': 'D?ner Ocaklar?'": "'doner-ocaklari-': 'Döner Ocakları'",
    "'pilic-cevirme-makineleri': 'Pili? ?evirme'": "'pilic-cevirme-makineleri': 'Piliç Çevirme'",
    "'ocakbasi-izgara': 'Ocakba?? Izgaralar'": "'ocakbasi-izgara': 'Ocakbaşı Izgaralar'",
    "'sogutma-ekipmanlari': 'So?utma Ekipmanlar?'": "'sogutma-ekipmanlari': 'Soğutma Ekipmanları'",
    "'bulasik-makineleri': 'Bula??k Makineleri'": "'bulasik-makineleri': 'Bulaşık Makineleri'",
    "'hamur-hazirlik-makineleri': 'Hamur Haz?rl?k'": "'hamur-hazirlik-makineleri': 'Hamur Hazırlık'",
    "'et-hazirlik-makineleri': 'Et Haz?rl?k'": "'et-hazirlik-makineleri': 'Et Hazırlık'",
    "'cay-kazanlari-cay-makineleri-cay-otomatlari': '?ay & Otomatlar'": "'cay-kazanlari-cay-makineleri-cay-otomatlari': 'Çay & Otomatlar'",
    "'yiyecek-ve-icecek-otomatlari-': 'Yiyecek & ??ecek Otomatlar?'": "'yiyecek-ve-icecek-otomatlari-': 'Yiyecek & İçecek Otomatları'",
    "displayName + ' markal? t?m ?r?nler ? kategoriye g?re incele.'": "displayName + ' markalı tüm ürünler — kategoriye göre incele.'",
    "tilesHdr: 'Kategoriye g?re incele'": "tilesHdr: 'Kategoriye göre incele'",
}


def main() -> None:
    marka = MARKA.read_text(encoding="utf-8")
    sss = SSS.read_text(encoding="utf-8")

    hdr = indent_for_marka(extract_block(sss, HEADER_START, HEADER_END))
    start = marka.index("  <header class=\"hdr\">")
    end = marka.index(PG_START)
    marka = marka[:start] + hdr + marka[end:]

    for mapping in (REPLACEMENTS, CAT_FIXES):
        for old, new in mapping.items():
            marka = marka.replace(old, new)

    MARKA.write_text(marka, encoding="utf-8", newline="\r\n")

    b = MARKA.read_bytes()
    assert b"\xc4\xb0stanbul" in b, "İstanbul UTF-8 missing"
    assert b"?stanbul" not in b, "literal ? istanbul still present"
    print("OK: marka.html UTF-8 fixed with cache", CACHE)


if __name__ == "__main__":
    main()
