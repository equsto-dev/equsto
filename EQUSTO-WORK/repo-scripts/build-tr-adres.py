#!/usr/bin/env python3
"""İl / ilçe / mahalle JSON üretir (sokak yok). Kaynak: bertugfahriozer/il_ilce_mahalle."""
from __future__ import annotations

import json
import re
import ssl
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "data" / "tr-adres.json"
SOURCE_URL = (
    "https://raw.githubusercontent.com/bertugfahriozer/il_ilce_mahalle/master/il_ilce_mahalle.json"
)

# 81 il — plaka sırası (Türkçe resmi ad)
ILLER = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
    "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
    "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
    "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
    "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van",
    "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak",
    "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce",
]

POP_FILE = Path(__file__).resolve().parent / "il-population-2023.json"


def load_nufus() -> dict[str, int]:
    if POP_FILE.exists():
        return json.loads(POP_FILE.read_text(encoding="utf-8"))
    return {}


NUFUS_BY_NAME = load_nufus()


def ascii_key(s: str) -> str:
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.upper().replace("İ", "I")
    return re.sub(r"[^A-Z0-9]", "", s)


def title_tr(s: str) -> str:
    s = re.sub(r"\s+", " ", s.strip())
    if not s:
        return s
    parts = s.split(" ")
    out = []
    for p in parts:
        if p.upper() in ("VE", "DE", "DA"):
            out.append(p.lower())
        else:
            out.append(p[:1].upper() + p[1:].lower() if len(p) > 1 else p.upper())
    return " ".join(out)


def clean_mahalle(name: str) -> str:
    name = re.sub(r"\s+", " ", name.strip())
    name = re.sub(r"\s+Mah\.?$", "", name, flags=re.I)
    name = re.sub(r"\s+Köyü?$", "", name, flags=re.I)
    return title_tr(name)


def clean_ilce(name: str) -> str:
    return title_tr(name.strip())


def fetch_source() -> dict:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(SOURCE_URL, context=ctx, timeout=120) as r:
        return json.loads(r.read().decode("utf-8"))


def build() -> dict:
    raw = fetch_source()
    by_key = {ascii_key(k): (k, v) for k, v in raw.items()}
    provinces = []
    missing = []

    for i, il_adi in enumerate(ILLER, start=1):
        key = ascii_key(il_adi)
        entry = by_key.get(key)
        if not entry:
            missing.append(il_adi)
            continue
        _, ilce_map = entry
        districts = []
        for ilce_raw, mah_list in sorted(ilce_map.items(), key=lambda x: clean_ilce(x[0])):
            mahalleler = sorted(
                {clean_mahalle(m) for m in mah_list if m and clean_mahalle(m)},
                key=lambda x: x.casefold(),
            )
            districts.append(
                {
                    "id": f"{i:02d}-{ascii_key(ilce_raw)[:24]}",
                    "name": clean_ilce(ilce_raw),
                    "neighborhoods": mahalleler,
                }
            )
        pop = NUFUS_BY_NAME.get(il_adi, 0)
        provinces.append(
            {"id": i, "plate": i, "name": il_adi, "population": pop, "districts": districts}
        )

    if missing:
        print("UYARI: eşleşmeyen iller:", missing)

    provinces.sort(key=lambda p: p.get("population") or 0, reverse=True)

    return {
        "version": 1,
        "source": "il_ilce_mahalle (TÜİK tabanlı topluluk verisi; sokak dahil değil)",
        "provinces": provinces,
    }


def main() -> None:
    data = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n_ilce = sum(len(p["districts"]) for p in data["provinces"])
    n_mah = sum(len(d["neighborhoods"]) for p in data["provinces"] for d in p["districts"])
    print(f"Wrote {OUT} — {len(data['provinces'])} il, {n_ilce} ilçe, {n_mah} mahalle, {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
