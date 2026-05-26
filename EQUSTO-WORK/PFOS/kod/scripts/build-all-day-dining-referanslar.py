#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
All Day Dining Cafe referans profilleri — THC Bakü (2017-044) ve AGU Kayseri (2017-073).

Kaynaklar:
  - THC BAKÜ PROFORMA.pdf (poz + ölçü + adet)
  - 2017-044-6.1.xlsx (arşiv doğrulama)
  - 2017-073-1.xlsx (Kayseri ekipman listesi)
  - THC DÜNYA MUTFAĞI.pdf / AB THC KAYSERİ.pdf (m² / yerleşim)

Çıktı: public/data/pfos-all-day-dining-referanslar.json
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "pfos-all-day-dining-referanslar.json"

BAKU_PDF = Path(r"c:\Users\User\OneDrive\Masaüstü\THC BAKÜ PROFORMA.pdf")
XLSX_044 = Path(r"C:/D Disk/EQUSTO-CURSOR/arşiv/projeler/2017-044 THC BAKÜ +/2017-044-6.1.xlsx")
XLSX_073 = Path(r"C:/D Disk/2017/2017-073 THC ABDULLAH GÜL ÜNİVERSİTESİ KAYSERİ/2017-073-1.xlsx")

BRANDS = re.compile(
    r"^(frenox|portashelf|mareno|inoksan|sgs|unox|atalay|electrolux|hobart|sgs)\s*",
    re.I,
)

# (regex on normalized name, urunTipi, kategoriKodu)
TIP_RULES: list[tuple[str, str, str]] = [
    (r"ESPRESSO", "espresso-2-grup", "A"),
    (r"KAHVE DE[ĞG]IRMEN", "kahve-degirmeni", "A"),
    (r"KAHVE MAK|TÜRK KAHVE", "turk-kahvesi-makinesi", "A"),
    (r"FILTRE KAHVE", "filter-coffee-makinesi", "A"),
    (r"BARDAK YIKAMA|GLASS", "glass-washer", "H"),
    (r"BUZ MAK", "buz-makinesi", "A"),
    (r"KOKTEYL", "bar-blender", "A"),
    (r"TATLI BAR", "pastane-vitrin-soguk", "D"),
    (r"PATISSERIE|PASTANE FIRIN", "konveksiyon-firin-pastane", "D"),
    (r"P[İI]ZZA FIRIN", "pizza-firin-kubbeli", "F"),
    (r"COMBI|KOMB[İI]", "combi-firin", "B"),
    (r"FR[İI]T[ÖO]Z", "friteuse-setustü", "B"),
    (r"IZGARA|D[ÖO]K[ÜU]M IZGARA", "ocak-4-gozlu", "B"),
    (r"4.?L[ÜU] OCAK|OCAK", "ocak-4-gozlu", "B"),
    (r"MAKARNA", "ocak-4-gozlu", "B"),
    (r"SALAMANDER", "salamander", "B"),
    (r"DAVLUMBAZ", "davlumbaz", "B"),
    (r"SERV[İI]S TEZGAHI.*SICAK|HEAT LAMP", "heat-lamp-servis", "B"),
    (r"SERV[İI]S RAF", "heat-lamp-servis", "B"),
    (r"DEPO T[İI]P[İI].*DER[İI]N", "derin-dondurucu-depo", "G"),
    (r"DEPO T[İI]P[İI].*BUZDOLAB", "dik-buzdolabi-depo", "G"),
    (r"TEZGAH T[İI]P[İI].*BUZDOLAB|MAKE.?UP DOLAB", "hazirlik-buzdolabi", "C"),
    (r"C[İI]HAZALTI.*BUZDOLAB", "setaltı-buzdolabi", "B"),
    (r"CAM KAPILI.*BUZDOLAB|BUZDOLAB.*TEK KAPILI", "bar-sogutucu-setaltı", "A"),
    (r"K[ÜU]VET HAVUZ|SO[ĞG]UTMALI.*DOLAB", "saladette", "E"),
    (r"SO[ĞG]UK TE[ŞS]H[İI]R", "pastane-vitrin-soguk", "D"),
    (r"[İI][ÇC]ECEK DOLABI", "sise-sogutucu-3-kapili", "A"),
    (r"BULA[ŞS]IK.*MAK|G[İI]YOT[İI]N", "bulasik-makinesi-kapasiteli", "H"),
    (r"BASKET RAF", "bulasik-cikis-tezgahi", "H"),
    (r"SIYIRMA|BULA[ŞS]IK SIYIRMA", "cop-siyirma-tezgahi", "H"),
    (r"BYM G[İI]R[İI][ŞS]|[ÖO]N YIKAMA", "cop-siyirma-tezgahi", "H"),
    (r"BYM [ÇC][İI]K[İI][ŞS]", "bulasik-cikis-tezgahi", "H"),
    (r"EL YIKAMA|D[İI]ZDEN KUMANDALI", "dizden-kumandali-evye", "G"),
    (r"FIRIN TEZGAH", "calisma-tezgahi-cekmeceli", "F"),
    (r"HAMUR YO[ĞG]URMA|SPIRAL", "spiral-mikser-hamur", "F"),
    (r"M[İI]KSER", "mikser-planet", "D"),
    (r"TOST MAK", "waffle-makinesi", "D"),
    (r"M[İI]KRODALGA", "waffle-makinesi", "D"),
    (r"TABAK ISITICI|RAF ALTI", "heat-lamp-servis", "B"),
    (r"[ÇC]AY OTOMAT", "filter-coffee-makinesi", "A"),
    (r"PORTAKAL SIK", "kati-meyve-sikacagi", "A"),
    (r"[İI]ST[İI]F RAF", "kuru-depo-raf", "G"),
    (r"[ÇC][ÖO]P ARAB", "cop-arabasi", "G"),
    (r"TAVA RAF", "kuru-depo-raf", "G"),
    (r"DUVAR RAF", "kuru-depo-raf", "G"),
    (r"EVYEL[İI].*TEZGAH|TEK EVYEL[İI]|[ÇC][İI]FT EVYEL[İI]", "calisma-tezgahi-cekmeceli", "C"),
    (r"[ÇC]ALI[ŞS]MA TEZGAH|FIRIN TEZGAH|HAREKETL[İI]", "calisma-tezgahi-cekmeceli", "C"),
    (r"MERMER TABLALI", "pizza-prep-tezgahi", "F"),
    (r"NAKL[İI]YE|MONTAJ", "montaj-nakliye", "X"),
]

