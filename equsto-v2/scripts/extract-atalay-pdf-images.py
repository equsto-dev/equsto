# -*- coding: utf-8 -*-
"""
ATALAY 2025 PDF — ürün görselleri (model metnine göre fotoğraf eşlemesi).

Eski yatay dilimleme tablo sayfalarında yanlış görsel atıyordu; görseller üst bantta,
model satırları altta. Her SKU için search_for(model) + üstteki en yakın foto bloğu.

  python scripts/extract-atalay-pdf-images.py
  set ATALAY_PDF=c:\\path\\ATALAY 2025 YERLİ.pdf
"""
from __future__ import annotations

import hashlib
import json
import os
import re
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
CATALOG = Path(__file__).resolve().parent / "data" / "atalay-pdf-catalog.json"
RAW = Path(__file__).resolve().parent / "data" / "atalay-pdf-catalog-raw.json"
OUT_BASE = ROOT / "public" / "images" / "catalog" / "atalay"
MANIFEST_PATH = OUT_BASE / "_extract-manifest.json"

PDF = Path(
    os.environ.get(
        "ATALAY_PDF",
        r"c:\Users\User\Downloads\ATALAY 2025 YERLİ.pdf",
    )
)

MIN_PHOTO_W = 80
MIN_PHOTO_H = 80
MAX_PHOTO_Y = 600
MAX_PHOTO_ASPECT = 3.2
MIN_TABLE_Y = 240
MIN_JPG_BYTES = 5000
MIN_SAVE_ASPECT = 0.35
MIN_SAVE_WIDTH = 80
PAD = 6
CAPTION_GAP = 14
MIN_H_OVERLAP = 24
MAX_TOP_PAD = 2


def slug_file(model: str) -> str:
    s = "atalay-" + model.lower().replace(" ", "-").replace("+", "-plus-")
    return "".join(c if c.isalnum() or c in "-+" else "" for c in s)


def model_variants(model: str) -> list[str]:
    m = re.sub(r"\s+", " ", str(model or "").strip())
    if not m:
        return []
    out: list[str] = []
    seen: set[str] = set()

    def add(s: str) -> None:
        s = re.sub(r"\s+", " ", s.strip())
        if s and s not in seen:
            seen.add(s)
            out.append(s)

    add(m)
    add(m.replace(" / ", " /"))
    add(re.sub(r"\s*-\s*", " - ", m))
    add(re.sub(r"\s*-\s*", "-", m))
    add(m.replace(" ", ""))
    add(re.sub(r"\s+", "", m.replace(" - ", "-")))
    if m.upper().startswith("E "):
        add(m[2:].strip())
    return out


def search_rects(page: fitz.Page, model: str) -> list[fitz.Rect]:
    rects: list[fitz.Rect] = []
    seen: set[tuple[int, int, int, int]] = set()
    for q in model_variants(model):
        try:
            for r in page.search_for(q):
                key = (round(r.x0), round(r.y0), round(r.x1), round(r.y1))
                if key not in seen:
                    seen.add(key)
                    rects.append(r)
        except Exception:
            pass
    return rects


def pick_table_rect(rects: list[fitz.Rect]) -> fitz.Rect | None:
    """Fiyat tablosundaki model satırı — sayfa ortasındaki caption değil, en alttaki eşleşme."""
    if not rects:
        return None
    table = [r for r in rects if r.y0 > MIN_TABLE_Y and r.height < 80]
    if not table:
        table = list(rects)
    return max(table, key=lambda r: (r.y0, r.width))


