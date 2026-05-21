"""Quick probe of Öztiryakiler xlsx + pdf structure."""
import re
import sys
from pathlib import Path

import fitz  # PyMuPDF
import pandas as pd

XLSX = Path(r"c:\Users\User\Downloads\Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx")
PDF = Path(r"c:\Users\User\Downloads\Öztiryakiler-Urun-katalogu-2026.pdf")

print("=== XLSX sheets ===")
xl = pd.ExcelFile(XLSX)
print(xl.sheet_names)
for sh in xl.sheet_names[:8]:
    df = pd.read_excel(XLSX, sheet_name=sh, header=None)
    print(f"\n--- {sh} shape {df.shape} ---")
    print(df.iloc[:6, : min(12, df.shape[1])].to_string())

print("\n=== PDF pages sample ===")
doc = fitz.open(PDF)
print("pages", doc.page_count)
for i in range(min(5, doc.page_count)):
    t = doc[i].get_text("text")
    print(f"\n--- page {i+1} ({len(t)} chars) ---")
    print(t[:2500])

doc.close()
