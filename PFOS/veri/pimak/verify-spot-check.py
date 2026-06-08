#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PDF metninden bağımsız spot-check — parser kodunu kullanmaz."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

import fitz

PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\pimak 27-27-030426.pdf")
SITE = Path(__file__).resolve().parent.parent.parent.parent / "E-TICARET" / "site"

# (sayfa, kod, beklenen liste EUR — PDF'den elle doğrulanmış referans)
SPOTS = [
    (188, "PIMAK.16070.04", 630),
    (190, "PIMAK.10060.15", 500),
    (190, "PIMAK.10070.70", 470),
    (127, "BPD", 1250),
    (127, "BPD.A", 1350),
    (81, "KM012-4", 3700),
    (81, "KM012-8", 7000),
    (107, "BPKM.32S", 3100),
    (107, "BPKM.32SCK", 3300),
    (197, "DR04-503030.00", 80),
    (197, "TB04-503030.00", 160),
    (195, "PIMAK.1501500500.10", 960),
    (37, "90SD-M168E", 900),
]

PRICE = re.compile(r"([\d.,]+)\s*€")


def page_text(page: int) -> str:
    doc = fitz.open(PDF)
    return doc[page - 1].get_text("text")


def prices_near_code(text: str, code: str) -> list[float]:
    """Kod satırına en yakın € fiyatları (basit bağımsız tarama)."""
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    idxs = [i for i, ln in enumerate(lines) if code.upper() in ln.upper().replace("İ", "I")]
    if not idxs:
        return []
    i = idxs[-1]
    window = lines[max(0, i - 35) : min(len(lines), i + 15)]
    out: list[float] = []
    for ln in window:
        for m in PRICE.finditer(ln.replace(" ", "")):
            s = m.group(1).replace(".", "").replace(",", ".") if re.match(r"^\d{1,3}\.\d{3}$", m.group(1)) else m.group(1).replace(",", ".")
            try:
                v = float(s)
                if v >= 20:
                    out.append(v)
            except ValueError:
                pass
    return out


def site_eur(sku: str) -> float | None:
    for f in (SITE / "public/data/dept").glob("*.json"):
        for r in json.loads(f.read_text(encoding="utf-8")):
            if r.get("sku") == sku or r.get("urun_kodu") == sku:
                return float(r.get("liste_fiyati_eur") or 0) or None
            equsto = "EQUSTO." + sku.replace("PIMAK.", "") if sku.startswith("PIMAK.") else None
            if equsto and r.get("sku") == equsto:
                return float(r.get("liste_fiyati_eur") or 0) or None
    return None


def sku_for(code: str) -> str:
    if code.startswith("PIMAK."):
        return "EQUSTO." + code[6:]
    return code


def main() -> int:
    fails = 0
    print("=== Bağımsız spot-check (PDF metin penceresi) ===\n")
    for page, code, expected in SPOTS:
        text = page_text(page)
        nearby = prices_near_code(text, code.split(".")[-1] if code.startswith("PIMAK.") else code)
        in_window = expected in nearby or any(abs(p - expected) < 0.01 for p in nearby)
        sku = sku_for(code)
        site = site_eur(sku) or site_eur(code)
        site_ok = site is not None and abs(site - expected) < 0.01
        ok = in_window and site_ok
        status = "OK" if ok else "FAIL"
        if not ok:
            fails += 1
        print(f"[{status}] s.{page} {code}")
        print(f"       PDF beklenen: {expected} € | pencerede: {nearby[:8]}")
        print(f"       Site ({sku}): {site} €")
        print()
    print(f"Sonuç: {len(SPOTS) - fails}/{len(SPOTS)} spot-check geçti")
    return fails


if __name__ == "__main__":
    sys.exit(main())
