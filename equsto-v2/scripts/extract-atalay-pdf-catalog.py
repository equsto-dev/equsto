# -*- coding: utf-8 -*-
"""
ATALAY 2025 YERLİ.pdf → scripts/data/atalay-pdf-catalog-raw.json
Tablo sayfaları (Model … Fiyat … EURO) + döner/robot özel sayfalar.
ekipmanlar.json KULLANILMAZ.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "data" / "atalay-pdf-catalog-raw.json"

PDF = Path(
    os.environ.get(
        "ATALAY_PDF",
        r"c:\Users\User\Downloads\ATALAY 2025 YERLİ.pdf",
    )
)

EURO_RE = re.compile(
    r"^([\d][\d.,\s]*)\s*EURO\s*$",
    re.IGNORECASE,
)
MODEL_RE = re.compile(
    r"^("
    r"AD[GECR][A-Z0-9+\-/]+|ADR-[A-Z0-9]+(?:-[A-Z0-9]+)*|"
    r"ADK-[A-Z0-9/]+|ADST-\d+|"
    r"E\s+[A-Z]{2,5}[\s\-]+[\dA-Z][\w\s\-/\+]+|"
    r"E\s+AWO[\s\-]*\d+|E\s+ALI[\s\-]+\d+|"
    r"AAIG[\s\-]+\d+|ALI[\s\-]+\d+|"
    r"[A-Z]{2,5}[\s\-]+\d[\w\s\-/\+]*|"
    r"[A-Z]{2,5}-\d[\w\-/\+]*"
    r")",
    re.IGNORECASE,
)
DIM_RE = re.compile(r"\d\s*x\s*\d", re.I)
VOL_RE = re.compile(r"\d+\s*V\b", re.I)
KW_RE = re.compile(r"\d+[\.,]?\d*\s*kW", re.I)
KG_RE = re.compile(r"\bkg\b", re.I)
SKIP_HEADERS = {
    "model",
    "plate",
    "voltaj",
    "kw",
    "fiyat",
    "fiyat ",
    "net ölçüler",
    "paket ölçüleri",
    "net ağırlık",
    "paket ağırlık",
    "brulör adedi",
    "brülör adedi",
    "gaz sarfiyatı-lpg",
    "gaz sarfiyatı-ng",
    "gaz sarfiyat›-lpg",
    "gaz sarfiyat›-ng",
    "kilokalori - lpg",
    "kilokalori - ng",
    "rezistans sayısı",
    "kapak sayısı",
    "aynar",
    "iç yükseklik",
    "iç çap",
    "net ölçüler (gxdx y)",
    "ağırlık",
    "minimum kaldırma mesafesi",
    "maksimum kaldırma mesafesi",
    "maksimum döner çapı ve yükseklik",
    "standart siparişinde detaylar",
}


def parse_euro(line: str) -> float | None:
    m = EURO_RE.match(line.strip())
    if not m:
        return None
    s = m.group(1).replace(" ", "").replace(".", "")
    try:
        v = float(s)
    except ValueError:
        return None
    return v if v >= 50 else None


def norm(s: str) -> str:
    return re.sub(r"\s+", " ", s.strip())


def is_model_line(line: str) -> bool:
    if not line or len(line) < 4:
        return False
    low = line.lower()
    if low in SKIP_HEADERS:
        return False
    if EURO_RE.match(line):
        return False
    if re.match(r"^\d+$", line):
        return False
    if line.startswith("•") or "opsiyonel" in low:
        return False
    if DIM_RE.search(line) or VOL_RE.search(line) or KW_RE.search(line) or KG_RE.search(line):
        return False
    if re.search(r"kg\s*/\s*h|m\s*3\s*/\s*h", low):
        return False
    if MODEL_RE.match(line):
        return True
    # Seri 730: AEI - 673 / N (E öneki yok)
    if re.match(r"^[A-Z]{2,5}\s*-\s*\d", line):
        return True
    return False


def parse_table_page(page_no: int, lines: list[str], seri: str, kategori: str, extra: str) -> list[dict]:
    products = []
    i = 0
    n = len(lines)
    while i < n:
        euro = parse_euro(lines[i])
        if euro is None:
            i += 1
            continue
        block = []
        j = i - 1
        while j >= 0 and not is_model_line(lines[j]):
            block.insert(0, lines[j])
            j -= 1
        if j < 0:
            i += 1
            continue
        model = norm(lines[j])
        plate = norm(block[0]) if block else ""
        fields = block[1:] if len(block) > 1 else block
        section = " · ".join(
            x for x in [seri, kategori, extra] if x
        )
        products.append(
            {
                "page": page_no,
                "seri": seri,
                "kategori": kategori,
                "extra": extra,
                "section": section,
                "model": model,
                "plate": plate,
                "euro": euro,
                "raw_fields": fields,
                "kind": "table",
            }
        )
        i += 1
    return products


def parse_robot_page(page_no: int, text: str, seri: str, kategori: str) -> list[dict]:
    """ADR / ADR-C1 tabloları: Model satırından sonra Fiyat satırına kadar blok, son satır EURO."""
    products = []
    lines = [norm(l) for l in text.split("\n") if norm(l)]
    i = 0
    while i < len(lines):
        if lines[i].lower() != "fiyat":
            i += 1
            continue
        i += 1
        while i < len(lines):
            if not is_model_line(lines[i]):
                i += 1
                if i >= len(lines):
                    break
                continue
            model = lines[i]
            j = i + 1
            fields = []
            euro = None
            while j < len(lines):
                ev = parse_euro(lines[j])
                if ev is not None:
                    euro = ev
                    break
                if lines[j].lower() == "fiyat" or is_model_line(lines[j]):
                    break
                fields.append(lines[j])
                j += 1
            if euro is not None:
                products.append(
                    {
                        "page": page_no,
                        "seri": seri,
                        "kategori": kategori,
                        "extra": "",
                        "section": kategori,
                        "model": model,
                        "plate": "",
                        "euro": euro,
                        "raw_fields": fields,
                        "kind": "robot",
                    }
                )
                i = j + 1
            else:
                i += 1
    return products


def scan_page(page_no: int, text: str) -> tuple[str, str, str, list[str]]:
    lines = [norm(l) for l in text.split("\n") if norm(l)]
    seri = ""
    kategori = ""
    extra = ""
    for idx, line in enumerate(lines[:12]):
        if re.match(r"^Seri\s+\d+", line, re.I):
            seri = line
        elif "/" in line and any(
            k in line
            for k in (
                "Izgara",
                "Ocak",
                "Fırın",
                "Fritöz",
                "Kuzine",
                "Döner",
                "Robot",
                "Benmari",
                "Pizza",
                "Wok",
                "Kalıp",
                "Lift",
            )
        ):
            if not kategori:
                kategori = line
            elif line != kategori and not extra:
                extra = line
    return seri, kategori, extra, lines


def main():
    if not PDF.is_file():
        raise SystemExit(f"PDF bulunamadı: {PDF}")

    doc = fitz.open(PDF)
    all_products: list[dict] = []
    seen: set[tuple] = set()

    for page_idx in range(doc.page_count):
        page_no = page_idx + 1
        text = doc[page_idx].get_text()
        seri, kategori, extra, lines = scan_page(page_no, text)

        if page_no >= 101 and page_no <= 128 and "Robot" in kategori:
            batch = parse_robot_page(page_no, text, seri, kategori)
        elif page_no >= 117 and page_no <= 120:
            batch = parse_robot_page(page_no, text, seri, kategori or "Döner Kalıpları")
        elif page_no >= 119 and page_no <= 120:
            batch = parse_robot_page(page_no, text, seri, "Döner Lifti")
        elif "Model" in lines and "Fiyat" in lines and page_no <= 176:
            batch = parse_table_page(page_no, lines, seri, kategori, extra)
        else:
            continue

        for p in batch:
            key = (p["model"], p.get("plate", ""), p["euro"], p["page"])
            if key in seen:
                continue
            seen.add(key)
            all_products.append(p)

    doc.close()

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": str(PDF),
        "pageCount": 178,
        "count": len(all_products),
        "products": all_products,
    }
    OUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[atalay-pdf] {len(all_products)} urun -> {OUT}")


if __name__ == "__main__":
    main()