def embedded_photos(page: fitz.Page) -> list[tuple[float, float, float, float, float]]:
    """PDF gömülü ürün fotoğrafları (get_image_info) — tablo sayfalarında güvenilir."""
    blocks: list[tuple[float, float, float, float, float]] = []
    pr = page.rect
    for info in page.get_image_info():
        x0, y0, x1, y1 = info["bbox"]
        w, h = x1 - x0, y1 - y0
        if w < 100 or h < 70:
            continue
        if h / max(w, 1) > 2.8 or w / max(h, 1) > 3.5:
            continue
        if y0 > pr.y0 + pr.height * 0.72:
            continue
        blocks.append((y0, x0, x1, y1, w * h))
    blocks.sort(key=lambda t: (t[0], t[1]))
    return blocks


def bbox_iou(
    a: tuple[float, float, float, float],
    b: tuple[float, float, float, float],
) -> float:
    ax0, ay0, ax1, ay1 = a
    bx0, by0, bx1, by1 = b
    ix0, iy0 = max(ax0, bx0), max(ay0, by0)
    ix1, iy1 = min(ax1, bx1), min(ay1, by1)
    if ix1 <= ix0 or iy1 <= iy0:
        return 0.0
    inter = (ix1 - ix0) * (iy1 - iy0)
    area_a = max(1.0, (ax1 - ax0) * (ay1 - ay0))
    area_b = max(1.0, (bx1 - bx0) * (by1 - by0))
    return inter / (area_a + area_b - inter)


def match_embedded_photo(
    model_rect: fitz.Rect,
    photos: list[tuple[float, float, float, float, float]],
    used: list[tuple[float, float, float, float]] | None = None,
) -> tuple[float, float, float, float] | None:
    if not photos:
        return None
    kcx = (model_rect.x0 + model_rect.x1) / 2
    scored: list[tuple[float, tuple[float, float, float, float]]] = []
    for y0, x0, x1, y1, area in photos:
        if y1 > model_rect.y0 + 12:
            continue
        bbox = (x0, y0, x1, y1)
        if used and any(bbox_iou(bbox, u) > 0.45 for u in used):
            continue
        overlap = min(x1, model_rect.x1) - max(x0, model_rect.x0)
        pcx = (x0 + x1) / 2
        gap = max(0, model_rect.y0 - y1)
        score = abs(pcx - kcx) * 3 - gap * 0.3 - min(area, 150000) * 0.0002
        if gap < 80:
            score += 100
        if overlap < 20:
            score += 90
        scored.append((score, bbox))
    if not scored:
        return None
    scored.sort(key=lambda t: t[0])
    return scored[0][1]


def photo_blocks(page: fitz.Page) -> list[tuple[float, float, float, float, float]]:
    blocks: list[tuple[float, float, float, float, float]] = []
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") != 1:
            continue
        x0, y0, x1, y1 = b["bbox"]
        w, h = x1 - x0, y1 - y0
        if w < MIN_PHOTO_W or h < MIN_PHOTO_H:
            continue
        if y0 > MAX_PHOTO_Y:
            continue
        if w / max(h, 1) > MAX_PHOTO_ASPECT or h / max(w, 1) > MAX_PHOTO_ASPECT:
            continue
        blocks.append((y0, x0, x1, y1, w * h))
    blocks.sort(key=lambda t: (t[0], t[1]))
    return blocks


def match_photo(
    model_rect: fitz.Rect,
    photos: list[tuple[float, float, float, float, float]],
    used: list[tuple[float, float, float, float]] | None = None,
) -> tuple[float, float, float, float] | None:
    if not photos:
        return None
    mcx = (model_rect.x0 + model_rect.x1) / 2
    my0 = model_rect.y0

    above = [p for p in photos if p[0] < my0 + 40]
    pool = above if above else photos

    scored: list[tuple[float, float, tuple[float, float, float, float]]] = []
    for y0, x0, x1, y1, area in pool:
        bbox = (x0, y0, x1, y1)
        if used and any(bbox_iou(bbox, u) > 0.45 for u in used):
            continue
        overlap = min(x1, model_rect.x1) - max(x0, model_rect.x0)
        pcx = (x0 + x1) / 2
        dx = abs(pcx - mcx)
        dy = max(0, my0 - y1)
        score = dx * 4 + dy * 0.8 - min(area, 200000) * 0.00015
        if overlap < MIN_H_OVERLAP:
            score += 120
        scored.append((score, overlap, bbox))
    if not scored:
        return None
    scored.sort(key=lambda t: t[0])
    return scored[0][2]


