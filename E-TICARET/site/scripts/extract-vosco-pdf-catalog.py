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
# "Vosco" / "Vision" gibi marka satırları CODE_RE'ye uyuyor; fiyat çalıyorlardı.
REJECT_CODES = {
    "VOSCO",
    "VISION",
    "VIZYON",
    "MISYON",
}
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


def is_product_code(line: str) -> bool:
    s = str(line or "").strip()
    if not CODE_RE.match(s):
        return False
    return norm_code(s) not in REJECT_CODES


def code_sort_key(code: str) -> tuple[int, str]:
    """VXC-112 < VXC-224 < VXC-336 gibi kapasite sıralaması."""
    nk = norm_code(code)
    nums = [int(x) for x in re.findall(r"\d+", nk)]
    return (nums[-1] if nums else 0, nk)


def parse_prices_near(
    lines: list[str], idx: int, line_pages: list[int]
) -> tuple[float, float]:
    """Kod satırına en yakın fiyat — yalnızca aynı PDF sayfasında."""
    page = line_pages[idx]
    assigns = _page_price_assignments(lines, line_pages).get(page, {})
    hit = assigns.get(idx)
    if hit:
        kind, val = hit
        return (val, 0.0) if kind == "usd" else (0.0, val)
    return 0.0, 0.0


_page_assign_cache: dict[int, dict[int, tuple[str, float]]] = {}


def _used_price_idxs_from_assigns(
    assigns: dict[int, tuple[str, float]],
    price_idxs: list[tuple[int, str, float]],
) -> set[int]:
    """code_idx→fiyat eşlemesinden kullanılan fiyat satır indekslerini çıkar."""
    used: set[int] = set()
    for code_idx, (kind, val) in assigns.items():
        candidates = [
            (abs(pidx - code_idx), pidx)
            for pidx, pk, pv in price_idxs
            if pk == kind and abs(pv - val) < 1e-9 and pidx not in used
        ]
        if candidates:
            used.add(min(candidates)[1])
    return used


def _page_price_assignments(
    lines: list[str], line_pages: list[int]
) -> dict[int, dict[int, tuple[str, float]]]:
    """Sayfa bazında kod↔fiyat: pencere içi en yakın; önceki ürüne ait fiyatı alma."""
    global _page_assign_cache
    if _page_assign_cache:
        return _page_assign_cache

    pages = sorted(set(line_pages))
    for page in pages:
        code_idxs = [
            i
            for i, p in enumerate(line_pages)
            if p == page and is_product_code(lines[i])
        ]
        price_idxs: list[tuple[int, str, float]] = []
        for i, p in enumerate(line_pages):
            if p != page:
                continue
            um = PRICE_USD_RE.search(lines[i])
            em = PRICE_EUR_RE.search(lines[i])
            if um:
                price_idxs.append(
                    (i, "usd", float(um.group(1).replace(",", "")))
                )
            elif em:
                price_idxs.append(
                    (i, "eur", float(em.group(1).replace(",", "")))
                )

        assigned: dict[int, tuple[str, float]] = {}
        used: set[int] = set()

        # Her kod için (önceki kod, sonraki kod) penceresindeki en yakın fiyat.
        # PDF metin sırası bazen fiyatı kodun üstüne koyar ($1750 → VSL-FRT2C08B);
        # yalnızca "koddan sonra" bakmak komşu ürün fiyatını çalıyordu ($1150).
        for ci, code_idx in enumerate(code_idxs):
            prev_code = code_idxs[ci - 1] if ci > 0 else -1
            next_code = (
                code_idxs[ci + 1] if ci + 1 < len(code_idxs) else len(lines)
            )
            best: tuple[int, int, str, float] | None = None
            for pidx, kind, val in price_idxs:
                if pidx in used:
                    continue
                if not (prev_code < pidx < next_code):
                    continue
                # Fiyat bir önceki koda daha yakınsa bu koda verme
                # (VSC-3 $44 → sonraki VSC-600B'ye yazılmasın).
                if pidx < code_idx and prev_code >= 0:
                    if (code_idx - pidx) >= (pidx - prev_code):
                        continue
                dist = abs(pidx - code_idx)
                if best is None or dist < best[0]:
                    best = (dist, pidx, kind, val)
            if best:
                _, pidx, kind, val = best
                assigned[code_idx] = (kind, val)
                used.add(pidx)

        _page_assign_cache[page] = assigned

    return _page_assign_cache


