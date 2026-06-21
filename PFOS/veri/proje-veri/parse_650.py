import pdfplumber
import json
from pathlib import Path

pdf_path = Path(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650.pdf")

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total Pages: {len(pdf.pages)}")
    text_sample = ""
    for i in range(min(5, len(pdf.pages))):
        text = pdf.pages[i].extract_text()
        print(f"--- Page {i+1} ---")
        lines = text.split('\n') if text else []
        for line in lines[:20]:
            print(line)
