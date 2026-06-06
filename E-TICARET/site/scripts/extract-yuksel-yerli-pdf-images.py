#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YÜKSEL YERLİ - 2025.pdf → gömülü (embedded) görseller, her xref ayrı dosya.

• Sayfa kırpımı YOK — extract_image(xref) ile orijinal gömülü dosya
• Her benzersiz xref bir kez: public/images/catalog/yuksel/embed/x{xref}.{ext}
• Model dosyası: public/images/catalog/yuksel/yuksel-{model}_1.{ext} (embed kopyası)
• Her xref en fazla bir modele; modeller tum-urunler.json sayfa alanından eşlenir

  python scripts/extract-yuksel-yerli-pdf-images.py
  python scripts/extract-yuksel-yerli-pdf-images.py --apply-catalog
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("Pillow gerekli: pip install pillow")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\YÜKSEL YERLİ - 2025.pdf")
EMBED_DIR = ROOT / "public" / "images" / "catalog" / "yuksel" / "embed"
MODEL_DIR = ROOT / "public" / "images" / "catalog" / "yuksel"
DEPT_DIR = ROOT / "public" / "data" / "dept"
EKIPMANLAR = ROOT / "public" / "data" / "ekipmanlar.json"
CATALOG_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-yerli" / "tum-urunler.json"
MAP_JSON = ROOT / "public" / "data" / "fiyat-listeleri" / "yuksel" / "2025-yerli" / "_pdf-images-map.json"

MIN_IMG_W = 80
MIN_IMG_H = 80
MIN_AREA = 9000
NEIGHBOR_PAGES = 2

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
    imgs: list[dict] = []
    for info in page.get_image_info(xrefs=True):
        bbox = info["bbox"]
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        area = w * h
        if w < MIN_IMG_W or h < MIN_IMG_H or area < MIN_AREA:
            continue
        cs = info.get("cs-name") or ""
        if cs == "DeviceGray" and area < 25000:
            continue
        if w > h * 8 and h < 120:
            continue
        imgs.append(
            {
                "xref": int(info["xref"]),
                "x": (bbox[0] + bbox[2]) / 2,
                "y": (bbox[1] + bbox[3]) / 2,
                "area": area,
                "page": int(page.number) + 1,
            }
        )
    imgs.sort(key=lambda i: (i["y"], i["x"]))
    return imgs


def _lum(c: tuple[int, int, int]) -> float:
    return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]


def _is_bg_like(c: tuple[int, int, int], refs: list[tuple[int, int, int]], *, relaxed: bool = False) -> bool:
    r, g, b = c
    if max(r, g, b) < (35 if relaxed else 28):
        return True
    spread = max(r, g, b) - min(r, g, b)
    lv = _lum(c)
    if lv > (165 if relaxed else 175) and spread < (55 if relaxed else 45):
        return True
    if b > r + (3 if relaxed else 5) and g > r - 5 and lv > (130 if relaxed else 140):
        return True
    if r > 140 and b > 140 and g < min(r, b) - 5:
        return True
    for ref in refs:
        if abs(r - ref[0]) + abs(g - ref[1]) + abs(b - ref[2]) < (70 if relaxed else 55):
            return True
    return False


