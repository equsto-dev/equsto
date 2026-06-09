#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""SAMİXİR KATALOG 2026 PDF → liste EUR fiyatları"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "data" / "samixir" / "samixir-pdf-catalog.json"
RAPOR = ROOT / "scripts" / "data" / "samixir" / "samixir-pdf-rapor.md"
PDF = Path(
    os.environ.get(
        "SAMIXIR_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\SAMİXİR KATALOG 2026 (1).pdf",
    )
)

CODE_RE = re.compile(r"^[A-Z][A-Z0-9]{1,}(?:\.[A-Z0-9]{1,6})+$")
SKIP = {
    "RGB",
    "LED",
    "ANALOG",
    "DİJİTAL",
    "Dijital",
    "MONO",
    "TWIN",
    "TRIPLE",
    "SARI",
    "SİYAH",
    "INOX",
    "GOLD",
    "HOT",
    "HAKKIMIZDA",
    "BEYAZ",
    "YENİ",
    "ANALOGTERMOSTAT",
    "DİJİTALTERMOSTAT",
    "LEDAYDINLATMABEYAZ",
    "PANORAMİK",
    "SERİSİ",
}


def parse_eur(raw: str) -> float | None:
    s = raw.strip().replace("€", "").replace("+", "").strip()
    if not s:
        return None
    if re.match(r"^\d{1,3}(\.\d{3})+$", s):
        return float(s.replace(".", ""))
    if re.match(r"^\d{1,3}(\.\d{3})+,\d+$", s):
        return float(s.replace(".", "").replace(",", "."))
    if "," in s:
        return float(s.replace(".", "").replace(",", "."))
    try:
        return float(s)
    except ValueError:
        return None


def main() -> None:
    if not PDF.exists():
        print(f"PDF bulunamadı: {PDF}")
        sys.exit(1)

    doc = fitz.open(str(PDF))
    lines: list[str] = []
    for page in doc:
        for line in page.get_text().splitlines():
            line = line.strip()
            if line:
                lines.append(line)

    by_code: dict[str, float] = {}
    pairs: list[dict] = []

    for i, line in enumerate(lines):
        if not line.startswith("€"):
            continue
        price = parse_eur(line)
        if price is None or price < 50:
            continue
        code = None
        for j in range(i - 1, max(-1, i - 6), -1):
            cand = lines[j].replace(" ", "")
            if cand in SKIP:
                continue
            if CODE_RE.match(cand) and 3 <= len(cand) <= 24:
                code = cand
                break
        if not code:
            continue
        by_code[code] = price
        pairs.append({"code": code, "liste_eur": price})

    # slug → varsayılan PDF kodu (inox / standart)
    slug_map = {
        "slush-mono-allure": "SLUSH12.IA",
        "slush-twin-allure": "SLUSH24.IA",
        "slush-triple-allure": "SLUSH36.IA",
        "slush-mono": "SLUSH12.I",
        "slush-twin": "SLUSH24.I",
        "slush-triple": "SLUSH36.I",
        "panoramik-m10": "M10.AI",
        "panoramik-10-twin": "MM20.AB",
        "panoramik-10-triple": "MMM30.AB",
        "panoramik-m22": "M22.DI",
        "panoramik-m40": "M40.DI",
        "panoramik-s22": "S22.DI",
        "panoramik-s40": "S40.DI",
        "panoramik-22-twin": "SM44.AB",
        "kam22": "KAM22.DI",
        "kam40": "KAM40.DI",
        "klasik-mono": "20.MI",
        "klasik-twin": "40.SSI",
        "klasik-triple": "40.MMI",
        "hot-sc06": "SC06.I",
        "hot-sc10": "SC10.I",
        "hot-gold-sc06": "SC06.AG",
        "hot-gold-sc10": "SC10.AG",
        "hot-neo-10": "HOT10.DNB",
        "hot-inox-10": "SC10.AI.SSPB",
    }

    slug_prices = {}
    missing = []
    for slug, code in slug_map.items():
        if code in by_code:
            slug_prices[slug] = {"pdf_code": code, "liste_eur": by_code[code]}
        else:
            missing.append({"slug": slug, "pdf_code": code})

    payload = {
        "source": str(PDF),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "iskonto_oran": 0.40,
        "equsto_satis_oran": 0.65,
        "formula": "Equsto satış EUR = liste × 65% (bayi %40 iskonto + %15 kar); TL + KDV %20",
        "by_code": by_code,
        "slug_map": slug_map,
        "slug_prices": slug_prices,
        "missing_slug_codes": missing,
        "pair_count": len(pairs),
        "unique_codes": len(by_code),
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")

    md = [
        "# Samixir PDF katalog özeti",
        "",
        f"- PDF: `{PDF}`",
        f"- Benzersiz kod: **{len(by_code)}**",
        f"- Slug eşleşen: **{len(slug_prices)}/{len(slug_map)}**",
        "",
        "## Slug → liste EUR",
        "",
        "| Slug | PDF kod | Liste EUR |",
        "|------|---------|----------:|",
    ]
    for slug in sorted(slug_map):
        sp = slug_prices.get(slug)
        if sp:
            md.append(f"| {slug} | {sp['pdf_code']} | {sp['liste_eur']:,.0f} |")
        else:
            md.append(f"| {slug} | {slug_map[slug]} | — |")
    if missing:
        md.extend(["", "## Eksik kodlar", ""])
        for m in missing:
            md.append(f"- {m['slug']} → `{m['pdf_code']}`")
    RAPOR.write_text("\n".join(md), encoding="utf-8")
    print(json.dumps({"out": str(OUT), "codes": len(by_code), "slugs": len(slug_prices), "missing": len(missing)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
