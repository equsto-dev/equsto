#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ATALAY 2025 YERLİ.pdf → ürün görselleri + ekipmanlar.json images alanı

  python scripts/extract-atalay-pdf-images.py
  python scripts/extract-atalay-pdf-images.py --dry-run
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
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\ATALAY 2025 YERLİ.pdf")
OUT_DIR = ROOT / "public" / "data" / "images"
EKIPMANLAR = ROOT / "public" / "data" / "ekipmanlar.json"
MAP_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "atalay" / "2025-yerli" / "_pdf-images-map.json"

MIN_IMG_W = 90
MIN_IMG_H = 90
MIN_AREA = 12000


def norm_model(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").upper()
    tr = str.maketrans("İĞÜŞÖÇ", "IGUSOC")
    s = s.translate(tr)
    return re.sub(r"[^A-Z0-9]", "", s)


def slug_model(model: str) -> str:
    s = unicodedata.normalize("NFKC", model or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "atalay-urun"


def transpose_models(table_rows: list[list]) -> list[str]:
    if not table_rows or not table_rows[0]:
        return []
    header = table_rows[0]
    if not header or str(header[0] or "").strip().lower() != "model":
        return []
    models = []
    for c in header[1:]:
        m = str(c or "").strip()
        if m and m.lower() != "model" and re.search(r"[A-Z]", m):
            models.append(m)
    return models


def model_positions(page) -> list[tuple[str, float]]:
    out = []
    for block in page.get_text("blocks"):
        text = block[4].strip()
        for m in re.findall(r"\bE\s+[A-Z]{2,}[\w\s\-/.]+\b", text):
            m = re.sub(r"\s+", " ", m).strip()
            if len(m) < 5 or len(m) > 40:
                continue
            out.append((m, block[0]))
    return out


def product_images(page) -> list[dict]:
    imgs = []
    for info in page.get_image_info(xrefs=True):
        bbox = info["bbox"]
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        area = w * h
        if w < MIN_IMG_W or h < MIN_IMG_H or area < MIN_AREA:
            continue
        cs = info.get("cs-name") or ""
        if cs == "DeviceGray" and area < 25000:
            continue
        imgs.append(
            {
                "xref": info["xref"],
                "bbox": bbox,
                "x": (bbox[0] + bbox[2]) / 2,
                "y": (bbox[1] + bbox[3]) / 2,
                "area": area,
            }
        )
    imgs.sort(key=lambda i: (i["y"], i["x"]))
    return imgs


def save_xref(doc, xref: int, dest: Path) -> bool:
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        dest.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(dest))
        pix = None
        return dest.is_file() and dest.stat().st_size > 500
    except Exception as e:
        print("  [warn] save", dest.name, e)
        return False


def assign_images(models: list[str], imgs: list[dict], pos: list[tuple[str, float]]) -> dict[str, dict]:
    """model -> image meta"""
    out: dict[str, dict] = {}
    if not models or not imgs:
        return out

    if len(imgs) == 1:
        for m in models:
            out[m] = imgs[0]
        return out

  # model x from text positions
    mx = {}
    for m, x in pos:
        mx.setdefault(m, x)
    for m in models:
        if m not in mx:
            mx[m] = None

    if len(imgs) == len(models):
        ims = sorted(imgs, key=lambda i: i["x"])
        mds = sorted(models, key=lambda m: mx.get(m) or 0)
        for m, im in zip(mds, ims):
            out[m] = im
        return out

    # nearest image by x per model
    for m in models:
        x = mx.get(m)
        if x is None:
            out[m] = max(imgs, key=lambda i: i["area"])
            continue
        best = min(imgs, key=lambda i: abs(i["x"] - x))
        out[m] = best
    return out


def page_models_and_images(page) -> tuple[list[str], list[dict], list[tuple[str, float]]]:
    models: list[str] = []
    for tab in page.find_tables().tables:
        try:
            models.extend(transpose_models(tab.extract()))
        except Exception:
            pass
    return models, product_images(page), model_positions(page)


def main() -> None:
    dry = "--dry-run" in sys.argv
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    doc = fitz.open(PDF)
    global_map: dict[str, str] = {}  # norm_model -> images/rel path
    page_log = []

    pages_meta: list[dict] = []
    for pi in range(doc.page_count):
        models, imgs, pos = page_models_and_images(doc[pi])
        pages_meta.append({"page": pi, "models": models, "imgs": imgs, "pos": pos})

    for i, meta in enumerate(pages_meta):
        page_models = meta["models"]
        if not page_models:
            continue

        imgs = meta["imgs"]
        pos = meta["pos"]
        # Tablo bir sayfada, fotoğraflar çoğu zaman sonraki/önceki sayfada
        if not imgs:
            for j in (i + 1, i - 1, i + 2):
                if 0 <= j < len(pages_meta) and pages_meta[j]["imgs"]:
                    imgs = pages_meta[j]["imgs"]
                    if not pos:
                        pos = pages_meta[j]["pos"]
                    break
        if not imgs:
            continue

        pairs = assign_images(page_models, imgs, pos)

        for model, im in pairs.items():
            rel = f"images/atalay-{slug_model(model)}_1.jpg"
            nm = norm_model(model)
            if not nm:
                continue
            if not dry:
                dest = OUT_DIR / rel.replace("images/", "")
                if save_xref(doc, im["xref"], dest):
                    global_map[nm] = rel.replace("\\", "/")
            else:
                global_map[nm] = rel

        if pairs:
            page_log.append(
                {
                    "page": meta["page"] + 1,
                    "models": len(pairs),
                    "images": len(imgs),
                }
            )

    doc.close()

    MAP_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(MAP_JSON, "w", encoding="utf-8") as f:
        json.dump({"models": global_map, "pages": page_log}, f, ensure_ascii=False, indent=2)

    print(f"PDF görsel eşlemesi: {len(global_map)} model")
    if dry:
        print("(dry-run, dosya yazılmadı)")
        return

    if not EKIPMANLAR.is_file():
        print("ekipmanlar.json yok")
        return

    catalog = json.loads(EKIPMANLAR.read_text(encoding="utf-8"))
    replaced = 0
    no_pdf = 0
    for p in catalog:
        if "atalay" not in str(p.get("brand") or "").lower():
            continue
        key = norm_model(p.get("model") or "")
        if not key:
            m = re.search(r"\bE\s*[A-Z][\w\s\-/.]+", p.get("name") or "")
            if m:
                key = norm_model(m.group(0))
        if not key:
            m2 = re.search(r"\b[A-Z]{2,}[\s\-]?\d{2,}[\w/.-]*", p.get("name") or "")
            if m2:
                key = norm_model(m2.group(0))
        rel = global_map.get(key)
        if not rel:
            no_pdf += 1
            continue
        # Tüm Atalay ürünlerinde görseli yalnızca PDF kaynağıyla değiştir
        p["images"] = [rel]
        replaced += 1

    EKIPMANLAR.write_text(json.dumps(catalog), encoding="utf-8")
    print(f"ekipmanlar.json: {replaced} Atalay ürünü PDF görseliyle güncellendi")
    print(f"PDF eşleşmeyen Atalay: {no_pdf}")
    print("Görseller:", OUT_DIR)


if __name__ == "__main__":
    main()
