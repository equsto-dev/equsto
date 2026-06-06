#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YÜKSEL YERLİ 2025 PDF — Arabalar bölümü (sayfa ~166–194) EUR liste fiyatları."""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf")
OUT = ROOT / "public/data/fiyat-listeleri/yuksel/2025-yerli/araba-fiyatlar.json"
PAGE_FROM = 166
PAGE_TO = 194


def parse_euro(s: str) -> float | None:
    s = unicodedata.normalize("NFKC", s).strip().replace(" ", "")
    m = re.search(r"([\d.,]+)", s)
    if not m:
        return None
    raw = m.group(1)
    if re.match(r"^\d{1,3}(\.\d{3})+$", raw):
        raw = raw.replace(".", "")
    elif "," in raw and "." in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        raw = raw.replace(",", ".")
    try:
        v = float(raw)
        return v if 20 <= v <= 120_000 else None
    except ValueError:
        return None


def fix_code(s: str) -> str:
    s = re.sub(r"\s+", "", s.split("/")[0].strip().upper())
    return re.sub(r"^MO(\d)", r"M0\1", s)


CODE = re.compile(
    r"^(M[BCTMS]\d{2,4}[A-Z0-9]*|M0\d{3,4}[A-Z0-9]*|C\d{3}[A-Z0-9]*)(?:\s*/\s*.+)?$",
    re.I,
)


def extract_araba_prices(pdf_path: Path) -> dict[str, float]:
    doc = fitz.open(pdf_path)
    allp: dict[str, float] = {}

    for pi in range(PAGE_FROM - 1, min(PAGE_TO, doc.page_count)):
        lines = [unicodedata.normalize("NFKC", l).strip() for l in doc[pi].get_text().splitlines()]
        lines = [l for l in lines if l]
        i = 0
        while i < len(lines):
            raw = lines[i].split("/")[0].strip()
            if not CODE.match(raw) and not re.match(r"^MO\d", raw, re.I):
                i += 1
                continue
            codes: list[str] = []
            while i < len(lines):
                part = lines[i].split("/")[0].strip()
                if CODE.match(part) or re.match(r"^MO\d", part, re.I):
                    codes.append(fix_code(lines[i]))
                    i += 1
                else:
                    break
            prices: list[float] = []
            while i < len(lines) and len(prices) < len(codes):
                part = lines[i].split("/")[0].strip()
                if CODE.match(part) or re.match(r"^MO\d", part, re.I):
                    break
                v = parse_euro(lines[i])
                if v is not None:
                    prices.append(v)
                i += 1
            for c, p in zip(codes, prices):
                allp[c] = p

    # Avatherm tepsi arabası — sayfa 166
    lines = [unicodedata.normalize("NFKC", l).strip() for l in doc[165].get_text().splitlines()]
    lines = [l for l in lines if l]
    for i, l in enumerate(lines):
        if l == "150225" and i + 1 < len(lines):
            v = parse_euro(lines[i + 1])
            if v:
                allp["150225"] = v
        if l == "150235" and i + 1 < len(lines):
            v = parse_euro(lines[i + 1])
            if v:
                allp["150235"] = v

    return allp


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.is_file():
        print("PDF bulunamadı:", pdf_path)
        sys.exit(1)
    prices = extract_araba_prices(pdf_path)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(prices, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[yuksel-araba] {len(prices)} model -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
