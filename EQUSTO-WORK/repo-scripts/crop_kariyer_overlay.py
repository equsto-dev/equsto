#!/usr/bin/env python3
"""Kariyer turuncu çerçeve + mavi şerit/banner gömülü görselleri kırpar."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "data" / "images"
REPORT = ROOT / "public" / "data" / "kariyer-overlay-images.json"


def is_orange(px: tuple[int, int, int]) -> bool:
    r, g, b = px
    return r > 200 and 90 < g < 180 and b < 120 and r > g + 30


def is_kariyer_blue(px: tuple[int, int, int]) -> bool:
    r, g, b = px
    if b > 165 and g > 95 and r < 160 and b > r + 20:
        return True
    if b > 200 and g > 175 and r > 120 and b >= g - 5:
        return True
    return False


def is_frame(px: tuple[int, int, int]) -> bool:
    return is_orange(px) or is_kariyer_blue(px)


_LINE_THRESH = 0.55


def _line_frame_ratio(im: Image.Image, y: int | None, x: int | None, w: int, h: int) -> float:
    step = max(1, (w if y is not None else h) // 80)
    pts = 0
    frame = 0
    if y is not None:
        for x0 in range(0, w, step):
            pts += 1
            if is_frame(im.getpixel((x0, y))):
                frame += 1
    else:
        for y0 in range(0, h, step):
            pts += 1
            if is_frame(im.getpixel((x, y0))):
                frame += 1
    return frame / max(pts, 1)


def is_bg(px: tuple[int, int, int]) -> bool:
    if is_frame(px):
        return True
    r, g, b = px
    return r > 242 and g > 242 and b > 242


def crop_content_bbox(path: Path, margin: int = 4) -> tuple[Image.Image | None, str]:
    try:
        im = Image.open(path).convert("RGB")
    except OSError as e:
        return None, str(e)
    w, h = im.size
    if w < 100 or h < 100:
        return None, "too-small"
    step = max(2, min(w, h) // 200)
    xs: list[int] = []
    ys: list[int] = []
    for y in range(0, h, step):
        for x in range(0, w, step):
            if not is_bg(im.getpixel((x, y))):
                xs.append(x)
                ys.append(y)
    if not xs:
        return None, "no-content"
    left, right = max(0, min(xs) - margin), min(w - 1, max(xs) + margin)
    top, bottom = max(0, min(ys) - margin), min(h - 1, max(ys) + margin)
    cw, ch = right - left + 1, bottom - top + 1
    if cw < w * 0.2 or ch < h * 0.2:
        return None, "crop-too-small"
    if cw > w * 0.98 and ch > h * 0.98:
        return None, "no-crop"
    return im.crop((left, top, right + 1, bottom + 1)), "ok-bbox"


def crop_overlay(path: Path, margin: int = 4) -> tuple[Image.Image | None, str]:
    try:
        im = Image.open(path).convert("RGB")
    except OSError as e:
        return None, str(e)
    w, h = im.size
    if w < 100 or h < 100:
        return None, "too-small"

    bbox, reason = crop_content_bbox(path, margin)
    if bbox is not None and reason == "ok-bbox":
        return bbox, reason

    thresh = _LINE_THRESH
    top = 0
    for y in range(h):
        if _line_frame_ratio(im, y, None, w, h) < thresh:
            top = y
            break
    bottom = h - 1
    for y in range(h - 1, -1, -1):
        if _line_frame_ratio(im, y, None, w, h) < thresh:
            bottom = y
            break
    left = 0
    for x in range(w):
        if _line_frame_ratio(im, None, x, w, h) < thresh:
            left = x
            break
    right = w - 1
    for x in range(w - 1, -1, -1):
        if _line_frame_ratio(im, None, x, w, h) < thresh:
            right = x
            break

    pad = max(4, int(min(w, h) * 0.008))
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(w - 1, right + pad)
    bottom = min(h - 1, bottom + pad)

    cw, ch = right - left + 1, bottom - top + 1
    if cw < w * 0.25 or ch < h * 0.25:
        return None, "crop-too-small"
    if cw > w * 0.97 and ch > h * 0.97:
        return None, "no-crop"

    out = im.crop((left, top, right + 1, bottom + 1))
    if margin and min(out.size) > margin * 2:
        out = out.crop((margin, margin, out.size[0] - margin, out.size[1] - margin))
    return out, "ok"


def _log(msg: str) -> None:
    sys.stdout.buffer.write((msg + "\n").encode("utf-8", errors="replace"))


def main() -> None:
    import sys
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--file", type=str, default="")
    ap.add_argument("--from-report", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--aggressive", action="store_true", help="Daha geniş turuncu şerit kırpma")
    args = ap.parse_args()

    global _LINE_THRESH
    if args.aggressive:
        _LINE_THRESH = 0.42

    if args.file:
        files = [args.file]
    elif args.from_report and REPORT.is_file():
        data = json.loads(REPORT.read_text(encoding="utf-8"))
        files = [x["file"] for x in data.get("bad", [])]
    else:
        print("Belirtin: --file NAME veya --from-report (önce detect_kariyer_overlay.py)")
        return

    if args.limit:
        files = files[: args.limit]

    ok, skip, fail = 0, 0, 0
    for name in files:
        src = IMG_DIR / name
        if not src.is_file():
            skip += 1
            continue
        cropped, reason = crop_overlay(src)
        if cropped is None:
            fail += 1
            _log(f"SKIP {name}: {reason}")
            continue
        if args.dry_run and not args.apply:
            _log(f"DRY {name}: {src.stat().st_size} -> ~{cropped.size[0]}x{cropped.size[1]}")
            ok += 1
            continue
        if args.apply:
            backup = src.with_suffix(src.suffix + ".kariyer-bak")
            if not backup.is_file():
                backup.write_bytes(src.read_bytes())
            cropped.save(src, quality=92)
            _log(f"OK {name} -> {cropped.size[0]}x{cropped.size[1]}")
            ok += 1

    _log(f"done ok={ok} skip={skip} fail={fail}")


if __name__ == "__main__":
    main()
