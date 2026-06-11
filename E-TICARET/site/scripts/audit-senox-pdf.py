# -*- coding: utf-8 -*-
"""PDF vs çıkarım audit → scripts/data/senox/audit.json"""
import json
import re
import unicodedata
from pathlib import Path
import fitz

PDF = Path(r"c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf")
CAT = Path(__file__).resolve().parent / "data" / "senox" / "senox-pdf-catalog.json"
OUT = Path(__file__).resolve().parent / "data" / "senox" / "audit.json"

TITLE = re.compile(r"^\s*(?:Senox|SENOX)[-\s]", re.I)
EUR = re.compile(r"(\d+(?:\.\d{3})*)\s*EUR", re.I)
MODEL_CODE = re.compile(
    r"\b(SDS[-\s]?\d+[A-Z0-9\-/]*|BBC[S]?[-\s]?\d+|SBC\d+|SNX[-\s]?\d+[A-Z]*|"
    r"SMR[-\s]?\d+|WN[-\s]?\d+|WF[-\s]?\d+|BZ\d+|MS\d+|BLK[-\s]?\d+|730[01][A-Z]?|"
    r"SMFER[-\s]?[A-Z0-9\-]+|SNX12R|DS[-\s]?\d{2}|SFT[-\s]?\d+|SLS[-\s]?\d+|"
    r"SRB[-\s]?\d+|DY[-\s]?\d+|PDY[-\s]?\d+|KM\d+|IC\d+[A-Z]?|SYD[-\s]?\d+|"
    r"SMF[-\s]?\d+|KRS\d+|CF\d+KROM|SYS[-\s]?\d+[A-Z]*)\b",
    re.I,
)
LK = re.compile(r"\b(\d{2,4})\s*LK(?:[-\s/]?([A-Z]{1,4}))?\b", re.I)

def product_imgs(page):
    pr = page.rect
    out = []
    for info in page.get_image_info(xrefs=True):
        x0,y0,x1,y1 = info["bbox"]
        w,h = x1-x0, y1-y0
        area = w*h
        if w*h >= pr.width*pr.height*0.55: continue
        if w/h > 6.5 or h/w > 6.5: continue
        if w < 70 or h < 70 or area < 8000: continue
        out.append({"xref": info["xref"], "area": int(area), "bbox": [round(x0),round(y0),round(x1),round(y1)]})
    return out

doc = fitz.open(PDF)
pages = []
all_eur_prices = 0
for i in range(doc.page_count):
    p = i+1
    if p <= 3: continue
    text = doc[i].get_text("text") or ""
    lines = [unicodedata.normalize("NFKC", l.strip()) for l in text.splitlines() if l.strip()]
    titles = [l for l in lines if TITLE.match(l) and len(l) < 110 and "www." not in l.lower()
              and not re.search(r"endüstriyel mutfak|temelleri|markas", l, re.I)]
    codes = set()
    for l in lines:
        for m in MODEL_CODE.findall(l):
            codes.add(m.upper().replace(" ", "-"))
        for m in LK.findall(l):
            codes.add(f"{m[0]}LK" + (f"-{m[1].upper()}" if m[1] else ""))
    imgs = product_imgs(doc[i])
    eurs = EUR.findall(text)
    all_eur_prices += len(eurs)
    if titles or len(imgs) >= 2 or eurs:
        pages.append({
            "page": p,
            "titles": titles,
            "titleCount": len(titles),
            "codes": sorted(codes)[:20],
            "codeCount": len(codes),
            "imgCount": len(imgs),
            "eurCount": len(eurs),
            "head": text[:400].replace("\n", " | "),
        })
doc.close()

cat = json.loads(CAT.read_text(encoding="utf-8")) if CAT.exists() else {"products": []}
cat_pages = {p["page"] for p in cat["products"]}
cat_models = {p["model"] for p in cat["products"]}

missing_pages = [x for x in pages if x["imgCount"] > x["titleCount"] and x["page"] not in cat_pages]
gap_imgs = sum(max(0, x["imgCount"] - x["titleCount"]) for x in pages)

audit = {
    "pdfPages": 55,
    "catalogProducts": len(cat["products"]),
    "pdfTitleLines": sum(x["titleCount"] for x in pages),
    "pdfEurLines": all_eur_prices,
    "pdfProductImages": sum(x["imgCount"] for x in pages),
    "imageTitleGap": gap_imgs,
    "pages": pages,
    "pagesWithMoreImgsThanTitles": [
        {"page": x["page"], "imgs": x["imgCount"], "titles": x["titleCount"], "codes": x["codes"][:8]}
        for x in pages if x["imgCount"] > max(1, x["titleCount"])
    ],
}
OUT.write_text(json.dumps(audit, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({k: audit[k] for k in audit if k != "pages"}, ensure_ascii=False, indent=2))
