from PIL import Image
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "public" / "images"
pad = 14
for name in ("equsto-logo.png", "equsto-logo-white.png"):
    p = root / name
    if not p.exists():
        continue
    im = Image.open(p).convert("RGBA")
    w, h = im.size
    out = Image.new("RGBA", (w + pad, h), (0, 0, 0, 0))
    out.paste(im, (0, 0))
    out.save(p)
    print(name, w, "->", w + pad)
