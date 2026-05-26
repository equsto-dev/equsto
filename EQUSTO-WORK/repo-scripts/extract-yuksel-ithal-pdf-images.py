#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YÜKSEL İTHAL 2025.pdf → sayfa/ürün görselleri

  python scripts/extract-yuksel-ithal-pdf-images.py
  python scripts/extract-yuksel-ithal-pdf-images.py --dry-run
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import fitz
except ImportError:
    print("pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL İTHAL - 2025.pdf")
OUT_DIR = ROOT / "public" / "data" / "images"
EKIPMANLAR = ROOT / "public" / "data" / "ekipmanlar.json"
CATALOG_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-ithal" / "tum-urunler.json"
MAP_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-ithal" / "_pdf-images-map.json"

MIN_AREA = 8000


def norm_sku(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", unicodedata.normalize("NFKC", s or "").upper())


def slug_ref(ref: str) -> str:
    s = unicodedata.normalize("NFKC", ref or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:60] or "ithal"


def product_images(page) -> list[dict]:
    imgs = []
    for info in page.get_image_info(xrefs=True):
        bbox = info["bbox"]
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        if w * h < MIN_AREA:
            continue
        imgs.append({"xref": info["xref"], "area": w * h})
    imgs.sort(key=lambda x: -x["area"])
    return imgs


def save_xref(doc, xref: int, dest: Path) -> bool:
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(dest))
        return dest.is_file() and dest.stat().st_size > 800
    except Exception:
        return False


def main() -> None:
    dry = "--dry-run" in sys.argv
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    by_page: dict[int, list[str]] = {}
    if CATALOG_JSON.is_file():
        for row in json.loads(CATALOG_JSON.read_text(encoding="utf-8")):
            pg = int(row.get("page") or 0)
            ref = str(row.get("sku") or row.get("model") or "")
            if pg and ref:
                by_page.setdefault(pg, []).append(ref)

    doc = fitz.open(PDF)
    global_map: dict[str, str] = {}
    page_thumbs: dict[int, str] = {}

    for pi in range(doc.page_count):
        page = doc[pi]
        pg_no = pi + 1
        imgs = product_images(page)
        rel_page = f"images/yuksel-ithal-p{pg_no}.jpg"
        dest = OUT_DIR / rel_page.replace("images/", "")
        saved = False
        if imgs and not dry:
            saved = save_xref(doc, imgs[0]["xref"], dest)
        if not saved and not dry:
            try:
                pix = page.get_pixmap(matrix=fitz.Matrix(1.5, 1.5))
                dest.parent.mkdir(parents=True, exist_ok=True)
                pix.save(str(dest))
                saved = dest.is_file() and dest.stat().st_size > 800
            except Exception:
                saved = False
        if saved and not dry:
            page_thumbs[pg_no] = rel_page.replace("\\", "/")
        elif dry and (imgs or True):
            page_thumbs[pg_no] = rel_page
        if not imgs and not saved:
            continue
        best = imgs[0] if imgs else None
        refs = by_page.get(pg_no, [])
        if refs:
            for ref in refs:
                rel = f"images/yuksel-ithal-{slug_ref(ref)}.jpg"
                nm = norm_sku(ref)
                if not dry:
                    dest = OUT_DIR / rel.replace("images/", "")
                    ok = best and save_xref(doc, best["xref"], dest)
                    if not ok and page_thumbs.get(pg_no):
                        global_map[nm] = page_thumbs[pg_no]
                    elif ok:
                        global_map[nm] = rel.replace("\\", "/")
                else:
                    global_map[nm] = rel

    doc.close()

    MAP_JSON.parent.mkdir(parents=True, exist_ok=True)
    MAP_JSON.write_text(
        json.dumps({"models": global_map, "pages": page_thumbs}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Gorsel esleme: {len(global_map)} urun, {len(page_thumbs)} sayfa")
    if dry:
        return

    if not EKIPMANLAR.is_file():
        return
    catalog = json.loads(EKIPMANLAR.read_text(encoding="utf-8"))
    replaced = 0
    for p in catalog:
        kaynak = str(p.get("kaynak_fiyat_listesi") or p.get("kaynak") or "")
        if "yuksel-2025-ithal" not in kaynak:
            continue
        key = norm_sku(p.get("sku") or p.model)
        rel = global_map.get(key)
        if not rel:
            pg = p.get("page")
            if pg is None:
                m = re.search(r"Sayfa:\s*(\d+)", str(p.get("specs") or ""))
                pg = int(m.group(1)) if m else None
            if pg is not None:
                rel = page_thumbs.get(int(pg)) or page_thumbs.get(str(pg))
        if rel:
            p["images"] = [rel]
            replaced += 1
    EKIPMANLAR.write_text(json.dumps(catalog), encoding="utf-8")
    print(f"ekipmanlar.json: {replaced} Yüksel ithal gorsel")


if __name__ == "__main__":
    main()
