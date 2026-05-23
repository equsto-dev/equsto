# -*- coding: utf-8 -*-
"""ATALAY 2025 PDF — Döner Makineleri sayfalarından ürün görselleri."""
import json
import re
from pathlib import Path

import fitz  # PyMuPDF

PDF = Path(r"c:\Users\User\Downloads\ATALAY 2025 YERLİ.pdf")
OUT = Path(__file__).resolve().parent.parent / "public" / "images" / "catalog" / "atalay" / "doner"
CATALOG = Path(__file__).resolve().parent / "data" / "atalay-doner-ocak.json"

# PDF sayfa 1..N → 0-indexed; katalog 129-144 (1-based)
PAGE_MODELS = {
    129: ["ADG-3S", "ADG-4S", "ADG-5S", "ADG-6S"],
    130: ["ADE-3S", "ADE-4S", "ADE-5S"],
    131: ["ADG-3U", "ADG-4U", "ADG-5U"],
    132: ["ADE-3U", "ADE-4U", "ADE-5U"],
    133: ["ADG-3A", "ADG-4A", "ADG-5A", "ADG-6A"],
    134: ["ADE-3A", "ADE-4A", "ADE-5A"],
    135: ["ADGC-3S", "ADGC-4S", "ADGC-5S"],
    136: ["ADGC-3U", "ADGC-4U", "ADGC-5U"],
    137: ["ADGC-3A", "ADGC-4A", "ADGC-5A"],
    138: ["ADG-4+4A", "ADG-5+5A"],
    139: ["ADG-8S", "ADG-10S", "ADG-12S"],
    140: ["ADG-8A", "ADG-10A", "ADG-12A"],
    141: ["ADG-5D", "ADG-6D"],
    142: ["ADG-8D", "ADG-10D", "ADG-12D"],
    143: ["ADG-5DS", "ADG-6DS"],
    144: ["ADG-8DS", "ADG-10DS", "ADG-12DS"],
}


def slugify(model: str) -> str:
    return "atalay-" + model.lower().replace("+", "-plus-")


def image_candidates(page: fitz.Page):
    blocks = []
    for img in page.get_images(full=True):
        xref = img[0]
        try:
            pix = fitz.Pixmap(page.parent, xref)
            if pix.n - pix.alpha > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            w, h = pix.width, pix.height
            if w < 120 or h < 120:
                continue
            blocks.append((w * h, w, h, pix))
        except Exception:
            continue
    blocks.sort(key=lambda x: -x[0])
    return blocks


def render_photo_strip(page: fitz.Page, clip):
    mat = fitz.Matrix(2, 2)
    pix = page.get_pixmap(matrix=mat, clip=clip, alpha=False)
    return pix


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    manifest = {}
    log = []

    for page_no, models in PAGE_MODELS.items():
        page = doc[page_no - 1]
        rect = page.rect
        # Üst bant: katalog sayfalarında ürün fotoğrafları genelde üst %45
        clip = fitz.Rect(rect.x0, rect.y0, rect.x1, rect.y0 + rect.height * 0.48)
        imgs = image_candidates(page)

        if len(imgs) >= len(models):
            for i, model in enumerate(models):
                _, w, h, pix = imgs[i]
                slug = slugify(model)
                out = OUT / f"{slug}.jpg"
                pix.save(str(out))
                manifest[model] = str(out.relative_to(OUT.parent.parent.parent)).replace("\\", "/")
                log.append(f"embed {page_no} {model} -> {out.name} ({w}x{h})")
        else:
            # Sayfa üst şeridini yatay dilimlere böl
            n = len(models)
            strip = render_photo_strip(page, clip)
            sw = strip.width // n
            for i, model in enumerate(models):
                slug = slugify(model)
                out = OUT / f"{slug}.jpg"
                x0, x1 = i * sw, (i + 1) * sw if i < n - 1 else strip.width
                sub = fitz.Pixmap(strip, x0, 0, x1 - x0, strip.height)
                sub.save(str(out))
                manifest[model] = f"/images/catalog/atalay/doner/{out.name}"
                log.append(f"crop {page_no} {model} -> {out.name}")

    # İkinci sayfa bazı modellerde sadece metin — 138+ tek görsel
    doc.close()

    meta_path = OUT / "_extract-manifest.json"
    meta_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[extract] {len(manifest)} görsel -> {OUT}")
    for line in log:
        print(line)

    # catalog json güncelle
    if CATALOG.exists():
        cat = json.loads(CATALOG.read_text(encoding="utf-8"))
        for p in cat.get("products", []):
            m = p.get("modelCode")
            if m in manifest:
                p["imagePath"] = manifest[m]
        CATALOG.write_text(json.dumps(cat, indent=2, ensure_ascii=False), encoding="utf-8")
        public = Path(__file__).resolve().parent.parent / "public" / "data" / "atalay-doner-ocak.json"
        public.write_text(json.dumps(cat, indent=2, ensure_ascii=False), encoding="utf-8")


if __name__ == "__main__":
    main()