def tighten_bbox_to_table(
    bbox: tuple[float, float, float, float],
    model_rect: fitz.Rect,
) -> tuple[float, float, float, float] | None:
    """Foto altındaki model yazısı (caption) kırpımda kalmasın."""
    x0, y0, x1, y1 = bbox
    cap_y = model_rect.y0 - CAPTION_GAP
    if y1 > cap_y:
        y1 = cap_y
    if y1 - y0 < MIN_PHOTO_H:
        return None
    return (x0, y0, x1, y1)


def clip_photo(page: fitz.Page, bbox: tuple[float, float, float, float]) -> fitz.Rect:
    pr = page.rect
    x0, y0, x1, y1 = bbox
    clip = fitz.Rect(
        max(pr.x0, x0 - PAD),
        max(pr.y0, y0 + MAX_TOP_PAD),
        min(pr.x1, x1 + PAD),
        min(pr.y1, y1 + PAD),
    )
    return clip & pr


def pixmap_is_strip(pix: fitz.Pixmap) -> bool:
    if pix.height < 1:
        return True
    return pix.width / pix.height < MIN_SAVE_ASPECT or pix.width < MIN_SAVE_WIDTH


def save_jpg(pix: fitz.Pixmap, out: Path) -> bool:
    try:
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        if pixmap_is_strip(pix):
            return False
        pix.save(str(out), jpg_quality=88)
        if not out.exists() or out.stat().st_size < MIN_JPG_BYTES:
            return False
        trim_label_band_jpg(out)
        return out.stat().st_size >= MIN_JPG_BYTES
    except Exception:
        return False


def trim_label_band_jpg(out: Path) -> None:
    """PDF foto bloğunun altındaki model kodu yazısını JPEG'ten kırp."""
    try:
        from PIL import Image
    except ImportError:
        return
    try:
        im = Image.open(out)
        w, h = im.size
        crop_b = min(48, max(14, int(h * 0.13)))
        crop_t = min(56, max(10, int(h * 0.12)))
        if h - crop_b - crop_t < 72:
            return
        im = im.crop((0, crop_t, w, h - crop_b))
        im.save(out, quality=88, optimize=True)
    except Exception:
        pass


def fallback_strip_clip(page: fitz.Page, index: int, total: int) -> fitz.Rect:
    rect = page.rect
    zone_top = rect.y0 + rect.height * 0.12
    zone_bot = rect.y0 + rect.height * 0.52
    zone = fitz.Rect(rect.x0, zone_top, rect.x1, zone_bot)
    n = max(total, 1)
    slice_w = zone.width / n
    x0 = zone.x0 + index * slice_w
    x1 = zone.x0 + (index + 1) * slice_w if index < n - 1 else zone.x1
    return fitz.Rect(x0, zone.y0, x1, zone.y1)


