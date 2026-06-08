# -*- coding: utf-8 -*-
"""
Pimak 2026 EUR fiyat listesi (PDF) → scripts/data/pimak-fiyat.json

  python scripts/sync-pimak-fiyat-pdf.py
  python scripts/sync-pimak-fiyat-pdf.py --pdf "c:\\D Disk\\FİYAT LİSTELERİ\\pimak 27-27-030426.pdf"
"""
from __future__ import annotations

import argparse
import glob
import json
import re
from datetime import date
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "scripts/data/pimak-fiyat.json"
MANIFEST = ROOT / "../../PFOS/veri/pimak/products-tr.json"
PAGES_DIR = ROOT / "../../PFOS/veri/pimak/urun-sayfalari"

PRICE_LINE = re.compile(
    r"^([\d]{1,3}(?:\.\d{3})+|\d{1,4}(?:[.,]\d+)?)\s*€\s*$",
    re.I,
)
SKIP_CODE = re.compile(
    r"^(temel|basic|teknik|technical|ürün|product|fiyat|price|enerji|energy|güç|power|ebat|dims|ağırlık|weight|gaz|gas|gerilim|voltage|kapasite|capacity|motor|radyan|radian|genişlik|width|incelik|thickness|ısıtma|heating|monofaze|trifaze|series|serisi|serie|\d+)$",
    re.I,
)


def find_pdf(explicit: str) -> Path:
    if explicit:
        p = Path(explicit)
        if p.exists():
            return p
        raise FileNotFoundError(explicit)
    hits = glob.glob(r"C:/D Disk/**/pimak*030426*.pdf", recursive=True)
    if hits:
        return Path(hits[0])
    raise FileNotFoundError("pimak 27-27-030426.pdf bulunamadı")


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "")).strip().upper()


def parse_eur(raw: str) -> float:
    s = raw.strip().replace(" ", "")
    if "." in s and "," not in s:
        # 13.400 → 13400
        parts = s.split(".")
        if len(parts) == 2 and len(parts[1]) == 3:
            s = "".join(parts)
    s = s.replace(",", ".")
    return round(float(s), 2)


def clean_code(line: str) -> str:
    s = line.strip()
    m = re.match(r"^([A-Za-z0-9][A-Za-z0-9./+\-]*)(?:\s*\(.*)?$", s)
    return m.group(1) if m else s


def is_code(line: str) -> bool:
    s = clean_code(line.strip())
    if not s or len(s) > 40:
        return False
    if SKIP_CODE.match(s):
        return False
    if PRICE_LINE.match(s):
        return False
    if re.fullmatch(r"[\d.,]+x[\d.,]+(?:x[\d.,]+)?", s, re.I):
        return False
    if re.fullmatch(r"[\d.,]+\s*/\s*[\d.,]+", s):
        return False
    if re.search(r"[a-zA-Z]", s) and re.search(r"\d", s):
        return bool(re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9./+\-]*", s))
    if re.fullmatch(r"[A-Z]{1,4}[\-/][A-Z0-9][A-Za-z0-9./+\-]*", s):
        return True
    if re.fullmatch(r"G\.[A-Z]{2}\.[A-Z0-9.]+", s):
        return True
    if re.fullmatch(r"[A-Z]{1,3}\d{2,4}[A-Z0-9\-]*", s):
        return True
    if re.fullmatch(r"[A-Z]{2,5}(?:\.[A-Z0-9]{1,4})?", s):
        return True
    return False


HEADER_SKIP = {
    "Ürün Kodu",
    "Product Code",
    "Fiyat",
    "Price",
    "Ürün Adı",
    "Product Name",
    "Ebat (cm)",
    "Dims. (cm)",
    "Ağırlık Brüt (Kg)",
    "Gross Weight (Kg)",
    "Ağırlık Net (Kg)",
    "Net Weight (Kg)",
    "Hacim (m³)",
    "Volume (m³)",
}


