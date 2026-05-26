#!/usr/bin/env python3
"""Vitrum Bar Price List PDF → ürün kodu başına doğru vitrin görseli.

equsto.com vitrum-drawings hero_p*.png dosyaları birçok kodda PDF ile uyuşmuyor
(ör. ML/BM mobil hat, AG musluklar). Bu script her SKU için PDF'deki kod
konumunun üstündeki ürün fotoğrafını keser.

  python scripts/extract-vitrum-besos-pdf-images.py
  set VITRUM_BESOS_PDF=c:\\path\\Vitrum+Bar+Price+List+October+2025.pdf
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
CATALOGUE = ROOT / "public/data/vitrum-bars-catalogue.json"
OUT_DIR = ROOT / "public/images/catalog/besos/pdf"
MANIFEST = ROOT / "public/images/catalog/besos/_pdf-manifest.json"
PDF = Path(
    os.environ.get(
        "VITRUM_BESOS_PDF",
        str(Path.home() / "Downloads" / "Vitrum+Bar+Price+List+October+2025.pdf"),
    )
)

CODE_ALIASES = {
    "PL/IM.N-08": ["PL/IM.N-07", "PL/IM.N-08"],
    "PL/SM.S.N.3-09": ["PL/BM.S.N.3-09", "PL/SM.S.N.3-09"],
    "PL/NM.ND-2": ["PL/NM.ND.2", "PL/NM.ND-2"],
    "PL/SM-04": ["SL/SM-04", "PL/SM-04"],
}

SIGNATURE_NAMES = {
    "BES-P23": ["The Manhattan", "Manhattan"],
    "BES-P24": ["The Boulverdier", "The Boulevardier", "Boulverdier", "Boulevardier"],
    "BES-P25": ["The Clover", "Clover"],
}

MIN_W = 60
MIN_H = 60
PAD = 4


def slug(code: str) -> str:
    s = "besos-" + code.lower().replace("/", "-").replace(".", "-")
    return re.sub(r"[^a-z0-9-]", "", s)


def code_queries(code: str) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []

    def add(q: str) -> None:
        q = q.strip()
        if q and q not in seen:
            seen.add(q)
            out.append(q)

    add(code)
    for alt in CODE_ALIASES.get(code, []):
        add(alt)
    # PDF bazen harfler arası boşluklu
    spaced = re.sub(r"(?<=[A-Z0-9])(?=[A-Z0-9/])", " ", code)
    add(spaced)
    return out


def page_images(page: fitz.Page) -> list[tuple[int, fitz.Rect]]:
    imgs: list[tuple[int, fitz.Rect]] = []
    for xref in {i[0] for i in page.get_images(full=True)}:
        for rect in page.get_image_rects(xref):
            if rect.width >= MIN_W and rect.height >= MIN_H:
                imgs.append((xref, rect))
    return imgs


def pick_image(text_rect: fitz.Rect, imgs: list[tuple[int, fitz.Rect]]) -> tuple[int, fitz.Rect] | None:
    """PDF vitrin düzeni: fotoğraf solda, kod+ fiyat sağda — dikey hizaya göre eşle."""
    ty = (text_rect.y0 + text_rect.y1) / 2
    candidates: list[tuple[float, int, fitz.Rect]] = []
    for xref, ir in imgs:
        iy = (ir.y0 + ir.y1) / 2
        dy = abs(iy - ty)
        if dy > 220:
            continue
        # Ürün fotoğrafları genelde sayfa sol yarısında
        if ir.x0 > text_rect.x0 - 40:
            continue
        candidates.append((dy, xref, ir))
    if not candidates:
        return None
    candidates.sort(key=lambda x: x[0])
    _, xref, ir = candidates[0]
    return xref, ir


def find_code_rect(doc: fitz.Document, code: str) -> tuple[int, fitz.Rect] | None:
    for q in code_queries(code):
        for pi in range(len(doc)):
            hits = doc[pi].search_for(q)
            if hits:
                return pi, hits[0]
    for q in SIGNATURE_NAMES.get(code, []):
        for pi in range(min(2, len(doc))):
            hits = doc[pi].search_for(q)
            if hits:
                return pi, hits[0]
    return None


def save_pixmap(doc: fitz.Document, xref: int, rect: fitz.Rect, dest: Path) -> bool:
    clip = fitz.Rect(rect)
    clip.x0 -= PAD
    clip.y0 -= PAD
    clip.x1 += PAD
    clip.y1 += PAD
    clip &= doc[0].rect  # clamp — fixed on page below
    page_no = None
    for pi in range(len(doc)):
        p = doc[pi]
        for x, r in page_images(p):
            if x == xref and abs(r.y0 - rect.y0) < 1:
                page_no = pi
                clip &= p.rect
                break
        if page_no is not None:
            break
    if page_no is None:
        return False
    page = doc[page_no]
    clip &= page.rect
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
    if pix.width < MIN_W or pix.height < MIN_H:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(dest))
    return dest.stat().st_size > 3000


def main() -> int:
    if not PDF.is_file():
        print(f"PDF bulunamadı: {PDF}", flush=True)
        return 1

    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    doc = fitz.open(str(PDF))
    manifest: dict[str, str] = {}
    ok = fail = 0

    for product in catalogue.get("products", []):
        code = product.get("code", "")
        if not code:
            continue
        # İmza barlar vitrumgroup.org CDN — PDF'den değiştirme
        if code in SIGNATURE_NAMES and product.get("imageSource") == "vitrumgroup.org-cdn":
            manifest[code] = product["image"]
            print(f"KEEP {code} (vitrum cdn)")
            ok += 1
            continue
        if code in SIGNATURE_NAMES and str(product.get("image", "")).endswith(".avif"):
            manifest[code] = product["image"]
            print(f"KEEP {code} (signature avif)")
            ok += 1
            continue
        hit = find_code_rect(doc, code)
        if not hit:
            print(f"MISS text {code}")
            fail += 1
            continue
        pi, text_rect = hit
        page = doc[pi]
        imgs = page_images(page)
        picked = pick_image(text_rect, imgs)
        if not picked:
            print(f"MISS image {code} page {pi + 1}")
            fail += 1
            continue
        xref, img_rect = picked
        dest = OUT_DIR / f"{slug(code)}.png"
        # save via page clip (not raw xref — keeps crop)
        clip = fitz.Rect(img_rect)
        clip.x0 -= PAD
        clip.y0 -= PAD
        clip.x1 += PAD
        clip.y1 += PAD
        clip &= page.rect
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
        if pix.width < MIN_W:
            print(f"SKIP small {code}")
            fail += 1
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(dest))
        rel = f"images/catalog/besos/pdf/{dest.name}"
        manifest[code] = rel
        product["image"] = rel
        product["imageSource"] = "vitrum-pdf-oct-2025"
        print(f"OK {code} -> {rel} ({pix.width}x{pix.height})")
        ok += 1

    catalogue["imageRoot"] = "images/catalog/besos/pdf"
    catalogue["imagesFetchedAt"] = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    ).isoformat()
    CATALOGUE.write_text(json.dumps(catalogue, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Done: {ok} ok, {fail} failed")
    doc.close()
    return 0 if ok > 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
