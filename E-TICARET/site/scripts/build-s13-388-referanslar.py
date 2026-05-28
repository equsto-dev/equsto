#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
S13-388-2-Model.pdf → Türk Restoranı + All Day Dining referans (150–300 m²).

Teşhir vitrinleri: tip=tavsiye (opsiyonellik henüz net değil).
Yenileme: python scripts/build-s13-388-referanslar.py
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "pfos-s13-388-referanslar.json"
PDF = Path(r"c:\Users\User\OneDrive\Masaüstü\S13-388-2-Model.pdf")

# (poz, isim, olcu or None, urunTipi_turk, kategori, teşhir?)
ROWS: list[tuple[str, str, str | None, str, str, bool]] = [
    ("1", "Mermer Tablalı Çalışma Tezgahı", "120×50×85", "pide-hazirlik-tezgahi", "F", False),
    ("2", "Vakum Makinası, Lipovak MV20", None, "vakum-makinesi", "C", False),
    ("3", "Hamur Açma Makinası", None, "hamur-yogurma-35lt", "F", False),
    ("4", "Tandır Fırını", None, "tas-firin", "B", False),
    ("5", "Depo Tipi Buzdolabı (40×60 Tepsi Raflı)", "72×80×205", "depo-buzdolabi-tek-kapili", "G", False),
    ("6", "Fırın", None, "konveksiyon-firin-pastane", "F", False),
    ("7", "Taş Fırın", None, "tas-firin", "B", False),
    ("8", "Mermer Tablalı Çalışma Tezgahı", None, "pide-hazirlik-tezgahi", "F", False),
    ("9", "Make-up Ünitesi, 3 Kapılı", None, "makeup-unite-3-kapili-mermer", "F", False),
    ("10", "Tezgah Tipi Buzdolabı", "200×85×85", "tezgah-buzdolabi-3-kapili", "B", False),
    ("11", "Kömürlü Izgara (Arka Duvar Tuğla Kaplı)", "180×70×30", "komurlu-izgara", "B", False),
    ("12", "Davlumbaz, Duvar Tipi, Filtreli", "200×95×45", "davlumbaz", "B", False),
    ("13", "Fritöz, Frymaster", None, "friteuse-cift-hazneli", "B", False),
    ("14", "Patates Dinlendirme, Elk.", "40×70×29", "bainmarie-3-gn", "B", False),
    ("15", "Sos Bainmarie, Elk.", "40×70×29", "bainmarie-3-gn", "B", False),
    ("16", "Çalışma Tezgahı", "80×65×56", "calisma-tezgahi-cekmeceli", "C", False),
    ("17", "Çorbalık Tezgahı", None, "calisma-tezgahi-cekmeceli", "C", False),
    ("18", "Setaltı Buzdolabı, 2 Kapılı", None, "setaltı-buzdolabi", "B", False),
    ("19", "Setaltı Çalışma Tezgahı", None, "calisma-tezgahi-cekmeceli", "C", False),
    ("20", "Yumurta Ocağı", None, "yumurta-omlet-ocagi-8-gozlu", "B", False),
    ("21", "Make-up Ünitesi, 2 Kapılı", None, "makeup-unite-3-kapili-mermer", "F", False),
    ("22", "Tek Evyeli Çalışma Tezgahı", None, "calisma-tezgahi-cekmeceli", "C", False),
    ("23", "Tezgah Tipi Buzdolabı, 3 Kapılı", None, "tezgah-buzdolabi-3-kapili", "B", False),
    ("24", "Çalışma Tezgahı", None, "calisma-tezgahi-cekmeceli", "C", False),
    ("25", "Patates Dinlendirme, Elk.", "40×65×20", "bainmarie-3-gn", "B", False),
    ("26", "Sos Bainmarie, Elk.", "40×65×20", "bainmarie-3-gn", "B", False),
    ("27", "İskender Ocağı", None, "izgara-gazli", "B", False),
    ("28", "Döner Ocağı", None, "doner-ocagi", "B", False),
    ("28B", "Davlumbaz, Duvar Tipi, Filtreli (servis hattı)", "120×95×45", "davlumbaz", "B", False),
    ("29", "Börek Teşhir Dolabı", None, "pogaca-baklava-tesir", "G", True),
    ("30", "Soğuk Teşhir Dolabı, Motoru Dışarıda", None, "pastane-vitrin-soguk", "D", True),
    ("31", "Pasta Dolabı", "170×70×110", "pasta-sutlu-tatli-tesir", "D", True),
    ("32", "Kasa Tezgahı", None, "calisma-tezgahi-kasa-kahve", "A", False),
    ("33", "Kahvaltı Dolabı", None, "kahvalti-tesir-dolabi", "G", True),
    ("34", "Servis Tezgahı", None, "sicak-yemek-display", "B", False),
    ("35", "Servis Tezgahı", "175×70×85", "sicak-yemek-display", "B", False),
    ("36", "Sütlü Tatlı Dolabı, Motoru Dışarıda", None, "pasta-sutlu-tatli-tesir", "D", True),
    ("37", "Kurabiye Dolabı", None, "pogaca-baklava-tesir", "G", True),
    ("38", "Salata Dolabı, Çekmeceli, Motoru Dışarıda", "210×80×125", "saladette", "E", True),
    ("39", "Et Teşhir Dolabı", None, "et-tesir-dolabi", "G", True),
]

