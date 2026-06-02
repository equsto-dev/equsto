from __future__ import annotations

import os

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    pisirme = os.path.join(root, "public", "images", "catalog", "atalay", "p7", "atalay-e-aei---360.jpg")
    sogutma = os.path.join(root, "public", "images", "catalog", "ozti", "p200", "ozti-9805-im240x-nhc.jpg")

    W, H = 2048, 1044
    canvas = Image.new("RGB", (W, H), (0, 30, 80))

    draw = ImageDraw.Draw(canvas)
    for y in range(H):
        t = y / float(H - 1)
        r = int(0 + t * (42 - 0))
        g = int(30 + t * (90 - 30))
        b = int(80 + t * (158 - 80))
        draw.line([(0, y), (W, y)], fill=(r, g, b))

    left = Image.open(pisirme).convert("RGBA")
    right = Image.open(sogutma).convert("RGBA")

    pad_x, pad_y = 48, 56
    half_w = W // 2
    box_w = half_w - pad_x * 2
    box_h = H - pad_y * 2

    lp = ImageOps.contain(left, (box_w, box_h), Image.LANCZOS)
    rp = ImageOps.contain(right, (box_w, box_h), Image.LANCZOS)

    lp = ImageEnhance.Brightness(lp).enhance(1.04)
    rp = ImageEnhance.Brightness(rp).enhance(1.04)

    lx = pad_x + (box_w - lp.width) // 2
    ly = pad_y + (box_h - lp.height) // 2
    rx = half_w + pad_x + (box_w - rp.width) // 2
    ry = pad_y + (box_h - rp.height) // 2

    canvas.paste(lp, (lx, ly), lp)
    canvas.paste(rp, (rx, ry), rp)

    divider = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ddraw = ImageDraw.Draw(divider)
    cx = half_w
    ddraw.line([(cx, int(H * 0.12)), (cx, int(H * 0.88))], fill=(255, 255, 255, 42), width=2)
    canvas = Image.alpha_composite(canvas.convert("RGBA"), divider).convert("RGB")

    out_dir = os.path.join(root, "public", "images", "home")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "hero-sogutma-pisirme-combo.jpg")
    canvas.save(out_path, quality=92, subsampling=1, optimize=True)
    print(out_path)


if __name__ == "__main__":
    main()
