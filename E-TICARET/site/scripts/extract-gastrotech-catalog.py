# -*- coding: utf-8 -*-
"""
Gastrotech 2025-2027 katalog PDF → ürün JSON (model, ad, liste fiyatı, sayfa).

Fiyat sütunu tipik olarak satırın en sağındaki sayı (EUR; TL sayfalarında TL).
Rational (s.91–94 ve RATIONAL başlıklı) ve Electrolux ürünleri çıkarılmaz.

  python scripts/extract-gastrotech-catalog.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF_CANDIDATES = [
    Path(r"C:\D Disk\FİYAT LİSTELERİ\Gastrotech 2025-2027 Kataloğu.pdf"),
    ROOT / "scripts/data/gastrotech/Gastrotech-2025-2027.pdf",
]
OUT = ROOT / "scripts/data/gastrotech/gastrotech-catalog-extracted.json"

# Sayfa aralıkları (1-indexed, inclusive) — TOC
SECTION = {
    "pisirme": (7, 89),
    "firin": (90, 130),
    "sogutma": (131, 175),
    "hazirlik": (176, 204),
    "kahve_kafeterya": (205, 249),
    "camasir": (250, 258),  # TOC: çamaşırhane 250; PDF'te bulaşık da burada
    "bulasik": (250, 265),
    "tamamlayici": (266, 272),
}

# Rational: iCombi sayfaları + aksesuar sayfaları (dokunulmaz)
RATIONAL_PAGES = set(range(91, 95))  # 91–94
SKIP_PAGE_MARKERS = re.compile(r"RATIONAL\s+FIRIN|RATIONAL\b", re.I)

# Model kodu: sol sütundaki ürün kimliği
MODEL_TOKEN = re.compile(
    r"^(?:"
    r"[A-Z]{1,6}\d{2,}[A-Z0-9\-]*"  # GKO6010, ICP61E, VBY1500L
    r"|[A-Z]{2,6}[-.][A-Z0-9.\-]+"  # GT-2M-TC, ST-530ED
    r"|\d{2}\.\d{2}\.\d{3}"  # Rational-style — yine de Rational sayfalarında skip
    r"|\d{4}\.\d{3,4}"
    r"|371\d{3}"  # 700 seri sayısal kodlar
    r"|EC\s?\d{2,3}"
    r"|EK\s?43\s?[ST]*"
    r"|PUQ\s?PRESS\s?(?:Q|PRO)?"
    r"|M4"
    r"|PRO"
    r"|Q"
    r")$",
    re.I,
)

DIM_RE = re.compile(r"^\d{2,4}\s*[x×]\s*\d{2,4}\s*[x×]\s*\d{2,4}$", re.I)
NUM_RE = re.compile(r"^[\d.]+€?$")
EURO_LINE = re.compile(r"([\d.]+)\s*€")
EURO_WORD = re.compile(r"^([\d.]+)\s*Euro$", re.I)

# Türkçe ürün adı satırı (İngilizce Product Name değil)
TR_NAME_HINT = re.compile(
    r"^(Gazlı|Elektrikli|İndüksiyon|Kombi|Konveksiyon|Fırın|Ocak|Izgara|Fritöz|Benmari|"
    r"Dolap|Tezgah|Buz|Makine|Makinesi|Değirmen|Tamper|Kuzine|Wok|Pleyt|Seri|"
    r"Yarı|Otomatik|Dik|Şok|Dry|Himalaya|Kokteyl|Demonte|Delikli|Düz|"
    r"Konveyörlü|Bulaşık|Çamaşır|Yıkama|Raf|Izgara|Hazırlık|Mutfak|"
    r"Gtech|PUQ|Kitchen|Imperia|Scotsman|Vital|Gastrotech)",
    re.I,
)


def find_pdf() -> Path:
    for p in PDF_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("Gastrotech PDF bulunamadı")


def parse_tr_number(raw: str) -> float | None:
    s = raw.strip().replace("€", "").replace(" ", "")
    if not s or not re.fullmatch(r"[\d.]+", s):
        return None
    if "." in s:
        parts = s.split(".")
        if len(parts) == 2 and len(parts[1]) == 3 and parts[0].isdigit():
            # 1.689 → 1689 (binlik ayırıcı)
            return float(parts[0] + parts[1])
        if len(parts) == 2 and len(parts[1]) <= 2:
            return float(s)
        # 10.054 veya 47.852 → binlik
        return float("".join(parts))
    return float(s)


def section_for(page: int) -> str:
    if 7 <= page <= 89:
        return "pisirme"
    if 90 <= page <= 130:
        return "firin"
    if 131 <= page <= 175:
        return "sogutma"
    if 176 <= page <= 204:
        return "hazirlik"
    if 205 <= page <= 249:
        return "kahve"
    if 250 <= page <= 265:
        return "yikama"
    if 266 <= page <= 272:
        return "servis"
    return "pisirme"


def dept_for(page: int) -> str:
    """Equsto dept dosya adı."""
    s = section_for(page)
    return {
        "pisirme": "pisirme",
        "firin": "pisirme",
        "sogutma": "sogutma",
        "hazirlik": "hazirlik",
        "kahve": "kahve",
        "yikama": "yikama",
        "servis": "servis",
    }.get(s, "pisirme")


def is_rational_model(code: str) -> bool:
    c = code.upper().replace(" ", "")
    if c.startswith(("ICP", "ICC")):
        return True
    if re.match(r"^\d{2}\.\d{2}\.\d{3}$", c):
        return True
    if re.match(r"^60\d{2}\.\d{3,4}$", c) or re.match(r"^56\.\d{2}\.\d{3}$", c):
        return True
    if re.match(r"^601[0-9]\.", c):
        return True
    if "RATIONAL" in c:
        return True
    return False


def normalize_model(code: str) -> str:
    c = re.sub(r"\s+", " ", code.strip())
    c = c.replace("×", "x")
    # Gtech ST-530 ED → ST-530ED / keep readable
    return c


def group_lines(words, y_bucket: int = 3):
    lines = defaultdict(list)
    for w in words:
        y = int(round(w[1] / y_bucket) * y_bucket)
        lines[y].append(w)
    return lines


def is_valid_model(model: str) -> bool:
    m = model.strip()
    if not m or len(m) < 3:
        return False
    if is_rational_model(m):
        return False
    # Saf kısa sayı (Scotsman parçası vb.) — 371xxx / 217xxx hariç
    if re.fullmatch(r"\d{1,4}", m):
        return False
    if re.fullmatch(r"\d{5,6}", m) and not m.startswith(("371", "217", "60")):
        # büyük pizza/fırın kodları 217xxx OK; diğer 5-6 hane şüpheli
        if not m.startswith("217"):
            return False
    if m.upper() in {"PRO", "Q", "MODEL", "NAME", "W", "KG", "LT"}:
        return False
    # En az bir harf veya bilinen sayısal seri
    if not re.search(r"[A-Za-z]", m) and not m.startswith(("371", "217")):
        return False
    return True


def extract_scotsman_pages(page_no: int, page: fitz.Page) -> list[dict]:
    """Scotsman soğutma s.158–166 (EC/AC…). Sayfa 226 Gtech kahve — burada değil."""
    if page_no < 158 or page_no > 166:
        return []
    words = page.get_text("words")
    lines = group_lines(words, 2)
    items = []
    for y, ws0 in lines.items():
        ws = sorted(ws0, key=lambda w: w[0])
        if len(ws) < 5 or ws[0][0] > 90:
            continue
        prefix = ws[0][4].strip().upper()
        tok0 = ws[0][4].strip()

        if re.match(r"^(SB|UBH|BK)[-]?\d+", tok0, re.I):
            model = tok0.upper()
        elif prefix in {"EC", "AC", "MX", "NW", "MF", "MAR", "AHC", "NB", "NS"}:
            num = ws[1][4].strip()
            if not re.fullmatch(r"\d{2,4}", num):
                continue
            # Başlık satırı: EC 47 EC 107 EC 127... (ortada başka EC var)
            mid_prefixes = sum(1 for w in ws[2:] if w[4].upper() in {"EC", "AC", "MX"} and w[0] < 450)
            if mid_prefixes >= 1:
                continue
            model = f"{prefix} {num}"
        else:
            continue

        # Ölçü zorunlu — başlık / WS satırlarını ele
        dims = next((w[4] for w in ws if DIM_RE.match(w[4].replace(" ", ""))), "")
        if not dims and not re.match(r"^(SB|UBH|BK)", model, re.I):
            continue

        price_words = [w for w in ws if w[0] >= 475]
        price = None
        for w in reversed(price_words):
            n = parse_tr_number(w[4].replace("€", ""))
            if n and n >= 400:  # buz makinesi liste fiyatı alt sınırı
                price = n
                break
        if not price:
            continue

        items.append(
            {
                "model": model,
                "name_tr": "Scotsman Buz Makinesi",
                "dims": dims.replace("×", "x"),
                "liste_fiyat": float(price),
                "currency": "EUR",
                "page": page_no,
                "dept": "sogutma",
                "section": "sogutma",
                "brand_hint": "Scotsman",
                "source": "scotsman",
            }
        )
    return items


def extract_row_products(page_no: int, page: fitz.Page, page_text: str) -> list[dict]:
    """Standart tablo satırları: sol model + sağ fiyat."""
    if page_no in RATIONAL_PAGES:
        return []
    if SKIP_PAGE_MARKERS.search(page_text) and 91 <= page_no <= 94:
        return []
    # Scotsman sayfalarını özel parser'a bırak
    if 159 <= page_no <= 166:
        return []

    words = page.get_text("words")
    lines = group_lines(words, 3)
    currency = "TL" if re.search(r"Fiyat\s*\(TL\)", page_text) else "EUR"
    if "€" in page_text or re.search(r"\bEuro\b", page_text):
        currency = "EUR"

    items: list[dict] = []
    sorted_ys = sorted(lines)

    for yi, y in enumerate(sorted_ys):
        ws = sorted(lines[y], key=lambda w: w[0])
        if not ws:
            continue
        texts = [w[4] for w in ws]

        left_models: list[str] = []
        # Çok parçalı: "M23" "UP" "DT/2"
        left_ws = [w for w in ws if w[0] < 130]
        if left_ws:
            joined = " ".join(w[4] for w in left_ws[:4]).strip()
            # GT-2M-TC tek token veya Gtech ST-530ED
            if any(w[4].upper().startswith("GTECH") for w in left_ws):
                # "Gtech ST-530ED PID" → ST-530ED
                toks = [w[4] for w in left_ws if w[4].upper() != "GTECH"]
                cand = " ".join(toks[:2]).replace(" ", "")
                if re.search(r"\d", cand):
                    left_models = [re.sub(r"(PID|EC)$", lambda m: m.group(0) if m.group(0) in cand else "", cand)]
                    # normalize ST-530ED / AC-517EC
                    m2 = re.search(r"([A-Z]{1,3}[-.]?\d{2,4}[A-Z]*)", " ".join(toks), re.I)
                    if m2:
                        left_models = [m2.group(1).upper().replace(".", "-")]
            elif re.match(r"^M23\b", joined, re.I):
                left_models = [re.sub(r"\s+", " ", joined)]
            else:
                for w in left_ws:
                    tok = w[4].strip()
                    if MODEL_TOKEN.match(tok) or (
                        re.match(r"^[A-Z0-9][A-Z0-9.\-/]{1,24}$", tok, re.I) and re.search(r"\d", tok)
                    ):
                        left_models.append(tok)
                        break
                if not left_models and len(left_ws) >= 2:
                    j2 = f"{left_ws[0][4]} {left_ws[1][4]}"
                    if re.match(r"^[A-Z]{1,4}\s?\d{2,4}[A-Z0-9\-]*$", j2, re.I):
                        left_models = [j2]

        if not left_models:
            continue

        right_nums = []
        for w in ws:
            if w[0] < 490:
                continue
            n = parse_tr_number(w[4].replace("€", ""))
            if n is not None and n > 0:
                right_nums.append((w[0], n, w[4]))

        # Fiyat bazen İngilizce ad satırına kayıyor (örn. GKO9030 → sonraki satırda 2.818)
        if not right_nums:
            for y_next in sorted_ys[yi + 1 : yi + 3]:
                if y_next - y > 12:
                    break
                ws_n = sorted(lines[y_next], key=lambda w: w[0])
                # Sonraki satırda yeni model varsa dur
                if any(w[0] < 100 and MODEL_TOKEN.match(w[4]) for w in ws_n):
                    break
                for w in ws_n:
                    if w[0] < 490:
                        continue
                    n = parse_tr_number(w[4].replace("€", ""))
                    if n is not None and n > 0:
                        right_nums.append((w[0], n, w[4]))
                if right_nums:
                    break

        price = None
        if right_nums:
            price = right_nums[-1][1]
        else:
            for t in texts:
                m = EURO_LINE.search(t) or EURO_WORD.match(t)
                if m:
                    price = parse_tr_number(m.group(1))
                    currency = "EUR"
                    break

        if price is None or price <= 0:
            continue

        model = normalize_model(left_models[0])
        if not is_valid_model(model):
            continue

        dims = next((t for t in texts if DIM_RE.match(t.replace(" ", ""))), "")
        name_tr = ""
        for y2 in reversed(sorted_ys[: yi + 1][-4:]):
            if y2 > y:
                continue
            ws2 = sorted(lines[y2], key=lambda w: w[0])
            mid = [w[4] for w in ws2 if 120 < w[0] < 320]
            joined = " ".join(mid).strip()
            if (
                joined
                and TR_NAME_HINT.match(joined)
                and "Product Name" not in joined
                and "Ürün Adı" not in joined
                and "Genel Özellikler" not in joined
            ):
                name_tr = joined
                break
            full_mid = " ".join(
                w[4] for w in ws2 if 100 < w[0] < 340 and not MODEL_TOKEN.match(w[4])
            ).strip()
            if full_mid and TR_NAME_HINT.match(full_mid) and len(full_mid) > 10:
                if "Genel Özellikler" not in full_mid:
                    name_tr = full_mid
                    break

        if currency == "EUR" and (price < 30 or price > 120000):
            continue
        if currency == "TL" and (price < 100 or price > 500000):
            continue

        brand_hint = None
        mu = model.upper()
        if mu.startswith(("GKO", "GKW", "GKS", "GKF", "EKO", "EKF", "IKO", "ESI", "EST", "VBL", "VBY", "CKT", "DR", "NEVO", "GR", "MIX")) or model.startswith("371"):
            brand_hint = "Gastrotech"
        elif mu.startswith(("ST-", "AC-", "GT-", "GDC", "GT.")):
            brand_hint = "Gtech"
        elif "GTECH" in (name_tr or "").upper():
            brand_hint = "Gtech"

        items.append(
            {
                "model": model,
                "name_tr": name_tr,
                "dims": dims.replace("×", "x"),
                "liste_fiyat": price,
                "currency": currency,
                "page": page_no,
                "dept": dept_for(page_no),
                "section": section_for(page_no),
                "brand_hint": brand_hint,
            }
        )

    return items


def extract_euro_explicit(page_no: int, page_text: str) -> list[dict]:
    """VBL / CKT gibi '10.054 €' formatı — model ile eşleştir."""
    items = []
    # MODEL ... fiyat satırları
    for m in re.finditer(
        r"\b([A-Z]{2,6}\d{0,4}(?:-[A-Z0-9]+)*)\s*[\n\r].{0,80}?([\d.]+)\s*€",
        page_text,
        re.S,
    ):
        model, price_s = m.group(1), m.group(2)
        if is_rational_model(model):
            continue
        price = parse_tr_number(price_s)
        if not price:
            continue
        items.append(
            {
                "model": model,
                "name_tr": "",
                "dims": "",
                "liste_fiyat": price,
                "currency": "EUR",
                "page": page_no,
                "dept": dept_for(page_no),
                "section": section_for(page_no),
                "source": "euro_explicit",
            }
        )
    # Aynı satır: VBL15-R290 10.054 €
    for m in re.finditer(r"\b([A-Z]{2,8}[\w\-]*)\s+([\d.]+)\s*€", page_text):
        model, price_s = m.group(1), m.group(2)
        if len(model) < 3 or is_rational_model(model):
            continue
        price = parse_tr_number(price_s)
        if not price or price < 50:
            continue
        items.append(
            {
                "model": model,
                "name_tr": "",
                "dims": "",
                "liste_fiyat": price,
                "currency": "EUR",
                "page": page_no,
                "dept": dept_for(page_no),
                "section": section_for(page_no),
                "source": "euro_inline",
            }
        )
    return items


def extract_kitchenaid_euro(page_no: int, page_text: str) -> list[dict]:
    if page_no != 203:
        return []
    items = []
    # 5K455B ... 150 Euro
    blocks = re.findall(r"(5K[A-Z0-9]+)\s*\n([^\n]+)\s*\n([\d.]+)\s*Euro", page_text)
    if not blocks:
        # flat
        codes = re.findall(r"\b(5K[A-Z0-9]+)\b", page_text)
        euros = re.findall(r"([\d.]+)\s*Euro", page_text)
        names = re.findall(
            r"(?:5K[A-Z0-9]+\s*\n)([^\n]+?)(?=\s*\n(?:[\d.]+)\s*Euro)",
            page_text,
        )
        # Fall back: zip codes with euros if counts match-ish
        for i, code in enumerate(codes):
            if i < len(euros):
                price = parse_tr_number(euros[i])
                if price:
                    items.append(
                        {
                            "model": code,
                            "name_tr": names[i] if i < len(names) else "",
                            "dims": "",
                            "liste_fiyat": price,
                            "currency": "EUR",
                            "page": page_no,
                            "dept": "hazirlik",
                            "section": "hazirlik",
                            "brand_hint": "KitchenAid",
                            "source": "kitchenaid",
                        }
                    )
        return items
    for code, name, price_s in blocks:
        price = parse_tr_number(price_s)
        if not price:
            continue
        items.append(
            {
                "model": code,
                "name_tr": name.strip(),
                "dims": "",
                "liste_fiyat": price,
                "currency": "EUR",
                "page": page_no,
                "dept": "hazirlik",
                "section": "hazirlik",
                "brand_hint": "KitchenAid",
                "source": "kitchenaid",
            }
        )
    return items


def extract_puqpress(page_no: int, page_text: str) -> list[dict]:
    if page_no != 238:
        return []
    items = []
    mapping = [
        # (model, price, name, brand, list_as_sale)
        ("PUQ PRESS Q", 1150, "Tamper Makinesi", "Puqpress", True),
        ("PUQ PRESS PRO", 1300, "Tamper Makinesi", "Puqpress", True),
        ("M4", 900, "Tamper Makinesi (Fiorenzato F64 & F83)", "Puqpress", True),
        ("EK 43 T", 2975, "Çok Fonksiyonlu Kahve Değirmeni", "Mahlkönig", False),
        ("EK 43 S T", 2975, "Çok Fonksiyonlu Kahve Değirmeni", "Mahlkönig", False),
    ]
    for model, price, name, brand, list_as_sale in mapping:
        items.append(
            {
                "model": model,
                "name_tr": name,
                "dims": "",
                "liste_fiyat": float(price),
                "currency": "EUR",
                "page": 238,
                "dept": "kahve",
                "section": "kahve",
                "brand_hint": brand,
                "source": "puqpress_manual",
                "pricing_rule": "list_as_sale" if list_as_sale else "default",
            }
        )
    return items


def extract_tl_shelves(page_no: int, page: fitz.Page, page_text: str) -> list[dict]:
    """s.270–271 Demonte istif rafları — Fiyat (TL). Model kodları metinde zayıf; ölçü+fiyat çiftleri."""
    if page_no not in (270, 271) or "Fiyat" not in page_text:
        return []
    # Bu sayfalar model kodu vermeden ölçü listesi — şimdilik atla veya ölçü bazlı ID
    # Kullanıcı ürün kodu bekliyorsa sonra zenginleştirilir.
    words = page.get_text("words")
    nums = []
    for w in words:
        n = parse_tr_number(w[4])
        if n and n >= 10000:  # TL raf fiyatları 13.800+
            nums.append(n)
    # Tekrarlayan fiyatlar — benzersiz tut
    items = []
    for i, price in enumerate(dict.fromkeys(nums)):
        items.append(
            {
                "model": f"RAF-TL-P{page_no}-{i+1}",
                "name_tr": "Demonte İstif Rafı",
                "dims": "",
                "liste_fiyat": price,
                "currency": "TL",
                "page": page_no,
                "dept": "servis",
                "section": "tamamlayici",
                "source": "tl_shelf",
                "skip_import": True,  # model kodu yok — otomatik ekleme riskli
            }
        )
    return items


def dedupe(items: list[dict]) -> list[dict]:
    best: dict[str, dict] = {}
    for it in items:
        key = re.sub(r"[^A-Z0-9]", "", it["model"].upper())
        if not key:
            continue
        prev = best.get(key)
        if not prev:
            best[key] = it
            continue
        # Tercih: isimli, sonra puqpress_manual, sonra daha yüksek güven
        score = (1 if it.get("name_tr") else 0) + (2 if it.get("source") == "puqpress_manual" else 0)
        prev_score = (1 if prev.get("name_tr") else 0) + (
            2 if prev.get("source") == "puqpress_manual" else 0
        )
        if score >= prev_score:
            best[key] = it
    return list(best.values())


def enrich_names_from_nearby(items: list[dict], pdf: fitz.Document) -> None:
    """İsim boşsa sayfa metninden model civarı Türkçe adı çek."""
    by_page: dict[int, list[dict]] = defaultdict(list)
    for it in items:
        by_page[it["page"]].append(it)

    for page_no, group in by_page.items():
        text = pdf[page_no - 1].get_text("text")
        for it in group:
            if it.get("name_tr"):
                continue
            model = it["model"]
            # Model satırını bul
            pat = re.escape(model).replace(r"\ ", r"\s*")
            m = re.search(
                rf"{pat}\s*[-–]?\s*([A-ZÇĞİÖŞÜa-zçğıöşü0-9 ,/\+]{{8,80}}?)(?:\s+\d{{2,4}}x|\s+Gas |\s+Electric |\s*$)",
                text,
                re.M,
            )
            if m:
                name = m.group(1).strip(" -–")
                if name and "Product" not in name and "Model" not in name:
                    it["name_tr"] = name


def main():
    pdf_path = find_pdf()
    print(f"PDF: {pdf_path}")
    pdf = fitz.open(pdf_path)
    print(f"Sayfa: {pdf.page_count}")

    all_items: list[dict] = []
    for i in range(pdf.page_count):
        page_no = i + 1
        if page_no < 7:
            continue
        page = pdf[i]
        text = page.get_text("text")

        if page_no in RATIONAL_PAGES:
            print(f"  skip Rational page {page_no}")
            continue

        page_items = extract_row_products(page_no, page, text)
        page_items += extract_scotsman_pages(page_no, page)
        page_items += extract_euro_explicit(page_no, text)
        page_items += extract_kitchenaid_euro(page_no, text)
        if page_no == 238:
            # Satır parser yerine doğrulanmış Puqpress/Mahlkönig listesi
            page_items = extract_puqpress(page_no, text)
        page_items += extract_tl_shelves(page_no, page, text)

        # Electrolux yok ama güvenlik
        page_items = [
            it
            for it in page_items
            if "electrolux" not in (it.get("name_tr") or "").lower()
            and "electrolux" not in it["model"].lower()
        ]

        if page_items:
            all_items.extend(page_items)
            print(f"  p{page_no}: +{len(page_items)}")

    enrich_names_from_nearby(all_items, pdf)
    items = dedupe(all_items)
    # skip_import olanları raporda tut ama ayır
    importable = [it for it in items if not it.get("skip_import")]
    skipped = [it for it in items if it.get("skip_import")]

    # Doğrulama örnekleri
    checks = {
        "GKO6010": 827,
        "GKW6010": 889,
        "GKO9010": 1102,
        "PUQ PRESS Q": 1150,
        "PUQ PRESS PRO": 1300,
        "M4": 900,
    }
    by_model = {it["model"].upper().replace(" ", ""): it for it in importable}
    print("\n=== DOĞRULAMA ===")
    for code, expected in checks.items():
        key = code.upper().replace(" ", "")
        hit = by_model.get(key)
        # fuzzy
        if not hit:
            for k, v in by_model.items():
                if key in k or k in key:
                    hit = v
                    break
        if not hit:
            print(f"  EKSİK: {code}")
        else:
            ok = abs(hit["liste_fiyat"] - expected) < 0.1
            print(f"  {'OK' if ok else 'HATA'}: {code} = {hit['liste_fiyat']} (beklenen {expected}) p{hit['page']}")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": str(pdf_path),
        "page_count": pdf.page_count,
        "product_count": len(importable),
        "skipped_count": len(skipped),
        "products": sorted(importable, key=lambda x: (x["page"], x["model"])),
        "skipped": skipped,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nYazıldı: {OUT} ({len(importable)} ürün, {len(skipped)} skip)")


if __name__ == "__main__":
    main()
