#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YÜKSEL İTHAL - 2025.pdf → Equsto fiyat listesi JSON (metin + OCR)

  python scripts/import-yuksel-ithal-2025-pdf.py
  python scripts/import-yuksel-ithal-2025-pdf.py --no-ocr

Çıktı: public/data/fiyat-listeleri/yuksel/2025-ithal/tum-urunler.json
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL İTHAL - 2025.pdf")
OUT_ROOT = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-ithal"

BRAND_DEFAULT = "Yüksel Endüstriyel"
LISTE = "YÜKSEL İTHAL - 2025"
KAYNAK = "yuksel-2025-ithal-pdf"

SKIP_LINE = re.compile(
    r"^(ref\.?|english\s*designation|yuksel|2025\s*mayis|turkey\s+.*price\s+list|price\s+list|may\s+\d)",
    re.I,
)
REF_RE = re.compile(r"^[\d]{4,7}[A-Z]?W?$", re.I)
REF_INLINE_RE = re.compile(r"Ref\.?\s*([\d]{4,7}[A-Z]?W?)", re.I)
PRICE_DOT_RE = re.compile(r"^[\d]{1,3}(?:\.\d{3})+$")
SPEC_NOISE_RE = re.compile(r"\b(cm²|cm2|dev/dak|230\s*v|50\s*hz|watt|^\d+\s*w\b)", re.I)
PRICE_RE = re.compile(
    r"^([\d]{1,3}(?:\.\d{3})*),(\d{1,2})\s*(?:€|eur)?\s*$|^([\d]{1,3}(?:\.\d{3})*)\s*(?:€|eur)\s*$",
    re.I,
)

DEPT_RULES: list[tuple[re.Pattern[str], str, str, str]] = [
    (re.compile(r"robot\s*coupe|food processor|blixer|cutter|emulsifier", re.I), "hazirlik", "hamur-hazirlik-makineleri", "Robot Coupe"),
    (re.compile(r"vacuum|vakum|packaging|paketleme", re.I), "hazirlik", "et-hazirlik-makineleri", "Robot Coupe"),
    (re.compile(r"slicer|dilim|disc|disk", re.I), "hazirlik", "et-hazirlik-makineleri", "Robot Coupe"),
    (re.compile(r"bulaşık|dishwash|glasswash", re.I), "yikama", "bulasik-makineleri", "Imported"),
    (re.compile(r"buzdolab|refriger|cooling|soğut|freezer|ice\b", re.I), "sogutma", "sogutma-ekipmanlari", "Imported"),
    (re.compile(r"fırın|firin|oven|pizza|konveks", re.I), "pisirme", "sanayi-ocaklari", "Imported"),
    (re.compile(r"espresso|kahve|coffee|grinder", re.I), "kahve", "kahve-makineleri", "Imported"),
    (re.compile(r"blender|mixer|mix", re.I), "hazirlik", "hamur-hazirlik-makineleri", "Imported"),
    (re.compile(r"hood|davlumbaz|ventilation", re.I), "davlumbaz", "davlumbaz", "Imported"),
]


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "diger"


def parse_euro_ithal(s: str) -> float | None:
    if not s:
        return None
    s = unicodedata.normalize("NFKC", s).strip().replace("€", "").replace("EUR", "").replace("eur", "").strip()
    m = PRICE_RE.match(s)
    if m:
        if m.group(1) is not None:
            return float(m.group(1).replace(".", "") + "." + m.group(2))
        if m.group(3) is not None:
            return float(m.group(3).replace(".", ""))
    m2 = re.match(r"^([\d]{1,3}(?:\.\d{3})*),(\d{1,2})$", s)
    if m2:
        return float(m2.group(1).replace(".", "") + "." + m2.group(2))
    m3 = re.match(r"^([\d]+),(\d+)$", s)
    if m3:
        return float(m3.group(1) + "." + m3.group(2))
    return None


def parse_price_any(s: str) -> float | None:
    v = parse_euro_ithal(s)
    if v is not None:
        return v
    s = unicodedata.normalize("NFKC", s or "").strip().replace(" ", "")
    if PRICE_DOT_RE.match(s):
        return float(s.replace(".", ""))
    if re.match(r"^[\d]{2,6}$", s):
        val = float(s)
        if 15 <= val <= 500_000:
            return val
    return None


