# -*- coding: utf-8 -*-
"""PDF sayfalarından Atalay ürün görselleri (katalog satırlarına göre)."""
from __future__ import annotations

import json
import os
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
CATALOG = Path(__file__).resolve().parent / "data" / "atalay-pdf-catalog.json"
RAW = Path(__file__).resolve().parent / "data" / "atalay-pdf-catalog-raw.json"
OUT_BASE = ROOT / "public" / "images" / "catalog" / "atalay"

PDF = Path(
    os.environ.get(
        "ATALAY_PDF",
        r"c:\Users\User\Downloads\ATALAY 2025 YERLİ.pdf",
    )
)


def slug_file(model: str) -> str:
    s = "atalay-" + model.lower().replace(" ", "-").replace("+", "-plus-")
    return "".join(c if c.isalnum() or c in "-+" else "" for c in s)


def main():
    src = CATALOG if CATALOG.exists() else RAW
    if not src.exists():
        raise SystemExit(f"Katalog yok: {src} (once npm run catalog:atalay:build)")

    data = json.loads(src.read_text(encoding="utf-8"))
    products = data.get("products") or []
    by_page: dict[int, list] = defaultdict(list)
    for p in products:
        page = int(p.get("page") or p.get("pdf_page") or 0)
        model = p.get("model") or p.get("modelCode")
        if page and model:
            by_page[page].append(p)

    doc = fitz.open(PDF)
    manifest = {}
    log = []

    for page_no, items in sorted(by_page.items()):
        if page_no < 1 or page_no > doc.page_count:
            continue
        page = doc[page_no - 1]
        rect = page.rect
        top = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + rect.height * 0.48)
        mat = fitz.Matrix(2, 2)
        n = max(len(items), 1)
        slice_w = top.width / n
        out_dir = OUT_BASE / f"p{page_no}"
        out_dir.mkdir(parents=True, exist_ok=True)

        for i, p in enumerate(items):
            model = p.get("model") or p.get("modelCode")
            fname = slug_file(model) + ".jpg"
            out = out_dir / fname
            x0 = top.x0 + i * slice_w
            x1 = top.x0 + (i + 1) * slice_w if i < n - 1 else top.x1
            sub_clip = fitz.Rect(x0, top.y0, x1, top.y1)
            pix = page.get_pixmap(matrix=mat, clip=sub_clip, alpha=False)
            pix.save(str(out))
            rel = f"/images/catalog/atalay/p{page_no}/{fname}"
            manifest[model] = rel
            p["images"] = [rel.lstrip("/")]
            log.append(f"p{page_no} {model} -> {fname}")

    doc.close()

    if CATALOG.exists():
        data["imageManifest"] = manifest
        CATALOG.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    # dept vitrin JSON görsellerini güncelle
    for dept_file in (ROOT / "public/data/dept").glob("*.json"):
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        changed = 0
        for row in rows:
            if "atalay" not in str(row.get("brand", "")).lower():
                continue
            model = row.get("model") or row.get("sku")
            if model in manifest:
                row["images"] = [manifest[model].lstrip("/")]
                changed += 1
        if changed:
            dept_file.write_text(json.dumps(rows), encoding="utf-8")

    meta = OUT_BASE / "_extract-manifest.json"
    meta.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[atalay-images] {len(manifest)} gorsel, {len(by_page)} sayfa")


if __name__ == "__main__":
    main()
