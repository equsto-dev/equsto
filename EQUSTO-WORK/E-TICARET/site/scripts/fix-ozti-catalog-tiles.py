# -*- coding: utf-8 -*-
"""
Öztiryakiler ax-images 1200×1200 katalog karelerini dept'te PDF kırpımıyla değiştirir.

  python scripts/fix-ozti-catalog-tiles.py
  python scripts/fix-ozti-catalog-tiles.py --dry
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DEPT_DIR = ROOT / "public" / "data" / "dept"
OZTI_BASE = ROOT / "public" / "images" / "catalog" / "ozti"
MANIFEST = OZTI_BASE / "_manifest.json"

CATALOG_TILE_SIZE = (1200, 1200)


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def slug_file(kod: str) -> str:
    s = "ozti-" + kod.lower().replace(".", "-")
    return "".join(c if c.isalnum() or c in "-" else "" for c in s)


def is_catalog_tile(fp: Path) -> bool:
    if not fp.is_file() or fp.stat().st_size < 6000:
        return False
    try:
        with Image.open(fp) as im:
            return im.size == CATALOG_TILE_SIZE
    except Exception:
        return False


def find_pdf_crop(kod: str) -> str | None:
    slug = slug_file(kod) + ".jpg"
    best: tuple[int, str] | None = None
    for p in OZTI_BASE.glob(f"p*/{slug}"):
        if not p.is_file() or is_catalog_tile(p):
            continue
        try:
            with Image.open(p) as im:
                w, h = im.size
                if w < 120 or h < 120:
                    continue
                aspect = w / max(h, 1)
                if aspect > 2.8 or aspect < 0.35:
                    continue
                score = w * h
                if best is None or score > best[0]:
                    best = (score, f"images/catalog/ozti/{p.parent.name}/{p.name}")
        except Exception:
            continue
    return best[1] if best else None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry", action="store_true")
    args = parser.parse_args()

    manifest: dict[str, str] = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    stats = {"tile": 0, "fixed": 0, "no_pdf": 0, "dept_rows": 0}

    for dept_file in sorted(DEPT_DIR.glob("*.json")):
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        changed = 0
        for row in rows:
            if "öztiryakiler" not in str(row.get("brand", "")).lower():
                continue
            kod = norm_kod(row.get("urun_kodu") or row.get("sku") or row.get("model") or "")
            if not kod:
                continue
            rel = str((row.get("images") or [""])[0]).replace("\\", "/")
            if not rel:
                continue
            pdf_rel = find_pdf_crop(kod)
            needs_swap = False
            if "ax-images" in rel or rel.startswith("http"):
                needs_swap = True
            elif "/catalog/ozti/web/" in rel:
                needs_swap = True
            elif "/catalog/ozti/" in rel:
                fp = ROOT / "public" / rel.lstrip("/")
                if is_catalog_tile(fp):
                    needs_swap = True
            if not needs_swap:
                continue
            stats["tile"] += 1
            if not pdf_rel:
                stats["no_pdf"] += 1
                continue
            if row.get("images") == [pdf_rel]:
                continue
            stats["fixed"] += 1
            if not args.dry:
                row["images"] = [pdf_rel]
                manifest[kod] = pdf_rel
                changed += 1
        if changed and not args.dry:
            dept_file.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
            stats["dept_rows"] += changed
            print(f"  {dept_file.name}: {changed} gorsel (pdf)")

    if not args.dry and manifest:
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print("[fix-ozti-catalog-tiles]", stats)


if __name__ == "__main__":
    main()
