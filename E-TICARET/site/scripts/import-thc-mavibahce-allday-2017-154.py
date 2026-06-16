#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2017-154 THC Mavibahçe (2017-154-2.pdf) → all-day-dining-cafe 200–400 m²

Kaynak: PFOS/kaynaklar/arsiv-projeler/2017-154 THC MAVİBAHÇE/2017-154-2.pdf
Çalışma kopyası: PFOS/veri/proje-veri/2017-154-thc-mavibahce-2.pdf

  python scripts/import-thc-mavibahce-allday-2017-154.py
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
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
ARCHIVE_PDF = (
    SITE.parent.parent
    / "PFOS"
    / "kaynaklar"
    / "arsiv-projeler"
    / "2017-154 THC MAVİBAHÇE"
    / "2017-154-2.pdf"
)
PROJE_VERI = SITE.parent.parent / "PFOS" / "veri" / "proje-veri"
WORK_PDF = PROJE_VERI / "2017-154-thc-mavibahce-2.pdf"
OUT = SITE / "public" / "data" / "pfos-referans"
MANIFEST = SITE / "public" / "data" / "pfos-kategoriler.json"
KORPUS = SITE / "scripts" / "build-pfos-mutfak-korpus.mjs"

KATEGORI_ID = "all-day-dining-cafe"
BANT_ID = "200-400"
REFERANS_M2 = 300
LABEL = "All Day Dining Cafe 200–400 m² (THC Mavibahçe)"
KAYNAK_DOSYA = "2017-154 THC MAVİBAHÇE/2017-154-2.pdf"

BRANDS = re.compile(
    r"^(frenox|özti|ozti|atalay|unox|bosfor|kitchenaid|neo|santos|mazzer|cimbali|arçelik|arcelik|scotsman)\s+",
    re.I,
)

SECTION_RE = re.compile(r"^([A-Z])-(.+)$")
POZ_START = re.compile(r"^([A-Z]\d+[A-Z]?)\s+")
DIM_ADET_PRICE = re.compile(
    r"(\d+\*\d+(?:\*\d+)?(?:/\d+)?)\s+(\d+)\s+[\d.,]+\s*€"
)
ADET_PRICE = re.compile(r"\s(\d+)\s+[\d.,]+\s*€\s*[\d.,]*\s*€?\s*$")
TEMINI = re.compile(r"TEM[İI]N[İI]\s*$", re.I)
IPTAL = re.compile(r"İPTAL|IPTAL", re.I)


def strip_brand(name: str) -> str:
    s = name.strip()
    while True:
        m = BRANDS.match(s)
        if not m:
            break
        s = s[m.end() :].strip()
    s = re.sub(
        r"\s+(frenox|özti|ozti|atalay|unox|bosfor|kitchenaid|neo|santos|mazzer|cimbali|arçelik|arcelik|scotsman)\s*$",
        "",
        s,
        flags=re.I,
    )
    return re.sub(r"\s+", " ", s).strip(" ,")


def is_complete_poz_line(line: str) -> bool:
    return bool(DIM_ADET_PRICE.search(line) or ADET_PRICE.search(line) or TEMINI.search(line))


def is_suffix_continuation(line: str) -> bool:
    s = line.strip()
    if s.startswith("("):
        return True
    return len(s) <= 16 and " " not in s


def normalize_lines(lines: list[str]) -> list[str]:
    """PDF satır kırılmalarını birleştir (ürün adı poz satırından önce/sonra gelebilir)."""
    cleaned: list[str] = []
    pre_poz: list[str] = []
    for line in lines:
        if SECTION_RE.match(line) or line.startswith("POZ.") or line.startswith("*"):
            pre_poz = []
            cleaned.append(line)
            continue
        if POZ_START.match(line):
            poz = POZ_START.match(line).group(1)
            rest = line[POZ_START.match(line).end() :].strip()
            if pre_poz:
                rest = " ".join(pre_poz) + " " + rest
                pre_poz = []
            cleaned.append(f"{poz} {rest}")
            continue
        if cleaned and POZ_START.match(cleaned[-1]):
            if is_suffix_continuation(line) or not is_complete_poz_line(cleaned[-1]):
                cleaned[-1] = cleaned[-1] + " " + line
                continue
        pre_poz.append(line)
    return cleaned


def parse_pdf(path: Path) -> list[dict]:
    lines: list[str] = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            for raw in text.splitlines():
                line = raw.strip()
                if line:
                    lines.append(line)

    lines = normalize_lines(lines)
    rows: list[dict] = []
    bolum = ""
    bolum_ad = ""
    pending_poz: str | None = None
    pending_parts: list[str] = []

    def flush_pending() -> None:
        nonlocal pending_poz, pending_parts
        if not pending_poz:
            return
        blob = " ".join(pending_parts).strip()
        poz = pending_poz
        pending_poz = None
        pending_parts = []
        row = parse_item_line(poz, blob, bolum, bolum_ad)
        if row:
            rows.append(row)

    for line in lines:
        if line.startswith("POZ.") or line.startswith("PROJE ADI"):
            continue
        if line.startswith("*") or line.startswith("ONAYLAYAN"):
            break

        sm = SECTION_RE.match(line)
        if sm:
            flush_pending()
            bolum = sm.group(1)
            bolum_ad = sm.group(2).strip()
            continue

        pm = POZ_START.match(line)
        if pm:
            flush_pending()
            poz = pm.group(1)
            rest = line[pm.end() :].strip()
            row = parse_item_line(poz, rest, bolum, bolum_ad)
            if row:
                rows.append(row)
            else:
                pending_poz = poz
                pending_parts = [rest]
            continue

        if pending_poz:
            pending_parts.append(line)

    flush_pending()
    return rows


