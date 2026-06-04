#!/usr/bin/env python3
"""Cafemarkt pop-cat (cm-*) görsellerindeki açık mavi zemin → beyaz."""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
POP = ROOT / "public" / "images" / "home" / "pop-cats"


def is_cafemarkt_blue(r: int, g: int, b: int) -> bool:
    if r >= 195 and g >= 215 and b >= 225 and b >= g >= r and (g - r) <= 48:
        return True
    if r >= 208 and g >= 228 and b >= 238 and b >= g >= r:
        return True
    return False


def whiten(path: Path) -> None:
    im = Image.open(path)
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 16 or is_cafemarkt_blue(r, g, b):
                px[x, y] = (255, 255, 255, 255)

    out = rgba
    ext = path.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        out = rgba.convert("RGB")
        out.save(path, quality=92, optimize=True)
    elif ext == ".webp":
        out.save(path, quality=90, method=6)
    else:
        rgba.save(path, optimize=True)
    print("whiten", path.name)


def main() -> int:
    files = sorted(POP.glob("cm-*"))
    if not files:
        print("no cm-* files in", POP, file=sys.stderr)
        return 1
    for f in files:
        whiten(f)
    print("done", len(files), "files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
