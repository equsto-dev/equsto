#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vosco_Katalog_2026.pdf → model kodu + USD liste fiyatı

  python scripts/extract-vosco-pdf-catalog.py
"""
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
OUT = ROOT / "scripts" / "data" / "vosco" / "vosco-pdf-catalog.json"
RAPOR = ROOT / "scripts" / "data" / "vosco" / "vosco-pdf-rapor.md"
PDF = Path(
    os.environ.get(
        "VOSCO_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\Vosco_Katalog_2026.pdf",
    )
)

CODE_RE = re.compile(
    r"^(?:V[A-Z]{1,3}[A-Z0-9\-/]{2,24}|VHZB-\d+[A-Z/]*|VSC-[A-Z0-9\-/]+|VFT-[A-Z0-9\-/]+|VCG-[A-Z0-9\-/]+|VBD-[A-Z0-9\-/]+)$",
    re.I,
)
PRICE_USD_RE = re.compile(r"\$\s*([\d,]+(?:\.\d+)?)\s*USD", re.I)
TITLE_RE = re.compile(r"^Vosco\s+(.+)$", re.I)
DIM_RE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*cm",
    re.I,
)
GUC_RE = re.compile(r"(\d+)\s*W\s*/\s*(\d+)\s*V", re.I)
KAP_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*kg(?:/24\s*saat)?", re.I)
LT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*L\b", re.I)
SKIP = re.compile(
    r"^(www\.|Biz Kimiz|VİZYON|MİSYON|\d{4}$|Endüstriyel|#2026|Güncel|QR|1\.BASKI)",
    re.I,
)


def norm_code(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(code or "").upper())


def parse_page(text: str, page_no: int) -> list[dict]:
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    category = ""
    products: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.isupper() and len(line) > 8 and not CODE_RE.match(line) and not PRICE_USD_RE.search(line):
            if not SKIP.search(line) and "VOSCO" not in line:
                category = line.title() if line.isupper() else line
        if CODE_RE.match(line):
            code = line.upper().replace(" ", "")
            block = lines[i : min(i + 14, len(lines))]
            price_usd = 0.0
            title = ""
            specs: list[str] = []
            dims = None
            power = None
            capacity_kg = None
            capacity_l = None
            for bl in block:
                pm = PRICE_USD_RE.search(bl)
                if pm and not price_usd:
                    price_usd = float(pm.group(1).replace(",", ""))
                tm = TITLE_RE.match(bl)
                if tm and not title:
                    title = f"Vosco {tm.group(1).strip()}"
                if bl not in (code, category) and not CODE_RE.match(bl) and not PRICE_USD_RE.search(bl):
                    if not tm and len(bl) > 4:
                        specs.append(bl)
                dm = DIM_RE.search(bl)
                if dm and not dims:
                    dims = {
                        "raw": dm.group(0),
                        "genislik_cm": float(dm.group(1).replace(",", ".")),
                        "derinlik_cm": float(dm.group(2).replace(",", ".")),
                        "yukseklik_cm": float(dm.group(3).replace(",", ".")),
                    }
                gm = GUC_RE.search(bl)
                if gm and not power:
                    power = f"{gm.group(1)} W / {gm.group(2)} V"
                km = KAP_RE.search(bl)
                if km and not capacity_kg:
                    capacity_kg = float(km.group(1).replace(",", "."))
                lm = LT_RE.search(bl)
                if lm and not capacity_l:
                    capacity_l = float(lm.group(1).replace(",", "."))
            if not title:
                for j in range(max(0, i - 6), i):
                    tm = TITLE_RE.match(lines[j])
                    if tm:
                        title = f"Vosco {tm.group(1).strip()}"
                        break
            products.append(
                {
                    "model": code,
                    "modelNorm": norm_code(code),
                    "title": title or code,
                    "category": category,
                    "page": page_no,
                    "specs": {
                        "liste_usd": price_usd if price_usd > 0 else None,
                        "guc": power,
                        "kapasite_kg": capacity_kg,
                        "kapasite_l": capacity_l,
                        "olculer": dims,
                    },
                    "description": "\n".join(specs[:8]),
                }
            )
        i += 1
    return products


def main() -> None:
    if not PDF.exists():
        print(f"PDF bulunamadı: {PDF}")
        sys.exit(1)

    doc = fitz.open(str(PDF))
    all_products: dict[str, dict] = {}
    for pi in range(doc.page_count):
        page_products = parse_page(doc[pi].get_text(), pi + 1)
        for p in page_products:
            k = p["modelNorm"]
            prev = all_products.get(k)
            if not prev or (p["specs"].get("liste_usd") and not prev["specs"].get("liste_usd")):
                all_products[k] = p

    products = sorted(all_products.values(), key=lambda x: x["model"])
    priced = [p for p in products if p["specs"].get("liste_usd")]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "liste": "Vosco Katalog 2026",
        "source": str(PDF),
        "extractedAt": datetime.now(timezone.utc).isoformat(),
        "pageCount": doc.page_count,
        "productCount": len(products),
        "pricedCount": len(priced),
        "products": products,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# Vosco PDF katalog raporu",
        "",
        f"Kaynak: `{PDF}`",
        f"Sayfa: {doc.page_count} | Ürün: **{len(products)}** | Fiyatlı: **{len(priced)}**",
        "",
        "## Örnek fiyatlı ürünler",
        "",
        "| Kod | USD liste | Kategori |",
        "|-----|-----------|----------|",
    ]
    for p in priced[:20]:
        lines.append(
            f"| {p['model']} | ${p['specs']['liste_usd']} | {p.get('category') or '-'} |"
        )
    RAPOR.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Yazıldı: {OUT} ({len(products)} ürün, {len(priced)} fiyatlı)")


if __name__ == "__main__":
    main()
