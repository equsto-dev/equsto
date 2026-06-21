import pdfplumber
import json
from pathlib import Path
import re

pdf_path = Path(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650.pdf")
output_path = Path(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650.json")

def clean(value) -> str:
    if value is None:
        return ""
    return str(value).replace("\n", " ").strip()

print("Starting PDF extraction...")
project_title = ""
current_section = ""
rows = []
all_text = []

HEADERS = ["Bölüm", "P.NO", "ÜRÜN ADI", "ÖLÇÜ", "AD."]
SECTION_PATTERN = re.compile(r"^[A-ZİĞÜŞÖÇ]-\s+.+")
PROJECT_PATTERN = re.compile(r"^\d{2,3}[-\s]|^RESTAURANT$|^RESTORAN$", re.I)
PNO_PATTERN = re.compile(r"^[A-Z]\d+[A-Z]?$|^\d+$", re.I)

with pdfplumber.open(pdf_path) as pdf:
    print(f"Total Pages: {len(pdf.pages)}")
    for page_num, page in enumerate(pdf.pages, start=1):
        text = page.extract_text()
        all_text.append(text or "")
        tables = page.extract_tables() or []
        for table in tables:
            for raw_row in table:
                if not raw_row:
                    continue
                cells = [clean(c) for c in raw_row]
                while len(cells) < 4:
                    cells.append("")
                
                first = cells[0]
                if not first:
                    continue
                
                if first.upper() in {"P.NO", "P.NO ÜRÜN ADI ÖLÇÜ AD."}:
                    continue
                
                if not project_title and (PROJECT_PATTERN.match(first) or first.upper() in {"RESTAURANT", "RESTORAN"}):
                    project_title = first
                    continue
                
                if SECTION_PATTERN.match(first) and not PNO_PATTERN.match(first):
                    current_section = first
                    continue
                
                if PNO_PATTERN.match(first):
                    rows.append({
                        "section": current_section,
                        "P.NO": first,
                        "ÜRÜN ADI": cells[1],
                        "ÖLÇÜ": cells[2],
                        "AD.": cells[3],
                        "page": page_num
                    })

result = {
    "project_title": project_title,
    "rows": rows,
    "pages_text": all_text
}

with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Extraction completed. Found {len(rows)} items. Saved to {output_path.name}")
