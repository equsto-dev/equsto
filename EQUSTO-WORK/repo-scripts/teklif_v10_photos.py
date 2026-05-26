# -*- coding: utf-8 -*-
"""Teklif v10 ürün fotoğrafı yolu — filesystem MVP ve ileride CDN/R2."""
from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Optional

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_STORAGE_ROOTS = (
    Path(os.environ.get("EQUSTO_STORAGE_ROOT", ""))
    if os.environ.get("EQUSTO_STORAGE_ROOT")
    else None,
    REPO_ROOT / "public" / "storage" / "products",
    REPO_ROOT / "storage" / "products",
    Path("/var/www/equsto/storage/products"),
)
DEFAULT_PLACEHOLDER = REPO_ROOT / "public" / "data" / "templates" / "teklif-photo-placeholder.png"
MAIN_NAMES = ("main.jpg", "main.jpeg", "main.png", "main.webp")
IMG_WIDTH = 140
IMG_HEIGHT = 130


def normalize_stok_no(stok_no: str) -> str:
    s = str(stok_no or "").strip()
    if not s:
        return ""
    return re.sub(r'[<>:"/\\|?*]', "-", s)


def product_photo_dir(storage_root: Path, stok_no: str) -> Path:
    return storage_root / normalize_stok_no(stok_no)


def product_photo_candidates(stok_no: str, storage_root: Path) -> list[Path]:
    base = product_photo_dir(storage_root, stok_no)
    return [base / name for name in MAIN_NAMES]


def resolve_storage_root(storage_root: Optional[Path] = None) -> Path:
    if storage_root is not None:
        p = Path(storage_root)
        return p
    for candidate in DEFAULT_STORAGE_ROOTS:
        if candidate and candidate.is_dir():
            return candidate
    return REPO_ROOT / "public" / "storage" / "products"


def resolve_product_photo(
    stok_no: str,
    photo_path: Optional[str] = None,
    storage_root: Optional[Path] = None,
) -> Optional[Path]:
    """Gerçek dosya varsa Path döner; yoksa None (placeholder kullanılır)."""
    if photo_path:
        p = Path(photo_path)
        if p.is_file():
            return p.resolve()

    root = resolve_storage_root(storage_root)
    for cand in product_photo_candidates(stok_no, root):
        if cand.is_file():
            return cand.resolve()

    # Eski düz katalog: public/data/images/
    legacy_dir = REPO_ROOT / "public" / "data" / "images"
    code = normalize_stok_no(stok_no).lower()
    if legacy_dir.is_dir() and code:
        for f in legacy_dir.iterdir():
            if not f.is_file():
                continue
            name = f.name.lower()
            if code in name and name.endswith((".jpg", ".jpeg", ".png", ".webp")):
                return f.resolve()

    return None


def resolve_photo_or_placeholder(
    stok_no: str,
    photo_path: Optional[str] = None,
    storage_root: Optional[Path] = None,
    placeholder: Optional[Path] = None,
) -> Path:
    found = resolve_product_photo(stok_no, photo_path=photo_path, storage_root=storage_root)
    if found:
        return found
    ph = Path(placeholder) if placeholder else DEFAULT_PLACEHOLDER
    if ph.is_file():
        return ph.resolve()
    ensure_placeholder(ph)
    return ph.resolve()


def ensure_placeholder(path: Path) -> Path:
    path = Path(path)
    if path.is_file():
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        from PIL import Image, ImageDraw

        im = Image.new("RGB", (IMG_WIDTH, IMG_HEIGHT), color=(32, 32, 34))
        draw = ImageDraw.Draw(im)
        draw.rectangle([8, 8, IMG_WIDTH - 9, IMG_HEIGHT - 9], outline=(90, 90, 96), width=2)
        draw.line([(36, 28), (104, 28), (IMG_WIDTH - 20, IMG_HEIGHT - 24), (20, IMG_HEIGHT - 24), (36, 28)], fill=(70, 70, 76), width=2)
        draw.ellipse([52, 38, 72, 58], outline=(110, 110, 118), width=2)
        draw.text((46, 88), "FOTO", fill=(130, 130, 138))
        im.save(path, format="PNG")
        return path
    except ImportError:
        # Minimal 1×1 PNG (openpyxl ölçekler)
        minimal_png = (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc``\x00\x00"
            b"\x00\x02\x00\x01\xe2!\xbc3\x00\x00\x00\x00IEND\xaeB`\x82"
        )
        path.write_bytes(minimal_png)
        return path


def cdn_url(stok_no: str, cdn_base: str = "https://cdn.equsto.com/products") -> str:
    code = normalize_stok_no(stok_no)
    base = cdn_base.rstrip("/")
    return f"{base}/{code}/main.jpg"
