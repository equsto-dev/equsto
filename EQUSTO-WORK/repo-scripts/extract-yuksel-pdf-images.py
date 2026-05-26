#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YÜKSEL YERLİ - 2025.pdf → PDF gömülü ORİJİNAL görsel (kırpma / sayfa taraması yok)

  python scripts/extract-yuksel-pdf-images.py
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

try:
    import fitz
except ImportError:
    print("pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf")
OUT_DIR = ROOT / "public" / "data" / "images"
EKIPMANLAR = ROOT / "public" / "data" / "ekipmanlar.json"
CATALOG_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-yerli" / "tum-urunler.json"
MAP_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-yerli" / "_pdf-images-map.json"

MIN_IMG_W = 90
MIN_IMG_H = 90
MIN_AREA = 12000

PRODUCT_MODEL_RE = re.compile(
    r"^(?:M\d{6,}|CA-[A-Z0-9][\w.-]*|"
    r"PZA[\w.-]*|PZAD[\w.-]*|PZAC[\w.-]*|PZAG[\w.-]*|"
    r"TTC[\w.-]*|TTU[\w.-]*|TTK[\w.-]*|TTX[\w.-]*|TTEV[\w.-]*|TTG[\w.-]*|TTR[\w.-]*|"
    r"ASB[\w.-]*|SBB[\w.-]*|SBTM[\w.-]*|TTM[\w.-]*|SBH[\w.-]*|SBT[\w.-]*|"
    r"ST[\w.-]*|DT[\w.-]*|BAR[\w.-]*|MSB[\w.-]*|SLM[\w.-]*|CAU[\w.-]*|CAK[\w.-]*|"
    r"GN[\w.-]*|SBM[\w.-]*|"
    r"\d{2,4}X\d{2,4}X\d{2,4}(?:/\d+)?)$",
    re.I,
)


