# -*- coding: utf-8 -*-
"""PDF s.100-130 ürün kodları + fiyatları çıkar."""
import json
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent.parent.parent / "E-TICARET" / "site"
import importlib.util

spec = importlib.util.spec_from_file_location(
    "sync_pimak_fiyat_pdf", SITE / "scripts" / "sync-pimak-fiyat-pdf.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
extract_pairs_from_page = mod.extract_pairs_from_page
norm_kod = mod.norm_kod

PDF = Path(r"C:/D Disk/FİYAT LİSTELERİ/pimak 27-27-030426.pdf")
OUT = ROOT / "p100-130-codes.json"

doc = fitz.open(PDF)
codes: dict[str, dict] = {}
for pno in range(99, 130):
    for code, price in extract_pairs_from_page(doc[pno].get_text("text")):
        k = norm_kod(code)
        codes[k] = {"urun_kodu": code, "liste_fiyati_eur": price, "pdf_page": pno + 1}

OUT.write_text(json.dumps(codes, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"[p100-130] {len(codes)} kod -> {OUT.name}")
