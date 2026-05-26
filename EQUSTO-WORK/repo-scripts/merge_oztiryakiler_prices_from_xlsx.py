#!/usr/bin/env python3
"""
Öztiryakiler Bayi fiyat listesi (.xlsx) → oztiryakiler-wp-products.json ile eşleştirme.

Eşleşme: Excel ÜRÜN KODU (örn. 79K4.06LMV.00) küçük harf ve nokta→tire ile normalize edilir;
WP slug'un son segmentleri (tire ile bölünmüş) en uzun eşleşen sonek ile kod aranır.

Çıktılar (önizleme, varsayılan):
  public/data/oztiryakiler-price-overlay-bayi1.json
  public/ozti-bayi1-price-preview.html  (zaten varsa üzerine yazılmaz — ayrı dosyada şablon)

--apply: public/data/oztiryakiler-wp-products.json içine dealerPriceTRY (ve meta) yazar.

Gereksinim: pip install openpyxl
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("openpyxl gerekli: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_XLSX = Path(r"c:\D Disk\FİYAT LİSTELERİ\Öztiryakiler Bayi 1 Fiyat listesi (002).xlsx")
PRODUCTS_JSON = ROOT / "public" / "data" / "oztiryakiler-wp-products.json"
OVERLAY_JSON = ROOT / "public" / "data" / "oztiryakiler-price-overlay-bayi1.json"


def norm_code(raw: str) -> str:
    s = str(raw).strip().upper()
    s = re.sub(r"\s+", "", s)
    return s.lower().replace(".", "-")


def load_prices_from_xlsx(path: Path) -> tuple[dict[str, dict], list[str]]:
    """Ürün kodu (orijinal büyük/küçük korunmuş anahtar) -> {price, name, norm}."""
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    wb.close()
    if not rows:
        return {}, ["(boş sayfa)"]

    # İlk anlamlı satır başlık: genelde satır 2 (index 1), veri 3'ten itibaren
    header_idx = None
    for i, row in enumerate(rows[:5]):
        if row and row[0] and "KOD" in str(row[0]).upper():
            header_idx = i
            break
    if header_idx is None:
        header_idx = 1

    data_start = header_idx + 1
    by_code: dict[str, dict] = {}
    dup: list[str] = []

    for row in rows[data_start:]:
        if not row or row[0] is None:
            continue
        code = str(row[0]).strip()
        if not code or code.upper() == "ÜRÜN KODU":
            continue
        name = str(row[1]).strip() if len(row) > 1 and row[1] is not None else ""
        price_cell = row[2] if len(row) > 2 else None
        try:
            price = float(price_cell) if price_cell is not None else None
        except (TypeError, ValueError):
            price = None
        if price is None:
            continue
        norm = norm_code(code)
        if code in by_code and by_code[code]["price"] != price:
            dup.append(code)
        by_code[code] = {"price": price, "name": name, "norm": norm}

    return by_code, dup


def match_slug_to_norm(slug: str, norm_set: set[str]) -> str | None:
    parts = slug.lower().split("-")
    max_k = min(10, len(parts))
    for k in range(max_k, 0, -1):
        cand = "-".join(parts[-k:])
        if cand in norm_set:
            return cand
    return None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", type=Path, default=DEFAULT_XLSX, help="Fiyat listesi .xlsx")
    ap.add_argument("--products", type=Path, default=PRODUCTS_JSON)
    ap.add_argument("--apply", action="store_true", help="Ürün JSON'ına dealerPriceTRY yaz")
    args = ap.parse_args()

    if not args.xlsx.is_file():
        print("XLSX bulunamadı:", args.xlsx, file=sys.stderr)
        sys.exit(1)
    if not args.products.is_file():
        print("Ürün JSON bulunamadı:", args.products, file=sys.stderr)
        sys.exit(1)

    by_code, dup_warnings = load_prices_from_xlsx(args.xlsx)
    norm_to_original: dict[str, str] = {}
    for code, v in by_code.items():
        norm_to_original[v["norm"]] = code

    norm_set = set(norm_to_original.keys())

    with open(args.products, "r", encoding="utf-8") as f:
        bundle = json.load(f)

    products = bundle.get("products") or []
    excel_codes_norm = set(norm_to_original.keys())
    matched_norms: set[str] = set()
    priced = 0
    unmatched_products = 0

    for p in products:
        slug = (p.get("slug") or "").strip()
        n = match_slug_to_norm(slug, norm_set) if slug else None
        if n is None:
            unmatched_products += 1
            continue
        matched_norms.add(n)
        orig = norm_to_original[n]
        info = by_code[orig]
        p["_priceMatch"] = {
            "productCode": orig,
            "dealerPriceTRY": info["price"],
            "listName": info["name"],
        }
        priced += 1

    unmatched_excel = sorted(excel_codes_norm - matched_norms, key=lambda x: norm_to_original[x])

    overlay = {
        "sourceXlsx": str(args.xlsx),
        "importedAt": datetime.now(timezone.utc).isoformat(),
        "currency": "TRY",
        "listLabel": "Bayi 1",
        "excelRowCount": len(by_code),
        "matchedDistinctCodes": len(matched_norms),
        "unmatchedExcelCodes": [norm_to_original[n] for n in unmatched_excel],
        "byProductCode": {
            code: {"price": v["price"], "listName": v["name"], "norm": v["norm"]}
            for code, v in by_code.items()
        },
        "stats": {
            "wpProductCount": len(products),
            "productsWithSlugMatch": priced,
            "distinctCodesInExcel": len(by_code),
            "distinctCodesMatchedInWp": len(matched_norms),
            "excelCodesNotFoundInAnySlug": len(unmatched_excel),
        },
    }

    OVERLAY_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(OVERLAY_JSON, "w", encoding="utf-8") as f:
        json.dump(overlay, f, ensure_ascii=False, indent=2)

    # Konsol özeti
    print("--- Öztiryakiler fiyat eşleştirme ---")
    print("XLSX:", args.xlsx)
    print("Excel ürün kodu satırı:", len(by_code))
    print("WP ürün:", len(products))
    print("Slug ile eşleşen ürün kaydı:", priced)
    print("Excel'de olup hiçbir slug'da bulunamayan kod sayısı:", len(unmatched_excel))
    if dup_warnings:
        print("Uyarı: tekrarlayan kod (son değer kullanıldı):", len(dup_warnings))
    if unmatched_excel and len(unmatched_excel) <= 30:
        print("Eşleşmeyen kodlar:", ", ".join(norm_to_original[n] for n in unmatched_excel))
    elif unmatched_excel:
        print("İlk 20 eşleşmeyen kod:", ", ".join(norm_to_original[n] for n in unmatched_excel[:20]), "...")

    print("Overlay yazıldı:", OVERLAY_JSON)

    if args.apply:
        for p in products:
            m = p.pop("_priceMatch", None)
            if m:
                p["dealerPriceTRY"] = m["dealerPriceTRY"]
                p["priceListName"] = m["listName"]
                p["priceListCode"] = m["productCode"]
        bundle["priceListImportedAt"] = overlay["importedAt"]
        bundle["priceListSource"] = str(args.xlsx)
        bundle["priceListLabel"] = "Bayi 1"
        with open(args.products, "w", encoding="utf-8") as f:
            json.dump(bundle, f, ensure_ascii=False, indent=2)
        print("Ürün JSON güncellendi (--apply):", args.products)
    else:
        for p in products:
            p.pop("_priceMatch", None)
        print("Önizleme: --apply verilmedi; ana JSON değişmedi.")
        print("Tarayici: npm run dev  http://localhost:5173/ozti-bayi1-price-preview.html")


if __name__ == "__main__":
    main()
