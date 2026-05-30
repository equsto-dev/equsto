# -*- coding: utf-8 -*-
"""PFOS yeme-içecek kategori ağacı + örnek marka eşlemesi."""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

VERI = Path(__file__).resolve().parent
ORNEK_DIR = VERI / "kategori-agaci" / "ornekler"
OUT = VERI / "kategori-agaci" / "pfos-yeme-icecek-agaci.json"

# motorSlug → anahtar kelimeler (işletme adında aranır)
KURAL: list[tuple[str, list[str]]] = [
    ("coffee-shop", [
        "starbucks", "coffee", "kahve", "espresso", "caffe", "nero", "kronotrop",
        "nespresso", "illy", "petra", "voi", "tea", "melez", "gloria", "happymoon",
        "happymoons", "house cafe", "selamlique", "yoort", "cup of joy",
    ]),
    ("steakhouse", [
        "steak", "kasap", "nusret", "welldone", "saltbae", "ranchero", "entrecote",
    ]),
    ("balikci", [
        "balik", "sushi", "sakhalin", "fish", "deniz",
    ]),
    ("kebap-ortadogu", [
        "kebap", "doner", "dürüm", "durum", "pidem", "ramiz", "ziyafe", "ocak",
        "kebab", "usta doner",
    ]),
    ("pizzaci", ["pizza", "eataly", "pidem"]),
    ("meyhane", ["meyhane", "meyhan", "pub", "bar ", "walkers", "jolly joker", "divan pub"]),
    ("turk-restoran", [
        "muhallebi", "lokanta", "ev yemek", "anadolu", "konyali", "tavuk dunyasi",
        "saray", "gram", "morini",
    ]),
    ("all-day-dining-cafe", [
        "bigchefs", "big chefs", "happy moon", "cantinery", "fauchon", "eataly",
    ]),
]

# PFOS konsept ağacı — shopTypes ile uyumlu
KONSEPTLER: list[dict] = [
    {
        "id": "restaurant_steakhouse",
        "ad": "Steakhouse",
        "ustSegment": "Restaurant",
        "motorSlug": "steakhouse",
        "dukkanSecim": "Steakhouse",
        "m2Min": 80,
        "m2Max": 250,
        "teklifKaynagi": "pfos-referans",
        "bantlar": ["80-150", "150-250"],
        "durum": "aktif",
    },
    {
        "id": "restaurant_balik",
        "ad": "Balıkçı / Balık restoran",
        "ustSegment": "Restaurant",
        "motorSlug": "balikci",
        "dukkanSecim": "Balık Restaurant",
        "dukkanAltTipler": ["Mahalle balıkçısı", "Balık Restaurant", "Balık lokantası"],
        "m2Min": 80,
        "m2Max": 250,
        "teklifKaynagi": "pfos-referans",
        "bantlar": ["mahalle", "80-150", "150-250"],
        "durum": "aktif",
    },
    {
        "id": "coffee_shop",
        "ad": "Coffee Shop",
        "ustSegment": "Kafe",
        "motorSlug": "coffee-shop",
        "dukkanSecim": "Coffee Shop",
        "m2Min": 60,
        "m2Max": 300,
        "teklifKaynagi": "referans-json",
        "bantlar": ["referans"],
        "durum": "aktif",
    },
    {
        "id": "restaurant_kebap",
        "ad": "Kebap & Ortadoğu",
        "ustSegment": "Restaurant",
        "motorSlug": "kebap-ortadogu",
        "dukkanSecim": "Kebapçı",
        "m2Min": 200,
        "m2Max": 300,
        "teklifKaynagi": "motor-sablon",
        "bantlar": [],
        "durum": "aktif",
    },
    {
        "id": "pizzaci",
        "ad": "Pizzacı",
        "ustSegment": "Restaurant",
        "motorSlug": "pizzaci",
        "dukkanSecim": "Pizzacı",
        "m2Min": 80,
        "m2Max": 300,
        "teklifKaynagi": "motor-sablon",
        "bantlar": [],
        "durum": "motor",
    },
    {
        "id": "turk_restoran",
        "ad": "Türk Restoranı",
        "ustSegment": "Restaurant",
        "motorSlug": "turk-restoran",
        "dukkanSecim": "Türk Restoranı",
        "m2Min": 100,
        "m2Max": 500,
        "teklifKaynagi": "motor-sablon",
        "bantlar": [],
        "durum": "motor",
    },
    {
        "id": "meyhane",
        "ad": "Meyhane / Mezeli",
        "ustSegment": "Restaurant",
        "motorSlug": "meyhane",
        "dukkanSecim": "Meyhane",
        "m2Min": 100,
        "m2Max": 500,
        "teklifKaynagi": "motor-sablon",
        "bantlar": [],
        "durum": "motor",
    },
    {
        "id": "all_day_dining",
        "ad": "All Day Dining / Cafe",
        "ustSegment": "Restaurant",
        "motorSlug": "all-day-dining-cafe",
        "dukkanSecim": "All Dining Cafe",
        "m2Min": 150,
        "m2Max": 400,
        "teklifKaynagi": "motor-sablon",
        "bantlar": [],
        "durum": "motor",
    },
    {
        "id": "fast_food",
        "ad": "Fast food / QSR",
        "ustSegment": "Fast food",
        "motorSlug": None,
        "dukkanSecim": "Fast food",
        "m2Min": 40,
        "m2Max": 200,
        "teklifKaynagi": "planlanan",
        "bantlar": [],
        "durum": "planlanan",
    },
    {
        "id": "pastane",
        "ad": "Pastane / Fırın",
        "ustSegment": "Kafe",
        "motorSlug": None,
        "dukkanSecim": "Pastane",
        "m2Min": 40,
        "m2Max": 150,
        "teklifKaynagi": "planlanan",
        "bantlar": [],
        "durum": "planlanan",
    },
]