def needs_pdf_bg_fix(im: Image.Image) -> bool:
    w, h = im.size
    px = im.load()
    top = max(1, h // 10)
    black = sum(1 for x in range(w) for y in range(top) if px[x, y] == (0, 0, 0))
    if black > w * top * 0.05:
        return True
    purple = sum(
        1
        for x in range(w)
        for y in range(h)
        if px[x, y][2] > px[x, y][0] + 15 and _lum(px[x, y]) > 190
    )
    if purple > w * h * 0.005:
        return True
    return False


def flatten_to_white_bg(path: Path) -> bool:
    """PDF mask artıkları (siyah/cyan/mor saçak) → düz beyaz arka plan. True = dosya güncellendi."""
    path = Path(path)
    if not path.is_file():
        return False
    im = Image.open(path).convert("RGB")
    if not needs_pdf_bg_fix(im):
        return False

    w, h = im.size
    px = im.load()
    refs = [px[0, h - 1], px[w - 1, h - 1], px[w - 1, 0], px[0, 0]]
    refs = [r for r in refs if _lum(r) > 140 or max(r) < 35] or [(240, 240, 240)]

    bg = bytearray(w * h)
    q: list[tuple[int, int]] = []
    for x in range(w):
        q.append((x, 0))
        q.append((x, h - 1))
    for y in range(h):
        q.append((0, y))
        q.append((w - 1, y))

    while q:
        x, y = q.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if bg[i]:
            continue
        if not _is_bg_like(px[x, y], refs):
            continue
        bg[i] = 1
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])

    for _ in range(2):
        add: list[tuple[int, int]] = []
        for y in range(h):
            for x in range(w):
                if bg[y * w + x]:
                    continue
                if not any(
                    0 <= x + dx < w and 0 <= y + dy < h and bg[(y + dy) * w + (x + dx)]
                    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))
                ):
                    continue
                if _is_bg_like(px[x, y], refs, relaxed=True):
                    add.append((x, y))
        for x, y in add:
            bg[y * w + x] = 1

    for _ in range(8):
        add = []
        for y in range(h):
            for x in range(w):
                i = y * w + x
                if bg[i]:
                    continue
                if min(px[x, y]) < 238:
                    continue
                if any(
                    0 <= x + dx < w and 0 <= y + dy < h and bg[(y + dy) * w + (x + dx)]
                    for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1))
                ):
                    add.append((x, y))
        if not add:
            break
        for x, y in add:
            bg[y * w + x] = 1

    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                px[x, y] = (255, 255, 255)

    ext = path.suffix.lower()
    if ext in (".jpg", ".jpeg"):
        im.save(path, "JPEG", quality=90, optimize=True)
    elif ext == ".png":
        im.save(path, "PNG", optimize=True)
    else:
        im.save(path, quality=90, optimize=True)
    return True


def fix_all_yuksel_backgrounds() -> tuple[int, int]:
    fixed = 0
    scanned = 0
    for base in (EMBED_DIR, MODEL_DIR):
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*")):
            if not path.is_file():
                continue
            if path.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
                continue
            scanned += 1
            if flatten_to_white_bg(path):
                fixed += 1
    return scanned, fixed


def save_embed_xref(doc, xref: int, dest: Path) -> Path | None:
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
            return None
        flatten_to_white_bg(out)
        return out
    except Exception:
        pass
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        out = dest.with_suffix(".jpg")
        out.parent.mkdir(parents=True, exist_ok=True)
        pix.save(str(out))
        if out.is_file() and out.stat().st_size > 400:
            flatten_to_white_bg(out)
            return out
    except Exception as e:
        print("  [warn] xref", xref, e)
    return None


def embed_rel_path(xref: int, ext: str) -> str:
    e = ext.lower().lstrip(".")
    if e in ("jpg", "jpeg"):
        e = "jpg"
    return f"images/catalog/yuksel/embed/x{xref}.{e}"


def model_rel_path(model: str, ext: str) -> str:
    e = ext.lower().lstrip(".")
    if e in ("jpg", "jpeg"):
        e = "jpg"
    return f"images/catalog/yuksel/yuksel-{slug_model(model)}_1.{e}"


def ensure_xref_file(doc, xref: int, cache: dict[int, str], *, dry: bool) -> str | None:
    if xref in cache:
        return cache[xref]
    if dry:
        rel = embed_rel_path(xref, "jpg")
        cache[xref] = rel
        return rel
    saved = save_embed_xref(doc, xref, EMBED_DIR / f"x{xref}")
    if not saved:
        return None
    rel = embed_rel_path(xref, saved.suffix)
    cache[xref] = rel
    return rel


def write_model_alias(embed_file: Path, model: str) -> str:
    ext = embed_file.suffix.lower()
    alias = MODEL_DIR / f"yuksel-{slug_model(model)}_1{ext}"
    alias.parent.mkdir(parents=True, exist_ok=True)
    if not alias.is_file() or alias.stat().st_size != embed_file.stat().st_size:
        alias.write_bytes(embed_file.read_bytes())
    return model_rel_path(model, ext)