def line_ref(line: str) -> str | None:
    m = REF_INLINE_RE.search(line)
    if m:
        return m.group(1).upper()
    if REF_RE.match(line):
        return line.upper()
    return None


def parse_price_loose(s: str) -> float | None:
    if not s or SPEC_NOISE_RE.search(s):
        return None
    v = parse_euro_ithal(s)
    if v is not None:
        return v
    s = unicodedata.normalize("NFKC", s).strip().replace(" ", "")
    if PRICE_DOT_RE.match(s):
        return float(s.replace(".", ""))
    if re.match(r"^[\d]{2,7}$", s):
        n = float(s)
        if 15 <= n <= 500_000:
            return n
    return None


def ref_from_line(line: str) -> str | None:
    line = line.strip()
    if REF_RE.match(line):
        return line.upper()
    m = REF_INLINE_RE.search(line)
    if m:
        return m.group(1).upper()
    return None


def classify_section(text: str) -> tuple[str, str, str, str]:
    for pat, dept, cat, sub_brand in DEPT_RULES:
        if pat.search(text):
            return dept, cat, sub_brand
    return "hazirlik", "hamur-hazirlik-makineleri", BRAND_DEFAULT


def page_text(page: fitz.Page, use_ocr: bool) -> str:
    t = page.get_text()
    if len(t.strip()) >= 80 or not use_ocr:
        return t
    try:
        import numpy as np
        from rapidocr_onnxruntime import RapidOCR
    except ImportError:
        return t
    ocr = RapidOCR()
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
    img = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    if pix.n == 4:
        img = img[:, :, :3]
    res, _ = ocr(img)
    if not res:
        return t
    return "\n".join(str(line[1]) for line in res)


def parse_ref_name_price(lines: list[str], section: str, page_no: int) -> list[dict]:
    dept, cat_slug, import_brand = classify_section(section)
    out: list[dict] = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or SKIP_LINE.search(line):
            i += 1
            continue
        if REF_RE.match(line):
            ref = line.upper()
            name = ""
            price_val = None
            if i + 1 < len(lines):
                cand = lines[i + 1].strip()
                if not REF_RE.match(cand) and parse_euro_ithal(cand) is None:
                    name = cand
                    i += 1
            if i + 1 < len(lines):
                cand = lines[i + 1].strip()
                price_val = parse_euro_ithal(cand)
                if price_val is not None:
                    i += 1
            if name and price_val is not None and 1 <= price_val <= 500_000:
                out.append(
                    {
                        "ref": ref,
                        "name": name,
                        "fiyat_euro": price_val,
                        "dept": dept,
                        "category": cat_slug,
                        "import_brand": import_brand,
                        "section": section[:200],
                        "page": page_no,
                    }
                )
        i += 1
    return out


def parse_ref_name_price_ocr(lines: list[str], section: str, page_no: int) -> list[dict]:
    """OCR / taranmış sayfalar: Ref.28110W, düz fiyat satırları."""
    dept, cat_slug, import_brand = classify_section(section)
    out: list[dict] = []
    for i, line in enumerate(lines):
        ref = ref_from_line(line)
        if not ref:
            continue
        name = ""
        price_val = None
        for j in range(1, 5):
            if i + j >= len(lines):
                break
            cand = lines[i + j].strip()
            if ref_from_line(cand):
                break
            pv = parse_price_loose(cand)
            if pv is not None:
                if price_val is None:
                    price_val = pv
                continue
            if not name and len(cand) > 2 and not SKIP_LINE.search(cand):
                name = cand[:120]
        if price_val is None or not (15 <= price_val <= 500_000):
            continue
        if not name or name.upper() == ref:
            name = ref
        out.append(
            {
                "ref": ref,
                "name": name,
                "fiyat_euro": price_val,
                "dept": dept,
                "category": cat_slug,
                "import_brand": import_brand,
                "section": section[:200],
                "page": page_no,
            }
        )
    return out


