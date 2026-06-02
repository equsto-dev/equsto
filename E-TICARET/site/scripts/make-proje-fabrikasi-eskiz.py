from __future__ import annotations

import glob
import os
import shutil

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def resolve_sketch_path() -> str | None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [
        os.path.join(root, "scripts", "data", "pfos-eskiz-source.png"),
        os.path.join(root, "scripts", "data", "pfos-eskiz-source.jpg"),
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    pattern = (
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets"
        r"\*0162b92c*"
    )
    found = sorted(glob.glob(pattern), key=os.path.getmtime)
    if found:
        return found[-1]
    return None


def beautify_raster(src: Image.Image) -> Image.Image:
    """El çizimi eskizi vitrin için yumuşatılmış, kontrastlı hale getirir."""
    img = src.convert("RGB")
    w, h = img.size
    crop = img.crop((int(w * 0.01), int(h * 0.01), int(w * 0.99), int(h * 0.99)))
    target_w, target_h = 1200, 800
    contained = ImageOps.contain(crop, (target_w, target_h), method=Image.LANCZOS)
    framed = Image.new("RGB", (target_w, target_h), (10, 22, 40))
    framed.paste(contained, ((target_w - contained.width) // 2, (target_h - contained.height) // 2))
    framed = ImageEnhance.Contrast(framed).enhance(1.08)
    framed = ImageEnhance.Brightness(framed).enhance(1.03)
    framed = framed.filter(ImageFilter.UnsharpMask(radius=1.2, percent=90, threshold=3))
    return framed


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)

    svg_src = os.path.join(out_dir, "proje-fabrikasi-eskiz.svg")
    svg_out = svg_src
    if os.path.isfile(svg_src):
        print("svg:", svg_out)

    sketch_path = resolve_sketch_path()
    if sketch_path:
        out_path = os.path.join(out_dir, "proje-fabrikasi-eskiz.jpg")
        framed = beautify_raster(Image.open(sketch_path))
        framed.save(out_path, quality=92, subsampling=1, optimize=True)
        print("jpg:", out_path)
        return

    if os.path.isfile(svg_src):
        print("Kaynak PNG yok; vitrin SVG kullanıyor:", svg_src)
        return

    raise FileNotFoundError("PFOS eskiz kaynağı veya SVG bulunamadı")


if __name__ == "__main__":
    main()
