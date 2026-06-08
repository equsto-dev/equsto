# -*- coding: utf-8 -*-
"""Pimak PDF tablo blokları — kod ↔ fiyat eşlemesi (s.188-218)."""
from __future__ import annotations

import re

DIM_HEADERS = {"Dimensions (mm)", "Ebat (mm)", "Dim. (mm)"}
ANCHORS = {"Ürün Kodu", "Product Code"}
_PLACEHOLDER = re.compile(r"^M0\d{2}T?$", re.I)


def collect_prices_before_fiyat(lines: list[str], fiyat_idx: int, price_line, parse_eur) -> list[float]:
    prices: list[float] = []
    k = fiyat_idx - 1
    while k >= 0:
        if lines[k] in DIM_HEADERS:
            break
        if lines[k] in {"Fiyat", "Price"}:
            break
        pm = price_line.match(lines[k])
        if pm:
            prices.insert(0, parse_eur(pm.group(1)))
        elif prices:
            break
        k -= 1
    return prices


def collect_prices_after_anchor_before_fiyat(
    lines: list[str], anchor: int, price_line, parse_eur, lookahead: int = 24
) -> tuple[int | None, list[float]]:
    fiyat_idx = None
    for k in range(anchor + 1, min(len(lines), anchor + lookahead)):
        if lines[k] == "Fiyat":
            fiyat_idx = k
            break
    if fiyat_idx is None:
        return None, []
    prices: list[float] = []
    for k in range(anchor + 1, fiyat_idx):
        pm = price_line.match(lines[k])
        if pm:
            prices.append(parse_eur(pm.group(1)))
    return fiyat_idx, prices


def pair_codes_prices_block(
    lines: list[str],
    anchor: int,
    codes: list[str],
    price_line,
    parse_eur,
) -> tuple[int | None, list[float]]:
    """Kod bloğu için en yakın geçerli fiyat kolonunu seç."""
    if not codes:
        return None, []

    fiyat_back = None
    for k in range(anchor - 1, -1, -1):
        if lines[k] == "Fiyat":
            fiyat_back = k
            break
    prices_back = (
        collect_prices_before_fiyat(lines, fiyat_back, price_line, parse_eur)
        if fiyat_back is not None
        else []
    )

    fiyat_fwd, prices_fwd = collect_prices_after_anchor_before_fiyat(
        lines, anchor, price_line, parse_eur
    )

    candidates: list[tuple[int, list[float], int]] = []
    if fiyat_back is not None and len(prices_back) == len(codes):
        candidates.append((fiyat_back, prices_back, anchor - fiyat_back))
    if fiyat_fwd is not None and len(prices_fwd) == len(codes):
        candidates.append((fiyat_fwd, prices_fwd, fiyat_fwd - anchor))

    if candidates:
        candidates.sort(key=lambda x: x[2])
        idx, prices, _ = candidates[0]
        return idx, prices

    # Uzunluk uyuşmazsa en yakın kolonu kırp
    best: tuple[int, list[float], int] | None = None
    for fi, plist, dist in (
        (fiyat_back, prices_back, anchor - fiyat_back if fiyat_back else 9999),
        (fiyat_fwd, prices_fwd, fiyat_fwd - anchor if fiyat_fwd else 9999),
    ):
        if fi is None or not plist:
            continue
        n = min(len(codes), len(plist))
        if n == 0:
            continue
        cand = (fi, plist[:n], dist)
        if best is None or cand[2] < best[2]:
            best = cand
    if best:
        return best[0], best[1]
    return None, []


def collect_codes_before_anchor(lines: list[str], anchor: int, is_product_code, norm_kod) -> list[str]:
    codes: list[str] = []
    j = anchor - 1
    while j >= 0:
        s = norm_kod(lines[j])
        if _PLACEHOLDER.match(s) or s in {"KOD", "CODE"}:
            j -= 1
            continue
        if not is_product_code(lines[j]):
            break
        codes.insert(0, s)
        j -= 1
    return codes


def extract_block_pairs_from_page(
    body: str,
    page: int,
    *,
    is_product_code,
    norm_kod,
    price_line,
    parse_eur,
) -> list[dict]:
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    out: list[dict] = []
    for anchor, ln in enumerate(lines):
        if ln not in ANCHORS:
            continue
        codes = collect_codes_before_anchor(lines, anchor, is_product_code, norm_kod)
        if not codes:
            continue
        fiyat_idx, prices = pair_codes_prices_block(lines, anchor, codes, price_line, parse_eur)
        if not prices:
            continue
        n = min(len(codes), len(prices))
        for code, price in zip(codes[:n], prices[:n]):
            out.append({"urun_kodu": code, "liste_fiyati_eur": price, "pdf_page": page})
    return out
