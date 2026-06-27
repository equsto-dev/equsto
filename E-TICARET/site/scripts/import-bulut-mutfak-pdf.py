#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Bulut mutfak PDF → pfos-referans (birebir, yorum yok)."""
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
        "manifest_label": "Hamburgerci",
        "konsept_title": "HAMBURGERCİ",
    },
    {
        "pdf": "ev-yemekleri.pdf",
        "kategori_id": "bulut-ev-yemek",
        "manifest_label": "Ev Yemekleri",
        "konsept_title": "EV YEMEKLERİ",
    },
    {
        "pdf": "donerci.pdf",
        "kategori_id": "bulut-doner",
        "manifest_label": "Dönerci",
        "konsept_title": "DÖNERCİ",
    },
    {
        "pdf": "kebap-turk-mutfagi.pdf",
        "kategori_id": "bulut-kebap",
        "manifest_label": "Kebap & Türk Mutfağı",
        "konsept_title": "KEBAP & TÜRK MUTFAĞI",
    },
    {
        "pdf": "mantici.pdf",
        "kategori_id": "bulut-manti",
        "manifest_label": "Mantıcı",
        "konsept_title": "MANTICI",
    },
    {
        "pdf": "pastane-firin.pdf",
        "kategori_id": "bulut-pastane-firin",
        "manifest_label": "Pastane & Fırın",
        "konsept_title": "PASTANE & FIRIN",
    },
    {
        "pdf": "pide-lahmacun.pdf",
        "kategori_id": "bulut-pide",
        "manifest_label": "Pide & Lahmacun",
        "konsept_title": "PİDE & LAHMACUN",
    },
    {
        "pdf": "pizzaci.pdf",
        "kategori_id": "bulut-pizza",
        "manifest_label": "Pizzacı",
        "konsept_title": "PİZZACI",
    },
    {
        "pdf": "salata-sandvic-kahvalti.pdf",
        "kategori_id": "bulut-salata-sandvic",
        "manifest_label": "Salata / Sandviç / Kahvaltı",
        "konsept_title": "SALATA & SANDVİÇ & KAHVALTI",
    },
    {
        "pdf": "tavukcu.pdf",
        "kategori_id": "bulut-tavuk",
        "manifest_label": "Tavukçu",
        "konsept_title": "TAVUKÇU",
    },
    {
        "pdf": "balikci.pdf",
        "kategori_id": "bulut-balik",
        "manifest_label": "Balıkçı",
        "konsept_title": "BALIKÇI",
    },
    {
        "pdf": "corbaci.pdf",
        "kategori_id": "bulut-corbaci",
        "manifest_label": "Çorbacı",
        "konsept_title": "ÇORBACI",
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


def bolum_slug(poz: str, bolum_ad: str) -> str:
    letter = poz[0].upper()
    slug = BOLUM_MAP.get(letter, letter)
    if slug == "PISIRME" and "MUTFAK" in bolum_ad.upper():
        return "MUTFAK"
    return slug


def parse_line(poz: str, rest: str, bolum_ad: str) -> dict | None:
    m_adet = ADET_TAIL.search(rest)
    if not m_adet:
        return None
    adet = int(m_adet.group(1))
    body = rest[: m_adet.start()].strip()
    olcu = "-"
    ad = body
    m_olcu = OLCU_DIM.search(body)
    if m_olcu:
        olcu = m_olcu.group(1).strip()
        ad = body[: m_olcu.start()].strip().rstrip(",").strip()
    if not ad:
        return None
    return {
        "bolum": bolum_slug(poz, bolum_ad),
        "bolumAd": bolum_ad,
        "poz": poz,
        "ad": ad,
        "olcu": olcu,
        "adet": adet,
    }


def parse_pdf(path: Path) -> list[dict]:
    kalemler: list[dict] = []
    bolum_ad = ""
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
                if SECTION_RE.match(line):
                    bolum_ad = line
                    continue
                pm = POZ_RE.match(line)
                if not pm:
                    continue
                item = parse_line(pm.group(1), pm.group(2), bolum_ad)
                if item:
                    kalemler.append(item)
    return kalemler


def pdf_kaynak(cfg: dict) -> Path:
    for base in (DESKTOP, PROJE_VERI):
        p = base / cfg["pdf"]
        if p.is_file():
            return p
    raise FileNotFoundError(cfg["pdf"])


def write_liste(cfg: dict, kalemler: list[dict], kaynak: str) -> dict:
    kid = cfg["kategori_id"]
    toplam = sum(k["adet"] for k in kalemler if isinstance(k["adet"], int))
    yukleme = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    payload = {
        "kategoriId": kid,
        "bantId": BANT_ID,
        "label": cfg["konsept_title"],
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
        src = pdf_kaynak(cfg)
        archive = PROJE_VERI / cfg["pdf"]
        if src.resolve() != archive.resolve():
            shutil.copy2(src, archive)
        kalemler = parse_pdf(src)
        if not kalemler:
            raise RuntimeError(f"Kalem çıkarılamadı: {src}")
        payload = write_liste(cfg, kalemler, f"BULUT MUTFAK/{cfg['pdf']}")
        upsert_manifest(cfg, payload)


if __name__ == "__main__":
    main()
