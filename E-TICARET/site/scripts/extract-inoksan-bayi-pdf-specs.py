# -*- coding: utf-8 -*-
"""İnoksan bayi fiyat listesi PDF'inden kod başına ölçü (mm), güç ve voltaj."""
from __future__ import annotations

import json
import re
from pathlib import Path

import fitz

PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\iNOKSAN BAYI-FIYAT-LISTESI.pdf")
OUT = Path(__file__).resolve().parent / "data" / "inoksan" / "inoksan-bayi-pdf-specs.json"

CODE_RE = re.compile(r"^(IN[A-Z]{1,2}[-. ]?[A-Z]{1,4}[-. ]?\d{2,5}[A-Z0-9\-]*)$")
TRIPLE_RE = re.compile(r"(\d{2,4}(?:[.,]\d)?)\s*[xX×*]\s*(\d{2,4}(?:[.,]\d)?)\s*[xX×*]\s*(\d{2,4}(?:[.,]\d)?)\s*(mm|cm)?", re.I)
KW_RE = re.compile(r"(\d+(?:[.,]\d+)?(?:\s*\+\s*\d+(?:[.,]\d+)?)*)\s*(kW|W)\b", re.I)
VOLT_RE = re.compile(r"\b(220|230|380|400)(?:\s*/\s*(?:230|400))?\s*V\b", re.I)


def norm(code: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", code.upper())


def page_unit(text: str) -> str:
    up = text.upper()
    if re.search(r"ÖLÇÜLER\s*\n(?:.*\n){0,12}?\s*CM\s*\n", up) or re.search(r"DIMENSIONS\s*\n(?:.*\n){0,8}?\s*CM\s*\n", up):
        return "cm"
    return ""


def to_mm(a: float, b: float, c: float, unit: str, page_hint: str):
    nums = [a, b, c]
    u = (unit or "").lower()
    if u == "mm":
        return [round(n) for n in nums]
    if u == "cm":
        if min(nums) >= 200:
            return [round(n) for n in nums]
        return [round(n * 10) for n in nums]
    if page_hint == "cm" and max(nums) <= 300:
        return [round(n * 10) for n in nums]
    if max(nums) <= 160:
        return [round(n * 10) for n in nums]
    if min(nums) >= 180:
        return [round(n) for n in nums]
    return None


def parse_page(text: str, page_no: int) -> dict[str, dict]:
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    hint = page_unit(text)
    out: dict[str, dict] = {}
    for i, line in enumerate(lines):
        m = CODE_RE.match(line.replace("  ", " "))
        if not m:
            continue
        code = norm(m.group(1))
        if len(code) < 6:
            continue
        window = []
        for j in range(i + 1, min(i + 9, len(lines))):
            if CODE_RE.match(lines[j]):
                break
            window.append(lines[j])
        if not window:
            continue
        blob = " | ".join(window)
        tm = TRIPLE_RE.search(blob)
        if not tm:
            continue
        before = blob[: tm.start()]
        if re.search(r"paket|packing", before, re.I):
            continue
        a, b, c = (float(x.replace(",", ".")) for x in tm.groups()[:3])
        mm = to_mm(a, b, c, tm.group(4) or "", hint)
        if not mm or not all(40 <= n <= 8000 for n in mm):
            continue
        rec = {"g": mm[0], "d": mm[1], "y": mm[2], "page": page_no, "raw": tm.group(0).strip()}
        km = KW_RE.search(blob)
        if km:
            rec["guc"] = re.sub(r"\s+", "", km.group(1)).replace(".", ",") + (" kW" if km.group(2).lower() == "kw" else " W")
        vm = VOLT_RE.search(blob)
        if vm:
            rec["volt"] = vm.group(0).replace(" ", "")
        if code not in out:
            out[code] = rec
    return out


def main() -> None:
    doc = fitz.open(PDF)
    merged: dict[str, dict] = {}
    for idx, page in enumerate(doc):
        for code, rec in parse_page(page.get_text("text"), idx + 1).items():
            merged.setdefault(code, rec)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"count": len(merged), "products": merged}, ensure_ascii=False, indent=1), encoding="utf-8")
    print("codes", len(merged))
    for k in ("INTSG0066", "INTSG0062", "INTSG0072", "INTSG0013", "INTRE0018"):
        print(k, merged.get(k))


if __name__ == "__main__":
    main()
