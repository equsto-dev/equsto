#!/usr/bin/env python3
"""Gömülü Kariyer filigran şeridi (alt-orta logo) — alt bandı kırpar."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "data" / "images"


def is_bg(px: tuple[int, int, int]) -> bool:
    r, g, b = px
    return r > 240 and g > 240 and b > 240


def find_watermark_top(im: Image.Image, band_start_ratio: float = 0.55) -> int | None:
    w, h = im.size
    y0 = int(h * band_start_ratio)
    step = max(2, w // 120)
    for y in range(h - 4, y0, -2):
        dark = 0
        total = 0
        for x in range(0, w, step):
            total += 1
            r, g, b = im.getpixel((x, y))
            if not is_bg((r, g, b)) and (r + g + b) < 620:
                dark += 1
        if total and dark / total > 0.12:
            return y
    return None


def strip_band(path: Path, fallback_ratio: float = 0.78) -> tuple[Image.Image | None, str]:
    try:
        im = Image.open(path).convert("RGB")
    except OSError as e:
        return None, str(e)
    w, h = im.size
    cut = find_watermark_top(im)
    if cut is None:
        cut = int(h * fallback_ratio)
    cut = max(int(h * 0.55), min(cut - 4, h - 20))
    if cut < h * 0.5:
        return None, "cut-too-high"
    return im.crop((0, 0, w, cut)), f"ok-cut-y={cut}/{h}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", required=True)
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    src = IMG_DIR / args.file
    if not src.is_file():
        print("missing", src)
        sys.exit(1)
    out, reason = strip_band(src)
    if out is None:
        print("FAIL", reason)
        sys.exit(1)
    if args.dry_run and not args.apply:
        print(f"DRY {args.file}: {src.stat().st_size} -> {out.size[0]}x{out.size[1]} ({reason})")
        return
    if args.apply:
        bak = src.with_suffix(src.suffix + ".wm-bak")
        if not bak.is_file():
            bak.write_bytes(src.read_bytes())
        out.save(src, quality=92)
        print(f"OK {args.file} -> {out.size[0]}x{out.size[1]} ({reason})")


if __name__ == "__main__":
    main()
