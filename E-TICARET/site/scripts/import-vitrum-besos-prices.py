#!/usr/bin/env python3
"""Vitrum Bar Price List (PDF) → vitrum-besos-prices.json

Formül: liste × (1 − 0,25 iskonto) × (1 + 0,20 KDV) = KDV dahil satış (EUR)
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path.home() / "Downloads" / "Vitrum+Bar+Price+List+October+2025.pdf"
OUT = ROOT / "public" / "data" / "vitrum-besos-prices.json"

ISKONTO = 0.25
KDV = 0.20

SIGNATURE_TO_CODE = {
    "The Manhattan": "BES-P23",
    "The Boulverdier": "BES-P24",
    "The Boulevardier": "BES-P24",
    "The Clover": "BES-P25",
}

CATALOG_ALIASES = {
    "PL/IM.N-07": "PL/IM.N-08",
    "PL/BM.S.N.3-09": "PL/SM.S.N.3-09",
    "PL/NM.ND.2": "PL/NM.ND-2",
    "SL/SM-04": "PL/SM-04",
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


def calc_price(liste_eur: float) -> dict:
    net = round(liste_eur * (1 - ISKONTO), 2)
    kdv_dahil = round(net * (1 + KDV), 2)
    return {
        "listeEur": liste_eur,
        "iskontoOran": ISKONTO,
        "netEur": net,
        "kdvOran": KDV,
        "fiyatEurKdvDahil": kdv_dahil,
    }


def parse_pdf(pdf_path: Path) -> dict[str, dict]:
    reader = PdfReader(str(pdf_path))
    text = despace("\n".join((p.extract_text() or "") for p in reader.pages))

    items: dict[str, dict] = {}

    code_pat = re.compile(
        r"(PL/[A-Z0-9./\-]+|SL/[A-Z0-9./\-]+|BL/[A-Z0-9./\-]+|ML/[A-Z0-9./\-]+|AG-[A-Z0-9]+)\s*(\d[\d\s]*)",
        re.I,
    )
    for m in code_pat.finditer(text):
        code = re.sub(r"\s+", "", m.group(1))
        price = int(re.sub(r"\s", "", m.group(2)))
        canon = CATALOG_ALIASES.get(code, code)
        if canon not in items:
            items[canon] = calc_price(price)
            items[canon]["pdfCode"] = code

    name_pat = re.compile(
        r"The\s*(Manhattan|Boulverdier|Boulevardier|Clover)\s*(\d[\d\s]*)",
        re.I,
    )
    for m in name_pat.finditer(text):
        name = "The " + m.group(1).title()
        if name == "The Boulevardier":
            name = "The Boulverdier"
        code = SIGNATURE_TO_CODE[name]
        price = int(re.sub(r"\s", "", m.group(2)))
        if code not in items:
            items[code] = calc_price(price)
            items[code]["pdfLabel"] = name

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
        "formula": "listeEur * 0.75 * 1.20 = fiyatEurKdvDahil",
        "iskontoOran": ISKONTO,
        "kdvOran": KDV,
        "currency": "EUR",
        "prices": prices,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({len(prices)} codes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