def process_page(
    page: fitz.Page,
    page_no: int,
    items: list[dict],
    manifest: dict,
    stats: dict,
) -> None:
    photos = photo_blocks(page)
    embedded = embedded_photos(page)
    mat = fitz.Matrix(2.5, 2.5)
    out_dir = OUT_BASE / f"p{page_no}"
    out_dir.mkdir(parents=True, exist_ok=True)

    ordered = sorted(
        items,
        key=lambda p: (
            pick_table_rect(search_rects(page, p.get("model") or "")) or fitz.Rect(0, 9999, 0, 9999)
        ).y0,
    )

    used_bboxes: list[tuple[float, float, float, float]] = []
    page_hashes: set[str] = set()
    photos_pool: list[tuple[float, float, float, float, float]] = sorted(
        embedded, key=lambda t: (t[1], t[0])
    )

    def take_photo_for_rect(mrect: fitz.Rect) -> tuple[float, float, float, float] | None:
        nonlocal photos_pool
        if not photos_pool:
            return None
        kcx = (mrect.x0 + mrect.x1) / 2
        best_i = min(
            range(len(photos_pool)),
            key=lambda j: abs((photos_pool[j][1] + photos_pool[j][2]) / 2 - kcx),
        )
        y0, x0, x1, y1, _area = photos_pool.pop(best_i)
        return (x0, y0, x1, y1)

    for i, p in enumerate(ordered):
        model = p.get("model") or p.get("modelCode")
        if not model:
            continue
        mrect = pick_table_rect(search_rects(page, model))
        clip = None
        bbox = None
        if mrect and photos_pool:
            bbox = take_photo_for_rect(mrect)
        elif mrect and embedded:
            bbox = match_embedded_photo(mrect, embedded, used_bboxes)
        if mrect and not bbox and photos:
            bbox = match_photo(mrect, photos, used_bboxes)
        if bbox and mrect:
            bbox = tighten_bbox_to_table(bbox, mrect)
        if bbox:
            clip = clip_photo(page, bbox)
            used_bboxes.append(bbox)
            stats["matched"] += 1
        if clip is None and mrect and embedded:
            bbox = match_embedded_photo(mrect, embedded, used_bboxes)
            if bbox:
                clip = clip_photo(page, bbox)
                used_bboxes.append(bbox)
                stats["matched"] += 1
        if clip is None and len(ordered) > 1:
            clip = fallback_strip_clip(page, i, len(ordered))
            stats["fallback"] += 1
        if clip is None:
            stats["fallback"] += 1
            continue

        fname = slug_file(model) + ".jpg"
        out = out_dir / fname

        def render_and_save(clip_rect: fitz.Rect) -> bool:
            pix = page.get_pixmap(matrix=mat, clip=clip_rect, alpha=False)
            if pixmap_is_strip(pix):
                return False
            return save_jpg(pix, out)

        clips_try: list[fitz.Rect] = [clip]
        if len(ordered) > 1:
            fb = fallback_strip_clip(page, i, len(ordered))
            if fb not in clips_try:
                clips_try.append(fb)

        saved = False
        digest = ""
        any_render = False
        for clip_rect in clips_try:
            if not render_and_save(clip_rect):
                continue
            any_render = True
            digest = hashlib.md5(out.read_bytes()).hexdigest()
            if digest not in page_hashes:
                saved = True
                break

        if saved:
            page_hashes.add(digest)
            rel = f"images/catalog/atalay/p{page_no}/{fname}"
            manifest[model] = f"/{rel}"
            p["images"] = [rel]
            stats["ok"] += 1
        elif any_render:
            if out.exists():
                out.unlink(missing_ok=True)
            stats["dup_skip"] += 1
        else:
            stats["strip_skip"] += 1
            if model in manifest:
                del manifest[model]


def patch_dept_targets() -> list[Path]:
    roots = [
        ROOT / "public",
        Path("C:/D Disk/EQUSTO-CURSOR/equsto-v2/public"),
    ]
    out: list[Path] = []
    for r in roots:
        d = r / "data" / "dept"
        if d.is_dir():
            out.append(d)
    return out


