from __future__ import annotations

import glob
import os

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def resolve_sketch_path() -> str:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [
        os.path.join(root, "scripts", "data", "pfos-eskiz-source.png"),
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_image-5e131b43-8045-4398-bada-3d2ec29fc73b.png",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    for pattern in (r"\*5e131b43*", r"\*0162b92c*"):
        found = sorted(
            glob.glob(
                r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets" + pattern
            ),
            key=os.path.getmtime,
        )
        if found:
            return found[-1]
    raise FileNotFoundError("PFOS mutfak eskiz kaynağı bulunamadı")


def build_hero_jpg(src: Image.Image) -> Image.Image:
    img = src.convert("RGB")
    w, h = img.size
    crop = img.crop((int(w * 0.01), int(h * 0.01), int(w * 0.99), int(h * 0.99)))
    canvas = Image.new("RGB", (1600, 1200), (248, 249, 251))
    fitted = ImageOps.contain(crop, (1600, 1200), method=Image.LANCZOS)
    fitted = ImageEnhance.Contrast(fitted).enhance(1.06)
    fitted = ImageEnhance.Brightness(fitted).enhance(1.02)
    fitted = fitted.filter(ImageFilter.UnsharpMask(radius=1.0, percent=80, threshold=3))
    canvas.paste(fitted, ((1600 - fitted.width) // 2, (1200 - fitted.height) // 2))
    return canvas


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "proje-fabrikasi-mutfak-eskiz.jpg")
    build_hero_jpg(Image.open(resolve_sketch_path())).save(
        out_path, quality=92, subsampling=1, optimize=True
    )
    print(out_path)


if __name__ == "__main__":
    main()