def norm_model(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").upper()
    tr = str.maketrans("İĞÜŞÖÇ", "IGUSOC")
    s = s.translate(tr)
    return re.sub(r"[^A-Z0-9]", "", s)


def slug_model(model: str) -> str:
    s = unicodedata.normalize("NFKC", model or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")[:80] or "yuksel-urun"


def clean_model_code(s: str) -> str:
    return re.sub(r"\s+", "", unicodedata.normalize("NFKC", s or "").strip())


def is_product_model(s: str) -> bool:
    s = clean_model_code(s)
    if not s or len(s) < 4 or len(s) > 48:
        return False
    return bool(PRODUCT_MODEL_RE.match(s))


def models_from_table(page) -> list[str]:
    models: list[str] = []
    for tab in page.find_tables().tables:
        try:
            raw = tab.extract()
        except Exception:
            continue
        if not raw or not raw[0]:
            continue
        if str(raw[0][0] or "").strip().lower() != "model":
            continue
        for row in raw[2:]:
            if not row:
                continue
            m = clean_model_code(str(row[0] or ""))
            if is_product_model(m):
                models.append(m.upper())
    return list(dict.fromkeys(models))


def models_from_text(page) -> list[str]:
    models: list[str] = []
    for line in page.get_text().splitlines():
        m = clean_model_code(line)
        if is_product_model(m):
            models.append(m.upper())
    return list(dict.fromkeys(models))


def models_on_page(page) -> list[str]:
    from_table = models_from_table(page)
    if from_table:
        return from_table
    return models_from_text(page)


def model_x_positions(page, models: list[str]) -> dict[str, float]:
    want = {norm_model(m): m for m in models}
    xs: dict[str, list[float]] = {k: [] for k in want}
    for block in page.get_text("blocks"):
        if len(block) < 5:
            continue
        x0 = float(block[0])
        text = unicodedata.normalize("NFKC", str(block[4]))
        for token in re.findall(r"[A-Z]{2,}[\w./-]{2,}|\bM\d{6,}\b", text, re.I):
            key = norm_model(clean_model_code(token))
            if key in xs:
                xs[key].append(x0)
    out: dict[str, float] = {}
    for key, m in want.items():
        if xs[key]:
            out[m] = sum(xs[key]) / len(xs[key])
    return out


def product_images(page) -> list[dict]:
    imgs = []
    for info in page.get_image_info(xrefs=True):
        bbox = info["bbox"]
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        area = w * h
        if w < MIN_IMG_W or h < MIN_IMG_H or area < MIN_AREA:
            continue
        cs = info.get("cs-name") or ""
        if cs == "DeviceGray" and area < 30000:
            continue
        if w > h * 8 and h < 120:
            continue
        imgs.append(
            {
                "xref": info["xref"],
                "x": (bbox[0] + bbox[2]) / 2,
                "y": (bbox[1] + bbox[3]) / 2,
                "area": area,
            }
        )
    imgs.sort(key=lambda i: (i["y"], i["x"]))
    return imgs


def save_xref_original(doc, xref: int, dest: Path) -> bool:
    """PDF içindeki gömülü görseli olduğu gibi kaydet (kırpma yok)."""
    try:
        img = doc.extract_image(xref)
        ext = (img.get("ext") or "jpeg").lower()
        if ext in ("jpg", "jpeg"):
            out = dest.with_suffix(".jpg")
        elif ext == "png":
            out = dest.with_suffix(".png")
        else:
            out = dest.with_suffix(f".{ext}")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(img["image"])
        if out.stat().st_size < 400:
            return False
        if out != dest and dest.exists():
            dest.unlink()
        return True
    except Exception:
        pass
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        out = dest.with_suffix(".jpg")
        out.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(out))
        return out.is_file() and out.stat().st_size > 400
    except Exception as e:
        print("  [warn]", dest.name, e)
        return False


def assign_images(
    models: list[str], imgs: list[dict], pos: dict[str, float]
) -> dict[str, dict]:
    out: dict[str, dict] = {}
    if not models or not imgs:
        return out

    if len(imgs) == 1:
        for m in models:
            out[m] = imgs[0]
        return out

    if len(imgs) == len(models):
        ims = sorted(imgs, key=lambda i: i["x"])
        mds = sorted(models, key=lambda m: pos.get(m, 0))
        for m, im in zip(mds, ims):
            out[m] = im
        return out

    if len(imgs) > 1 and len(models) > len(imgs):
        ims = sorted(imgs, key=lambda i: i["x"])
        per = len(models) // len(ims)
        extra = len(models) % len(ims)
        idx = 0
        for ii, im in enumerate(ims):
            n = per + (1 if ii < extra else 0)
            for _ in range(n):
                if idx < len(models):
                    out[models[idx]] = im
                    idx += 1
        return out

    ims = sorted(imgs, key=lambda i: i["x"])
    for i, m in enumerate(models):
        out[m] = ims[min(i, len(ims) - 1)]
    return out


def main() -> None:
    dry = "--dry-run" in sys.argv
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    doc = fitz.open(PDF)
    global_map: dict[str, str] = {}
    page_log = []

    pages_meta: list[dict] = []
    for pi in range(doc.page_count):
        page = doc[pi]
        models = models_on_page(page)
        pages_meta.append(
            {
                "page": pi,
                "pg_no": pi + 1,
                "models": models,
                "imgs": product_images(page),
                "pos": model_x_positions(page, models),
            }
        )

    for i, meta in enumerate(pages_meta):
        models = meta["models"]
        if not models:
            continue

        imgs = meta["imgs"]
        pos = meta["pos"]
        if not imgs:
            for j in (i, i + 1, i - 1, i + 2, i - 2):
                if 0 <= j < len(pages_meta) and pages_meta[j]["imgs"]:
                    imgs = pages_meta[j]["imgs"]
                    if not pos:
                        pos = pages_meta[j]["pos"]
                    break

        if not imgs:
            continue

        pairs = assign_images(models, imgs, pos)
        saved = 0
        for model, im in pairs.items():
            rel = f"images/yuksel-{slug_model(model)}_1.jpg"
            nm = norm_model(model)
            if not nm:
                continue
            if dry:
                global_map[nm] = rel.replace("\\", "/")
                saved += 1
                continue
            dest = OUT_DIR / rel.replace("images/", "")
            if save_xref_original(doc, int(im["xref"]), dest):
                actual = dest.with_suffix(".jpg")
                if not actual.is_file():
                    for p in dest.parent.glob(dest.stem + ".*"):
                        actual = p
                        break
                global_map[nm] = ("images/" + actual.name).replace("\\", "/")
                saved += 1

        if saved:
            page_log.append({"page": meta["pg_no"], "models": len(models), "saved": saved})

    doc.close()

    MAP_JSON.parent.mkdir(parents=True, exist_ok=True)
    MAP_JSON.write_text(
        json.dumps({"models": global_map, "page_log": page_log}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"PDF orijinal gorsel: {len(global_map)} model")
    if dry:
        return

    if not EKIPMANLAR.is_file():
        return
    catalog = json.loads(EKIPMANLAR.read_text(encoding="utf-8"))
    replaced = 0
    for p in catalog:
        if "yuksel-2025-yerli" not in str(p.get("kaynak_fiyat_listesi") or ""):
            continue
        key = norm_model(p.get("model") or p.get("sku") or "")
        rel = global_map.get(key)
        if not rel:
            continue
        p["images"] = [rel.replace("\\", "/")]
        replaced += 1

    EKIPMANLAR.write_text(json.dumps(catalog), encoding="utf-8")
    print(f"ekipmanlar.json: {replaced} yerli gorsel guncellendi")


if __name__ == "__main__":
    main()
