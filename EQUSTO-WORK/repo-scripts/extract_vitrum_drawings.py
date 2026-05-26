"""Vitrum Bars Catalogue — per-product PNG extractor (hero + technical).

Hero: largest embedded raster whose bottom lies above the dimension row (~60%
page height), padded — fixes top/bottom clipping from fixed fractions.

Tech: if the page has raster(s) in the lower band (y >= ~51% height), use their
bounding-box union (multi-panel technical sheets). Otherwise a wide bottom
clip captures vector orthographic drawings.

Usage (repo root):
  python scripts/extract_vitrum_drawings.py
  python scripts/extract_vitrum_drawings.py --pdf "C:\\path\\Vitrum+Bars+Catalogue+2025+-+ENG.pdf"
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import fitz  # PyMuPDF

DEFAULT_PDF = r"c:\D Disk\FİYAT LİSTELERİ\Vitrum+Bars+Catalogue+2025+-+ENG.pdf"
ROOT = Path(__file__).resolve().parent.parent / "public" / "data"
DEFAULT_OUT_DIR = ROOT / "vitrum-drawings"
DEFAULT_JSON = ROOT / "vitrum-bars-catalogue.json"

DPI = 200
ZOOM = DPI / 72.0

# Fallback clips (normalized 0–1) when a page has no usable embedded images.
FALLBACK_HERO = (0.02, 0.03, 0.72, 0.60)
FALLBACK_TECH = (0.03, 0.53, 0.995, 0.98)


def _collect_image_rects(page: fitz.Page) -> list[fitz.Rect]:
    rects: list[fitz.Rect] = []
    for img in page.get_images(full=True):
        xref = img[0]
        rects.extend(page.get_image_rects(xref))
    return rects


def _pad_rect(page: fitz.Page, r: fitz.Rect, fx: float, fy: float) -> fitz.Rect:
    pr = page.rect
    pad_x = pr.width * fx
    pad_y = pr.height * fy
    return fitz.Rect(
        max(pr.x0, r.x0 - pad_x),
        max(pr.y0, r.y0 - pad_y),
        min(pr.x1, r.x1 + pad_x),
        min(pr.y1, r.y1 + pad_y),
    )


def _union_rects(rects: list[fitz.Rect]) -> fitz.Rect | None:
    if not rects:
        return None
    x0 = min(r.x0 for r in rects)
    y0 = min(r.y0 for r in rects)
    x1 = max(r.x1 for r in rects)
    y1 = max(r.y1 for r in rects)
    return fitz.Rect(x0, y0, x1, y1)


def hero_tech_clips(page: fitz.Page) -> tuple[fitz.Rect, fitz.Rect]:
    """Return (hero_clip, tech_clip) in PDF user space."""
    pr = page.rect
    rects = _collect_image_rects(page)
    h = pr.height

    # Upper band: main 3D render (exclude lower technical rasters)
    upper_cut = 0.60 * h
    upper = [r for r in rects if r.y1 <= upper_cut + 1.0]
    if upper:
        hero_raw = max(upper, key=lambda r: r.get_area())
        hero = _pad_rect(page, hero_raw, 0.01, 0.012)
    else:
        # Tall renders (some tap pages) extend below 60% — pick largest raster
        # that starts in the header/hero vertical band.
        tall = [r for r in rects if r.y0 < 0.35 * h]
        if tall:
            hero_raw = max(tall, key=lambda r: r.get_area())
            hero = _pad_rect(page, hero_raw, 0.01, 0.012)
        else:
            fx0, fy0, fx1, fy1 = FALLBACK_HERO
            hero = fitz.Rect(
                pr.x0 + pr.width * fx0,
                pr.y0 + pr.height * fy0,
                pr.x0 + pr.width * fx1,
                pr.y0 + pr.height * fy1,
            )

    lower_cut = 0.51 * h
    lower = [r for r in rects if r.y0 >= lower_cut - 1.0]
    if lower:
        u = _union_rects(lower)
        assert u is not None
        tech = _pad_rect(page, u, 0.012, 0.015)
    else:
        fx0, fy0, fx1, fy1 = FALLBACK_TECH
        tech = fitz.Rect(
            pr.x0 + pr.width * fx0,
            pr.y0 + pr.height * fy0,
            pr.x0 + pr.width * fx1,
            pr.y0 + pr.height * fy1,
        )

    # Safety: non-empty, ordered rects
    hero = hero & pr
    tech = tech & pr
    if hero.get_area() < 16:
        fx0, fy0, fx1, fy1 = FALLBACK_HERO
        hero = fitz.Rect(
            pr.x0 + pr.width * fx0,
            pr.y0 + pr.height * fy0,
            pr.x0 + pr.width * fx1,
            pr.y0 + pr.height * fy1,
        ) & pr
    if tech.get_area() < 16:
        fx0, fy0, fx1, fy1 = FALLBACK_TECH
        tech = fitz.Rect(
            pr.x0 + pr.width * fx0,
            pr.y0 + pr.height * fy0,
            pr.x0 + pr.width * fx1,
            pr.y0 + pr.height * fy1,
        ) & pr

    return hero, tech


def render_clip(page: fitz.Page, clip: fitz.Rect, matrix: fitz.Matrix) -> fitz.Pixmap:
    return page.get_pixmap(matrix=matrix, clip=clip, alpha=False)


def main() -> int:
    ap = argparse.ArgumentParser(description="Vitrum catalogue hero/tech PNG extractor")
    ap.add_argument("--pdf", default=DEFAULT_PDF, help="Source PDF path")
    ap.add_argument("--out-dir", default=str(DEFAULT_OUT_DIR), help="PNG output directory")
    ap.add_argument("--json", default=str(DEFAULT_JSON), help="Catalogue JSON to update")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    out_dir = Path(args.out_dir)
    json_path = Path(args.json)

    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2
    if not json_path.exists():
        print(f"JSON not found: {json_path}", file=sys.stderr)
        return 2

    out_dir.mkdir(parents=True, exist_ok=True)
    for fn in out_dir.iterdir():
        if fn.suffix.lower() != ".png":
            continue
        if fn.name.startswith("hero_p") or fn.name.startswith("tech_p"):
            fn.unlink()

    with open(json_path, encoding="utf-8") as f:
        cat = json.load(f)

    doc = fitz.open(str(pdf_path))
    matrix = fitz.Matrix(ZOOM, ZOOM)
    saved_hero: dict[int, str] = {}
    saved_tech: dict[int, str] = {}

    for prod in cat["products"]:
        page_num = int(prod["page"])
        page = doc[page_num - 1]
        hero_clip, tech_clip = hero_tech_clips(page)

        hero_pix = render_clip(page, hero_clip, matrix)
        hero_name = f"hero_p{page_num:02d}.png"
        hero_pix.save(str(out_dir / hero_name))
        saved_hero[page_num] = f"vitrum-drawings/{hero_name}"

        tech_pix = render_clip(page, tech_clip, matrix)
        tech_name = f"tech_p{page_num:02d}.png"
        tech_pix.save(str(out_dir / tech_name))
        saved_tech[page_num] = f"vitrum-drawings/{tech_name}"

        print(
            f"  p{page_num:>2}  hero {hero_pix.width:>4}x{hero_pix.height:<4}"
            f"  tech {tech_pix.width:>4}x{tech_pix.height:<4}"
        )

    doc.close()

    for prod in cat["products"]:
        page = int(prod["page"])
        if page in saved_hero:
            prod["image"] = saved_hero[page]
        if page in saved_tech:
            prod["drawing"] = saved_tech[page]
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(cat, f, ensure_ascii=False, indent=2)

    print(f"\nDone. {len(saved_hero)} hero + {len(saved_tech)} tech PNGs.")
    print(f"  PDF : {pdf_path}")
    print(f"  Out : {out_dir}")
    print(f"  JSON: {json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