# All-day dining: aynı hat, birkaç urunTipi farkı
ALL_DAY_TIP_OVERRIDE: dict[str, str] = {
    "pogaca-baklava-tesir": "sicak-yemek-display",
    "kahvalti-tesir-dolabi": "sicak-yemek-display",
    "pasta-sutlu-tatli-tesir": "pastane-vitrin-soguk",
    "et-tesir-dolabi": "sicak-yemek-display",
    "doner-ocagi": "ocak-4-gozlu",
    "tas-firin": "combi-firin",
    "makeup-unite-3-kapili-mermer": "hazirlik-buzdolabi",
    "tezgah-buzdolabi-3-kapili": "hazirlik-buzdolabi",
    "hamur-yogurma-35lt": "spiral-mikser-hamur",
    "pide-hazirlik-tezgahi": "pizza-prep-tezgahi",
}

TESHIR_NOT = "Teşhir vitrini — şu an tavsiye; opsiyonellik kararı bekleniyor."


def row_to_kalem(
    poz: str,
    isim: str,
    olcu: str | None,
    urun_tipi: str,
    kat: str,
    teshir: bool,
    konsept: str,
) -> dict:
    tip = "tavsiye" if teshir else "zorunlu"
    if konsept == "all-day-dining-cafe":
        urun_tipi = ALL_DAY_TIP_OVERRIDE.get(urun_tipi, urun_tipi)
    notlar = None
    if olcu:
        notlar = f"{olcu} cm"
    if teshir:
        notlar = f"{notlar}; {TESHIR_NOT}" if notlar else TESHIR_NOT
    return {
        "referansPoz": poz,
        "isim": isim,
        "urunTipi": urun_tipi,
        "kategoriKodu": kat,
        "adet": 1,
        "tip": tip,
        **({"notlar": notlar} if notlar else {}),
    }


def build_profile(konsept: str, profil_id: str, label: str) -> dict:
    kalemler = [
        row_to_kalem(poz, isim, olcu, tip, kat, teshir, konsept)
        for poz, isim, olcu, tip, kat, teshir in ROWS
    ]
    zorunlu = sum(1 for k in kalemler if k["tip"] == "zorunlu")
    tavsiye = sum(1 for k in kalemler if k["tip"] == "tavsiye")
    return {
        "id": profil_id,
        "label": label,
        "konsept": konsept,
        "kaynak": "S13-388-2-Model.pdf (Sütiş tipi yerleşim modeli)",
        "referansM2": 220,
        "not": (
            f"Plan ölçüleri ~296 m² (205+89); referans bandı 150–300 m². "
            f"{zorunlu} zorunlu + {tavsiye} teşhir (tavsiye)."
        ),
        "kalemler": kalemler,
    }


def main() -> int:
    payload = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "m2Band": {"min": 150, "max": 300},
        "sources": {
            "layoutPdf": str(PDF),
            "projeKodu": "S13-388",
        },
        "referanslar": {
            "turk-restoran": build_profile(
                "turk-restoran",
                "s13-388-turk-220",
                "S13-388 / Türk Restoranı (~220 m²)",
            ),
            "all-day-dining-cafe": build_profile(
                "all-day-dining-cafe",
                "s13-388-all-day-220",
                "S13-388 / All Day Dining (~220 m²)",
            ),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    z = sum(1 for r in ROWS if not r[5])
    t = sum(1 for r in ROWS if r[5])
    print(f"Wrote {OUT} — {len(ROWS)} kalem ({z} zorunlu, {t} teşhir tavsiye)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
