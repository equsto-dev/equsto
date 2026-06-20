#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SENOX 2026-1 PDF — tam katalog çıkarımı.

Stratejiler:
  A) Senox … başlık satırları (+ çoklu varyant: 160/300/400/500 LK)
  B) KOD tablo blokları (El Blenderları: BL25, BL40 …)
  C) Bağımsız model kodu satırları (SNX-17-C, DT 6, BN7-M-R290 …)
  D) Sayfa altı EUR fiyatları → ürünlere sıra ile

  python scripts/extract-senox-pdf-catalog.py
"""
from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "scripts" / "data" / "senox" / "senox-pdf-catalog.json"
PDF = Path(
    os.environ.get(
        "SENOX_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf",
    )
)

SKIP_TITLE = re.compile(
    r"endüstriyel\s+mutfak|temelleri|markasının|faaliyet|tescili|kurulan|"
    r"bugün\s+senox|www\.|\.com|frenox\s*/\s*inoksan",
    re.I,
)
TITLE_RE = re.compile(r"^\s*(?:Senox|SENOX)[-\s](.+)$", re.I)
DIM_RE = re.compile(
    r"(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4}(?:[.,]\d+)?)",
    re.I,
)
DIM2_RE = re.compile(r"(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4})", re.I)
PRICE_EUR_RE = re.compile(r"(\d+(?:\.\d{3})*(?:,\d+)?)\s*EUR\b", re.I)
GAZ_RE = re.compile(r"(?:Soğutucu\s*Gaz|Gaz)\s*:?\s*(R\d+[A-Za-z]?)", re.I)
VOLT_RE = re.compile(r"(\d{2,3}\s*V\s*[-~]?\s*\d{0,2}\s*Hz?)", re.I)
GUC_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*W\b", re.I)
GUC_KW_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*kW\b", re.I)
AGIR_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s*kg\b", re.I)

SKIP_CODE = {
    "kod", "fiyat", "fiyat ", "model", "voltaj", "ebatlar", "ebatlar (mm)",
    "ağırlık", "ağırlık (kg)", "senox", "ürün kodu", "ürün açıklaması",
    "kapasite", "kapasite (l)", "ısı aralığı", "elektrik bağlantısı", "güç",
    "boyut", "d", "frenox / inoksan", "endüstriyel soğutucular",
    "el blenderları", "ısıtıcı lambalar", "dondurma reyonları", "fiyat ",
}

# Bağımsız ürün kodu satırı
CODE_LINE_RE = re.compile(
    r"^(?:"
    r"BL\s?\d{2}(?:\s?L\d{2})?(?:-C)?|"  # BL 25, BL25 L35-C
    r"BL\d{2}(?:\s?L\d{2})?(?:-C)?|"
    r"DT\s?\d+\w*|DW\s?\d+\w*|"
    r"SDS[-\s]?\d+[A-Z0-9\-/]*|BBC[S]?[-\s]?\d+|SBC\d+|"
    r"SNX[-\s]?\d+[A-Z0-9\-]*|SMR[-\s]?\d+|WN[-\s]?\d+|WF[-\s]?\d+|"
    r"WF[-\s]?\d+|BZ\d+|MS\d+|BLK[-\s]?\d+|730[01][A-Z]?|"
    r"SMFER[-\s]?[A-Z0-9\-]+|SNX12R|COFFEEDO|KRS\d+|"
    r"DS[-\s]?\d{2}[A-Z]?|SFT[-\s]?\d+\w*|SLS[-\s]?\d+|SRB[-\s]?\d+\w*|"
    r"DY[-\s]?\d+\w*|PDY[-\s]?\d+|PDM[-\s]?\d[\d\-]*L?|KM\d+|IC\d+[A-Z]?|SYD[-\s]?\d+|SMF[-\s]?\d+|"
    r"CF\d+KROM|SYS[-\s]?\d+[A-Z]*|"
    r"BN\d+[-\w]+|BL\d+[-\w]+|BGN\d+[-\w]+|UGN\d+[-\w\s]+|CKT[\d\w\-]+|"
    r"FR-\d+|SB-\d+|MC\s?\d+|BYM-\d+\w+|VBL-\d+|GD-\d+|YSO-\d+|"
    r"SNX-\d+-[A-Z]|SNX-\d+-[A-Z]{2,4}|"
    r"\d{2,4}LK(?:[-\s][A-Z]{1,4})?"
    r")$",
    re.I,
)

SECTION_HEADERS = {
    "su sebilleri": ("Soğutma", "Su Sebilleri"),
    "şişe soğutucu": ("Soğutma", "Şişe Soğutucular"),
    "set altı": ("Soğutma", "Set Altı Soğutucular"),
    "teşhir": ("Soğutma", "Teşhir Dolapları"),
    "dondurma reyon": ("Soğutma", "Dondurma Reyonları"),
    "derin dondurucu": ("Soğutma", "Derin Dondurucular"),
    "buz mak": ("Soğutma", "Buz Makinaları"),
    "endüstriyel soğutucu": ("Soğutma", "Endüstriyel Soğutucular"),
    "espresso makineleri": ("Kahve Ekipmanları", "Espresso Makineleri"),
    "kahve değirmenleri": ("Kahve Ekipmanları", "Kahve Değirmenleri"),
    "kahve kavurma": ("Kahve Ekipmanları", "Kahve Kavurma Makineleri"),
    "süt soğutucu": ("Kahve Ekipmanları", "Süt Soğutucular"),
    "filtre kahve": ("Kahve Ekipmanları", "Filtre Kahve Makineleri"),
    "ısıtıcı lamba": ("Kahve Ekipmanları", "Isıtıcı Lambalar"),
    "minibar": ("Otel Ekipmanları", "Minibar"),
    "otel odası": ("Otel Ekipmanları", "Otel Odası"),
    "el blender": ("Hazırlık Ekipmanları", "El Blenderleri"),
    "mutfak şef": ("Hazırlık Ekipmanları", "Mutfak Şefi"),
    "mikser": ("Hazırlık Ekipmanları", "Mikser"),
    "soft dondurma": ("Soğutma", "Soft Dondurma Makineleri"),
    "slush": ("Cafe/Bar", "Slush Makineleri"),
    "hazırlık ekipman": ("Hazırlık Ekipmanları", "Hazırlık"),
}

PAGE_RANGES: list[tuple[int, int, str, str]] = [
    (4, 6, "Soğutma", "Su Sebilleri"),
    (7, 12, "Soğutma", "Şişe Soğutucular"),
    (13, 15, "Cafe/Bar", "Soft Dondurma / Slush"),
    (16, 17, "Cafe/Bar", "Bar Ekipmanları"),
    (18, 20, "Soğutma", "Derin Dondurucular"),
    (21, 22, "Soğutma", "Dondurma Reyonları"),
    (23, 29, "Soğutma", "Teşhir Dolapları"),
    (30, 33, "Otel Ekipmanları", "Minibar / Kasa"),
    (34, 35, "Hazırlık Ekipmanları", "El Blenderleri"),
    (36, 36, "Hazırlık Ekipmanları", "Robot Coupe / Hazırlık"),
    (37, 37, "Hazırlık Ekipmanları", "Mikser / Mutfak Şefi"),
    (38, 38, "Hazırlık Ekipmanları", "Gıda Dilimleme / Sinek Öldürücü"),
    (39, 40, "Hazırlık Ekipmanları", "Hazırlık / Terazi"),
    (41, 41, "Kahve Ekipmanları", "Isıtıcı Lambalar"),
    (42, 42, "Kahve Ekipmanları", "Espresso Makineleri"),
    (43, 43, "Kahve Ekipmanları", "Kahve Kavurma / Süt Soğutucu"),
    (44, 44, "Kahve Ekipmanları", "Kahve Değirmenleri / Filtre Kahve"),
    (45, 46, "Soğutma", "Endüstriyel Soğutucular"),
    (47, 47, "Soğutma", "Blast Chiller / Şok Dondurucu"),
    (48, 48, "Soğutma", "Buz Makinaları"),
    (49, 49, "Soğutma", "Buz Makinaları"),
    (51, 51, "Hazırlık Ekipmanları", "Mikrodalga Fırınlar"),
    (53, 53, "Hazırlık Ekipmanları", "Bulaşık Makineleri"),
]

DISTRIBUTOR_RE = re.compile(
    r"^(?:Magister GT.+|Electrolux\s+\d+.+|La Cimbali .+|Fiorenzato F\d+.+|"
    r"Cunill .+|Geleneksel Espresso.+|Otomatik espresso.+|Tam Otomatik Espresso.+|"
    r"Frenox\s*/\s*Inoksan .+|İnoksan\s+.+|Inoksan\s+.+|Iceinox .+|Ice.+Buz .+|"
    r"Robotcoupe .+|YSO-\d+ .+|DDKB .+)",
    re.I,
)
ROBOTCOUPE_RE = re.compile(r"^Robotcoupe(?:\s*-\s*|\s+)(.+)$", re.I)
THIRD_PARTY_LINE = re.compile(
    r"^(?:Frenox\s*/\s*Inoksan|İnoksan|Inoksan|Iceinox|Ice.+Buz|YSO-\d+|DDKB)",
    re.I,
)


def slug_from_title(title: str) -> str:
    t = clean_line(title)
    m = re.search(r"\b(\d{5,7})\b", t)
    if m:
        return f"ELUX-{m.group(1)}"
    m = re.search(r"\b(F\d+[A-Z0-9]*)\b", t, re.I)
    if m:
        return f"FIO-{m.group(1).upper()}"
    m = re.search(r"La Cimbali\s+(\S+)", t, re.I)
    if m:
        return f"CIMBALI-{norm_model(m.group(1))}"
    m = re.search(r"Magister\s+(\S+)", t, re.I)
    if m:
        return f"MAG-{norm_model(m.group(1))}"
    return norm_model(re.sub(r"[^A-Za-z0-9]+", "-", t))[:40]


def nfkc(s: str) -> str:
    return unicodedata.normalize("NFKC", s or "").replace("\u0d88", "i")


def clean_line(s: str) -> str:
    return re.sub(r"\s+", " ", nfkc(s).replace("\u00a0", " ").strip())


def norm_model(code: str) -> str:
    c = clean_line(code).upper()
    c = re.sub(r"\s+", "", c)
    return re.sub(r"[^A-Z0-9\-]", "", c)


def norm(s: str) -> str:
    s = clean_line(s).lower()
    return s.translate(str.maketrans("ığüşöç", "igusoc"))


def category_for_page(page_no: int, page_text: str, hint: str = "") -> tuple[str, str]:
    blob = norm(page_text + " " + hint)
    for key, val in SECTION_HEADERS.items():
        if key in blob:
            return val
    for lo, hi, grp, cat in PAGE_RANGES:
        if lo <= page_no <= hi:
            return grp, cat
    return "Senox", "Genel"


def parse_eur_token(raw: str) -> float:
    s = str(raw or "").strip()
    if not s:
        return 0.0
    # 18.000 / 1.800 — binlik nokta (TR/EU)
    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", s):
        return float(s.replace(".", ""))
    # 1.234,56 ondalık virgül
    if "," in s and "." in s:
        return float(s.replace(".", "").replace(",", "."))
    if "," in s:
        return float(s.replace(",", "."))
    return float(s.replace(".", ""))


def find_eur_near_row(rows: list[dict], idx: int, max_dy: float = 220) -> float | None:
    """Kod satırına en yakın EUR — sayfa düzenine göre sütun seçimi."""
    if idx < 0 or idx >= len(rows):
        return None
    code_y = rows[idx]["y0"]
    code_x = rows[idx]["cx"]
    candidates: list[tuple[float, float, float]] = []
    for r in rows:
        m = PRICE_EUR_RE.search(r["text"])
        if not m:
            continue
        price = parse_eur_token(m.group(1))
        if not (price > 0):
            continue
        dy = r["y0"] - code_y
        px = r["cx"]
        dx = abs(px - code_x)
        if dy < -40 or dy > max_dy:
            continue
        # Çift tablo (s.21 dondurma reyonu): sol kod → orta fiyat sütunu (~530)
        if code_x < 400:
            if not (450 <= px <= 620):
                continue
            if dx > 320:
                continue
        # Orta/sağ ürün kodu → sağ fiyat sütunu (~900+)
        elif code_x >= 500:
            if px < 820:
                continue
            if dx > 420:
                continue
        else:
            if dx > 380:
                continue
        sort_dy = abs(dy) if abs(dy) <= 25 else (1000 + abs(dy))
        candidates.append((sort_dy, dx, price))
    if not candidates:
        return None
    candidates.sort(key=lambda t: (t[0], t[1]))
    return candidates[0][2]


def parse_specs(text: str, rows: list[dict] | None = None, row_idx: int | None = None) -> dict:
    t = clean_line(text.replace("\n", " "))
    specs: dict = {}
    for dm in DIM_RE.finditer(t):
        specs["ebat_mm"] = f"{dm.group(1)} x {dm.group(2)} x {dm.group(3)}"
        try:
            specs["genislik_mm"] = int(float(dm.group(1).replace(",", ".")))
            specs["derinlik_mm"] = int(float(dm.group(2).replace(",", ".")))
            specs["yukseklik_mm"] = int(float(dm.group(3).replace(",", ".")))
        except ValueError:
            pass
        break
    price_val = 0.0
    if rows is not None and row_idx is not None:
        near = find_eur_near_row(rows, row_idx)
        if near and near > 0:
            price_val = near
    if not price_val:
        eur_hits = [parse_eur_token(m.group(1)) for m in PRICE_EUR_RE.finditer(text)]
        eur_hits = [p for p in eur_hits if p > 0]
        if eur_hits:
            if len(eur_hits) == 1:
                price_val = eur_hits[0]
            else:
                # Komşu ürün fiyatı karışmasın: en küçük makul aday (18.000 + 1800 → 1800)
                lo, hi = min(eur_hits), max(eur_hits)
                price_val = lo if hi >= lo * 5 else sorted(eur_hits)[len(eur_hits) // 2]
    if price_val > 0:
        specs["fiyat_eur"] = str(int(price_val) if price_val == int(price_val) else price_val)
    gz = GAZ_RE.search(t)
    if gz:
        specs["sogutucu_gaz"] = gz.group(1).upper()
    vt = VOLT_RE.search(t)
    if vt:
        specs["voltaj"] = clean_line(vt.group(1))
    gkw = GUC_KW_RE.search(t)
    if gkw:
        specs["elektrik_gucu"] = f"{gkw.group(1).replace(',', '.')} kW"
    else:
        gw = GUC_RE.search(t)
        if gw:
            specs["elektrik_gucu"] = f"{gw.group(1).replace(',', '.')} W"
    ag = AGIR_RE.search(t)
    if ag:
        specs["agirlik_kg"] = ag.group(1).replace(",", ".")
    return specs


def is_title_line(line: str) -> bool:
    line = clean_line(line)
    if len(line) < 10 or len(line) > 110:
        return False
    if SKIP_TITLE.search(line):
        return False
    if not TITLE_RE.match(line):
        return False
    if line.count(" ") > 16:
        return False
    return True


def extract_codes_from_title(title: str) -> list[str]:
    t = clean_line(title)
    t = re.sub(r"^(?:Senox|SENOX)[-\s]+", "", t, flags=re.I).strip()
    codes: list[str] = []
    seen: set[str] = set()

    def add(c: str) -> None:
        c = norm_model(c)
        if c and c not in seen and len(c) >= 2:
            seen.add(c)
            codes.append(c)

    # 160 / 300 / 400 / 500 LK
    if re.search(r"\d{2,4}\s*/\s*\d{2,4}.*LK", t, re.I):
        for m in re.finditer(r"(\d{2,4})\s*LK", t, re.I):
            add(f"{m.group(1)}LK")

    for m in re.finditer(r"\b([A-Z]{1,4}[\-]?\d{2,4}[A-Z0-9\-]*)\b", t, re.I):
        add(m.group(1))
    for m in re.finditer(r"\b(\d{2,4})\s*LK(?:[-\s]([A-Z]{1,4}))?\b", t, re.I):
        add(f"{m.group(1)}LK" + (f"-{m.group(2).upper()}" if m.group(2) else ""))
    for m in re.finditer(r"\b(DS[-\s]?\d{2}[A-Z]?)\b", t, re.I):
        add(m.group(1))
    for m in re.finditer(
        r"\b(SDS[-\s]?\d+[A-Z0-9\-/]*|BBC[S]?[-\s]?\d+|SBC\d+|SNX[-\s]?\d+[A-Z]*|"
        r"SMR[-\s]?\d+|WN[-\s]?\d+|WF[-\s]?\d+|BZ\d+|MS\d+|BLK[-\s]?\d+|730[01][A-Z]?|"
        r"SMFER[-\s]?[A-Z0-9\-]+|SNX12R|COFFEEDO|KRS\d+|DT\s?\d+\w*|DW\s?\d+\w*)\b",
        t,
        re.I,
    ):
        add(m.group(1))

    if not codes:
        slug = re.sub(r"[^A-Z0-9]+", "-", t.upper()).strip("-")[:48]
        if slug and len(slug) >= 3:
            add(slug)
    return codes


def is_code_line(line: str) -> bool:
    line = clean_line(line)
    if not line or len(line) > 48:
        return False
    if line.lower() in SKIP_CODE:
        return False
    if PRICE_EUR_RE.search(line):
        return False
    if re.match(r"^\d+$", line):
        return False
    if "www." in line.lower():
        return False
    if re.match(r"^(?:Senox|SENOX)", line, re.I):
        return False
    if re.search(r"\b(?:volt|watt|°c|rpm|mm\s*$|eur)\b", line, re.I):
        return False
    if re.search(r"^\d{2,3}/\d{3}\s*V", line):
        return False
    if len(line.split()) > 6:
        return False
    if CODE_LINE_RE.match(line):
        return True
    # DT 6, DW 9RA gibi
    if re.match(r"^(DT|DW)\s?\d", line, re.I) and len(line) < 20:
        return True
    # Frenox distribütör kodları
    if re.match(r"^(BN|BL|BGN|UGN|CKT)\d", line, re.I) and len(line) < 35:
        return True
    if re.match(r"^(FR-\d+|SB-\d+|MC\s?\d+|GD-\d+|YSO-\d+)$", line, re.I):
        return True
    if re.match(r"^SNX-\d+-[A-Z]$", line, re.I):
        return True
    if re.match(r"^SNX-\d+-[A-Z]{2,5}$", line, re.I):
        return True
    if re.match(r"^PDM\s?[\d\-]+L?$", line, re.I):
        return True
    if re.match(r"^(\d{2,4})\s*LK(?:[-\s/]?\s*[A-Z]{1,4})?\s*$", line, re.I):
        return True
    return False


def normalize_code(line: str) -> str:
    c = clean_line(line).upper()
    c = re.sub(r"\s+", " ", c)
    c = c.replace(" ", "-") if re.match(r"^BL\s?\d", c, re.I) else re.sub(r"\s+", "", c)
    c = re.sub(r"^BL-", "BL", c)  # BL-25 → BL25 optional
    return norm_model(c) if not re.match(r"^BL\d", c) else c.replace("-", "")


def collect_lines(page) -> list[dict]:
    rows: list[dict] = []
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") != 0:
            continue
        for ln in b.get("lines", []):
            text = clean_line("".join(s.get("text", "") for s in ln.get("spans", [])))
            if not text:
                continue
            x0, y0, x1, y1 = ln["bbox"]
            rows.append({"text": text, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "cx": (x0 + x1) / 2})
    rows.sort(key=lambda r: (r["y0"], r["x0"]))
    return rows


def context_block(rows: list[dict], idx: int, radius: int = 12) -> str:
    parts = [rows[idx]["text"]]
    y0 = rows[idx]["y0"]
    for j in range(idx + 1, min(len(rows), idx + radius + 1)):
        if rows[j]["y0"] - y0 > 120:
            break
        if is_code_line(rows[j]["text"]) and j != idx:
            break
        if is_title_line(rows[j]["text"]):
            break
        parts.append(rows[j]["text"])
    return "\n".join(parts)


def parse_kod_tables(lines: list[str], page_text: str) -> list[tuple[str, str, int]]:
    """KOD tablo blokları → (code, block_text, line_index)"""
    out: list[tuple[str, str, int]] = []
    i = 0
    while i < len(lines):
        if clean_line(lines[i]).upper() != "KOD":
            i += 1
            continue
        block = []
        j = i + 1
        while j < len(lines) and clean_line(lines[j]).upper() not in ("KOD", "FİYAT", "FIYAT"):
            block.append(lines[j])
            j += 1
        # model = first code-like line after header noise
        code = None
        body = []
        for ln in block:
            if is_code_line(ln) and not code:
                code = normalize_code(ln)
                body.append(ln)
            elif code:
                body.append(ln)
        if code:
            out.append((code, "\n".join(body), i))
        i = j if j > i else i + 1
    return out


def page_eur_prices(text: str) -> list[str]:
    prices = []
    for m in PRICE_EUR_RE.finditer(text):
        prices.append(m.group(1).replace(".", "").replace(",", "."))
    return prices


def page_section_hint(page) -> str:
    for line in (page.get_text("text") or "").splitlines()[:12]:
        line = clean_line(line)
        if line and line.lower() not in ("senox", "www.senox.com.tr") and 4 < len(line) < 55:
            if not re.match(r"^\d+$", line):
                return line
    return ""


def parse_page(page, page_no: int) -> list[dict]:
    page_text = page.get_text("text") or ""
    lines = [clean_line(l) for l in page_text.splitlines() if clean_line(l)]
    rows = collect_lines(page)
    hint = page_section_hint(page)
    grp, cat = category_for_page(page_no, page_text, hint)
    eurs = page_eur_prices(page_text)
    found: dict[str, dict] = {}

    def add_product(code: str, title: str, block: str, anchor: dict | None, source: str, row_idx: int | None = None) -> None:
        code = norm_model(code) if not re.match(r"^BL\d", code, re.I) else code.replace("-", "").upper()
        if not code or len(code) < 2:
            return
        key = f"{page_no}:{code}"
        specs = parse_specs(block, rows, row_idx)
        if key in found:
            prev = found[key]
            # LK satırı — önceki hatalı kaydın üzerine yaz
            if source == "lk-line" and prev.get("parseSource") in ("senox-title", "code-line"):
                pass
            else:
                return
        found[key] = {
            "model": code,
            "title": title or code,
            "page": page_no,
            "categoryGroup": grp,
            "category": cat,
            "anchorY": round(anchor["y0"], 1) if anchor else 0,
            "anchorX": round(anchor["cx"], 1) if anchor else 0,
            "description": block[:2000],
            "specs": specs,
            "parseSource": source,
        }

    # A) Senox başlıkları
    anchors = [r for r in rows if is_title_line(r["text"])]
    for i, anc in enumerate(anchors):
        next_y = anchors[i + 1]["y0"] if i + 1 < len(anchors) else 99999
        title = anc["text"]
        block_parts = [title]
        for r in rows:
            if r["y0"] <= anc["y0"] + 2 or r["y0"] >= next_y:
                continue
            if abs(r["cx"] - anc["cx"]) < 450:
                block_parts.append(r["text"])
        block = "\n".join(block_parts)
        for code in extract_codes_from_title(title):
            add_product(code, title, block, anc, "senox-title")

    # B) KOD tabloları
    for code, block, _ in parse_kod_tables(lines, page_text):
        anchor = next((r for r in rows if code.replace("-", "") in r["text"].replace(" ", "").upper()), None)
        add_product(code, f"Senox {code}", block, anchor, "kod-table")

    # C) Bağımsız kod satırları
    for i, r in enumerate(rows):
        if not is_code_line(r["text"]):
            continue
        code = normalize_code(r["text"])
        block = context_block(rows, i)
        title = code
        if not re.match(r"^\d{2,4}LK", code, re.I):
            if i > 0 and len(rows[i - 1]["text"]) > 15 and not is_code_line(rows[i - 1]["text"]):
                if not re.match(r"^(?:Senox|senox|www)", rows[i - 1]["text"], re.I):
                    title = rows[i - 1]["text"][:120]
        add_product(code, title, block, r, "code-line", i)

    # D) Ürün Kodu etiketi sonrası
    for i, ln in enumerate(lines):
        if clean_line(ln).lower() not in ("ürün kodu", "urun kodu"):
            continue
        if i + 1 >= len(lines):
            continue
        nxt = clean_line(lines[i + 1])
        if is_code_line(nxt) or re.match(r"^R\d{3}", nxt, re.I) or re.match(r"^MC\s?\d", nxt, re.I) or re.match(r"^PDM\s", nxt, re.I):
            code = normalize_code(nxt)
            if re.match(r"^R\d{3}", nxt, re.I):
                code = norm_model(nxt.replace(" ", ""))
            if re.match(r"^PDM\s", nxt, re.I):
                code = norm_model(nxt.replace(" ", ""))
            block = "\n".join(lines[max(0, i - 8) : i + 6])
            anchor = next((r for r in rows if r["text"] == lines[i + 1]), None)
            add_product(code, nxt, block, anchor, "urun-kodu")

    # F) Distribütör / espresso / değirmen / Robotcoupe / Inoksan
    for i, ln in enumerate(lines):
        if not DISTRIBUTOR_RE.match(ln):
            continue
        if len(ln) < 12:
            continue
        code = slug_from_title(ln)
        block = "\n".join(lines[max(0, i - 2) : min(len(lines), i + 12)])
        anchor = next((r for r in rows if r["text"] == ln), None)
        add_product(code, ln, block, anchor, "distributor")

    # G) Robotcoupe kısa satırlar (Cl50 Ultra vb.)
    for i, ln in enumerate(lines):
        if not ROBOTCOUPE_RE.match(ln):
            continue
        code = slug_from_title(ln)
        block = "\n".join(lines[max(0, i - 1) : min(len(lines), i + 14)])
        anchor = next((r for r in rows if r["text"] == ln), None)
        add_product(code, ln, block, anchor, "robotcoupe")

    # H) LK kapasite satırları (40 LK, 40 LK-AS …) — başlık = kod satırı
    for i, r in enumerate(rows):
        m = re.match(r"^(\d{2,4})\s*LK(?:[-\s/]?\s*([A-Z]{1,4}))?\s*$", r["text"], re.I)
        if not m:
            continue
        code = f"{m.group(1)}LK" + (f"-{m.group(2).upper()}" if m.group(2) else "")
        block = context_block(rows, i)
        add_product(code, code, block, r, "lk-line", i)

    # E) Sayfa EUR → fiyatsız ürünlere: koda en yakın atanmamış fiyat
    used_prices: set[float] = set()
    for p in found.values():
        fe = p["specs"].get("fiyat_eur")
        if fe:
            try:
                used_prices.add(float(str(fe).replace(",", ".")))
            except ValueError:
                pass
    eur_floats = []
    for ep in eurs:
        try:
            eur_floats.append(float(ep))
        except ValueError:
            pass
    free_prices = [p for p in eur_floats if p not in used_prices]
    prods = sorted(
        [p for p in found.values() if not p["specs"].get("fiyat_eur")],
        key=lambda p: (p["anchorY"], p["anchorX"]),
    )
    ei = 0
    for p in prods:
        if ei >= len(free_prices):
            break
        p["specs"]["fiyat_eur"] = str(int(free_prices[ei]) if free_prices[ei] == int(free_prices[ei]) else free_prices[ei])
        p["specs"]["fiyat_eur_source"] = "page-order"
        used_prices.add(free_prices[ei])
        ei += 1

    return list(found.values())


def main() -> None:
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    doc = fitz.open(PDF)
    products: list[dict] = []
    for pi in range(doc.page_count):
        if pi + 1 <= 3:
            continue
        products.extend(parse_page(doc[pi], pi + 1))
    page_count = doc.page_count
    doc.close()

    # page:model bazlı dedupe (aynı sayfada tekrar yok)
    by_key: dict[str, dict] = {}
    alias_merge = {"SYD510": "SYD-510", "SYD-510": "SYD-510"}
    for p in products:
        m = p["model"]
        canon = alias_merge.get(m.upper().replace(" ", ""), m)
        p["model"] = canon
        key = f"{p['page']}:{canon}"
        prev = by_key.get(key)
        if not prev or len(p.get("description", "")) > len(prev.get("description", "")):
            by_key[key] = p
    products = sorted(by_key.values(), key=lambda x: (x["page"], x["model"]))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": str(PDF),
        "liste": "SENOX 2026-1",
        "scrapedAt": datetime.now(timezone.utc).isoformat(),
        "pages": page_count,
        "productCount": len(products),
        "products": products,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    with_img_src = sum(1 for p in products if p.get("parseSource"))
    with_dims = sum(1 for p in products if p["specs"].get("ebat_mm"))
    with_price = sum(1 for p in products if p["specs"].get("fiyat_eur"))
    print(f"[senox-pdf] urun: {len(products)}")
    print(f"[senox-pdf] olcu: {with_dims}  fiyat: {with_price}")
    print(f"[senox-pdf] -> {OUT}")


if __name__ == "__main__":
    main()
