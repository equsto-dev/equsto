#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
BYKITCHEN 2027 katalog PDF → ürün JSON.

Konum bazlı: sayfadaki fiyat kelimeleri ile model kodlarını (x,y) yakınlığıyla eşler.

  python scripts/extract-bykitchen-catalog.py
"""
from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\BYKITCHEN 2027.pdf")
OUT = ROOT / "scripts/data/bykitchen/bykitchen-catalog-extracted.json"
DEPT = ROOT / "public/data/dept"

# Üçüncü parti / yetkili satıcı markaları (Brema, Magister, Cunill…)
SKIP_MODEL = re.compile(
    r"^("
    r"G-\d|GB-\d|BIN-?\d|BİN-?\d|"
    r"CB-\d|"  # Brema küp buz
    r"HRC-[BS]|ES100|"  # Magister espresso
    r"CHIPS|"  # güç etiketi (CHIPS.60W)
    r"EC\s?\d|AC\s?\d|NW\s?\d|MF\s?\d|HZ/?"
    r")",
    re.I,
)

# Sayfa metninde bu geçerse By Kitchen değil
SKIP_PAGE_HINT = re.compile(
    r"Brema|Cunill|Magister|Bezzera|La\s*Spaziale",
    re.I,
)

# Geçerli model
STRICT_MODEL = re.compile(
    r"^("
    r"[A-Z]{2,6}\d{1,4}[A-Z]{0,4}"  # DDM16, BLM22D, DS2000, FS100, CVS101S
    r"|[A-Z]{2,6}[-./](?:\d+[A-Z0-9]*|[A-Z]*\d[A-Z0-9]*)"  # DBM-01, FCM-02K, DPS-M01
    r"|[A-Z]{2,6}[-./](?:F|S|K|B|M|CP|ECO|PRO|GR|D|P)"  # DPH-F, FCM-K, BOT-S, DBB-350P handled above
    r")$"
)

SHORT_OK = re.compile(r"^[A-Z]{3,6}$")

# Fiyat: 999 $ | 1.940 $ | 9700$ | 525 €  — boşluk binlik AYRACI DEĞİL
PRICE_TOKEN = re.compile(
    r"^(?P<a>\d{1,3}(?:\.\d{3})+|\d{2,5})(?P<c>\$|€)?$"
)
CUR_ONLY = re.compile(r"^(\$|€|EUR|USD)$", re.I)

# İsim benzeri satırlar
TR_NAME = re.compile(r"[çğıöşüÇĞİÖŞÜ]")


def norm(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def parse_amount(s: str) -> float | None:
    """1.940 → 1940; 9700 → 9700; 525 → 525. Virgüllü ondalık yok sayılır."""
    s = s.strip().replace(" ", "")
    if "," in s and "." not in s:
        # 12,5 kapasite — fiyat değil
        return None
    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", s):
        return float(s.replace(".", ""))
    if re.fullmatch(r"\d{2,5}", s):
        return float(s)
    return None


def load_existing_norms() -> set[str]:
    out: set[str] = set()
    for f in DEPT.glob("*.json"):
        rows = json.loads(f.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        for r in rows:
            brand = str(r.get("brand") or "").lower().replace(" ", "")
            mk = str(r.get("marka_kodu") or "").upper()
            if brand not in ("bykitchen", "by-kitchen") and mk != "BYKITCHEN":
                if not str(r.get("id") or "").startswith("by-kitchen"):
                    continue
            for key in ("sku", "model", "marka_urun_kodu", "id"):
                v = r.get(key)
                if v:
                    out.add(norm(str(v).replace("by-kitchen__", "")))
    # Bilinen isimsel / katalog kısa kodlar
    for extra in (
        "SILENCER",
        "VORTEXS",
        "VORTEX",
        "SILENCERPRO",
        "SILENCERPROGR",
        "DPHS",
        "DJR",
        "DBK",
        "DHR",
        "DPOJ",
        "DDKB",
        "DPDK",
    ):
        out.add(extra)
    return out


def is_model(tok: str, existing: set[str]) -> bool:
    t = tok.strip().upper().rstrip(".,;:")
    if not t or SKIP_MODEL.match(t):
        return False
    if re.match(r"^GN-?\d", t):
        return False
    if t in {"GREY", "BLACK", "INOX", "WHITE", "PRO", "NEW", "YENI"}:
        return False
    if STRICT_MODEL.match(t):
        return True
    if SHORT_OK.match(t) and norm(t) in existing:
        return True
    return False


def page_words(page) -> list[tuple[float, float, float, float, str]]:
    """(x0,y0,x1,y1,word)"""
    return [(w[0], w[1], w[2], w[3], w[4]) for w in page.get_text("words")]


def extract_prices(words) -> list[dict]:
    """Fiyat noktaları: amount, currency, cx, cy.

    Para birimi ya aynı tokende (9700$) ya da *hemen sonraki* kelimede ($ / €).
    Araya başka sayı girerse (16000 + 260 $) fiyat sayılmaz.
    """
    out = []
    n = len(words)
    for i, (x0, y0, x1, y1, tok) in enumerate(words):
        m = PRICE_TOKEN.match(tok)
        if not m:
            continue
        amt = parse_amount(m.group("a"))
        if amt is None or not (8 <= amt <= 30000):
            continue
        cur = None
        if m.group("c"):
            cur = "EUR" if m.group("c") == "€" else "USD"
        elif i + 1 < n and CUR_ONLY.match(words[i + 1][4]):
            t2 = words[i + 1][4]
            cur = "EUR" if t2.upper() in {"€", "EUR"} else "USD"
        if not cur:
            continue
        out.append(
            {
                "amt": amt,
                "cur": cur,
                "cx": (x0 + x1) / 2,
                "cy": (y0 + y1) / 2,
                "i": i,
            }
        )
    return out


def extract_models(words, existing: set[str]) -> list[dict]:
    out = []
    for i, (x0, y0, x1, y1, tok) in enumerate(words):
        up = tok.upper().rstrip(".,;:")
        # "VORTEX SİLENCER PRO" adlı ürünler — kelime bazlı ayrı
        if is_model(up, existing):
            out.append(
                {
                    "model": up,
                    "cx": (x0 + x1) / 2,
                    "cy": (y0 + y1) / 2,
                    "i": i,
                }
            )
    return out


def pair_score(price: dict, model: dict) -> float | None:
    """Aynı satır (küçük dy) öncelikli; fiyat genelde modelin sağında."""
    dx = abs(price["cx"] - model["cx"])
    dy = abs(price["cy"] - model["cy"])
    # Katalog düzeni: model sol, fiyat sağ — dy küçük olmalı
    if dy > 55:
        return None
    if dx > 520:
        return None
    return dy * 4.0 + dx * 0.35


def pair_prices_models(prices: list[dict], models: list[dict]) -> list[tuple[dict, dict]]:
    """Her fiyat ↔ en yakın model (satır öncelikli); 1-1 eşleme."""
    cands = []
    for pi, p in enumerate(prices):
        for mi, m in enumerate(models):
            s = pair_score(p, m)
            if s is None:
                continue
            cands.append((s, pi, mi))
    cands.sort()
    used_p, used_m = set(), set()
    pairs = []
    for _s, pi, mi in cands:
        if pi in used_p or mi in used_m:
            continue
        used_p.add(pi)
        used_m.add(mi)
        pairs.append((prices[pi], models[mi]))
    return pairs


def guess_name(text: str, model: str) -> str:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    mn = norm(model)
    for i, ln in enumerate(lines):
        if mn and mn in norm(ln):
            for j in (i - 1, i + 1, i - 2, i + 2, i):
                if 0 <= j < len(lines):
                    cand = lines[j]
                    if len(cand) < 8 or len(cand) > 110:
                        continue
                    if TR_NAME.search(cand):
                        return cand
                    if re.search(
                        r"(Makine|Blender|Mikser|Dolap|Fırın|Ocak|Ünite|Teşhir|Sıkac|Fanus)",
                        cand,
                        re.I,
                    ):
                        return cand
    for ln in lines:
        if TR_NAME.search(ln) and 12 < len(ln) < 90:
            if not re.search(r"CAFE BAR|HAZIRLIK|SOĞUT|YIKA|EKİPMAN|KATALOG|PİŞİRİCİ", ln, re.I):
                return ln
    return f"By Kitchen {model}"


def named_vortex(page_no: int, words, text: str) -> list[dict]:
    """Sayfa 4: Vortex ailesi isim + fiyat."""
    if page_no != 4:
        return []
    prices = extract_prices(words)
    # 499 → SILENCER, 244 → VORTEX-S, 778 → SILENCER.PRO
    by_amt = {round(p["amt"]): p for p in prices}
    out = []
    mapping = {
        499: ("SILENCER", "Vortex Silencer Bar Blender"),
        244: ("VORTEX-S", "Vortex Bar Blender"),
        778: ("SILENCER.PRO", "Vortex Silencer Pro Bar Blender"),
    }
    for amt, (model, name) in mapping.items():
        if amt in by_amt:
            out.append(
                {
                    "model": model,
                    "name_tr": name,
                    "liste_fiyat": float(amt),
                    "currency": by_amt[amt]["cur"],
                    "page": 4,
                    "source": "named-vortex",
                }
            )
    return out


def main() -> None:
    existing = load_existing_norms()
    print(f"[bykitchen-extract] existing SKU norms={len(existing)}")
    doc = fitz.open(str(PDF))
    by_norm: dict[str, dict] = {}

    for i in range(doc.page_count):
        page_no = i + 1
        if page_no <= 3:
            continue
        page = doc[i]
        text = page.get_text("text")
        words = page_words(page)
        third_party_page = bool(SKIP_PAGE_HINT.search(text))

        for it in named_vortex(page_no, words, text):
            by_norm[norm(it["model"])] = it

        if third_party_page:
            # Brema / Cunill / Magister sayfası — By Kitchen ürünü yok
            continue

        prices = extract_prices(words)
        models = extract_models(words, existing)
        # Vortex sayfasında model kodları zaten named ile alındı; çiftlemeyi azalt
        if page_no == 4:
            models = [m for m in models if not re.search(r"VORTEX|SILENCER|GREY", m["model"], re.I)]

        for price, model in pair_prices_models(prices, models):
            if SKIP_MODEL.match(model["model"]):
                continue
            key = norm(model["model"])
            item = {
                "model": model["model"].rstrip("."),
                "name_tr": guess_name(text, model["model"]),
                "liste_fiyat": price["amt"],
                "currency": price["cur"],
                "page": page_no,
            }
            prev = by_norm.get(key)
            if not prev:
                by_norm[key] = item
            elif abs(prev["liste_fiyat"] - item["liste_fiyat"]) > 0.01 or prev["currency"] != item["currency"]:
                # Aynı model farklı fiyat: daha spesifik / sonraki sayfa — yakın eşleşme koru
                # Öncelik: aynı sayfada daha düşük mesafe yok; sonra gelen üzerine yazma sadece
                # önceki "named" ise koru
                if prev.get("source", "").startswith("named"):
                    continue
                item["replaced"] = {
                    "page": prev["page"],
                    "liste_fiyat": prev["liste_fiyat"],
                    "currency": prev["currency"],
                }
                by_norm[key] = item

    products = sorted(by_norm.values(), key=lambda x: (x["page"], x["model"]))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": str(PDF),
        "pages": doc.page_count,
        "count": len(products),
        "pricing_note": "liste × 0.55 (%45 iskonto) + KDV %20",
        "products": products,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[bykitchen-extract] {len(products)} ürün → {OUT}")
    print("currency", dict(Counter(p["currency"] for p in products)))
    for p in products[:30]:
        print(
            f"  p{p['page']:<3} {p['model']:16} {p['liste_fiyat']:>8} {p['currency']}  {p['name_tr'][:55]}"
        )
    print("...")
    for p in products[-12:]:
        print(
            f"  p{p['page']:<3} {p['model']:16} {p['liste_fiyat']:>8} {p['currency']}  {p['name_tr'][:55]}"
        )


if __name__ == "__main__":
    main()