def patch_dept_files(manifest: dict) -> int:
    total = 0
    seen: set[str] = set()
    for dept_dir in patch_dept_targets():
        key = str(dept_dir)
        if key in seen:
            continue
        seen.add(key)
        for dept_file in dept_dir.glob("*.json"):
            rows = json.loads(dept_file.read_text(encoding="utf-8"))
            changed = 0
            for row in rows:
                if "atalay" not in str(row.get("brand", "")).lower():
                    continue
            model = str(row.get("model") or "").strip()
            if not model:
                continue
            cur = str((row.get("images") or [""])[0]).replace("\\", "/")
            if "/catalog/atalay/cafemarkt/" in cur:
                continue
            hit = manifest.get(model)
            if not hit:
                continue
            rel = hit.lstrip("/")
            if row.get("images") != [rel]:
                row["images"] = [rel]
                changed += 1
            if changed:
                dept_file.write_text(
                    json.dumps(rows, ensure_ascii=False), encoding="utf-8"
                )
                print(
                    f"  dept {dept_file.parent.parent.name}/{dept_file.name}: {changed} gorsel"
                )
                total += changed
    return total


def strip_legacy_atalay() -> int:
    """PDF kataloğu dışı eski Atalay satırlarını dept dosyalarından çıkar."""
    removed = 0
    dept_dir = ROOT / "public" / "data" / "dept"
    for dept_file in dept_dir.glob("*.json"):
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        kept = []
        for row in rows:
            if "atalay" not in str(row.get("brand", "")).lower():
                kept.append(row)
                continue
            k = row.get("kaynak_fiyat_listesi") or row.get("kaynak") or ""
            img = str((row.get("images") or [""])[0]).replace("\\", "/")
            if re.match(r"^atalay-2025", k) or "/catalog/atalay/" in img:
                kept.append(row)
            else:
                removed += 1
        if len(kept) != len(rows):
            dept_file.write_text(json.dumps(kept, ensure_ascii=False), encoding="utf-8")
    return removed


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"PDF yok: {PDF}")

    src = CATALOG if CATALOG.exists() else RAW
    if not src.exists():
        raise SystemExit(f"Katalog yok: {src} (once npm run catalog:atalay:build)")

    data = json.loads(src.read_text(encoding="utf-8"))
    products = data.get("products") or []
    by_page: dict[int, list] = defaultdict(list)
    for p in products:
        if p.get("_doner"):
            continue
        kaynak = str(p.get("kaynak_fiyat_listesi") or p.get("kaynak") or "")
        if "doner" in kaynak:
            continue
        page = int(p.get("page") or p.get("pdf_page") or 0)
        model = p.get("model") or p.get("modelCode")
        if page and model:
            by_page[page].append(p)

    doc = fitz.open(PDF)
    manifest: dict[str, str] = {}
    if MANIFEST_PATH.exists():
        try:
            manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}
    stats = {
        "ok": 0,
        "matched": 0,
        "fallback": 0,
        "skip_small": 0,
        "strip_skip": 0,
        "dup_skip": 0,
        "kept_prev": 0,
    }

    for page_no, items in sorted(by_page.items()):
        if page_no < 1 or page_no > doc.page_count:
            continue
        process_page(doc[page_no - 1], page_no, items, manifest, stats)

    doc.close()

    if CATALOG.exists():
        data["imageManifest"] = {k: v.lstrip("/") for k, v in manifest.items()}
        CATALOG.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

    OUT_BASE.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    patched = patch_dept_files(manifest)
    legacy = strip_legacy_atalay()

    doner_manifest = OUT_BASE / "doner" / "_extract-manifest.json"
    if doner_manifest.exists():
        dm = json.loads(doner_manifest.read_text(encoding="utf-8"))
        for k, v in dm.items():
            manifest[k] = v if str(v).startswith("/") else f"/{v}"
        MANIFEST_PATH.write_text(
            json.dumps(manifest, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        patched += patch_dept_files(manifest)

    print(
        f"[atalay-images] {stats['ok']} gorsel, {len(by_page)} sayfa, "
        f"matched={stats['matched']} fallback={stats['fallback']} "
        f"skip_small={stats['skip_small']} strip_skip={stats['strip_skip']} "
        f"dup_skip={stats['dup_skip']} "
        f"kept_prev={stats['kept_prev']} dept_patch={patched} legacy_removed={legacy}"
    )


if __name__ == "__main__":
    main()
