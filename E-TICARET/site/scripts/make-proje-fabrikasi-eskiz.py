from __future__ import annotations

import glob
import os

from PIL import Image, ImageEnhance, ImageOps


def resolve_sketch_path() -> str:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [
        os.path.join(root, "scripts", "data", "pfos-eskiz-source.png"),
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_0162b92c-69db-41ed-96d4-5a292989bc1e-d988c360-c791-4297-88fe-d4f674969595.png",
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
    raise FileNotFoundError("PFOS eskiz kaynağı bulunamadı: " + ", ".join(candidates))


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sketch = Image.open(resolve_sketch_path()).convert("RGB")

    W, H = 1600, 900
    canvas = Image.new("RGB", (W, H), (245, 246, 248))
    contained = ImageOps.contain(sketch, (W, H), method=Image.LANCZOS)
    contained = ImageEnhance.Contrast(contained).enhance(1.02)
    x = (W - contained.width) // 2
    y = (H - contained.height) // 2
    canvas.paste(contained, (x, y))

    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "proje-fabrikasi-eskiz.jpg")
    canvas.save(out_path, quality=92, subsampling=1, optimize=True)
    print(out_path)


if __name__ == "__main__":
    main()
