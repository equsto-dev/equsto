#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Vosco_Katalog_2026.pdf → model kodu + USD/EUR liste fiyatı

  python scripts/extract-vosco-pdf-catalog.py
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "data" / "vosco" / "vosco-pdf-catalog.json"
RAPOR = ROOT / "scripts" / "data" / "vosco" / "vosco-pdf-rapor.md"
PDF = Path(
    os.environ.get(
        "VOSCO_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\Vosco_Katalog_2026.pdf",
    )
)

CODE_RE = re.compile(
    r"^(?:V[A-Z0-9][A-Z0-9\-/]{2,28}|FT-\d+[A-Z0-9\-]*|NG[345]R)$",
    re.I,
)
PRICE_USD_RE = re.compile(r"\$\s*([\d,]+(?:\.\d+)?)\s*USD", re.I)
PRICE_EUR_RE = re.compile(r"€\s*([\d,]+(?:\.\d+)?)\s*EUR", re.I)
TITLE_RE = re.compile(r"^Vosco\s+(.+)$", re.I)
DIM_RE = re.compile(
    r"(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*[x×X*]\s*(\d+(?:[.,]\d+)?)\s*cm",
    re.I,
)
GUC_RE = re.compile(r"(\d+)\s*W\s*/\s*(\d+)", re.I)
KAP_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*kg(?:/24\s*saat)?", re.I)
LT_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*L\b", re.I)
SKIP_CAT = re.compile(
    r"^(www\.|Biz Kimiz|VİZYON|MİSYON|\d{1,3}$|Endüstriyel|#2026|Güncel|QR|1\.BASKI|Vosco$)",
    re.I,
)


def norm_code(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(code or "").upper())


def parse_prices_near(lines: list[str], idx: int) -> tuple[float, float]:
    usd = eur = 0.0

    def scan(start: int, stop: int, step: int) -> None:
        nonlocal usd, eur
        j = start
        while j != stop:
            bl = lines[j]
            um = PRICE_USD_RE.search(bl)
            em = PRICE_EUR_RE.search(bl)
            if um and not usd:
                usd = float(um.group(1).replace(",", ""))
            if em and not eur:
                eur = float(em.group(1).replace(",", ""))
            if usd and eur:
                return
            j += step

    # Önce kod satırından sonraki fiyat (VFT/VKM gibi bloklarda doğru eşleşme)
    scan(idx + 1, min(len(lines), idx + 14), 1)
    if not usd and not eur:
        scan(idx - 1, max(-1, idx - 8), -1)
    return usd, eur


def expand_code_lines(
    lines: list[str], line_pages: list[int]
) -> tuple[list[str], list[int]]:
    """VKM-G3R | NG3R gibi çoklu kod satırlarını ayır."""
    out_lines: list[str] = []
    out_pages: list[int] = []
    for idx, line in enumerate(lines):
        page = line_pages[idx]
        if "|" not in line:
            out_lines.append(line)
            out_pages.append(page)
            continue
        parts = [p.strip() for p in line.split("|") if p.strip()]
        codes = [p.upper().replace(" ", "") for p in parts if CODE_RE.match(p.strip())]
        if len(codes) >= 2:
            for c in codes:
                out_lines.append(c)
                out_pages.append(page)
        else:
            out_lines.append(line)
            out_pages.append(page)
    return out_lines, out_pages


def pair_trailing_prices(lines: list[str]) -> None:
    """Ardışık fiyat satırları + ardışık kod satırları → eşleştir."""
    i = 0
    while i < len(lines):
        prices: list[tuple[str, float]] = []
        j = i
        while j < len(lines) and j < i + 6:
            um = PRICE_USD_RE.search(lines[j])
            em = PRICE_EUR_RE.search(lines[j])
            if um:
                prices.append(("usd", float(um.group(1).replace(",", ""))))
            elif em:
                prices.append(("eur", float(em.group(1).replace(",", ""))))
            elif prices:
                break
            j += 1
        if not prices:
            i += 1
            continue
        codes = []
        k = j
        while k < len(lines) and k < j + 8:
            if CODE_RE.match(lines[k]):
                codes.append(lines[k].upper().replace(" ", ""))
                k += 1
            elif codes:
                break
            else:
                k += 1
        if codes and len(prices) >= 1:
            for ci, code in enumerate(codes):
                pi = min(ci, len(prices) - 1)
                kind, val = prices[pi]
                # stored via global merge in extract_all
                _pending_pairs.append((code, kind, val))
        i = max(i + 1, k)


_pending_pairs: list[tuple[str, str, float]] = []


