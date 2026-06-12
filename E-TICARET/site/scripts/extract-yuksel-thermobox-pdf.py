#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""YÜKSEL YERLİ 2025 PDF — Avatherm Thermobox (sayfa ~152–170) EUR liste fiyatları."""
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
OUT = ROOT / "public/data/fiyat-listeleri/yuksel/2025-yerli/thermobox-fiyatlar.json"
PAGE_FROM = 152
PAGE_TO = 170

# yukselendustriyel.com/thermobox slug → liste EUR (PDF spot-check 2026-06)
SLUG_LIST_EUR: dict[str, float] = {
    "avatherm-tepsi-tasima-arabasi-12": 424.0,
    "avatherm-tepsi-tasima-arabasi-20": 1275.0,
    "avatherm-kilitli-resital-tepsi": 71.0,
    "avatherm-kilitli-prestij-tepsi": 71.0,
    "avatherm-menu-mobil": 142.0,
    "avatherm-prestij-tepsi": 71.0,
    "avatherm-resital-tepsi": 71.0,
    "av11-kare-servis-cantasi": 80.0,
    "av12-dikdortgen-servis-cantasi": 80.0,
    "av13-kucuk-boy-pizza-cantasi": 80.0,
    "av14-orta-boy-pizza-cantasi": 80.0,
    "av15-buyuk-boy-pizza-cantasi": 80.0,
    "av16-pide-cantasi": 34.0,
    "av17-buyuk-multi-servis-cantasi": 34.0,
    "av18-ekstra-cepli-pizza-cantasi": 34.0,
    "avatherm-640-thermobox": 215.0,
    "avatherm-pizzabox": 255.0,
    "avatherm-ergoline": 255.0,
    "avatherm-hamur-tekne-ve-kapagi": 74.0,
    "avatherm-hamur-tepsisi": 34.0,
    "avatherm-660-thermobox": 675.0,
    "avatherm-630-thermobox": 335.0,
    "avatherm-180": 184.0,
    "avatherm-f55": 361.0,
    "avatherm-f40": 314.0,
    "avatherm-f25": 263.0,
    "avatherm-f20": 198.0,
    "avatherm-f10": 165.0,
    "avatherm-waterbox": 445.0,
    "avatherm-50-thermobox": 225.0,
    "avatherm-100-thermobox": 214.0,
    "avatherm-200-thermobox": 314.0,
    "avatherm-300-thermobox": 241.0,
    "avatherm-601-thermobox": 225.0,
    "avatherm-601-m-thermobox": 251.0,
    "avatherm-600x2-thermobox": 639.0,
    "avatherm-600x2-double-thermobox": 2140.0,
}

# yukselsatis slug → yukselendustriyel slug (fiyat eşlemesi)
SLUG_ALIASES: dict[str, str] = {
    "avatherm-prestige-tepsi": "avatherm-prestij-tepsi",
    "avatherm-f180": "avatherm-180",
    "avatherm-640": "avatherm-640-thermobox",
    "avatherm-630-thermobox": "avatherm-630-thermobox",
    "avatherm-660-thermobox": "avatherm-660-thermobox",
    "avatherm-hamur-tepsisi": "avatherm-hamur-tepsisi",
    "avatherm-menu-mobile": "avatherm-menu-mobil",
    "avatherm-600x2": "avatherm-600x2-thermobox",
    "avatherm-600x2-double": "avatherm-600x2-double-thermobox",
    "avatherm-600m-2": "avatherm-601-m-thermobox",
    "avatherm-601m": "avatherm-601-m-thermobox",
    "avatherm-601": "avatherm-601-thermobox",
    "avatherm-600m": "avatherm-601-m-thermobox",
    "avatherm-50": "avatherm-50-thermobox",
    "avatherm-100": "avatherm-100-thermobox",
    "avatherm-200": "avatherm-200-thermobox",
    "avatherm-300": "avatherm-300-thermobox",
    "avatherm-400": "avatherm-400-thermobox",
}

# yukselsatis-only / eski satır adı → liste EUR
NAME_LIST_EUR: dict[str, float] = {
    "AVATHERM 600": 251.0,
    "AVATHERM 600M": 639.0,
    "AVATHERM 600M TEKERLEKLİ": 639.0,
    "AVATHERM 600M DOUBLE": 2140.0,
    "AVATHERM 600X2 DOUBLE": 2140.0,
    "AVATHERM 601M": 251.0,
    "AVATHERM 400": 254.0,
    "AVATHERM F180": 184.0,
    "Avatherm Ergoline": 255.0,
}


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
        return v if 20 <= v <= 5000 else None
    except ValueError:
        return None


def extract_code_prices(pdf_path: Path) -> dict[str, float]:
    doc = fitz.open(pdf_path)
    prices: dict[str, float] = {}
    code_re = re.compile(r"^(100\d{3}|150\d{3})$")

    for pi in range(PAGE_FROM - 1, min(PAGE_TO, doc.page_count)):
        lines = [unicodedata.normalize("NFKC", l).strip() for l in doc[pi].get_text().splitlines()]
        lines = [l for l in lines if l]
        current: float | None = None
        for line in lines:
            pm = re.match(r"^([\d.,]+)\s*€$", line)
            if pm:
                v = parse_euro(pm.group(1))
                if v is not None:
                    current = v
                continue
            if code_re.match(line) and current is not None:
                prices[line] = current

    # Sayfa 170 — 660 thermobox fiyatı blok sonunda
    if prices.get("100256", 0) < 100:
        prices["100256"] = 675.0

    # Tepsi taşıma arabası — sayfa 166 net kod fiyatları
    overrides = {
        "150225": 424.0,
        "150235": 1275.0,
        "100250": 335.0,
        "100260": 34.0,
        "100265": 46.0,
        "100270": 28.0,
        "100256": 675.0,
        "100436": 142.0,
        "100446": 71.0,
        "100461": 71.0,
        "100491": 71.0,
        "100100": 225.0,
        "100110": 214.0,
        "100116": 314.0,
        "100118": 241.0,
        "100130": 254.0,
        "100147": 225.0,
        "100162": 251.0,
        "100210": 639.0,
        "100220": 757.0,
        "100227": 2140.0,
        "100395": 184.0,
        "100405": 165.0,
        "100410": 198.0,
        "100415": 263.0,
        "100420": 314.0,
        "100425": 361.0,
        "100275": 215.0,
        "100315": 255.0,
        "100345": 80.0,
        "100350": 80.0,
        "100355": 80.0,
        "100360": 80.0,
        "100365": 80.0,
        "100370": 34.0,
        "100375": 34.0,
        "100380": 34.0,
        "100141": 445.0,
    }
    prices.update(overrides)
    return prices


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.is_file():
        print("PDF bulunamadı:", pdf_path)
        sys.exit(1)

    codes = extract_code_prices(pdf_path)
    out = {
        "_meta": {
            "kaynak": "YÜKSEL YERLİ - 2025",
            "sayfa": f"{PAGE_FROM}-{PAGE_TO}",
            "slug_count": len(SLUG_LIST_EUR),
            "code_count": len(codes),
        },
        "by_slug": SLUG_LIST_EUR,
        "by_code": codes,
        "slug_aliases": SLUG_ALIASES,
        "by_name": NAME_LIST_EUR,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"[yuksel-thermobox] {len(SLUG_LIST_EUR)} slug, {len(codes)} kod -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
