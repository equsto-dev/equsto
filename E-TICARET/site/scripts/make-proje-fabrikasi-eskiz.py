from __future__ import annotations

import glob
import os

from PIL import Image, ImageEnhance, ImageOps


def resolve_sketch_path() -> str:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [os.path.join(root, "scripts", "data", "pfos-eskiz-source.png")]
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
    raise FileNotFoundError("PFOS eskiz kaynağı bulunamadı")


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sketch = Image.open(resolve_sketch_path()).convert("RGB")

    W, H = 1600, 900
    framed = ImageOps.fit(sketch, (W, H), method=Image.LANCZOS, centering=(0.5, 0.5))
    framed = ImageEnhance.Contrast(framed).enhance(1.02)

    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "proje-fabrikasi-eskiz.jpg")
    framed.save(out_path, quality=92, subsampling=1, optimize=True)
    print(out_path)


if __name__ == "__main__":
    main()