def extract_all(doc: fitz.Document) -> dict[str, dict]:
    global _pending_pairs
    _pending_pairs = []
    lines: list[str] = []
    line_pages: list[int] = []
    for pi in range(doc.page_count):
        for l in doc[pi].get_text().split("\n"):
            l = l.strip()
            if l:
                lines.append(l)
                line_pages.append(pi + 1)

    lines, line_pages = expand_code_lines(lines, line_pages)
    pair_trailing_prices(lines)

    products: dict[str, dict] = {}
    category = ""

    for i, line in enumerate(lines):
        if line.isupper() and len(line) > 8 and not CODE_RE.match(line):
            if not SKIP_CAT.search(line) and not PRICE_USD_RE.search(line) and not PRICE_EUR_RE.search(line):
                category = line.title() if line.isupper() else line

        if not CODE_RE.match(line):
            continue

        code = line.upper().replace(" ", "")
        nk = norm_code(code)
        usd, eur = parse_prices_near(lines, i)

        title = ""
        for j in range(max(0, i - 8), min(len(lines), i + 6)):
            tm = TITLE_RE.match(lines[j])
            if tm:
                title = f"Vosco {tm.group(1).strip()}"
                break

        block = " ".join(lines[max(0, i - 2) : min(len(lines), i + 10)])
        dims = None
        dm = DIM_RE.search(block)
        if dm:
            dims = {
                "raw": dm.group(0),
                "genislik_cm": float(dm.group(1).replace(",", ".")),
                "derinlik_cm": float(dm.group(2).replace(",", ".")),
                "yukseklik_cm": float(dm.group(3).replace(",", ".")),
            }
        gm = GUC_RE.search(block)
        km = KAP_RE.search(block)
        lm = LT_RE.search(block)

        prev = products.get(nk)
        entry = {
            "model": code,
            "modelNorm": nk,
            "title": title or (prev or {}).get("title") or code,
            "category": category or (prev or {}).get("category") or "",
            "page": line_pages[i],
            "specs": {
                "liste_usd": usd if usd > 0 else None,
                "liste_eur": eur if eur > 0 else None,
                "guc": gm.group(0) if gm else (prev or {}).get("specs", {}).get("guc"),
                "kapasite_kg": float(km.group(1).replace(",", ".")) if km else None,
                "kapasite_l": float(lm.group(1).replace(",", ".")) if lm else None,
                "olculer": dims or (prev or {}).get("specs", {}).get("olculer"),
            },
        }
        if prev:
            if not entry["specs"]["liste_usd"]:
                entry["specs"]["liste_usd"] = prev["specs"].get("liste_usd")
            if not entry["specs"]["liste_eur"]:
                entry["specs"]["liste_eur"] = prev["specs"].get("liste_eur")
        products[nk] = entry

    for code, kind, val in _pending_pairs:
        nk = norm_code(code)
        p = products.get(nk) or {
            "model": code,
            "modelNorm": nk,
            "title": code,
            "category": "",
            "page": 0,
            "specs": {},
        }
        if kind == "usd" and not p["specs"].get("liste_usd"):
            p["specs"]["liste_usd"] = val
        if kind == "eur" and not p["specs"].get("liste_eur"):
            p["specs"]["liste_eur"] = val
        products[nk] = p

    return products


def main() -> None:
    if not PDF.exists():
        print(f"PDF bulunamadı: {PDF}")
        sys.exit(1)

    doc = fitz.open(str(PDF))
    all_products = extract_all(doc)
    products = sorted(all_products.values(), key=lambda x: x["model"])
    priced = [p for p in products if p["specs"].get("liste_usd") or p["specs"].get("liste_eur")]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "liste": "Vosco Katalog 2026",
        "source": str(PDF),
        "extractedAt": datetime.now(timezone.utc).isoformat(),
        "pageCount": doc.page_count,
        "productCount": len(products),
        "pricedCount": len(priced),
        "products": products,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    eur_n = sum(1 for p in priced if p["specs"].get("liste_eur"))
    usd_n = sum(1 for p in priced if p["specs"].get("liste_usd"))
    lines = [
        "# Vosco PDF katalog raporu",
        "",
        f"Kaynak: `{PDF}`",
        f"Ürün: **{len(products)}** | Fiyatlı: **{len(priced)}** (EUR: {eur_n}, USD: {usd_n})",
        "",
        "| Kod | EUR | USD |",
        "|-----|-----|-----|",
    ]
    for p in priced[:25]:
        s = p["specs"]
        lines.append(
            f"| {p['model']} | {s.get('liste_eur') or '—'} | {s.get('liste_usd') or '—'} |"
        )
    RAPOR.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Yazıldı: {OUT} ({len(products)} ürün, {len(priced)} fiyatlı)")


if __name__ == "__main__":
    main()
