"""Mutfak planı görselini 270° çevir → public/images/pfos/mutfak-plani-referans.jpg"""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path(
    r"C:\Users\User\.cursor\projects\c-D-Disk-EQUSTO-CURSOR\assets"
    r"\c__Users_User_AppData_Roaming_Cursor_User_workspaceStorage_9fb64fc761316601e4f24b301be31c8a_images_image-c2feebeb-c08a-4038-a449-ce5398999321.png"
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