def pair_page_block_prices(lines: list[str], line_pages: list[int]) -> None:
    """Aynı sayfada uzak fiyat + ardışık kod blokları (VXC buzlaş vb.)."""
    pages = sorted(set(line_pages))
    for page in pages:
        page_idxs = [i for i, p in enumerate(line_pages) if p == page]
        if not page_idxs:
            continue
        assigns = _page_price_assignments(lines, line_pages).get(page, {})
        price_idxs_on_page: list[tuple[int, str, float]] = []
        for k in page_idxs:
            um = PRICE_USD_RE.search(lines[k])
            em = PRICE_EUR_RE.search(lines[k])
            if um:
                price_idxs_on_page.append(
                    (k, "usd", float(um.group(1).replace(",", "")))
                )
            elif em:
                price_idxs_on_page.append(
                    (k, "eur", float(em.group(1).replace(",", "")))
                )
        used_price_idxs = _used_price_idxs_from_assigns(
            assigns, price_idxs_on_page
        )

        pi = 0
        while pi < len(page_idxs):
            i = page_idxs[pi]
            if not is_product_code(lines[i]):
                pi += 1
                continue
            codes: list[str] = []
            j = i
            last = page_idxs[-1]
            while j <= last and line_pages[j] == page:
                if is_product_code(lines[j]):
                    codes.append(lines[j].upper().replace(" ", ""))
                    j += 1
                elif TITLE_RE.match(lines[j]):
                    j += 1
                else:
                    break
            if len(codes) >= 2:
                # Önceki ürünlerin fiyatlarını çalma: yalnızca bu bloktan
                # hemen önceki kod ile blok başı arasında kalan boş fiyatlar.
                prev_code = -1
                for k in page_idxs:
                    if k >= i:
                        break
                    if is_product_code(lines[k]):
                        prev_code = k

                prices: list[tuple[str, float]] = []
                for pidx, kind, val in price_idxs_on_page:
                    if pidx in used_price_idxs:
                        continue
                    if not (prev_code < pidx < i):
                        continue
                    prices.append((kind, val))
                usd_vals = sorted({v for k, v in prices if k == "usd"})
                eur_vals = sorted({v for k, v in prices if k == "eur"})
                sorted_codes = sorted(codes, key=code_sort_key)
                if len(usd_vals) >= len(sorted_codes):
                    for ci, code in enumerate(sorted_codes):
                        _pending_pairs.append(("pageblock", code, "usd", usd_vals[ci]))
                elif len(eur_vals) >= len(sorted_codes):
                    for ci, code in enumerate(sorted_codes):
                        _pending_pairs.append(("pageblock", code, "eur", eur_vals[ci]))
                pi += len(codes)
            else:
                pi += 1


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
        codes = [p.upper().replace(" ", "") for p in parts if is_product_code(p.strip())]
        if len(codes) >= 2:
            for c in codes:
                out_lines.append(c)
                out_pages.append(page)
        else:
            out_lines.append(line)
            out_pages.append(page)
    return out_lines, out_pages


def pair_trailing_prices(lines: list[str], line_pages: list[int]) -> None:
    """Ardışık fiyat satırları + ardışık kod satırları → eşleştir.

    Pencere atamasında zaten kullanılmış fiyat satırlarını atla; aksi halde
    $35/$44 → sonraki VSC-600B/VSC-6'ya yazılıyordu (PDF'te 6 parça fiyatsız).
    """
    assigns_by_page = _page_price_assignments(lines, line_pages)
    all_price_idxs: list[tuple[int, str, float]] = []
    for i, line in enumerate(lines):
        um = PRICE_USD_RE.search(line)
        em = PRICE_EUR_RE.search(line)
        if um:
            all_price_idxs.append((i, "usd", float(um.group(1).replace(",", ""))))
        elif em:
            all_price_idxs.append((i, "eur", float(em.group(1).replace(",", ""))))
    used_price_idxs: set[int] = set()
    for page, assigns in assigns_by_page.items():
        page_prices = [
            (pidx, kind, val)
            for pidx, kind, val in all_price_idxs
            if line_pages[pidx] == page
        ]
        used_price_idxs |= _used_price_idxs_from_assigns(assigns, page_prices)

    i = 0
    while i < len(lines):
        if not (PRICE_USD_RE.search(lines[i]) or PRICE_EUR_RE.search(lines[i])):
            i += 1
            continue
        if i in used_price_idxs:
            i += 1
            continue
        prices: list[tuple[str, float]] = []
        j = i
        while j < len(lines) and j < i + 6:
            if j in used_price_idxs:
                if prices:
                    break
                j += 1
                continue
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
        codes: list[str] = []
        first_code_line: int | None = None
        k = j
        while k < len(lines) and k < j + 8:
            if is_product_code(lines[k]):
                if first_code_line is None:
                    first_code_line = k
                codes.append(lines[k].upper().replace(" ", ""))
                k += 1
            elif codes:
                break
            else:
                k += 1
        if codes and len(prices) >= 1:
            if len(prices) > 1 and len(codes) < len(prices):
                i = max(i + 1, k)
                continue

            prev_code_line: int | None = None
            for back in range(i - 1, max(-1, i - 15), -1):
                if is_product_code(lines[back]):
                    prev_code_line = back
                    break

            # Fiyat kümesi önceki ürüne daha yakınsa sonraki kodlara yazma
            # ($35/$44 → VSC-600B/VSC-6 değil; 6 parça PDF'te fiyatsız).
            closer_to_prev = (
                prev_code_line is not None
                and first_code_line is not None
                and (i - prev_code_line) <= (first_code_line - i)
            )

            # Tek fiyat + hemen sonraki tek kod: fiyat önceki koda aittir (VHS-206 → $190 → VHS-206C)
            if len(prices) == 1 and (len(codes) == 1 or closer_to_prev):
                kind, val = prices[0]
                if prev_code_line is not None:
                    _pending_pairs.append(
                        (
                            "trail",
                            lines[prev_code_line].upper().replace(" ", ""),
                            kind,
                            val,
                        )
                    )
                elif not closer_to_prev:
                    _pending_pairs.append(("trail", codes[0], kind, val))
                i = max(i + 1, k)
                continue
            if closer_to_prev:
                i = max(i + 1, k)
                continue
            for ci, code in enumerate(codes):
                pi = min(ci, len(prices) - 1)
                kind, val = prices[pi]
                _pending_pairs.append(("trail", code, kind, val))
        i = max(i + 1, k)


