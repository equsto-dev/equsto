"""Mutfak planı görselini 270° çevir → public/images/pfos/mutfak-plani-referans.jpg"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets"
    r"\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_9123bd26-3ce5-460d-8962-bb29f2eb0324-2a5faf0e-fdb6-4021-9d3d-9f97d2b3212a.png"
)
DEST = ROOT / "public" / "images" / "pfos" / "mutfak-plani-referans.jpg"

def main() -> None:
    DEST.parent.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC)
    out = im.rotate(270, expand=True)
    out.save(DEST, "JPEG", quality=88, optimize=True)
    print(f"[ok] {DEST} ({out.size[0]}×{out.size[1]})")

if __name__ == "__main__":
    main()