def detect_section(lines: list[str], prev: str) -> str:
    for l in lines[:40]:
        if SKIP_LINE.search(l):
            continue
        if re.search(
            r"price\s+list|liste|kombin|blixer|cutter|vacuum|robot|kombi|fırın|firin|bulaşık|soğut|kahve|dishwash|refriger",
            l,
            re.I,
        ) and len(l) > 8:
            return l[:160]
        if len(l) > 10 and l == l.upper() and re.search(r"[A-Z]{4}", l):
            if not re.search(r"^REF|^ENGLISH|^YÜKSEL", l, re.I):
                return l[:160]
    return prev


def to_equsto_item(row: dict) -> dict:
    ref = row["ref"]
    name = row["name"]
    euro = row["fiyat_euro"]
    section = row.get("section", "")
    import_brand = row.get("import_brand", BRAND_DEFAULT)
    dept = row["dept"]
    cat = row["category"]
    display_brand = import_brand if import_brand != BRAND_DEFAULT else f"{BRAND_DEFAULT} (ithal)"
    title = f"{display_brand} {name}".strip()
    specs = "\n".join(
        x
        for x in [
            f"Kaynak: {LISTE}",
            f"Bölüm: {section}",
            f"Referans: {ref}",
            f"Liste fiyatı (EUR): {euro:g} €",
            f"Sayfa: {row.get('page', '')}",
        ]
        if x
    )
    return {
        "category": cat,
        "brand": display_brand,
        "name": title,
        "price": f"{euro:g} € + KDV",
        "specs": specs,
        "sku": ref,
        "model": ref,
        "tip_kodu": slugify(f"{ref}-{name}"),
        "liste": LISTE,
        "kaynak": KAYNAK,
        "dept": dept,
        "alt_kategori": section,
        "seri": import_brand,
        "fiyat_euro": euro,
        "page": row.get("page"),
        "equsto_folder": f"{dept}/{slugify(cat)}",
    }


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else DEFAULT_PDF
    use_ocr = "--no-ocr" not in sys.argv
    if not pdf_path.is_file():
        print("PDF bulunamadi:", pdf_path)
        sys.exit(1)

    doc = fitz.open(pdf_path)
    section = LISTE
    by_folder: dict[str, list[dict]] = {}
    meta_pages: list[dict] = []
    total = 0
    seen: set[str] = set()

    for pi in range(doc.page_count):
        page = doc[pi]
        raw = page_text(page, use_ocr)
        lines = [unicodedata.normalize("NFKC", l).strip() for l in raw.splitlines()]
        lines = [l for l in lines if l]
        if len(lines) < 3:
            continue
        section = detect_section(lines, section)
        rows = parse_ref_name_price(lines, section, pi + 1)
        if len(raw.strip()) < 80:
            rows = rows + parse_ref_name_price_ocr(lines, section, pi + 1)
        page_count = 0
        for row in rows:
            item = to_equsto_item(row)
            key = f"{item['sku']}|{item['fiyat_euro']}"
            if key in seen:
                continue
            seen.add(key)
            fk = item["equsto_folder"]
            by_folder.setdefault(fk, []).append(item)
            total += 1
            page_count += 1
        if page_count:
            meta_pages.append({"page": pi + 1, "section": section, "count": page_count, "ocr": len(raw.strip()) < 80})

    doc.close()

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    all_items: list[dict] = []
    for key in sorted(by_folder.keys()):
        all_items.extend(by_folder[key])

    with open(OUT_ROOT / "tum-urunler.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    with open(OUT_ROOT / "_index.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "marka": BRAND_DEFAULT,
                "liste": LISTE,
                "kaynak_pdf": str(pdf_path),
                "olusturma": datetime.now(timezone.utc).isoformat(),
                "toplam_urun": total,
                "ocr_kullanildi": use_ocr,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )
    with open(OUT_ROOT / "_sayfa-log.json", "w", encoding="utf-8") as f:
        json.dump(meta_pages, f, ensure_ascii=False, indent=2)

    print(f"OK: {total} urun -> {OUT_ROOT}")
    for k in sorted(by_folder.keys()):
        print(f"  {k}: {len(by_folder[k])}")


if __name__ == "__main__":
    main()
