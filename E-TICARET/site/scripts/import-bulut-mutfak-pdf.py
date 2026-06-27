#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Bulut mutfak PDF listeleri → pfos-referans + pfos-kategoriler.json

Kaynak (varsayılan):
  c:\\Users\\adema\\Desktop\\bulut mutfak\\hamburgerci.pdf
  c:\\Users\\adema\\Desktop\\bulut mutfak\\ev-yemekleri.pdf

  python scripts/import-bulut-mutfak-pdf.py
"""
from __future__ import annotations

import json
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("pdfplumber gerekli: pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT
DESKTOP = Path(r"c:\Users\adema\Desktop\bulut mutfak")
PROJE_VERI = SITE.parent.parent / "PFOS" / "veri" / "proje-veri" / "BULUT MUTFAK"
OUT = SITE / "public" / "data" / "pfos-referans"
MANIFEST = SITE / "public" / "data" / "pfos-kategoriler.json"

BANT_ID = "40-80"
REFERANS_M2 = 60

KONFIG = [
    {
        "pdf": "hamburgerci.pdf",
        "kategori_id": "bulut-burger",
        "label": "Bulut Mutfak — Hamburgerci",
        "manifest_label": "Hamburgerci",
        "konsept_title": "HAMBURGERCİ",
    },
    {
        "pdf": "ev-yemekleri.pdf",
        "kategori_id": "bulut-ev-yemek",
        "label": "Bulut Mutfak — Ev Yemekleri",
        "manifest_label": "Ev Yemekleri",
        "konsept_title": "EV YEMEKLERİ",
    },
]

SECTION_RE = re.compile(r"^([A-Z])-\s*(.+)$")
POZ_RE = re.compile(r"^([A-Z]\d+)\s+(.+)$")
ADET_TAIL = re.compile(r"\s(\d+)\s*$")
OLCU_DIM = re.compile(
    r"(\d+\*\d+(?:\*\d+)?(?:/\d+)?|Ø\d+\*\d+|500\s*Tb/saat|-)\s*$",
    re.I,
)

BOLUM_MAP = {
    "A": "KURU_DEPO",
    "B": "SOGUK_ODA",
    "C": "DEEPFREEZE_DEPO",
    "D": "PISIRME",
    "E": "BULASIK_YIKAMA",
    "Y": "YER_IZGARASI",
}


def infer_kategori(ad: str) -> str:
    u = ad.upper()
    if any(
        x in u
        for x in (
            "TEZGAH",
            "RAF",
            "LAVABO",
            "EVYE",
            "EVYEL",
            "SIYIRMA",
            "BASKET",
            "ÇALIŞMA",
            "CALISMA",
        )
    ):
        return "tezgah"
    return "diger"


def parse_line(poz: str, rest: str, bolum_ad: str, bolum: str) -> dict | None:
    m_adet = ADET_TAIL.search(rest)
    if not m_adet:
        return None
    adet = int(m_adet.group(1))
    body = rest[: m_adet.start()].strip()
    olcu = "—"
    ad = body
    m_olcu = OLCU_DIM.search(body)
    if m_olcu:
        olcu = m_olcu.group(1).strip()
        ad = body[: m_olcu.start()].strip().rstrip(",").strip()
    if not ad:
        return None
    if bolum == "PISIRME" and "MUTFAK" in bolum_ad.upper():
        bolum = "MUTFAK"
    return {
        "bolum": bolum,
        "bolumAd": bolum_ad,
        "poz": poz,
        "ad": ad,
        "olcu": olcu,
        "adet": adet,
        "kategori": infer_kategori(ad),
    }


def parse_pdf(path: Path) -> list[dict]:
    kalemler: list[dict] = []
    bolum_ad = ""
    bolum = "GENEL"
    skip_titles = {"", "P.NO ÜRÜN ADI ÖLÇÜ AD.", "P.NO URUN ADI OLCU AD."}

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for raw_line in text.splitlines():
                line = raw_line.strip()
                if not line or line.upper() in skip_titles:
                    continue
                if line.isupper() and " " not in line and len(line) > 3:
                    continue
                sm = SECTION_RE.match(line)
                if sm:
                    letter = sm.group(1)
                    bolum_ad = line
                    bolum = BOLUM_MAP.get(letter, letter)
                    continue
                pm = POZ_RE.match(line)
                if not pm:
                    continue
                item = parse_line(pm.group(1), pm.group(2), bolum_ad, bolum)
                if item:
                    kalemler.append(item)
    return kalemler


def write_liste(cfg: dict, kalemler: list[dict], kaynak: str) -> dict:
    kid = cfg["kategori_id"]
    toplam = sum(k["adet"] for k in kalemler if isinstance(k["adet"], int))
    yukleme = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    payload = {
        "kategoriId": kid,
        "bantId": BANT_ID,
        "label": cfg["label"],
        "referansM2": REFERANS_M2,
        "kaynakDosya": kaynak,
        "yukleme": yukleme,
        "kalemSayisi": len(kalemler),
        "toplamAdet": toplam,
        "kalemler": kalemler,
    }
    dest = OUT / f"{kid}-{BANT_ID}.json"
    dest.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"OK {dest} — {len(kalemler)} kalem, toplamAdet {toplam}")
    return payload


def upsert_manifest(cfg: dict, payload: dict) -> None:
    manifest = {"version": "1", "updated_at": "", "kategoriler": []}
    if MANIFEST.is_file():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    kategoriler = manifest.get("kategoriler") or []
    meta = {
        "listeDosya": f"{cfg['kategori_id']}-{BANT_ID}.json",
        "kalemSayisi": payload["kalemSayisi"],
        "toplamAdet": payload["toplamAdet"],
        "kaynakDosya": payload["kaynakDosya"],
        "yukleme": payload["yukleme"],
    }
    kayit = {
        "id": cfg["kategori_id"],
        "label": cfg["manifest_label"],
        "ustKategori": "Bulut Mutfak",
        "bantlar": [
            {
                "id": BANT_ID,
                "label": "40–80 m²",
                "referansM2": REFERANS_M2,
                "meta": meta,
            }
        ],
    }
    idx = next((i for i, k in enumerate(kategoriler) if k.get("id") == cfg["kategori_id"]), -1)
    if idx >= 0:
        kategoriler[idx] = kayit
    else:
        kategoriler.append(kayit)
    manifest["kategoriler"] = kategoriler
    manifest["updated_at"] = payload["yukleme"]
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Manifest güncellendi: {cfg['kategori_id']}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    PROJE_VERI.mkdir(parents=True, exist_ok=True)

    for cfg in KONFIG:
        src = DESKTOP / cfg["pdf"]
        if not src.is_file():
            raise FileNotFoundError(f"PDF bulunamadı: {src}")
        archive = PROJE_VERI / cfg["pdf"]
        shutil.copy2(src, archive)
        kalemler = parse_pdf(src)
        if not kalemler:
            raise RuntimeError(f"Kalem çıkarılamadı: {src}")
        payload = write_liste(cfg, kalemler, f"BULUT MUTFAK/{cfg['pdf']}")
        upsert_manifest(cfg, payload)

    # Eski bant dosyasını kaldır
    old = OUT / "bulut-burger-35-100.json"
    if old.is_file():
        old.unlink()
        print("Silindi:", old)


if __name__ == "__main__":
    main()