def match_one_to_one(models: list[str], imgs: list[dict], pos: dict[str, float]) -> dict[str, dict]:
    if not models or not imgs:
        return {}
    if len(models) == 1 and len(imgs) == 1:
        return {models[0]: imgs[0]}
    models_sorted = sorted(models, key=lambda m: pos.get(m, 0.0))
    imgs_sorted = sorted(imgs, key=lambda i: (i["y"], i["x"]))
    if len(imgs_sorted) == len(models_sorted):
        return dict(zip(models_sorted, imgs_sorted))
    out: dict[str, dict] = {}
    pool = list(imgs_sorted)
    for m in models_sorted:
        if not pool:
            break
        mx = pos.get(m, pool[0]["x"])
        best_i = min(range(len(pool)), key=lambda i: abs(pool[i]["x"] - mx))
        out[m] = pool.pop(best_i)
    return out


def load_catalog_products() -> list[dict]:
    if not CATALOG_JSON.is_file():
        return []
    rows = json.loads(CATALOG_JSON.read_text(encoding="utf-8"))
    out: list[dict] = []
    for row in rows:
        model = clean_model_code(str(row.get("model") or row.get("sku") or ""))
        if not model:
            continue
        page = int(row.get("page") or 0)
        if page <= 0:
            continue
        out.append(
            {
                "model": model.upper(),
                "key": norm_model(model),
                "page": int(row.get("page") or 0),
            }
        )
    return out


def apply_map_to_catalog(model_map: dict[str, str]) -> int:
    n = 0

    def patch_rows(rows: list) -> None:
        nonlocal n
        for row in rows:
            if not isinstance(row, dict):
                continue
            if "yuksel-2025-yerli" not in str(row.get("kaynak_fiyat_listesi") or ""):
                continue
            key = norm_model(row.get("model") or row.get("sku") or "")
            rel = model_map.get(key)
            if not rel:
                row["images"] = []
                continue
            row["images"] = [rel.replace("\\", "/")]
            n += 1

    if EKIPMANLAR.is_file():
        catalog = json.loads(EKIPMANLAR.read_text(encoding="utf-8"))
        patch_rows(catalog)
        EKIPMANLAR.write_text(json.dumps(catalog), encoding="utf-8")

    if DEPT_DIR.is_dir():
        for path in DEPT_DIR.glob("*.json"):
            rows = json.loads(path.read_text(encoding="utf-8"))
            if not isinstance(rows, list):
                continue
            before = n
            patch_rows(rows)
            if n > before:
                path.write_text(json.dumps(rows), encoding="utf-8")

    return n