def parse_item_line(poz: str, rest: str, bolum: str, bolum_ad: str) -> dict | None:
    if IPTAL.search(rest):
        return None

    olcu = "—"
    adet: int | str = "—"

    dm = DIM_ADET_PRICE.search(rest)
    if dm:
        olcu = dm.group(1).replace("*", "×")
        adet = int(dm.group(2))
        ad_raw = rest[: dm.start()].strip()
    elif TEMINI.search(rest):
        ad_raw = rest
        adet = 1
    else:
        am = ADET_PRICE.search(rest)
        if not am:
            return None
        adet = int(am.group(1))
        ad_raw = rest[: am.start()].strip()
        maybe_dim = re.search(r"(\d+\*\d+(?:\*\d+)?(?:/\d+)?)\s*$", ad_raw)
        if maybe_dim:
            olcu = maybe_dim.group(1).replace("*", "×")
            ad_raw = ad_raw[: maybe_dim.start()].strip()

    ad = strip_brand(ad_raw)
    if not ad:
        return None

    if not bolum:
        bolum = poz[0]
    if not bolum_ad:
        bolum_ad = bolum

    return {
        "bolum": bolum,
        "bolumAd": bolum_ad,
        "poz": poz,
        "ad": ad,
        "olcu": olcu,
        "adet": adet,
    }


def write_liste(kalemler: list[dict]) -> dict:
    toplam = sum(k["adet"] for k in kalemler if isinstance(k["adet"], int))
    yukleme = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    liste = {
        "kategoriId": KATEGORI_ID,
        "bantId": BANT_ID,
        "label": LABEL,
        "referansM2": REFERANS_M2,
        "kaynakDosya": KAYNAK_DOSYA,
        "yukleme": yukleme,
        "kalemSayisi": len(kalemler),
        "toplamAdet": toplam,
        "kalemler": kalemler,
    }
    OUT.mkdir(parents=True, exist_ok=True)
    dest = OUT / f"{KATEGORI_ID}-{BANT_ID}.json"
    dest.write_text(json.dumps(liste, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OK", dest, len(kalemler), "kalem, toplam adet", toplam)
    return {
        "id": BANT_ID,
        "label": "200–400 m² (THC Mavibahçe)",
        "referansM2": REFERANS_M2,
        "meta": {
            "listeDosya": f"{KATEGORI_ID}-{BANT_ID}.json",
            "kalemSayisi": len(kalemler),
            "toplamAdet": toplam,
            "kaynakDosya": KAYNAK_DOSYA,
            "yukleme": yukleme,
        },
    }


def update_manifest(bant: dict) -> None:
    try:
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    except FileNotFoundError:
        manifest = {"version": "1", "updated_at": "", "kategoriler": []}

    kategoriler = list(manifest.get("kategoriler") or [])
    idx = next((i for i, k in enumerate(kategoriler) if k.get("id") == KATEGORI_ID), -1)
    existing = kategoriler[idx] if idx >= 0 else None
    other = [b for b in (existing or {}).get("bantlar") or [] if b.get("id") != BANT_ID]
    kayit = {
        "id": KATEGORI_ID,
        "label": "All Day Dining Cafe",
        "ustKategori": "Restoran",
        "bantlar": sorted([*other, bant], key=lambda b: str(b.get("id", ""))),
    }
    if idx >= 0:
        kategoriler[idx] = kayit
    else:
        kategoriler.append(kayit)
    manifest["kategoriler"] = kategoriler
    manifest["updated_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Manifest:", MANIFEST)


def main() -> None:
    src = ARCHIVE_PDF if ARCHIVE_PDF.is_file() else WORK_PDF
    if not src.is_file():
        print("PDF bulunamadı:", ARCHIVE_PDF, file=sys.stderr)
        sys.exit(1)

    PROJE_VERI.mkdir(parents=True, exist_ok=True)
    if src.resolve() != WORK_PDF.resolve():
        shutil.copy2(src, WORK_PDF)
        print("Kopyalandı:", WORK_PDF)

    kalemler = parse_pdf(WORK_PDF)
    if not kalemler:
        print("Kalem bulunamadı — PDF formatı değişmiş olabilir.", file=sys.stderr)
        sys.exit(1)

    bant = write_liste(kalemler)
    update_manifest(bant)

    try:
        subprocess.run(["node", str(KORPUS)], cwd=SITE, check=True)
    except (subprocess.CalledProcessError, OSError) as e:
        print("Korpus güncellenemedi:", e, file=sys.stderr)


if __name__ == "__main__":
    main()
