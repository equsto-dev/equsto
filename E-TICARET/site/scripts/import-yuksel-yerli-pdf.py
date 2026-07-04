#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YÜKSEL YERLİ - 2025.pdf → Equsto fiyat listesi JSON

  python scripts/import-yuksel-2025-pdf.py
  python scripts/import-yuksel-2025-pdf.py "C:\\D Disk\\FİYAT LİSTELERİ\\YÜKSEL YERLİ - 2025.pdf"

Çıktı: public/data/fiyat-listeleri/yuksel/2025-yerli/tum-urunler.json
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
DEFAULT_PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf")
OUT_ROOT = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-yerli"

BRAND = "Yüksel Endüstriyel"
LISTE = "YÜKSEL YERLİ - 2025"
KAYNAK = "yuksel-2025-yerli-pdf"

MODEL_CODE_RE = re.compile(
    r"^(?:M\d{6,}|CA-[A-Z0-9][\w.-]*|[A-Z]{1,4}[-.][A-Z0-9][\w./-]{2,}|[A-Z]{2}\d{2,}[\w.-]*)$",
    re.I,
)

DEPT_RULES: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"her kap[iı]da|tezgah\s*tip|tezgahalti|make[- ]?up|camli make|slim.*buzdolab", re.I), "sogutma", "tezgah-alti-sogutma"),
    (re.compile(r"portashelf|tel raf|korkuluk|ayaklar|yardımcı|auxiliary|raf\b|tier shelv", re.I), "istif", "portashelf"),
    (re.compile(r"bulaşık|dishwash|yıkama mak", re.I), "yikama", "bulasik-makineleri"),
    (re.compile(r"davlumbaz|filtre|hood|sterile", re.I), "davlumbaz", "davlumbaz"),
    (re.compile(r"araba|taşıma|servis araba|çamaşır|tabak otomat|muhafaza", re.I), "tasima", "tasima-arabalari"),
    (re.compile(r"yer süzgeç|gider", re.I), "yikama", "yer-gideri"),
    (re.compile(r"bar\s*blender", re.I), "icecek", "bar-blender"),
    (re.compile(r"buzdolab|soğut|refriger|freezer|derin dondur|portabianco|barista|pizza", re.I), "sogutma", "sogutma-ekipmanlari"),
    (re.compile(r"tezgah|counter type|make up|undercounter", re.I), "sogutma", "tezgah-alti-sogutma"),
    (re.compile(r"fırın|firin|ocak|izgara|kuzine|fritöz|pişir", re.I), "pisirme", "pisirme"),
]


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "diger"