SKIP_NAME = re.compile(
    r"^(NAKL[İI]YE|ŞARTLAR|\*|FİYAT|FİRMA|İŞVEREN|BİLGİ|doruk|0212|merkez mah|\.\.\.)",
    re.I,
)


def load_extractor():
    spec = importlib.util.spec_from_file_location(
        "ext", ROOT / "scripts" / "extract-pfos-referans-projeler.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def norm_name(raw: str) -> str:
    s = BRANDS.sub("", raw.strip())
    s = re.sub(r"\s+", " ", s)
    return s.upper()


def clean_display(raw: str) -> str:
    s = BRANDS.sub("", raw.strip())
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def map_tip(isim: str) -> tuple[str, str]:
    n = norm_name(isim)
    for pat, tip, kat in TIP_RULES:
        if re.search(pat, n):
            return tip, kat
    return "calisma-tezgahi-cekmeceli", "C"


def poz_to_kategori_fallback(poz: str) -> str:
    letter = poz[0].upper()
    if letter in ("E", "F"):
        return "A"
    if letter == "D":
        return "H"
    if letter in ("A", "B"):
        return "G"
    return "C"


def parse_baku_pdf(path: Path) -> list[dict]:
    try:
        import pypdf
    except ImportError:
        print("pypdf yok — pip install pypdf", file=sys.stderr)
        return []

    if not path.is_file():
        print(f"PDF bulunamadı: {path}", file=sys.stderr)
        return []

    text = "\n".join((pg.extract_text() or "") for pg in pypdf.PdfReader(str(path)).pages)
    rows: list[dict] = []
    for line in text.split("\n"):
        line = line.strip()
        m = re.match(
            r"^([A-Z]\d+[A-Z]?)\s+(.+?)\s+(\d+\*\d+(?:\*\d+)?(?:/\d+)?)\s+(\d+)\s",
            line,
        )
        if not m:
            continue
        poz, rest, dim, adet_s = m.groups()
        adet = int(adet_s)
        if adet < 1:
            continue
        isim = clean_display(rest)
        tip, kat = map_tip(isim)
        if kat == "C" and poz[0] in "CDEF":
            kat = poz_to_kategori_fallback(poz)
            if poz[0] == "C":
                tip, kat = map_tip(isim)
        rows.append(
            {
                "referansPoz": poz,
                "isim": isim,
                "urunTipi": tip,
                "kategoriKodu": kat,
                "adet": adet,
                "notlar": dim.replace("*", "×") + " cm",
            }
        )
    return rows


def xlsx_zone_lines(path: Path, ext) -> dict[str, list[str]]:
    zones: dict[str, list[str]] = {}
    current: str | None = None
    with zipfile.ZipFile(path) as z:
        shared = ext.read_shared_strings(z)
        sheets = sorted(
            n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")
        )
        for sheet in sheets:
            cells = ext.read_sheet_cells(z, sheet, shared)
            for col, row, text in sorted(cells, key=lambda x: (x[1], x[0])):
                if col > 4:
                    continue
                zk = ext.map_zone_label(text)
                if zk:
                    current = zk
                    zones.setdefault(current, [])
                    continue
                if not current or len(text) < 6:
                    continue
                if re.match(r"^[A-Z]?\d+$", text.strip(), re.I):
                    continue
                if SKIP_NAME.match(text.strip()):
                    break
                zones.setdefault(current, []).append(text.strip())
    return zones


def assign_poz(kategori: str, counters: dict[str, int]) -> str:
    counters[kategori] = counters.get(kategori, 0) + 1
    return f"{kategori}{counters[kategori]}"


def kayseri_from_xlsx(path: Path, ext) -> list[dict]:
    zone_order = ["bar", "izgara_meze", "bulasikhane"]
    zones = xlsx_zone_lines(path, ext)
    rows: list[dict] = []
    counters: dict[str, int] = {}

    # Kayseri plan: bar=A, sıcak/pizza=B–F, bulaşık=H
    for zone in zone_order:
        for raw in zones.get(zone, []):
            if SKIP_NAME.match(raw):
                break
            isim = clean_display(raw)
            tip, kat = map_tip(isim)
            if zone == "bar" and kat not in ("A", "H", "X"):
                if tip in ("hazirlik-buzdolabi", "pastane-vitrin-soguk", "sise-sogutucu-3-kapili"):
                    kat = "A"
                elif tip == "waffle-makinesi":
                    kat = "A"
                else:
                    kat = "A"
            elif zone == "bulasikhane":
                kat = "H"
            elif zone == "izgara_meze":
                if tip == "montaj-nakliye":
                    kat = "X"
                # map_tip already assigns B/C/D/E/F/G
            poz = assign_poz(kat, counters)
            rows.append(
                {
                    "referansPoz": poz,
                    "isim": isim,
                    "urunTipi": tip,
                    "kategoriKodu": kat,
                    "adet": 1,
                }
            )
    return rows


def main() -> int:
    ext = load_extractor()
    baku_kalemler = parse_baku_pdf(BAKU_PDF)
    kayseri_kalemler = kayseri_from_xlsx(XLSX_073, ext) if XLSX_073.is_file() else []

    payload = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "m2Band": {"min": 200, "max": 400},
        "defaultReferansId": "thc-baku-280",
        "sources": {
            "thc-baku-280": {
                "proformaPdf": str(BAKU_PDF),
                "xlsx": str(XLSX_044) if XLSX_044.is_file() else None,
                "layoutPdf": r"c:\Users\User\OneDrive\Masaüstü\THC DÜNYA MUTFAĞI.pdf",
                "referansM2": 280,
                "not": "THEHOUSE CAFE Bakü — kafe ~78,5 m² + mutfak ~39 m² + bar ~8 m² (yerleşim planı).",
            },
            "thc-kayseri-073": {
                "xlsx": str(XLSX_073),
                "layoutPdf": r"c:\Users\User\OneDrive\Masaüstü\AB THC KAYSERİ.pdf",
                "referansM2": 250,
                "not": "AGÜ kampüs THC — 2017-073 proforma; 200–400 m² all-day dining bandı.",
            },
        },
        "referanslar": [
            {
                "id": "thc-baku-280",
                "label": "THC Bakü / All Day Dining (280 m²)",
                "kaynak": "2017-044 THC BAKÜ — THC BAKÜ PROFORMA.pdf",
                "referansM2": 280,
                "not": "Doğrulanmış proforma pozları (C/D/E/F); ~280 m² referans.",
                "kalemler": baku_kalemler,
            },
            {
                "id": "thc-kayseri-073",
                "label": "THC AGÜ Kayseri / All Day Dining (~250 m²)",
                "kaynak": "2017-073 THC Abdullah Gül Üniversitesi — 2017-073-1.xlsx",
                "referansM2": 250,
                "not": "Kampüs kafe-restoran; bar + izgara/meze + bulaşıkhane seti.",
                "kalemler": kayseri_kalemler,
            },
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(
        f"Wrote {OUT} — Bakü {len(baku_kalemler)} kalem, Kayseri {len(kayseri_kalemler)} kalem"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
