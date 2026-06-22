#!/usr/bin/env python3
"""SPARO 2026 katalog fiyat listesi (PDF) → sparo-pdf-prices.json

Formül: liste USD × 70% (30% iskonto) → Equsto satış USD
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path.home() / "Downloads" / "SPARO 2026 KATALOG FİYAT LİSTESİ.pdf"
OUT = ROOT / "scripts" / "data" / "sparo" / "sparo-pdf-prices.json"

ISKONTO = 0.30
SATIS_ORAN = 0.70
KDV = 0.20


def normalize_spr_kod(raw: str) -> str:
    m = re.match(r"SPR\s*(\d+(?:\.\d+)?)", raw.strip(), re.I)
    if not m:
        return re.sub(r"\s+", "", raw.upper())
    return f"SPR{m.group(1)}"


def parse_usd_amount(raw: str) -> float:
    s = re.sub(r"\s+", "", str(raw or "").strip())
    if not s:
        raise ValueError("empty price")
    # Türkçe binlik: 6.455 → 6455, 17.800 → 17800
    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", s):
        return float(s.replace(".", ""))
    if re.fullmatch(r"\d+\.\d{3}", s):
        a, b = s.split(".", 1)
        return float(a + b)
    return float(s.replace(",", "."))


def calc_price(liste_usd: float) -> dict:
    liste = round(liste_usd, 2)
    satis = round(liste * SATIS_ORAN, 2)
    return {
        "listeUsd": liste,
        "iskontoOran": ISKONTO,
        "satisUsd": satis,
        "satisOran": SATIS_ORAN,
        "kdvOran": KDV,
    }


def despace(text: str) -> str:
    lines = []
    for line in (text or "").split("\n"):
        line = line.strip()
        if not line:
            continue
        if re.match(r"^([A-Za-z0-9/.\-\u0100-\u017f]\s+){3,}", line):
            line = re.sub(r"(?<=\S)\s+(?=\S)", "", line)
        lines.append(line)
    return "\n".join(lines)


def parse_pdf(pdf_path: Path) -> dict[str, dict]:
    reader = PdfReader(str(pdf_path))
    text = despace("\n".join((p.extract_text() or "") for p in reader.pages))
    # Satır sonu kırılmalarını birleştir (62.2 / 63.2 gibi)
    text = re.sub(r"\n(?=SMOKER)", " ", text)

    items: dict[str, dict] = {}
    line_pat = re.compile(
        r"SPR\s*(\d+(?:\.\d+)?)\s+.+?\s([\d][\d.]*)\s*\$",
        re.I,
    )
    for m in line_pat.finditer(text):
        kod = normalize_spr_kod(f"SPR {m.group(1)}")
        try:
            liste_usd = parse_usd_amount(m.group(2))
        except ValueError:
            continue
        if kod not in items:
            items[kod] = calc_price(liste_usd)

    return items


def main() -> int:
    pdf = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf.is_file():
        print(f"PDF bulunamadı: {pdf}", file=sys.stderr)
        return 1

    prices = parse_pdf(pdf)
    payload = {
        "version": 1,
        "source": pdf.name,
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "formula": "listeUsd * 0.70 = satisUsd (30% iskonto)",
        "iskontoOran": ISKONTO,
        "satisOran": SATIS_ORAN,
        "kdvOran": KDV,
        "currency": "USD",
        "prices": prices,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(prices)} kod)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
