# -*- coding: utf-8 -*-
"""
Tablo kırpımı / ax katalog karesi / aşırı geniş görselleri dept'ten temizler.

  python scripts/prune-ozti-bad-product-images.py
  python scripts/prune-ozti-bad-product-images.py --dept sogutma
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
MAX_ASPECT = 1.55
CATALOG_TILE = (1200, 1200)
# PDF'te gömülü fotoğraf yok; yalnız tablo metni kırpılmış sayfalar
TEXT_ONLY_PAGES = {217}


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def is_bad_file(fp: Path) -> bool:
    if not fp.is_file() or fp.stat().st_size < 6000:
        return True
    try:
        with Image.open(fp) as im:
            w, h = im.size
            if (w, h) == CATALOG_TILE:
                return True
            ar = w / max(h, 1)
            if ar > MAX_ASPECT or ar < 0.35:
                return True
    except Exception:
        return True
    m = re.search(r"/p(\d+)/", str(fp).replace("\\", "/"))
    if m and int(m.group(1)) in TEXT_ONLY_PAGES:
        return True
    return False


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dept", default="", help="Yalnız bu dept (ör. sogutma)")
    args = parser.parse_args()

    manifest: dict[str, str] = {}
    if MANIFEST.exists():
        manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))

    cleared_manifest = 0
    for kod, rel in list(manifest.items()):
        fp = ROOT / "public" / rel.lstrip("/")
        if is_bad_file(fp):
            del manifest[kod]
            cleared_manifest += 1

    stats = {"rows": 0, "dept_files": 0}
    for dept_file in sorted(DEPT_DIR.glob("*.json")):
        dept = dept_file.stem
        if args.dept and dept != args.dept:
            continue
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        changed = 0
        for row in rows:
            if "öztiryakiler" not in str(row.get("brand", "")).lower():
                continue
            rel = str((row.get("images") or [""])[0]).replace("\\", "/")
            if not rel or "ax-images" in rel or rel.startswith("http"):
                if row.get("images"):
                    row["images"] = []
                    changed += 1
                continue
            fp = ROOT / "public" / rel.lstrip("/")
            if is_bad_file(fp) or "/web/" in rel:
                row["images"] = []
                changed += 1
                kod = norm_kod(row.get("urun_kodu") or row.get("sku") or "")
                if kod in manifest:
                    del manifest[kod]
        if changed:
            dept_file.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
            stats["rows"] += changed
            stats["dept_files"] += 1
            print(f"  {dept_file.name}: {changed} temizlendi")

    if cleared_manifest or stats["rows"]:
        MANIFEST.write_text(
            json.dumps(manifest, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

    print("[prune-ozti-bad]", {"manifest_removed": cleared_manifest, **stats})


if __name__ == "__main__":
    main()