def main() -> None:
    if "--fix-bg" in sys.argv:
        scanned, fixed = fix_all_yuksel_backgrounds()
        print(f"[yuksel-images] arka plan: {fixed} / {scanned} dosya duzeltildi")
        return

    dry = "--dry-run" in sys.argv
    apply_catalog = "--apply-catalog" in sys.argv or not dry
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    products = load_catalog_products()
    if not products:
        print("tum-urunler.json bulunamadi/bos")
        sys.exit(1)

    by_page: dict[int, list[dict]] = defaultdict(list)
    for p in products:
        if p["page"] > 0:
            by_page[p["page"]].append(p)

    doc = fitz.open(PDF)
    page_imgs: dict[int, list[dict]] = {}
    page_pos_cache: dict[int, dict[str, float]] = {}

    for pi in range(doc.page_count):
        pg = pi + 1
        page_imgs[pg] = product_images(doc[pi])

    xref_cache: dict[int, str] = {}
    used_xrefs: set[int] = set()
    model_map: dict[str, str] = {}
    page_log: list[dict] = []

    # 1) Aynı sayfadaki modeller ↔ görseller
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        models = [p["model"] for p in prods if p["key"] not in model_map]
        if not models:
            continue
        imgs = page_imgs.get(pg, [])
        if not imgs:
            continue
        if pg not in page_pos_cache:
            page_pos_cache[pg] = model_x_positions(doc[pg - 1], models)

        matched = 0
        if len(imgs) == 1 and len(models) >= 1:
            # Tek gömülü foto — aynı xref, her model için ayrı dosya (kırpım değil)
            im = imgs[0]
            xref = int(im["xref"])
            embed_rel = ensure_xref_file(doc, xref, xref_cache, dry=dry)
            if embed_rel:
                for model in models:
                    key = norm_model(model)
                    if dry:
                        rel = model_rel_path(model, "jpg")
                    else:
                        embed_file = ROOT / "public" / Path(*embed_rel.split("/"))
                        rel = write_model_alias(embed_file, model)
                    model_map[key] = rel
                    matched += 1
        else:
            free_imgs = [im for im in imgs if im["xref"] not in used_xrefs]
            pairs = match_one_to_one(models, free_imgs, page_pos_cache[pg])
            for model, im in pairs.items():
                xref = int(im["xref"])
                embed_rel = ensure_xref_file(doc, xref, xref_cache, dry=dry)
                if not embed_rel:
                    continue
                if dry:
                    rel = model_rel_path(model, "jpg")
                else:
                    embed_file = ROOT / "public" / Path(*embed_rel.split("/"))
                    rel = write_model_alias(embed_file, model)
                key = norm_model(model)
                model_map[key] = rel
                used_xrefs.add(xref)
                matched += 1

        if matched:
            page_log.append({"page": pg, "phase": "same-page", "matched": matched, "imgs": len(imgs)})

    # 2) Kalan modeller — komşu sayfadaki xref (her model ayrı dosya)
    remaining = [p for p in products if p["key"] not in model_map]
    for prod in remaining:
        pg = prod["page"]
        model = prod["model"]
        key = prod["key"]
        neighbor_imgs: list[dict] = []
        for delta in range(-NEIGHBOR_PAGES, NEIGHBOR_PAGES + 1):
            cp = pg + delta
            if cp < 1 or cp > doc.page_count:
                continue
            neighbor_imgs.extend(page_imgs.get(cp, []))
        if not neighbor_imgs:
            continue
        # En yakın sayfa/görsel — xref başına bir model (tekrar kullanılabilir komşudan)
        pos = page_pos_cache.get(pg) or model_x_positions(doc[pg - 1], [model])
        mx = pos.get(model, neighbor_imgs[0]["x"])
        best = min(neighbor_imgs, key=lambda im: abs(im["x"] - mx) + abs(im["page"] - pg) * 25)
        xref = int(best["xref"])
        embed_rel = ensure_xref_file(doc, xref, xref_cache, dry=dry)
        if not embed_rel:
            continue
        if dry:
            rel = model_rel_path(model, "jpg")
        else:
            embed_file = ROOT / "public" / Path(*embed_rel.split("/"))
            rel = write_model_alias(embed_file, model)
        model_map[key] = rel

    doc.close()

    MAP_JSON.parent.mkdir(parents=True, exist_ok=True)
    MAP_JSON.write_text(
        json.dumps(
            {
                "mode": "embedded-xref-per-file-v2",
                "models": model_map,
                "xrefs": xref_cache,
                "page_log": page_log,
                "stats": {
                    "catalog_products": len(products),
                    "unique_xrefs": len(xref_cache),
                    "models_mapped": len(model_map),
                    "unmapped": len(products) - len(model_map),
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    stats = {
        "unique_xrefs": len(xref_cache),
        "models_mapped": len(model_map),
        "unmapped": len(products) - len(model_map),
    }
    print(f"[yuksel-images] benzersiz embed: {stats['unique_xrefs']}")
    print(f"[yuksel-images] eslesen model: {stats['models_mapped']} / {len(products)}")
    print(f"[yuksel-images] gorselsiz: {stats['unmapped']}")

    if dry:
        return

    if apply_catalog:
        n = apply_map_to_catalog(model_map)
        print(f"[yuksel-images] katalog guncellendi: {n} kayit")


if __name__ == "__main__":
    main()