def tr_fold(s: str) -> str:
    tr = str.maketrans("çğıöşüÇĞİÖŞÜâîû", "cgiosucgiosuaiu")
    return s.translate(tr).lower()


def tahmin_konsept(ad: str) -> str | None:
    t = tr_fold(ad)
    for slug, keys in KURAL:
        for k in keys:
            if k in t:
                return slug
    if re.search(r"burger|mcdonald|popeyes|arby|carl|hot dog|fried chicken|shake shack", t):
        return "fast_food"
    if re.search(r"pastane|firin|fırin|bakery|backhaus|krispy|godiva|chocolat", t):
        return "pastane"
    return None


def load_ornekler() -> list[dict]:
    rows = []
    for path in sorted(ORNEK_DIR.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        kid = data.get("kaynakId", path.stem)
        for i in data.get("isletmeler", []):
            rows.append({**i, "kaynakId": kid})
    return rows


def build_agac(konseptler: list[dict]) -> dict:
    by_seg: dict[str, list] = {}
    for k in konseptler:
        seg = k["ustSegment"]
        by_seg.setdefault(seg, []).append(k)

    cocuklar = []
    for seg in sorted(by_seg):
        cocuklar.append(
            {
                "id": slugify_seg(seg),
                "ad": seg,
                "tip": "ust-segment",
                "cocuklar": [
                    {
                        "id": k["id"],
                        "ad": k["ad"],
                        "tip": "konsept",
                        "motorSlug": k.get("motorSlug"),
                        "dukkanSecim": k.get("dukkanSecim"),
                        "m2Min": k["m2Min"],
                        "m2Max": k["m2Max"],
                        "teklifKaynagi": k["teklifKaynagi"],
                        "bantlar": k.get("bantlar", []),
                        "durum": k["durum"],
                        "ornekMarkalar": k.get("ornekMarkalar", []),
                    }
                    for k in by_seg[seg]
                ],
            }
        )
    return {
        "id": "yeme-icecek",
        "ad": "Yeme-İçecek",
        "tip": "kok",
        "cocuklar": cocuklar,
    }


def slugify_seg(s: str) -> str:
    return tr_fold(s).replace(" ", "-")


def main():
    ornekler = load_ornekler()
    buckets: dict[str, list] = {}
    eslesmeyen: list[dict] = []

    for o in ornekler:
        key = tahmin_konsept(o["ad"])
        if key:
            buckets.setdefault(key, []).append(
                {"ad": o["ad"], "kaynakId": o["kaynakId"], "id": o.get("id")}
            )
        else:
            eslesmeyen.append(o)

    konseptler = []
    for k in KONSEPTLER:
        lookup = k.get("motorSlug") or k["id"]
        konseptler.append({**k, "ornekMarkalar": buckets.get(lookup, [])})

    agac = build_agac(konseptler)
    doc = {
        "version": "1",
        "alan": "yeme-icecek",
        "aciklama": "PFOS konsept ve teklif motoru için yeme-içecek alan ağacı",
        "guncelleme": datetime.now(timezone.utc).isoformat(),
        "agac": agac,
        "konseptler": konseptler,
        "ornekKaynaklari": [
            {"kaynakId": "zorlu", "dosya": "ornekler/zorlu-yeme-icecek.json"},
            {"kaynakId": "kanyon", "dosya": "ornekler/kanyon-yeme-icecek.json"},
        ],
        "eslesmeyenOrnekler": [
            {"ad": x["ad"], "kaynakId": x["kaynakId"]} for x in eslesmeyen
        ],
        "ozet": {
            "konseptSayisi": len(konseptler),
            "aktifMotor": sum(1 for k in konseptler if k["durum"] == "aktif"),
            "ornekToplam": len(ornekler),
            "eslesmeyen": len(eslesmeyen),
        },
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OK ->", OUT)
    print(
        f"  {doc['ozet']['konseptSayisi']} konsept, "
        f"{doc['ozet']['ornekToplam']} ornek, "
        f"{doc['ozet']['eslesmeyen']} eslesmeyen"
    )


if __name__ == "__main__":
    main()
