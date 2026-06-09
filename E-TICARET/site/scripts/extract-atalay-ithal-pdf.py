# -*- coding: utf-8 -*-
"""
ATALAY 2025 İTHAL.pdf → scripts/data/atalay-ithal-pdf-raw.json

Yalnızca: Animo, Santos, Faema, Dito Sama (sayfa aralıkları sabit).
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "data" / "atalay-ithal-pdf-raw.json"

PDF = Path(
    os.environ.get(
        "ATALAY_ITHAL_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\ATALAY 2025 İTHAL.pdf",
    )
)

BRAND_PAGES: dict[str, list[tuple[int, int]]] = {
    "Animo": [(89, 90), (119, 131)],
    "Santos": [(91, 98)],
    "Faema": [(101, 116)],
    "Dito Sama": [(151, 178)],
}

EURO_RE = re.compile(r"^([\d][\d.,\s]*)\s*EURO\s*$", re.IGNORECASE)
SKIP = {
    "model",
    "fiyat",
    "fiyat ",
    "kapasite",
    "voltaj",
    "güç",
    "guc",
    "net ölçüler",
    "net ölçüleri",
    "net ağırlık",
    "net ağırlığı",
    "paket ölçüleri",
    "paket ağırlığı",
    "paket ağırlı¤ı",
    "motor gücü",
    "hız",
    "program sayısı",
    "hazne kapasitesi",
    "buhar çubuğu",
    "sıcak su çıkışı",
    "boiler kapasitesi",
    "toz haznesi ve kapasitesi",
    "kahve haznesi ve kapasitesi",
    "elektrik gücü",
    "soğutma tipi",
    "üretim kapasitesi",
    "saklama kapasitesi",
    "döngü başına küp sayısı",
    "gaz tipi",
    "net ölçüler-ayak hariç",
    "ayaklar",
    "maksimum derinlik",
    "öğütücü disk çapı",
    "öğütme çıkışı",
    "hazne çıkış kapasitesi",
    "öğütücü bıçaklar",
}


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def parse_euro(line: str) -> float | None:
    m = EURO_RE.match(line.strip())
    if not m:
        return None
    s = m.group(1).replace(" ", "").replace(".", "")
    try:
        v = float(s)
    except ValueError:
        return None
    return v if v >= 20 else None


def is_noise(line: str) -> bool:
    if not line or len(line) < 2:
        return True
    low = line.lower()
    if low in SKIP:
        return True
    if EURO_RE.match(line):
        return True
    if re.match(r"^\d{1,3}$", line):
        return True
    if line.startswith("•"):
        return True
    if re.match(r"^#\d", line):
        return True
    if re.match(r"^[\d]{6,7}-", line) and " " not in line:
        return False
    if re.match(r"^\d{6,7}\s*-", line):
        return False
    return False


def looks_like_model(line: str, brand: str) -> bool:
    if is_noise(line):
        return False
    s = norm(line)
    if len(s) < 2 or len(s) > 90:
        return False
    if re.search(r"\d\s*x\s*\d", s, re.I):
        return False
    if re.search(r"\bmm\.?\b|\bkg\.?\b|\blt\.?\b|\bkw\b|\brpm\b", s, re.I):
        return False
    if re.search(r"\bV\b|\bHz\b|\bW\b", s):
        return False

    patterns = {
        "Animo": [
            r"^NO\s*\d",
            r"^M\d",
            r"^LEO\s*\d",
            r"^M2E",
            r"^C\d{2}\b",
            r"^\d{6,7}\s*-",
            r"^500\d{2}\s*-",
            r"^100\d{4}\s*-",
            r"^100\d{3}\s*-",
            r"^ComBi",
            r"^MPW",
            r"^CB\s",
            r"^B\d{2}X",
            r"^B\d{2}W",
            r"^B\d{2}T",
        ],
        "Santos": [r"^NO\s*\d", r"^NO\s*\d+\s+[A-Z]"],
        "Faema": [
            r"^E\d{2}\b",
            r"^X\d{2}\b",
            r"^MD\s*\d",
            r"^ME\s*A\b",
            r"^BR\d",
            r"^FRI\d",
            r"^SCAL",
            r"^E71\b",
            r"^E98\b",
            r"^E61\b",
        ],
        "Dito Sama": [
            r"^\d{6}\b",
            r"^\d{6}-",
            r"^MAGISTAR",
            r"^RC\d",
            r"^K\d{2}\b",
            r"^XBE",
            r"^XBM",
            r"^LVA",
            r"^ELX",
            r"^EL40",
            r"^Prep4You",
            r"^SPEEDY",
            r"^EASY\s",
        ],
    }
    for pat in patterns.get(brand, []):
        if re.search(pat, s, re.I):
            return True
    if brand == "Dito Sama" and re.match(r"^\d{6}$", s):
        return True
    if brand in ("Animo", "Santos") and re.match(r"^NO\s", s, re.I):
        return True
    if brand == "Faema" and re.match(r"^[A-Z]{1,3}\d", s):
        return True
    return False


def page_brand(page_no: int) -> str | None:
    for brand, ranges in BRAND_PAGES.items():
        for lo, hi in ranges:
            if lo <= page_no <= hi:
                return brand
    return None


def pick_model_from_block(block: list[str], brand: str) -> str:
    for line in block:
        if looks_like_model(line, brand):
            return norm(line)
    for line in block:
        if not is_noise(line) and len(line) <= 70:
            return norm(line)
    return ""


def extract_products_from_page(page_no: int, brand: str, lines: list[str], section: str) -> list[dict]:
    products: list[dict] = []
    n = len(lines)

    # Tablo: "Fiyat" başlığından sonraki blok → model + EURO
    i = 0
    while i < n:
        if lines[i].lower() != "fiyat":
            i += 1
            continue
        j = i + 1
        block: list[str] = []
        euro = None
        while j < n:
            ev = parse_euro(lines[j])
            if ev is not None:
                euro = ev
                break
            if lines[j].lower() == "fiyat":
                break
            block.append(lines[j])
            j += 1
        if euro is not None:
            model = pick_model_from_block(block, brand)
            if model:
                products.append(
                    {
                        "brand": brand,
                        "model": model,
                        "liste_eur": euro,
                        "page": page_no,
                        "section": section,
                        "raw_fields": [x for x in block[1:13] if not is_noise(x)],
                    }
                )
            i = j + 1
            continue
        i += 1

    # Yedek: doğrudan EURO satırı (Fiyat başlığı olmayan sayfalar)
    for idx, line in enumerate(lines):
        euro = parse_euro(line)
        if euro is None:
            continue
        if idx > 0 and lines[idx - 1].lower() == "fiyat":
            continue
        model = ""
        fields: list[str] = []
        k = idx - 1
        while k >= 0:
            prev = lines[k]
            if prev.lower() == "fiyat" or parse_euro(prev) is not None:
                break
            if looks_like_model(prev, brand) and not model:
                model = norm(prev)
            elif model and not is_noise(prev):
                fields.insert(0, prev)
            k -= 1
        if not model:
            for k2 in range(max(0, idx - 20), idx):
                if looks_like_model(lines[k2], brand):
                    model = norm(lines[k2])
                    break
        if model and not any(p["model"] == model and p["liste_eur"] == euro for p in products):
            products.append(
                {
                    "brand": brand,
                    "model": model,
                    "liste_eur": euro,
                    "page": page_no,
                    "section": section,
                    "raw_fields": fields[:12],
                }
            )
    return products


def scan_section(lines: list[str]) -> str:
    for line in lines[:15]:
        if len(line) > 8 and not line.isdigit() and "•" not in line:
            if not EURO_RE.match(line) and line.lower() not in SKIP:
                return line
    return ""


def main() -> None:
    if not PDF.is_file():
        raise SystemExit(f"PDF bulunamadı: {PDF}")

    doc = fitz.open(PDF)
    all_products: list[dict] = []
    seen: set[tuple[str, str]] = set()

    for page_idx in range(doc.page_count):
        page_no = page_idx + 1
        brand = page_brand(page_no)
        if not brand:
            continue
        text = doc[page_idx].get_text()
        lines = [norm(l) for l in text.split("\n") if norm(l)]
        section = scan_section(lines)
        batch = extract_products_from_page(page_no, brand, lines, section)
        for p in batch:
            key = (p["brand"], p["model"].upper().replace(" ", ""))
            if key in seen:
                continue
            seen.add(key)
            all_products.append(p)

    by_brand: dict[str, int] = {}
    for p in all_products:
        by_brand[p["brand"]] = by_brand.get(p["brand"], 0) + 1

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(
        json.dumps(
            {
                "source": str(PDF),
                "parsedAt": __import__("datetime").datetime.now().isoformat(),
                "count": len(all_products),
                "byBrand": by_brand,
                "products": all_products,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print("[atalay-ithal-extract]", len(all_products), "urun", by_brand, "->", OUT)


if __name__ == "__main__":
    main()