def is_fiyat_anchor(line: str) -> bool:
    s = line.strip()
    return s == "Fiyat" or s.startswith("Fiyat ") or s == "Price" or s.startswith("Price ")


def collect_codes_before(lines: list[str], idx: int) -> list[str]:
    codes: list[str] = []
    j = idx - 1
    while j >= 0 and is_code(lines[j]):
        codes.insert(0, clean_code(lines[j]))
        j -= 1
    return codes


def collect_codes_after(lines: list[str], idx: int) -> tuple[list[str], int]:
    k = idx + 1
    while k < len(lines) and (lines[k] in HEADER_SKIP or is_fiyat_anchor(lines[k])):
        k += 1
    while k < len(lines) and not is_code(lines[k]) and not PRICE_LINE.match(lines[k]):
        k += 1
    codes: list[str] = []
    start = k
    while k < len(lines) and is_code(lines[k]):
        codes.append(clean_code(lines[k]))
        k += 1
    return codes, k - 1 if codes else start


def collect_prices_before(lines: list[str], end_idx: int, start_idx: int = 0) -> list[float]:
    prices: list[float] = []
    j = end_idx - 1
    while j >= start_idx:
        m = PRICE_LINE.match(lines[j])
        if m:
            prices.insert(0, parse_eur(m.group(1)))
            j -= 1
        elif lines[j] in {"-", "–"}:
            j -= 1
        elif prices:
            break
        else:
            j -= 1
    return prices


def collect_prices_after(lines: list[str], start_idx: int) -> list[float]:
    prices: list[float] = []
    j = start_idx + 1
    while j < len(lines):
        m = PRICE_LINE.match(lines[j])
        if m:
            prices.append(parse_eur(m.group(1)))
            j += 1
        elif prices:
            break
        else:
            j += 1
    return prices


def fiyat_anchors(lines: list[str]) -> list[int]:
    return [i for i, ln in enumerate(lines) if is_fiyat_anchor(ln)]


def pair_codes_prices(codes: list[str], lines: list[str], anchor_idx: int) -> list[tuple[str, float]]:
    if not codes:
        return []
    n = len(codes)
    candidates: list[list[float]] = []

    for fi in fiyat_anchors(lines):
        if fi > anchor_idx:
            p = collect_prices_before(lines, fi, anchor_idx)
        else:
            p = collect_prices_before(lines, fi)
        if len(p) == n:
            candidates.append(p)

    _, fwd_end = collect_codes_after(lines, anchor_idx)
    p_after = collect_prices_after(lines, fwd_end)
    if len(p_after) == n:
        candidates.append(p_after)

    if not candidates:
        return []
    return list(zip(codes, candidates[0]))


def scan_inline_runs(lines: list[str]) -> list[tuple[str, float]]:
    pairs: list[tuple[str, float]] = []
    i = 0
    while i < len(lines):
        if not is_code(lines[i]):
            i += 1
            continue
        codes: list[str] = []
        j = i
        while j < len(lines) and is_code(lines[j]):
            codes.append(clean_code(lines[j]))
            j += 1
        k = j
        limit = min(len(lines), j + 25)
        while k < limit and not PRICE_LINE.match(lines[k]):
            k += 1
        prices: list[float] = []
        while k < len(lines) and PRICE_LINE.match(lines[k]):
            prices.append(parse_eur(PRICE_LINE.match(lines[k]).group(1)))
            k += 1
        if codes and prices and len(codes) == len(prices):
            pairs.extend(zip(codes, prices))
        i = j if j > i else i + 1
    return pairs


def extract_pairs_from_page(text: str) -> list[tuple[str, float]]:
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    pairs: list[tuple[str, float]] = []
    seen_blocks: set[tuple[str, ...]] = set()

    for i, line in enumerate(lines):
        if line not in ("Ürün Kodu", "Product Code"):
            continue
        for codes in (collect_codes_before(lines, i), collect_codes_after(lines, i)[0]):
            if not codes:
                continue
            key = tuple(codes)
            if key in seen_blocks:
                continue
            block = pair_codes_prices(codes, lines, i)
            if block:
                seen_blocks.add(key)
                pairs.extend(block)

    pairs.extend(scan_inline_runs(lines))
    return pairs


