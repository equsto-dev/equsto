"""Crop WhatsApp FAB cat from screenshot (asset recovery)."""
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
assets = Path(
    r"C:\Users\User\.cursor\projects\c-D-Disk-EQUSTO-mutbex-scraping\assets"
)
candidates = sorted(assets.glob("*image-c42ed51e*.png")) + sorted(
    assets.glob("*image-fd4f7973*.png")
)
out = root / "public" / "equsto-bize-ulasin-isimlik.png"

best = None
best_score = -1

for src in candidates:
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    side = max(72, int(min(w, h) * 0.09))
    # try a grid near bottom (page area, not IDE strip on far right)
    for x_ratio in (0.38, 0.44, 0.50, 0.56, 0.62, 0.68):
        for y_ratio in (0.78, 0.82, 0.86, 0.90):
            left = int(w * x_ratio) - side // 2
            top = int(h * y_ratio) - side // 2
            left = max(0, min(left, w - side))
            top = max(0, min(top, h - side))
            crop = im.crop((left, top, left + side, top + side))
            px = crop.load()
            green = 0
            dark = 0
            for y in range(0, side, 3):
                for x in range(0, side, 3):
                    r, g, b, a = px[x, y]
                    if a < 32:
                        continue
                    if g > 140 and g > r + 25 and g > b + 25:
                        green += 1
                    if r < 90 and g < 90 and b < 90:
                        dark += 1
            # cat FAB: green border + dark/white fur, not flat gray button text
            score = green * 3 + min(dark, 40)
            if score > best_score:
                best_score = score
                best = (src.name, left, top, side, crop)

if not best:
    raise SystemExit("no candidate crop")

_, left, top, side, crop = best
crop = crop.resize((124, 124), Image.Resampling.LANCZOS)
crop.save(out, format="PNG", optimize=True)
print(f"wrote {out} from {best[0]} box {left},{top}+{side} score={best_score}")
