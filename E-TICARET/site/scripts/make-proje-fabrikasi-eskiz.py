from __future__ import annotations

import glob
import os

from PIL import Image, ImageEnhance, ImageOps


def resolve_sketch_path() -> str:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    candidates = [
        os.path.join(root, "scripts", "data", "pfos-eskiz-source.png"),
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_0162b92c-69db-41ed-96d4-5a292989bc1e-06df7333-c3bf-4cea-bba3-de39742a27f9.png",
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_0162b92c-69db-41ed-96d4-5a292989bc1e-a9d4d16b-901c-4e3e-8771-27e61621bc34.png",
    ]
    for p in candidates:
        if os.path.isfile(p):
            return p
    pattern = (
        r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets"
        r"\*0162b92c*"
    )
    found = sorted(glob.glob(pattern))
    if found:
        return found[-1]
    raise FileNotFoundError("PFOS eskiz kaynağı bulunamadı: " + ", ".join(candidates))


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    sketch = Image.open(resolve_sketch_path()).convert("RGB")

    W, H = 1600, 900
    fitted = ImageOps.fit(sketch, (W, H), method=Image.LANCZOS, centering=(0.5, 0.45))
    fitted = ImageEnhance.Contrast(fitted).enhance(1.03)

    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "proje-fabrikasi-eskiz.jpg")
    fitted.save(out_path, quality=92, subsampling=1, optimize=True)
    print(out_path)


if __name__ == "__main__":
    main()