def parse_pdf(pdf_path: Path) -> dict[str, dict]:
    """Blok parse (birincil) + satır içi tarama (yedek)."""
    import importlib.util
    import sys

    pimak_root = Path(__file__).resolve().parent.parent.parent.parent / "PFOS" / "veri" / "pimak"
    if str(pimak_root) not in sys.path:
        sys.path.insert(0, str(pimak_root))
    spec = importlib.util.spec_from_file_location("parse_p188", pimak_root / "parse-pdf-p188-197.py")
    parse_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(parse_mod)

    from pimak_pdf_blocks import extract_block_pairs_from_page

    doc = fitz.open(pdf_path)
    raw: dict[str, dict] = {}

    def put(code: str, price: float, page: int) -> None:
        key = norm_kod(code)
        raw[key] = {"urun_kodu": code, "liste_fiyati_eur": price, "pdf_page": page}

    for i, page in enumerate(doc, start=1):
        body = page.get_text("text")
        if "Orta Tip Filtreli" in body and re.search(r"P[Iİi]MAK\.", body, re.I):
            for row in parse_mod.parse_page_195(body, {}):
                put(row["urun_kodu"], row["liste_fiyati_eur"], i)
            continue
        for row in extract_block_pairs_from_page(
            body,
            i,
            is_product_code=parse_mod.is_product_code,
            norm_kod=parse_mod.norm_kod,
            price_line=PRICE_LINE,
            parse_eur=parse_eur,
        ):
            put(row["urun_kodu"], row["liste_fiyati_eur"], i)

    # Yedek: blokta yakalanmayan kodlar için eski satır içi tarama
    for i, page in enumerate(doc, start=1):
        for code, price in extract_pairs_from_page(page.get_text("text")):
            key = norm_kod(code)
            if key not in raw:
                raw[key] = {"urun_kodu": code, "liste_fiyati_eur": price, "pdf_page": i}

    return raw


def load_catalog_codes() -> set[str]:
    codes: set[str] = set()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    for p in manifest.get("products", []):
        if p.get("urunKodu"):
            codes.add(norm_kod(p["urunKodu"]))
        slug = p.get("slug", "")
        if slug:
            codes.add(norm_kod(slug))
    if PAGES_DIR.exists():
        for f in PAGES_DIR.glob("*.json"):
            d = json.loads(f.read_text(encoding="utf-8"))
            if d.get("urunKodu"):
                codes.add(norm_kod(d["urunKodu"]))
    return codes


def alias_keys(code: str) -> list[str]:
    k = norm_kod(code)
    out = [k]
    if k.startswith("PI/"):
        out.append(k[3:])
    out.append(k.replace("/", "-"))
    out.append(k.replace(".", "-"))
    out.append(k.replace(".", ""))
    return list(dict.fromkeys(out))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default="")
    args = ap.parse_args()
    pdf_path = find_pdf(args.pdf)
    prices = parse_pdf(pdf_path)
    catalog = load_catalog_codes()

    matched = 0
    for k in prices:
        if any(a in catalog for a in alias_keys(k)):
            matched += 1

    payload = {
        "_meta": {
            "kaynak": str(pdf_path),
            "tarih": date.today().isoformat(),
            "para_birimi": "EUR",
            "iskonto_yuzde": 47,
            "odeme_carpani": 0.53,
            "kar_yuzde": 5,
            "toplam_pdf_satir": len(prices),
            "katalog_eslesen": matched,
        },
        **{k: v for k, v in sorted(prices.items())},
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[pimak-fiyat] PDF: {pdf_path.name}")
    print(f"[pimak-fiyat] {len(prices)} fiyat satiri -> {OUT.relative_to(ROOT)}")
    print(f"[pimak-fiyat] katalog kod eşleşmesi (yaklaşık): {matched}")


if __name__ == "__main__":
    main()
