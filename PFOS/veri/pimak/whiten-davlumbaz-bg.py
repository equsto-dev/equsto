# -*- coding: utf-8 -*-
"""Açık gri stüdyo arka planını düz beyaza çevir."""
from pathlib import Path

import numpy as np
from PIL import Image

SRC = Path(
    r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK-PFOS\assets"
    r"\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_30021aece509c972abfffd7f66ac8137_images_aa464a30-ffd7-48eb-9197-1f90104ef7e4-e1f8660e-c769-4fc9-8666-4de419bcc363.png"
)
OUT_MANUAL = Path(__file__).resolve().parent / "media" / "manual" / "davlumbaz-orta-tip-kutu.png"
OUT_SITE = (
    Path(__file__).resolve().parent.parent.parent.parent
    / "E-TICARET"
    / "site"
    / "public"
    / "images"
    / "catalog"
    / "equsto"
    / "davlumbaz-orta-tip-kutu.png"
)


def whiten_background(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGB"), dtype=np.float32)
    h, w, _ = arr.shape
    corners = np.concatenate(
        [
            arr[0:48, 0:48].reshape(-1, 3),
            arr[0:48, w - 48 : w].reshape(-1, 3),
            arr[h - 48 : h, 0:48].reshape(-1, 3),
            arr[h - 48 : h, w - 48 : w].reshape(-1, 3),
        ],
        axis=0,
    )
    bg = np.median(corners, axis=0)
    diff = np.linalg.norm(arr - bg, axis=2)
    lum = arr.mean(axis=2)
    chroma = arr.max(axis=2) - arr.min(axis=2)
    mask = ((diff < 46) & (lum > 125)) | ((lum > 192) & (chroma < 30))
    out = arr.copy()
    out[mask] = (255.0, 255.0, 255.0)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def main() -> None:
    img = Image.open(SRC)
    out = whiten_background(img)
    for dest in (OUT_MANUAL, OUT_SITE):
        dest.parent.mkdir(parents=True, exist_ok=True)
        out.save(dest, format="PNG", optimize=True)
        print("OK", dest)


if __name__ == "__main__":
    main()
