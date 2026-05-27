# -*- coding: utf-8 -*-
import re
import json
from pathlib import Path
import fitz

PDF = Path(r"c:\Users\User\Downloads\Öztiryakiler-Urun-katalogu-2026.pdf")
OUT = Path(__file__).resolve().parent / "data" / "ozti-pdf-sample.json"

# Typical Öztiryakiler codes: 7865.N1.80908.10, 79E4.27NMV.00, etc.
CODE_RE = re.compile(
    r"\b([0-9]{4}\.[A-Z0-9][A-Z0-9.\-]{4,40}|[0-9]{2}[A-Z][0-9]\.[0-9]{2}[A-Z]{3}\.[0-9]{2})\b",
    re.I,
)

doc = fitz.open(PDF)
page_count = doc.page_count
samples = []
all_codes = set()
pages_with_text = 0
for i in range(page_count):
    t = doc[i].get_text("text") or ""
    if len(t.strip()) < 30:
        continue
    pages_with_text += 1
    codes = CODE_RE.findall(t)
    for c in codes:
        all_codes.add(c.upper())
    if len(samples) < 15:
        samples.append({"page": i + 1, "chars": len(t), "codes": codes[:8], "text_head": t[:800]})

doc.close()

OUT.write_text(
    json.dumps(
        {
            "pages": page_count,
            "pages_with_text": pages_with_text,
            "unique_codes_in_text": len(all_codes),
            "samples": samples,
            "code_examples": sorted(all_codes)[:40],
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
print("written", OUT)
print("pages_with_text", pages_with_text, "codes", len(all_codes))