def pair_leading_codes_trailing_prices(lines: list[str]) -> None:
    """Aynı bloktaki kodlar (arada açıklama satırı olabilir) + sonraki fiyatlar."""
    i = 0
    while i < len(lines):
        if not is_product_code(lines[i]):
            i += 1
            continue

        codes: list[str] = [lines[i].upper().replace(" ", "")]
        j = i + 1
        while j < len(lines) and j < i + 28:
            if is_product_code(lines[j]):
                codes.append(lines[j].upper().replace(" ", ""))
                j += 1
                continue
            if PRICE_USD_RE.search(lines[j]) or PRICE_EUR_RE.search(lines[j]):
                break
            j += 1

        if len(codes) < 2:
            i += 1
            continue

        prices: list[tuple[str, float]] = []
        k = j
        while k < len(lines) and k < j + 8:
            um = PRICE_USD_RE.search(lines[k])
            em = PRICE_EUR_RE.search(lines[k])
            if um:
                prices.append(("usd", float(um.group(1).replace(",", ""))))
            elif em:
                prices.append(("eur", float(em.group(1).replace(",", ""))))
            elif prices:
                break
            k += 1

        if len(prices) >= len(codes):
            for ci, code in enumerate(codes):
                kind, val = prices[ci]
                _pending_pairs.append(("lead", code, kind, val))
            i = j
            continue
        i += 1


_pending_pairs: list[tuple[str, str, str, float]] = []


def extract_all(doc: fitz.Document) -> dict[str, dict]:
    global _pending_pairs, _page_assign_cache
    _pending_pairs = []
    _page_assign_cache = {}
    lines: list[str] = []
    line_pages: list[int] = []
    for pi in range(doc.page_count):
        for l in doc[pi].get_text().split("\n"):
            l = l.strip()
            if l:
                lines.append(l)
                line_pages.append(pi + 1)

    lines, line_pages = expand_code_lines(lines, line_pages)
    pair_page_block_prices(lines, line_pages)
    pair_trailing_prices(lines, line_pages)
    pair_leading_codes_trailing_prices(lines)

    products: dict[str, dict] = {}
    category = ""

    for i, line in enumerate(lines):
        if line.isupper() and len(line) > 8 and not is_product_code(line):
            if not SKIP_CAT.search(line) and not PRICE_USD_RE.search(line) and not PRICE_EUR_RE.search(line):
                category = line.title() if line.isupper() else line

        if not is_product_code(line):
            continue

        code = line.upper().replace(" ", "")
        nk = norm_code(code)
        usd, eur = parse_prices_near(lines, i, line_pages)

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

    priority = {"pageblock": 3, "lead": 2, "trail": 1}
    best: dict[str, tuple[int, str, str, float]] = {}
    for src, code, kind, val in _pending_pairs:
        nk = norm_code(code)
        pr = priority.get(src, 0)
        if nk not in best or pr >= best[nk][0]:
            best[nk] = (pr, code, kind, val)

    for nk, (pr, code, kind, val) in best.items():
        p = products.get(nk) or {
            "model": code,
            "modelNorm": nk,
            "title": code,
            "category": "",
            "page": 0,
            "specs": {},
        }
        has_parse = p["specs"].get("liste_usd") or p["specs"].get("liste_eur")
        # Yalnızca düşük öncelikli "trail" parse sonucunu korur; lead/pageblock her zaman kazanır
        if pr == 1 and has_parse:
            continue
        if kind == "usd":
            p["specs"]["liste_usd"] = val
            p["specs"]["liste_eur"] = None
        if kind == "eur":
            p["specs"]["liste_eur"] = val
            p["specs"]["liste_usd"] = None
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
