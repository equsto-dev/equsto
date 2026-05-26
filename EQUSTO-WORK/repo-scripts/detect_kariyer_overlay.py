#!/usr/bin/env python3
"""Turuncu Kariyer Mutfak çerçevesi / İNDİRİMLİ banner gömülü görselleri tespit eder."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "public" / "data" / "images"
DEFAULT_OUT = ROOT / "public" / "data" / "kariyer-overlay-images.json"


def is_orange(px: tuple[int, int, int]) -> bool:
    r, g, b = px
    return r > 200 and 90 < g < 180 and b < 120 and r > g + 30


def orange_frame_score(path: Path) -> float | None:
    try:
        im = Image.open(path).convert("RGB")
    except OSError:
        return None
    w, h = im.size
    if w < 80 or h < 80:
        return 0.0
    pts: list[tuple[int, int]] = []
    step_x = max(1, (w - 16) // 24)
    step_y = max(1, (h - 16) // 24)
    for x in range(8, w - 8, step_x):
        pts.append((x, 4))
        pts.append((x, h - 5))
    for y in range(8, h - 8, step_y):
        pts.append((4, y))
        pts.append((w - 5, y))
    orange = sum(1 for p in pts if is_orange(im.getpixel(p)))
    return orange / max(len(pts), 1)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.12, help="Min orange border ratio")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--file", type=str, default="", help="Tek dosya adı (images/ altında)")
    args = ap.parse_args()

    if args.file.strip():
        p = IMG_DIR / args.file.strip()
        score = orange_frame_score(p)
        print(json.dumps({"file": p.name, "score": score, "overlay": score is not None and score >= args.threshold}))
        return

    bad: list[dict] = []
    scanned = 0
    for path in sorted(IMG_DIR.iterdir()):
        if path.suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp"}:
            continue
        scanned += 1
        score = orange_frame_score(path)
        if score is None:
            continue
        if score >= args.threshold:
            bad.append({"file": path.name, "score": round(score, 4)})
        if args.limit and len(bad) >= args.limit:
            break
        if scanned % 4000 == 0:
            print(f"… {scanned} scanned, {len(bad)} flagged", flush=True)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(
        json.dumps({"scanned": scanned, "bad": bad, "threshold": args.threshold}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Scanned {scanned} -> {len(bad)} overlay suspects -> {args.out}")


if __name__ == "__main__":
    main()
