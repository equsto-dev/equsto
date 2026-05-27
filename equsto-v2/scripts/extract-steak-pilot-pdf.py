#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Pilot: steak.pdf + S13-117-8-steakhouse.pdf → JSON özet."""
from __future__ import annotations

import importlib.util
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PILOT = ROOT / "public" / "data" / "referans-pilot"
OUT = PILOT / "steak-pilot-extract.json"

spec = importlib.util.spec_from_file_location(
    "ex", ROOT / "scripts" / "extract-pfos-archive-all.py"
)
ex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ex)

M2_RE = re.compile(
    r"(\d{1,4}(?:[.,]\d+)?)\s*m\s*[²2]|m\s*[²2]\s*[:=]?\s*(\d{1,4})|"
    r"(\d{1,4}(?:[.,]\d+)?)\s*metre\s*kare|alan\s*[:=]?\s*(\d{1,4})",
    re.I,
)
AREA_LABEL_RE = re.compile(
    r"alan|m2|m\s*²|metre|toplam|net|brüt|brut|yüzey|yuzey", re.I
)


def read_pdf(path: Path) -> tuple[str, str]:
    try:
        import fitz

        doc = fitz.open(str(path))
        text = "\n".join(page.get_text() for page in doc)
        doc.close()
        return text, "pymupdf"
    except Exception:
        r = ex.extract_pdf_pypdf(path, max_pages=50)
        if r.get("error"):
            return "", f"pypdf_err:{r['error']}"
        # rebuild minimal text from zones samples
        parts = []
        for z in r.get("zones", {}).values():
            for lb in z.get("labels_found", []):
                parts.append(lb)
            for s in z.get("sample_lines", []):
                parts.append(s)
        return "\n".join(parts), "pypdf"


def parse_areas(lines: list[str]) -> list[dict]:
    areas = []
    for i, ln in enumerate(lines):
        if not AREA_LABEL_RE.search(ln) and not M2_RE.search(ln):
            continue
        m = M2_RE.search(ln)
        val = None
        if m:
            for g in m.groups():
                if g:
                    val = float(g.replace(",", "."))
                    break
        areas.append({"line_index": i, "line": ln[:240], "m2": val})
    return areas


def parse_zones(lines: list[str]) -> dict:
    zones: dict = {}
    cur: str | None = None
    for ln in lines:
        zk = ex.map_zone(ln)
        if zk:
            cur = zk
            zones.setdefault(
                zk,
                {"zone_key": zk, "section_titles": [], "equipment": [], "m2_notes": []},
            )
            if ln not in zones[zk]["section_titles"]:
                zones[zk]["section_titles"].append(ln[:180])
            if M2_RE.search(ln) or AREA_LABEL_RE.search(ln):
                zones[zk]["m2_notes"].append(ln[:180])
            continue
        if cur and len(ln) > 6 and not ex.SKIP.search(ex.norm(ln)):
            if M2_RE.search(ln) or AREA_LABEL_RE.search(ln):
                zones[cur]["m2_notes"].append(ln[:180])
            elif len(zones[cur]["equipment"]) < 60:
                zones[cur]["equipment"].append(ln[:220])
    return zones


def main() -> None:
    files = [
        PILOT / "steak.pdf",
        PILOT / "S13-117-8-steakhouse.pdf",
    ]
    result = {"version": 1, "files": {}}
    for fp in files:
        if not fp.exists():
            result["files"][fp.name] = {"error": "missing"}
            continue
        text, engine = read_pdf(fp)
        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        zones = parse_zones(lines)
        result["files"][fp.name] = {
            "engine": engine,
            "chars": len(text),
            "line_count": len(lines),
            "areas_all": parse_areas(lines),
            "zones": zones,
            "zone_order": list(zones.keys()),
            "text_preview": lines[:120],
        }
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