def norm(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("\u00a0", " ").strip().lower()
    s = s.replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")
    return re.sub(r"\s+", " ", s)


def parse_euro_num(s: str) -> float | None:
    if not s:
        return None
    s = unicodedata.normalize("NFKC", s).strip().replace("€", "").replace(" ", "")
    if not s or s.lower() in ("-", "—"):
        return None
    m = re.search(r"([\d.,]+)", s)
    if not m:
        return None
    raw = m.group(1)
    if re.match(r"^\d{1,3}(\.\d{3})+$", raw):
        return float(raw.replace(".", ""))
    if "," in raw and "." in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif "," in raw:
        raw = raw.replace(",", ".")
    try:
        v = float(raw)
        return v if v > 0 else None
    except ValueError:
        return None


COOLING_MODEL_RE = re.compile(
    r"^(PZA|PZAD|TTC|TTU|ASB|SBB|SBTM|GN|CA-|SBB|SBM|TTM)[\w./-]*$",
    re.I,
)


def is_dimension_token(s: str) -> bool:
    s = unicodedata.normalize("NFKC", s or "").strip()
    return bool(re.match(r"^\d{1,4}\s*[xX]\s*\d", s)) or bool(re.match(r"^\d{2,4}X\d{2,4}X\d", s, re.I))


def min_list_eur(model: str, dept: str) -> float:
    if dept == "sogutma" or COOLING_MODEL_RE.match(model or ""):
        return 80.0
    if dept == "istif":
        return 15.0
    return 5.0


def is_model_code(s: str) -> bool:
    s = unicodedata.normalize("NFKC", s or "").strip()
    if not s or len(s) < 4 or len(s) > 48:
        return False
    if is_dimension_token(s):
        return False
    if re.match(r"^M\d{6,}$", s, re.I):
        return True
    if re.match(r"^CA-[A-Z0-9]", s, re.I):
        return True
    if re.match(r"^[A-Z]{2,}[-.][A-Z0-9][\w./-]+$", s, re.I):
        return True
    if MODEL_CODE_RE.match(s):
        return True
    return False


def classify_subcat(subcat: str) -> tuple[str, str]:
    for pat, dept, cat in DEPT_RULES:
        if pat.search(subcat):
            return dept, cat
    return "diger", slugify(subcat)[:80]


def parse_euro_from_cell(s: str) -> float | None:
    if not s:
        return None
    if "€" in s or re.search(r"euro", s, re.I):
        return parse_euro_num(s)
    return parse_euro_num(s)


def parse_price_cell(s: str) -> float | None:
    """Ölçü+ağırlık birleşik hücreleri (237x74x91 135) fiyat sanma."""
    s = unicodedata.normalize("NFKC", str(s or "")).strip()
    if not s:
        return None
    if re.search(r"\d\s*[xX]\s*\d", s):
        parts = s.split()
        if len(parts) >= 2 and not re.search(r"[xX]", parts[-1]):
            return parse_euro_num(parts[-1])
        return None
    return parse_euro_num(s)


def _header_cell(rows: list[list], row_i: int, col_i: int) -> str:
    if row_i >= len(rows) or col_i >= len(rows[row_i]):
        return ""
    return str(rows[row_i][col_i] or "")


def _find_price_column(rows: list[list]) -> int | None:
    ncol = max(len(r) for r in rows[:2]) if rows else 0
    for i in range(ncol):
        h = norm(_header_cell(rows, 0, i) + " " + _header_cell(rows, 1, i))
        if "fiyat" in h or re.search(r"\bprice\b", h):
            return i
    for i in range(ncol - 1, 0, -1):
        h = norm(_header_cell(rows, 0, i) + " " + _header_cell(rows, 1, i))
        if "fiyat" in h or "price" in h:
            return i
    return None


def _guess_list_price_column(rows: list[list], ncols: int) -> int | None:
    """Fiyat sütunu PDF'de kayıpken (pizza sayfası): Hacim=825 € gibi."""
    data = rows[2:]
    best_i: int | None = None
    best_score = 0.0
    for i in range(1, ncols):
        vals: list[float] = []
        for row in data:
            if i >= len(row):
                continue
            v = parse_price_cell(str(row[i] or ""))
            if v is not None and 200 <= v <= 50_000:
                vals.append(v)
        if len(vals) < 2:
            continue
        h = norm(_header_cell(rows, 0, i) + " " + _header_cell(rows, 1, i))
        score = len(vals) * 2
        if "hacim" in h or "capacity" in h:
            score += 6
        if min(vals) >= 400:
            score += 4
        if score > best_score:
            best_score = score
            best_i = i
    return best_i


def parse_horizontal_product_table(rows: list[list]) -> list[dict]:
    """Model | … | Fiyat (€) — soğutma / Portabianco tabloları."""
    if not rows or len(rows) < 3:
        return []
    if norm(str(rows[0][0] if rows[0] else "")) != "model":
        return []
    ncols = max(len(r) for r in rows)
    price_col = _find_price_column(rows)
    if price_col is None:
        price_col = _guess_list_price_column(rows, ncols)

    products: list[dict] = []
    for row in rows[2:]:
        if not row:
            continue
        model = re.sub(r"\s+", "", str(row[0] or "").strip())
        if not is_model_code(model):
            continue
        rec: dict = {"model_kodu": model}
        if price_col is not None and price_col < len(row):
            euro = parse_price_cell(str(row[price_col] or ""))
            if euro is not None and euro >= min_list_eur(model, "sogutma"):
                rec["fiyat_euro"] = f"{euro:g} €"
        for ci in range(1, min(len(row), ncols)):
            if ci == price_col:
                continue
            h = norm(_header_cell(rows, 0, ci) + " " + _header_cell(rows, 1, ci))
            val = str(row[ci] or "").strip()
            if not val:
                continue
            if "olcu" in h or "dimension" in h:
                if re.search(r"\d\s*[xX]\s*\d", val):
                    rec["olculer_net"] = val
            elif "agirlik" in h or h == "weight":
                rec["agirlik_net"] = val
            elif "sicaklik" in h or "temp" in h:
                rec["sicaklik"] = val
            elif "guc" in h or h == "power":
                rec["guc_kw"] = val
        if rec.get("fiyat_euro"):
            products.append(rec)
    return products


def transpose_table_atelay(rows: list[list]) -> list[dict]:
    if not rows or len(rows) < 2:
        return []
    header = rows[0]
    if not header or norm(str(header[0] or "")) != "model":
        return []
    models = [str(c or "").strip() for c in header[1:]]
    models = [m for m in models if m and norm(m) != "model"]
    if not models:
        return []
    products: list[dict] = []
    for i, model in enumerate(models):
        rec: dict = {"model_kodu": model}
        for row in rows[1:]:
            if not row:
                continue
            label = norm(str(row[0] or ""))
            val = str(row[i + 1] if i + 1 < len(row) else "").strip()
            if label.startswith("fiyat") or label == "price":
                rec["fiyat_euro"] = val
            elif "guc" in label or label == "kw":
                rec["guc_kw"] = val
            elif "voltaj" in label:
                rec["voltaj"] = val
            elif "net" in label and "olcu" in label:
                rec["olculer_net"] = val
            elif "paket" in label and "olcu" in label:
                rec["olculer_paket"] = val
            elif "agirlik" in label or label == "weight":
                rec["agirlik_net"] = val
            elif "hacim" in label or "capacity" in label:
                rec["hacim"] = val
            elif "sicaklik" in label or label == "temp.":
                rec["sicaklik"] = val
        products.append(rec)
    return products


def _price_ok(v: float | None, *, min_eur: float = 5.0) -> bool:
    return v is not None and min_eur <= v <= 120_000


def parse_mcode_block(lines: list[str]) -> list[dict]:
    """Portashelf: KOD listesi + € fiyat listesi (matris veya ardışık)."""
    out: list[dict] = []
    codes = [l.strip().upper() for l in lines if re.match(r"^M\d{7,}$", l.strip(), re.I)]
    prices: list[float] = []
    for l in lines:
        s = unicodedata.normalize("NFKC", l).strip()
        if "€" in s or re.search(r"\beuro\b", s, re.I):
            v = parse_euro_num(s)
            if _price_ok(v):
                prices.append(v)
    if codes and prices and len(codes) == len(prices):
        for c, p in zip(codes, prices):
            out.append({"model_kodu": c, "fiyat_euro": f"{p:g} €"})
        return out

    i = 0
    while i < len(lines):
        l = lines[i].strip()
        if re.match(r"^M\d{7,}$", l, re.I):
            code = l.upper()
            price = None
            for j in range(i + 1, min(i + 4, len(lines))):
                if re.match(r"^M\d", lines[j].strip(), re.I):
                    break
                v = parse_euro_num(lines[j])
                if _price_ok(v):
                    price = v
                    break
            if price is not None:
                out.append({"model_kodu": code, "fiyat_euro": f"{price:g} €"})
        i += 1
    return out


def parse_reversed_model_grid(lines: list[str]) -> list[dict]:
    """Model kodları 'Model' etiketinin hemen üstünde; fiyatlar daha yukarıda."""
    model_i = None
    for i, l in enumerate(lines):
        if norm(l) == "model":
            model_i = i
            break
    if model_i is None:
        return []

    models: list[str] = []
    j = model_i - 1
    while j >= 0 and is_model_code(lines[j]):
        models.insert(0, lines[j])
        j -= 1
    n = len(models)
    if n == 0:
        return []

    stack = [lines[k] for k in range(0, model_i - n)]
    prices: list[float] = []
    for line in reversed(stack):
        v = parse_euro_num(line)
        if _price_ok(v, min_eur=80.0):
            prices.insert(0, v)
        elif prices and len(prices) >= n:
            break
    if len(prices) != n:
        return []

    attrs: dict[str, list[str]] = {}
    k = model_i + 1
    while k < len(lines):
        lab = norm(lines[k])
        if lab.startswith("porta") or lab in ("options", "opsiyonlar"):
            break
        if lab in (
            "sicaklik(c)",
            "temp.",
            "capacity",
            "power",
            "hacim(lt.)",
            "paslanmaz ozelligi",
            "stainless steeln",
            "net dimensions",
            "paket olcusu(cm)",
            "packing dimensions",
            "guc(w)",
            "olcu(cm)",
            "agirlik",
            "weight",
            "price",
            "fiyat (e)",
            "fiyat",
        ):
            field = {
                "sicaklik(c)": "sicaklik",
                "temp.": "sicaklik",
                "capacity": "hacim",
                "power": "guc_kw",
                "hacim(lt.)": "hacim",
                "net dimensions": "olculer_net",
                "paket olcusu(cm)": "olculer_paket",
                "packing dimensions": "olculer_paket",
                "guc(w)": "guc_kw",
                "olcu(cm)": "olculer_net",
                "agirlik": "agirlik_net",
                "weight": "agirlik_net",
            }.get(lab, lab.replace(" ", "_"))
            vals: list[str] = []
            k += 1
            while k < len(lines):
                nl = norm(lines[k])
                if nl in (
                    "model",
                    "price",
                    "fiyat (e)",
                    "fiyat",
                ) or nl.startswith("porta"):
                    break
                if nl in (
                    "sicaklik(c)",
                    "temp.",
                    "capacity",
                    "power",
                    "hacim(lt.)",
                    "net dimensions",
                    "price",
                    "fiyat (e)",
                    "fiyat",
                ):
                    break
                vals.append(lines[k])
                k += 1
            if vals:
                attrs[field] = vals[-n:] if len(vals) >= n else vals
            continue
        k += 1

    products = []
    for i, model in enumerate(models):
        rec: dict = {"model_kodu": model}
        if i < len(prices) and prices[i]:
            rec["fiyat_euro"] = f"{prices[i]:g} €"
        for fk, arr in attrs.items():
            if i < len(arr) and arr[i]:
                rec[fk] = arr[i]
        products.append(rec)
    return products


def parse_bar_blender_cards(lines: list[str]) -> list[dict]:
    """Portabianco ürün kartı: BAR BLENDER 1280 + FİYAT 238 € (tablo değil)."""
    if not any(re.search(r"bar\s*blender", l, re.I) for l in lines):
        return []
    out: list[dict] = []
    seen: set[str] = set()
    for i, raw in enumerate(lines):
        m = re.match(r"^BAR\s*BLENDER\s+(\d{3,4}[A-Z]*)$", raw.strip(), re.I)
        if not m:
            continue
        model = m.group(1).upper().replace("İ", "I")
        if model in seen:
            continue
        price: float | None = None
        for j in range(i + 1, min(i + 28, len(lines))):
            line = lines[j].strip()
            if re.match(r"^BAR\s*BLENDER\s+", line, re.I):
                break
            if re.search(r"fiyat|price", line, re.I):
                price = parse_euro_num(line)
                if price:
                    break
            v = parse_euro_num(line)
            if v is not None and 40 <= v <= 900 and not re.search(r"\d\s*[xX]\s*\d", line):
                price = v
        if price is not None:
            seen.add(model)
            out.append({"model_kodu": model, "fiyat_euro": f"{price:g} €"})
    return out


def parse_size_price_grid(lines: list[str]) -> list[dict]:
    """46 X 91 X 183 + 488 € gibi ızgara satırları."""
    out: list[dict] = []
    i = 0
    while i < len(lines):
        l = lines[i]
        if re.match(r"^\d+\s*[xX]\s*\d+\s*[xX]\s*\d+", l):
            size = l.replace(" ", " ").upper()
            price = None
            for j in range(i + 1, min(i + 4, len(lines))):
                v = parse_euro_num(lines[j])
                if v is not None:
                    price = v
                    break
            if price is not None:
                out.append(
                    {
                        "model_kodu": size.replace(" ", "-"),
                        "olculer_net": size,
                        "fiyat_euro": f"{price:g} €",
                    }
                )
        i += 1
    return out


def product_to_equsto(
    rec: dict, *, serie: str, subcat: str, dept: str, folder_slug: str, page: int
) -> dict | None:
    model = str(rec.get("model_kodu", "")).strip()
    euro = parse_price_cell(str(rec.get("fiyat_euro", ""))) or parse_euro_from_cell(
        str(rec.get("fiyat_euro", ""))
    )
    if not model:
        return None
    if euro is None or euro < min_list_eur(model, dept):
        return None

    sub_short = subcat.split("\n")[0].strip()[:120]
    name = f"{BRAND} {sub_short} {model}".replace("  ", " ").strip()
    spec_lines = [
        f"Kaynak: {LISTE}",
        f"Seri: {serie}" if serie else "",
        f"Kategori: {subcat}",
        f"Model / kod: {model}",
    ]
    for key, label in (
        ("sicaklik", "Sıcaklık"),
        ("hacim", "Hacim"),
        ("guc_kw", "Güç"),
        ("voltaj", "Voltaj"),
        ("olculer_net", "Ölçü (cm)"),
        ("olculer_paket", "Paket ölçüsü"),
        ("agirlik_net", "Ağırlık"),
    ):
        if rec.get(key):
            spec_lines.append(f"{label}: {rec[key]}")
    spec_lines.append(f"Liste fiyatı (EUR): {euro:g} €")

    return {
        "category": folder_slug,
        "brand": BRAND,
        "name": name,
        "price": f"{euro:g} € + KDV",
        "specs": "\n".join(x for x in spec_lines if x),
        "sku": re.sub(r"\s+", "", model.upper()),
        "model": model,
        "tip_kodu": slugify(model),
        "liste": LISTE,
        "kaynak": KAYNAK,
        "dept": dept,
        "alt_kategori": subcat,
        "seri": serie,
        "fiyat_euro": euro,
        "olculer_net_mm": str(rec.get("olculer_net", "")).replace(" ", ""),
        "guc_kw": str(rec.get("guc_kw", "")),
        "voltaj": str(rec.get("voltaj", "")),
        "page": page,
        "equsto_folder": f"{dept}/{folder_slug}",
    }


SKIP_SUBCAT = re.compile(
    r"^(kod|fiyat|price|code|size|ölçü|olcu|model|temp|capacity|power|weight|aisi|inox|boyali|plastik|portashelf)$",
    re.I,
)


def detect_subcat(page_text: str, prev: str) -> str:
    lines = [unicodedata.normalize("NFKC", l).strip() for l in page_text.splitlines()]
    lines = [l for l in lines if l and len(l) < 120]
    candidates: list[str] = []
    for l in lines[:25]:
        if re.match(r"^\d{1,3}$", l):
            continue
        if re.search(r"kod\s*/\s*code|fiyat\s*/\s*price", l, re.I):
            continue
        if SKIP_SUBCAT.search(l.replace(" / ", " ").split("/")[0].strip()):
            continue
        if re.search(r"portashelf|portabianco|professional|profesyonel", l, re.I):
            candidates.append(l)
        elif len(l) > 8 and l == l.upper() and re.search(r"[A-ZÇĞİÖŞÜ]", l):
            if not re.search(r"^AISI|^INOX|^BOYALI|^304|^201$|^PLAST", l):
                candidates.append(l)
        elif re.search(r"tezgah|buzdolab|raf|makine|araba|davlumbaz|filtre|katli", l, re.I):
            candidates.append(l)
    if candidates:
        return " · ".join(dict.fromkeys(candidates[:4]))
    return prev


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.is_file():
        print("PDF bulunamadı:", pdf_path)
        sys.exit(1)

    doc = fitz.open(pdf_path)
    serie = ""
    subcat = ""
    by_folder: dict[str, list[dict]] = {}
    meta_pages: list[dict] = []
    total = 0
    seen: set[str] = set()

    for pi in range(doc.page_count):
        page = doc[pi]
        text = page.get_text()
        subcat = detect_subcat(text, subcat)
        if not subcat or re.fullmatch(r"(?i)kod\s*/\s*code", subcat.strip()):
            continue

        dept, folder_slug = classify_subcat(subcat)
        lines = [unicodedata.normalize("NFKC", l).strip() for l in text.splitlines()]
        lines = [l for l in lines if l]

        recs: list[dict] = []
        for tab in page.find_tables().tables:
            try:
                raw = tab.extract()
            except Exception:
                continue
            horiz = parse_horizontal_product_table(raw)
            if horiz:
                recs.extend(horiz)
            else:
                recs.extend(transpose_table_atelay(raw))

        if not any(r.get("fiyat_euro") for r in recs):
            recs.extend(parse_reversed_model_grid(lines))
        recs.extend(parse_bar_blender_cards(lines))
        recs.extend(parse_mcode_block(lines))
        if dept == "istif" or "portashelf" in subcat.lower():
            recs.extend(parse_size_price_grid(lines))

        page_best: dict[str, dict] = {}
        for rec in recs:
            item = product_to_equsto(
                rec, serie=serie, subcat=subcat, dept=dept, folder_slug=folder_slug, page=pi + 1
            )
            if not item:
                continue
            sku = item["sku"]
            prev = page_best.get(sku)
            if not prev or float(item["fiyat_euro"]) > float(prev["fiyat_euro"]):
                page_best[sku] = item

        page_count = 0
        for item in page_best.values():
            key = f"{item['sku']}|{item['fiyat_euro']}"
            if key in seen:
                continue
            seen.add(key)
            fk = f"{dept}/{folder_slug}"
            by_folder.setdefault(fk, []).append(item)
            total += 1
            page_count += 1

        if page_count:
            meta_pages.append(
                {
                    "page": pi + 1,
                    "subcat": subcat,
                    "dept": dept,
                    "folder": folder_slug,
                    "count": page_count,
                }
            )

    doc.close()

    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    index = {
        "marka": BRAND,
        "liste": LISTE,
        "kaynak_pdf": str(pdf_path),
        "olusturma": datetime.now(timezone.utc).isoformat(),
        "toplam_urun": total,
        "klasorler": [],
    }

    for key in sorted(by_folder.keys()):
        dept, slug = key.split("/", 1)
        dest_dir = OUT_ROOT / dept / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        items = by_folder[key]
        with open(dest_dir / "urunler.json", "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        index["klasorler"].append(
            {"dept": dept, "slug": slug, "path": key, "adet": len(items)}
        )

    all_items: list[dict] = []
    for key in sorted(by_folder.keys()):
        all_items.extend(by_folder[key])

    by_sku_best: dict[str, dict] = {}
    for item in all_items:
        sku = str(item.get("sku") or "")
        if not sku:
            continue
        prev = by_sku_best.get(sku)
        if not prev or float(item["fiyat_euro"]) > float(prev["fiyat_euro"]):
            by_sku_best[sku] = item
    all_items = list(by_sku_best.values())
    total = len(all_items)

    with open(OUT_ROOT / "tum-urunler.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)
    with open(OUT_ROOT / "_index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
    with open(OUT_ROOT / "_sayfa-log.json", "w", encoding="utf-8") as f:
        json.dump(meta_pages, f, ensure_ascii=False, indent=2)

    print(f"OK: {total} urun -> {OUT_ROOT}")
    for k in sorted(by_folder.keys()):
        print(f"  {k}: {len(by_folder[k])}")


if __name__ == "__main__":
    main()
