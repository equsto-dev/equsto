from __future__ import annotations

import os

from PIL import Image, ImageEnhance, ImageFilter, ImageOps


def main() -> None:
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # Cursor chat-uploaded assets (absolute paths)
    base_path = r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_image-3171060d-23b7-4ed6-9aff-23a5fd715a69.png"
    sketch_path = r"C:\Users\adema\.cursor\projects\c-D-Disk-EQUSTO-WORK\assets\c__Users_adema_AppData_Roaming_Cursor_User_workspaceStorage_09d25d8a44f66226e9a0880f108de3fa_images_0162b92c-69db-41ed-96d4-5a292989bc1e-a9d4d16b-901c-4e3e-8771-27e61621bc34.png"

    if not os.path.exists(base_path):
        raise FileNotFoundError(base_path)
    if not os.path.exists(sketch_path):
        raise FileNotFoundError(sketch_path)

    base = Image.open(base_path).convert("RGB")
    sketch = Image.open(sketch_path).convert("RGB")

    W, H = 1600, 900
    canvas = Image.new("RGB", (W, H), (8, 12, 18))

    bw, bh = base.size
    crop_h = int(bh * 0.60)
    plan = base.crop((0, 0, bw, crop_h)).resize((W, H), Image.LANCZOS)
    plan = ImageEnhance.Brightness(plan).enhance(0.90)
    plan = ImageEnhance.Contrast(plan).enhance(1.05)
    canvas.paste(plan, (0, 0))

    # right-side dark overlay (simple linear mask)
    mask = Image.new("L", (W, H), 0)
    mask_px = mask.load()
    for x in range(W):
        t = (x - int(W * 0.55)) / float(int(W * 0.45))
        a = int(max(0, min(220, t * 220)))
        for y in range(H):
            mask_px[x, y] = a
    overlay = Image.new("RGB", (W, H), (10, 10, 12))
    canvas = Image.composite(overlay, canvas, mask)

    # sketch card
    card_w, card_h = 560, 700
    sk = ImageOps.contain(sketch, (card_w - 40, card_h - 40), Image.LANCZOS)
    sk = ImageEnhance.Color(sk).enhance(0.0)
    sk = ImageEnhance.Contrast(sk).enhance(1.05)

    border = 2
    card = Image.new("RGB", (card_w, card_h), (220, 224, 230))
    inner = Image.new("RGB", (card_w - border * 2, card_h - border * 2), (245, 246, 248))
    card.paste(inner, (border, border))

    sx = (card_w - sk.size[0]) // 2
    sy = (card_h - sk.size[1]) // 2
    card.paste(sk, (sx, sy))

    shadow = Image.new("RGBA", (card_w + 40, card_h + 40), (0, 0, 0, 0))
    shadow_im = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 200))
    shadow.paste(shadow_im, (20, 20))
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))

    px = W - card_w - 80
    py = (H - card_h) // 2

    canvas_rgba = canvas.convert("RGBA")
    canvas_rgba.alpha_composite(shadow, (px - 20, py - 20))
    canvas_rgba.alpha_composite(card.convert("RGBA"), (px, py))

    out_dir = os.path.join(root, "public", "images", "pfos")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "proje-fabrikasi-eskiz.jpg")
    canvas_rgba.convert("RGB").save(out_path, quality=92, subsampling=1, optimize=True)
    print(out_path)


if __name__ == "__main__":
    main()

