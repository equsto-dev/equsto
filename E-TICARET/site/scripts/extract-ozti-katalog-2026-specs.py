# -*- coding: utf-8 -*-
"""Öztiryakiler 2026 ürün kataloğundan kod başına G×D×Y, enerji ve madde işaretli metin."""
from __future__ import annotations

import json
import re
from pathlib import Path

import fitz

PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\Öztiryakiler-Urun-katalogu-2026.pdf")
OUT = Path(__file__).resolve().parent / "data" / "ozti" / "ozti-katalog-2026-specs.json"
KOD_RE = re.compile(r"^(\d{2,4}\.[A-Z0-9][A-Z0-9.\-]{3,})$", re.I)
NUM_RE = re.compile(r"^(\d{2,4})$")
SKIP = re.compile(
    r"^(KOD|TİP|TIP|G|D|Y|MODEL|FİYAT|FIYAT|CİHAZ|CIHAZ|SERİ|SERI|BRÜLÖR GÜCÜ|TOPLAM GÜÇ|GERİLİM|FIRIN GÜCÜ)$",
    re.I,
)


def is_code(line: str) -> bool:
    return bool(KOD_RE.match(line.strip()))


def dim_triplet(lines: list[str], start: int) -> tuple[int, int, int] | None:
    nums = []
    i = start
    while i < len(lines) and len(nums) < 3:
        m = NUM_RE.match(lines[i])
        if m:
            n = int(m.group(1))
            if 40 <= n <= 7000:
                nums.append(n)
            else:
                return None
        elif nums:
            return None
        i += 1
    if len(nums) != 3:
        return None
    return nums[0], nums[1], nums[2]


def page_bullets(text: str) -> list[str]:
    bullets: list[str] = []
    current = ""
    for raw in text.splitlines():
        s = raw.strip()
        if not s or SKIP.match(s) or is_code(s) or NUM_RE.match(s):
            continue
        if s.startswith("•") or s.startswith("·"):
            if len(current) > 25:
                bullets.append(re.sub(r"\s+", " ", current).strip())
            current = s.lstrip("•· ").strip()
            continue
        if current and not re.search(r"[.!?…]$", current):
            current = current + " " + s
    if len(current) > 25:
        bullets.append(re.sub(r"\s+", " ", current).strip())
    return bullets[:14]


def parse_page(text: str) -> dict[str, dict]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip() and not SKIP.match(ln.strip())]
    bullets = page_bullets(text)
    out: dict[str, dict] = {}
    i = 0
    while i < len(lines):
        if not is_code(lines[i]):
            i += 1
            continue
        codes = []
        while i < len(lines) and is_code(lines[i]):
            codes.append(lines[i].upper())
            i += 1
        blocks = []
        scan_from = i
        while len(blocks) < len(codes) and scan_from < len(lines):
            if is_code(lines[scan_from]):
                break
            found = None
            for j in range(scan_from, min(scan_from + 8, len(lines))):
                trip = dim_triplet(lines, j)
                if trip:
                    found = (j, trip)
                    break
            if not found:
                scan_from += 1
                continue
            j, (g, d, y) = found
            window = lines[scan_from : j + 12]
            blob = " ".join(window)
            volt = ""
            vm = re.search(r"(\d{3}\s*V[^.]{0,40})", blob, re.I)
            if vm:
                volt = re.sub(r"\s+", " ", vm.group(1)).strip(" -")
            kw = ""
            kws = re.findall(r"(\d+(?:[.,]\d+)?)\s*kW", blob, re.I)
            if kws:
                kw = kws[-1].replace(".", ",")
            fuel = ""
            if re.search(r"\bGAZ\b", blob):
                fuel = "gaz"
            if re.search(r"\bELEKT", blob):
                fuel = "elektrik" if not fuel else fuel
            blocks.append({"g": g, "d": d, "y": y, "volt": volt, "kw": kw, "fuel": fuel})
            scan_from = j + 3
        for idx, code in enumerate(codes):
            if idx >= len(blocks):
                break
            rec = blocks[idx]
            rec["bullets"] = bullets[:12]
            rec["page_bullets"] = bool(bullets)
            prev = out.get(code)
            if not prev or (rec["g"] and not prev.get("g")):
                out[code] = rec
        i = scan_from
    return out


def main() -> None:
    doc = fitz.open(PDF)
    merged: dict[str, dict] = {}
    for page in doc:
        for code, rec in parse_page(page.get_text("text")).items():
            merged[code] = rec
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"count": len(merged), "products": merged}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("codes", len(merged), "->", OUT)


if __name__ == "__main__":
    main()
