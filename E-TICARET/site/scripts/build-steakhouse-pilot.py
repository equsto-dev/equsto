#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""steak.pdf + S13-117-8-steakhouse.pdf → S13-117-steakhouse-pilot.json"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PILOT_DIR = ROOT / "public" / "data" / "referans-pilot"
OUT = PILOT_DIR / "S13-117-steakhouse-pilot.json"

SECTION_ZONE = {
    "A": ("kuru_depo", "A- Kuru Depo"),
    "B": ("soguk_oda", "B- Soğuk Oda"),
    "C": ("derin_dondurucu", "C- Deepfreeze Depo"),
    "D": ("et_hazirlik", "D- Hazırlık Bölümü"),
    "E": ("pastane", "E- Hamur Hazırlık"),
    "F": ("ana_mutfak", "F- Pişirme"),
    "G": ("show_mutfagi", "G- Ön Mutfak / Et Teşhir"),
    "H": ("sebze_hazirlik", "H- Soğuk Hazırlık"),
    "J": ("bulasikhane", "J- Bulaşık Yıkama"),
    "I": ("bar", "I- İçecek"),
    "Y": ("izgara_meze", "Y- Yer Izgara"),
}

# Kullanıcı doğrulaması (plan PDF m²)
ZONE_M2 = {
    "show_mutfagi": 36,
    "soguk_oda": 6,
    "derin_dondurucu": 5,
    "et_hazirlik": 10,
    "ana_mutfak": 10,
    "bar": 10,
    "sebze_hazirlik": 8,
    "pastane": 9,
    "kuru_depo": 8,
    "bulasikhane": 16,
}
STATION_M2_LABELS = {
    "Ön Mutfak": 36,
    "Soğuk Oda": 6,
    "Derin Dondurucu Oda": 5,
    "Et & Sebze Hazırlık": 10,
    "Pişirme": 10,
    "İçecek & Servis": 10,
    "Soğuk Hazırlık": 8,
    "Hamur Hazırlık": 9,
    "Kuru Depo": 8,
    "Bulaşık Yıkama": 16,
}
BRUT_TOTAL = 270
MASA_OTURUM = 128

SEC_HEAD = re.compile(r"^([A-Z])-\s+(.+)$", re.I)
POS_RE = re.compile(r"^([A-Z]\d+)$", re.I)
DIM_RE = re.compile(r"^\d+\*[\d*./]+|\d+[.,]\d+\s*(lt|kg|Tb)|^Ø\d|^-+$", re.I)


def read_pdf_text(path: Path) -> str:
    import fitz

    doc = fitz.open(str(path))
    text = "\n".join(page.get_text() for page in doc)
    doc.close()
    return text


def parse_steak_list(text: str) -> dict:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    zones: dict = {}
    cur_sec: str | None = None
    cur_pos: str | None = None
    pending_name: str | None = None

    for ln in lines:
        if ln in ("P.NO", "ÜRÜN ADI", "ÖLÇÜ", "AD.", "01- STEAKHOUSE"):
            continue
        m = SEC_HEAD.match(ln)
        if m:
            cur_sec = m.group(1).upper()
            zk, title = SECTION_ZONE.get(cur_sec, (None, ln))
            if zk:
                zones.setdefault(
                    zk,
                    {
                        "zone_key": zk,
                        "section_code": cur_sec,
                        "title": title,
                        "items": [],
                    },
                )
            cur_pos = None
            pending_name = None
            continue
        if not cur_sec or cur_sec not in SECTION_ZONE:
            continue
        zk = SECTION_ZONE[cur_sec][0]
        if POS_RE.match(ln):
            cur_pos = ln.upper()
            pending_name = None
            continue
        if cur_pos and DIM_RE.match(ln):
            qty = None
            pending_name = pending_name or ""
            zones[zk]["items"].append(
                {
                    "poz": cur_pos,
                    "name": pending_name,
                    "olcu": ln,
                    "adet": qty,
                }
            )
            cur_pos = None
            pending_name = None
            continue
        if cur_pos and ln.isdigit():
            if zones[zk]["items"]:
                zones[zk]["items"][-1]["adet"] = int(ln)
            cur_pos = None
            continue
        if cur_pos:
            pending_name = ln
            continue

    return zones


def main() -> None:
    list_text = read_pdf_text(PILOT_DIR / "steak.pdf")
    plan_text = read_pdf_text(PILOT_DIR / "S13-117-8-steakhouse.pdf")

    zones = parse_steak_list(list_text)
    mutfak_sum = sum(ZONE_M2.values())

    pilot = {
        "id": "S13-117",
        "baslik": "Steakhouse (S13-117-8)",
        "konsept": "Steakhouse",
        "dukkan": "Steakhouse",
        "source_files": [
            "steak.pdf",
            "S13-117-8-steakhouse.pdf",
        ],
        "alan_m2": {
            "brut_toplam": BRUT_TOTAL,
            "masa_oturum": MASA_OTURUM,
            "pfos_alan": BRUT_TOTAL,
            "mutfak_toplam": mutfak_sum,
            "zones": ZONE_M2,
            "station_m2_labels": STATION_M2_LABELS,
            "note": "Kullanıcı doğrulaması: brüt 270 m²; salon 128 m².",
        },
        "pfos_zones": list(ZONE_M2.keys()) + ["izgara_meze"],
        "zones": zones,
        "plan_labels": [
            ln.strip()
            for ln in plan_text.splitlines()
            if ln.strip()
            and re.search(
                r"mutfak|depo|hazir|bula|pişir|pisir|izgara|içecek|icecek|teşhir|teshir|servis",
                ln,
                re.I,
            )
        ],
        "item_count": sum(len(z["items"]) for z in zones.values()),
    }

    OUT.write_text(json.dumps(pilot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT}")
    print(f"Zones: {len(zones)}  Items: {pilot['item_count']}  Brüt: {BRUT_TOTAL}  Mutfak: {mutfak_sum}")


if __name__ == "__main__":
    main()
