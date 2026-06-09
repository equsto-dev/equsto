#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SENOX PDF — tüm gömülü ürün görselleri (xref sökümü + bbox render).

  1. Her sayfadaki ürün xref'lerini topla → embed/x{xref}.jpg (CMYK→RGB)
  2. Küçük/bozuk xref → sayfa bbox render (3×)
  3. Senox başlık bloklarına göre grup eşlemesi
  4. Varyant mirası (SNX-25-B → SNX-25)

  python scripts/extract-senox-pdf-images.py [--purge]
"""
from __future__ import annotations

import json
import os
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
    Image = None  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "scripts" / "data" / "senox" / "senox-pdf-catalog.json"
EMBED_DIR = ROOT / "scripts" / "data" / "senox" / "images" / "embed"
MODEL_DIR = ROOT / "scripts" / "data" / "senox" / "images"
MAP_JSON = ROOT / "scripts" / "data" / "senox" / "pdf-images-map.json"

PDF = Path(
    os.environ.get(
        "SENOX_PDF",
        r"c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf",
    )
)

MIN_IMG_W = 65
MIN_IMG_H = 65
MIN_AREA = 7000
MAX_BANNER_ASPECT = 6.5
MIN_PAGE_COVER = 0.52
MIN_OUTPUT_DIM = 150
RENDER_MATRIX = fitz.Matrix(3, 3)

TITLE_RE = re.compile(r"^\s*(?:Senox|SENOX)[-\s]", re.I)
SKIP_TITLE = re.compile(
    r"endüstriyel\s+mutfak|temelleri|markasının|faaliyet|www\.",
    re.I,
)


def norm_model(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").upper()
    tr = str.maketrans("İĞÜŞÖÇ", "IGUSOC")
    return re.sub(r"[^A-Z0-9]", "", s.translate(tr))


def slug_model(model: str) -> str:
    s = unicodedata.normalize("NFKC", model or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return ("senox-" + s.strip("-"))[:80]


def family_keys(model: str) -> list[str]:
    """Varyant → ana model anahtarları (miras için)."""
    m = unicodedata.normalize("NFKC", model or "").upper().strip()
    keys = [norm_model(m)]
    if re.match(r"SNX-\d+-[A-Z]$", m):
        keys.append(norm_model(m.rsplit("-", 1)[0]))
    if re.match(r"SNX-\d+-[A-Z]{2,5}$", m):
        base = "-".join(m.split("-")[:2])
        keys.append(norm_model(base))
    dm = re.match(r"^(DT|DW)\s?(\d+)", m.replace("-", " "))
    if dm:
        keys.append(norm_model(f"{dm.group(1)}{dm.group(2)}"))
    cf = re.match(r"^CF(\d+)KROM$", m.replace("-", ""))
    if cf:
        keys.append(norm_model(f"CF{cf.group(1)}KROM"))
    return list(dict.fromkeys(keys))


def is_background_bbox(bbox, page_rect: fitz.Rect) -> bool:
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    if w * h >= page_rect.width * page_rect.height * MIN_PAGE_COVER:
        return True
    if w >= page_rect.width * 0.9 and h >= page_rect.height * 0.32:
        return True
    return False


def product_images(page: fitz.Page) -> list[dict]:
    pr = page.rect
    imgs: list[dict] = []
    seen_xref: set[int] = set()
    for info in page.get_image_info(xrefs=True):
        xref = int(info["xref"])
        if xref in seen_xref:
            continue
        seen_xref.add(xref)
        bbox = info["bbox"]
        x0, y0, x1, y1 = bbox
        w, h = x1 - x0, y1 - y0
        area = w * h
        if w < MIN_IMG_W or h < MIN_IMG_H or area < MIN_AREA:
            continue
        if is_background_bbox(bbox, pr):
            continue
        if w / max(h, 1) > MAX_BANNER_ASPECT or h / max(w, 1) > MAX_BANNER_ASPECT:
            continue
        imgs.append(
            {
                "xref": xref,
                "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                "cx": (x0 + x1) / 2,
                "cy": (y0 + y1) / 2,
                "area": area,
            }
        )
    imgs.sort(key=lambda i: (i["y0"], i["x0"]))
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
        1 for x in range(w) for y in range(h)
        if px[x, y][2] > px[x, y][0] + 15 and _lum(px[x, y]) > 190
    )
    return purple > w * h * 0.005


def flatten_to_white_bg(path: Path) -> bool:
    if Image is None or not path.is_file():
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
        q.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        q.extend([(0, y), (w - 1, y)])
    while q:
        x, y = q.pop()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if bg[i] or not _is_bg_like(px[x, y], refs):
            continue
        bg[i] = 1
        q.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    for y in range(h):
        for x in range(w):
            if bg[y * w + x]:
                px[x, y] = (255, 255, 255)
    im.save(path, "JPEG", quality=90, optimize=True)
    return True


def image_dims(path: Path) -> tuple[int, int] | None:
    if Image is None or not path.is_file():
        return None
    try:
        with Image.open(path) as im:
            return im.size
    except Exception:
        return None


def rect_from_bbox(bbox) -> fitz.Rect:
    if isinstance(bbox, fitz.Rect):
        return bbox
    if isinstance(bbox, dict):
        return fitz.Rect(bbox["x0"], bbox["y0"], bbox["x1"], bbox["y1"])
    if isinstance(bbox, (list, tuple)) and len(bbox) >= 4:
        return fitz.Rect(bbox[0], bbox[1], bbox[2], bbox[3])
    raise TypeError(f"bbox: {type(bbox)}")


def render_bbox(page: fitz.Page, bbox, dest: Path) -> Path | None:
    out = dest.with_suffix(".jpg")
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        clip = rect_from_bbox(bbox) & page.rect
        clip = clip + (-4, -4, 4, 4)
        clip &= page.rect
        if clip.width < 20 or clip.height < 20:
            return None
        pix = page.get_pixmap(matrix=RENDER_MATRIX, clip=clip, alpha=False)
        pix.save(str(out), jpg_quality=92)
        if out.stat().st_size > 400:
            flatten_to_white_bg(out)
            return out
    except Exception:
        pass
    out.unlink(missing_ok=True)
    return None


def save_embed_xref(
    doc: fitz.Document, xref: int, dest: Path, page: fitz.Page | None = None, bbox=None
) -> Path | None:
    """CMYK/masklı PDF görselleri — ham bytes tarayıcıda bozuk; daima RGB Pixmap."""
    out = dest.with_suffix(".jpg")
    out.parent.mkdir(parents=True, exist_ok=True)
    best: Path | None = None
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.alpha or pix.n > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(str(out), jpg_quality=92)
        if out.stat().st_size > 400:
            flatten_to_white_bg(out)
            dims = image_dims(out)
            if dims and min(dims) >= MIN_OUTPUT_DIM:
                return out
            best = out
    except Exception:
        pass
    if page is not None and bbox is not None:
        rendered = render_bbox(page, bbox, dest)
        if rendered:
            rd = image_dims(rendered)
            bd = image_dims(best) if best else None
            if rd and (not bd or min(rd) > min(bd)):
                if best and best != rendered:
                    best.unlink(missing_ok=True)
                return rendered
            if not best:
                return rendered
    if best and best.is_file() and best.stat().st_size > 400:
        return best
    out.unlink(missing_ok=True)
    return None


def collect_lines(page: fitz.Page) -> list[dict]:
    rows: list[dict] = []
    for b in page.get_text("dict").get("blocks", []):
        if b.get("type") != 0:
            continue
        for ln in b.get("lines", []):
            text = re.sub(r"\s+", " ", unicodedata.normalize("NFKC", "".join(
                s.get("text", "") for s in ln.get("spans", [])
            ).replace("\u00a0", " "))).strip()
            if not text:
                continue
            x0, y0, x1, y1 = ln["bbox"]
            rows.append({"text": text, "x0": x0, "y0": y0, "x1": x1, "y1": y1, "cx": (x0 + x1) / 2})
    rows.sort(key=lambda r: (r["y0"], r["x0"]))
    return rows


def is_title_line(line: str) -> bool:
    if len(line) < 10 or len(line) > 110 or SKIP_TITLE.search(line):
        return False
    return bool(TITLE_RE.match(line))


def title_y_for_product(p: dict, titles: list[dict]) -> float:
    ay = p.get("anchorY") or 0
    above = [t for t in titles if t["y0"] <= ay + 40]
    if not above:
        return -1.0
    return max(above, key=lambda t: t["y0"])["y0"]


def family_group_key(model: str) -> str:
    m = model.upper()
    if re.match(r"SNX-\d+-[A-Z]$", m):
        return m.rsplit("-", 1)[0]
    if re.match(r"SNX-\d+-[A-Z]{2,5}$", m):
        return "-".join(m.split("-")[:2])
    return model


def search_variants(model: str, title: str) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()

    def add(s: str) -> None:
        s = re.sub(r"\s+", " ", s.strip())
        if s and s not in seen and len(s) >= 2:
            seen.add(s)
            out.append(s)

    add(model)
    add(model.replace("-", " "))
    add(re.sub(r"(\d)(LK)", r"\1 \2", model, flags=re.I))
    if title:
        add(title)
        add(re.sub(r"^(?:Senox|SENOX)[-\s]+", "", title, flags=re.I))
    return out


def search_rect(page: fitz.Page, model: str, title: str) -> fitz.Rect | None:
    rects: list[fitz.Rect] = []
    for q in search_variants(model, title):
        try:
            rects.extend(page.search_for(q))
        except Exception:
            pass
    if not rects:
        return None
    return min(rects, key=lambda r: r.y0)


def match_spatial(imgs: list[dict], mrect: fitz.Rect, used: set[int]) -> dict | None:
    pool = [im for im in imgs if im["xref"] not in used]
    if not pool:
        return None
    mx, my = (mrect.x0 + mrect.x1) / 2, mrect.y0

    def score(im: dict) -> float:
        gap = max(0, my - im["y1"])
        dx = abs(im["cx"] - mx)
        pen = 0.0
        if im["x0"] > mrect.x1 + 60:
            pen += 150
        if im["y0"] > my + 40:
            pen += 400
        return dx * 2 + gap * 0.5 + pen - min(im["area"], 100000) * 0.0002

    return min(pool, key=score)


def assign_page_order(prods: list[dict], imgs: list[dict], used_xrefs: set[int]) -> dict[str, dict]:
    out: dict[str, dict] = {}
    free_imgs = [im for im in imgs if im["xref"] not in used_xrefs]
    pending = [p for p in prods if norm_model(p["model"]) not in out]
    if not pending or not free_imgs:
        return out

    pending.sort(key=lambda p: (p.get("anchorY") or 0, p.get("anchorX") or 0))
    free_imgs.sort(key=lambda im: (im["y0"], im["x0"]))

    if len(free_imgs) == len(pending):
        for p, im in zip(pending, free_imgs):
            out[norm_model(p["model"])] = im
        return out

    if len(pending) >= 2 and len(free_imgs) >= 2:
        px = sorted(set(round(p.get("anchorX") or 0, -1) for p in pending))
        ix = sorted(set(round(im["cx"], -1) for im in free_imgs))
        if len(px) == len(ix) == len(free_imgs) == len(pending):
            for pxv, ixv in zip(px, ix):
                pp = [p for p in pending if round(p.get("anchorX") or 0, -1) == pxv]
                ii = [im for im in free_imgs if round(im["cx"], -1) == ixv]
                pp.sort(key=lambda p: p.get("anchorY") or 0)
                ii.sort(key=lambda im: im["y0"])
                for p, im in zip(pp, ii):
                    out[norm_model(p["model"])] = im
            return out
    return out


def assign_by_title_blocks(
    prods: list[dict], page: fitz.Page, imgs: list[dict], used_xrefs: set[int]
) -> dict[str, dict]:
    """Senox başlık blokları: her bloktaki ürünler aynı görseli paylaşır."""
    rows = collect_lines(page)
    titles = [r for r in rows if is_title_line(r["text"])]
    if not titles:
        return {}

    titles.sort(key=lambda t: t["y0"])
    groups: dict[float, list[dict]] = defaultdict(list)
    for p in prods:
        groups[title_y_for_product(p, titles)].append(p)

    out: dict[str, dict] = {}
    title_ys = sorted(ty for ty in groups if ty >= 0)
    if not title_ys:
        return {}

    for idx, ty in enumerate(title_ys):
        next_y = title_ys[idx + 1] if idx + 1 < len(title_ys) else page.rect.height + 1
        band_imgs = [
            im for im in imgs
            if im["xref"] not in used_xrefs and ty - 20 <= im["y0"] < next_y + 30
        ]
        if not band_imgs:
            band_imgs = [im for im in imgs if im["xref"] not in used_xrefs]
        if not band_imgs:
            continue
        band_imgs.sort(key=lambda im: (-im["area"], im["y0"]))
        im = band_imgs[0]
        for p in groups[ty]:
            out[norm_model(p["model"])] = im
    return out


def assign_by_family_groups(
    prods: list[dict], page: fitz.Page, imgs: list[dict], used_xrefs: set[int]
) -> dict[str, dict]:
    """Renk/varyant grupları (SNX-17-*, SNX-25-*) — grup başına bir görsel."""
    groups: dict[str, list[dict]] = defaultdict(list)
    for p in prods:
        groups[family_group_key(p["model"])].append(p)

    out: dict[str, dict] = {}
    free = [im for im in imgs if im["xref"] not in used_xrefs]
    free.sort(key=lambda im: (im["y0"], im["x0"]))

    multi = {k: v for k, v in groups.items() if len(v) > 1}
    if not multi or not free:
        return out

    for gkey, gprods in sorted(multi.items(), key=lambda x: min(p.get("anchorY") or 0 for p in x[1])):
        if not free:
            break
        gprods.sort(key=lambda p: (p.get("anchorY") or 0, p.get("anchorX") or 0))
        anchor = gprods[0]
        mrect = search_rect(page, anchor["model"], anchor.get("title", ""))
        if mrect:
            im = match_spatial(imgs, mrect, used_xrefs)
        else:
            im = free[0]
        if not im:
            continue
        for p in gprods:
            out[norm_model(p["model"])] = im
        if im["xref"] in {x["xref"] for x in free}:
            free = [x for x in free if x["xref"] != im["xref"]]
    return out


def write_alias(embed_file: Path, model: str) -> str:
    ext = embed_file.suffix.lower() or ".jpg"
    alias = MODEL_DIR / f"{slug_model(model)}_1{ext}"
    alias.parent.mkdir(parents=True, exist_ok=True)
    if not alias.is_file() or alias.stat().st_size != embed_file.stat().st_size:
        alias.write_bytes(embed_file.read_bytes())
    return str(alias.relative_to(ROOT / "scripts" / "data" / "senox")).replace("\\", "/")


def assign_grid_zip(prods: list[dict], imgs: list[dict], used_xrefs: set[int], mapped: set[str]) -> dict[str, dict]:
    """2 sütunlu KOD tabloları — (y band, x) sıralı zip."""
    pending = [p for p in prods if norm_model(p["model"]) not in mapped]
    free = [im for im in imgs if im["xref"] not in used_xrefs]
    if not pending or not free:
        return {}
    pending.sort(key=lambda p: (round((p.get("anchorY") or 0) / 180), p.get("anchorX") or 0))
    free.sort(key=lambda im: (round(im["y0"] / 180), im["x0"]))
    if len(pending) == len(free):
        return {norm_model(p["model"]): im for p, im in zip(pending, free)}
    return {}


def assign_nearest_y(prods: list[dict], imgs: list[dict], mapped: set[str], *, allow_reuse: bool = True) -> dict[str, dict]:
    """Tablo satırları — her ürün en yakın y konumlu görsel (paylaşımlı olabilir)."""
    pending = [p for p in prods if norm_model(p["model"]) not in mapped]
    if not pending or not imgs:
        return {}
    out: dict[str, dict] = {}
    for p in sorted(pending, key=lambda x: (x.get("anchorY") or 0, x.get("anchorX") or 0)):
        py = p.get("anchorY") or 0
        px = p.get("anchorX") or 0
        im = min(imgs, key=lambda i: abs(i["cy"] - py) * 2 + abs(i["cx"] - px) * 0.3)
        out[norm_model(p["model"])] = im
    return out


def match_im_for_product(p: dict, imgs: list[dict]) -> dict | None:
    if not imgs:
        return None
    py = p.get("anchorY") or 0
    px = p.get("anchorX") or 0
    return min(imgs, key=lambda i: abs(i["cy"] - py) * 2 + abs(i["cx"] - px) * 0.3)


def save_model_image(page: fitz.Page, im: dict, model: str, pg: int) -> str | None:
    """Her ürün — kendi sayfa bbox'ından 3× render (xref paylaşımı yok)."""
    slug = slug_model(model)
    rendered = render_bbox(page, im, EMBED_DIR / f"p{pg}-{slug}")
    alias = MODEL_DIR / f"{slug}_1.jpg"
    if not rendered:
        rendered = render_bbox(page, im, alias.with_suffix(""))
    if not rendered:
        return None
    alias.parent.mkdir(parents=True, exist_ok=True)
    if alias.resolve() != rendered.resolve():
        alias.write_bytes(rendered.read_bytes())
    return str(alias.relative_to(ROOT / "scripts" / "data" / "senox")).replace("\\", "/")


def main() -> None:
    dry = "--dry-run" in sys.argv
    if "--purge" in sys.argv and not dry:
        for d in (EMBED_DIR, MODEL_DIR):
            if d.is_dir():
                for f in d.rglob("*"):
                    if f.is_file():
                        f.unlink(missing_ok=True)
                print(f"[senox-images] temizlendi: {d}")
    if not CATALOG.is_file():
        print("Once: python scripts/extract-senox-pdf-catalog.py")
        sys.exit(1)
    if not PDF.is_file():
        print("PDF yok:", PDF)
        sys.exit(1)

    data = json.loads(CATALOG.read_text(encoding="utf-8"))
    products = data.get("products") or []
    by_page: dict[int, list[dict]] = defaultdict(list)
    for p in products:
        by_page[int(p.get("page") or 0)].append(p)

    doc = fitz.open(PDF)
    im_map: dict[str, dict] = {}  # norm_model -> placement dict
    used_by_page: dict[int, set[int]] = defaultdict(set)
    stats = {"rendered": 0, "matched": 0, "pass2": 0, "family": 0, "orphan_xrefs": 0}

    def used_on(pg: int) -> set[int]:
        return used_by_page[pg]

    def apply_pairs(
        pairs: dict[str, dict],
        prods: list[dict],
        page: fitz.Page,
        pg: int,
        counter: str,
        *,
        mark_used: bool = True,
    ) -> None:
        nonlocal stats
        for key, im in pairs.items():
            if key in im_map:
                continue
            if not next((x for x in prods if norm_model(x["model"]) == key), None):
                continue
            im_map[key] = im
            if mark_used:
                used_by_page[pg].add(im["xref"])
            stats[counter] += 1

    # Geçiş 1: başlık blokları (çoklu varyant sayfaları)
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        pairs = assign_by_title_blocks(prods, page, imgs, used_on(pg))
        apply_pairs(pairs, prods, page, pg, "matched")

    # Geçiş 2: grid zip (KOD tabloları, eşit sayı)
    mapped_keys = set(im_map.keys())
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        pairs = assign_grid_zip(prods, imgs, used_on(pg), mapped_keys | set(im_map.keys()))
        apply_pairs(pairs, prods, page, pg, "matched")
        mapped_keys = set(im_map.keys())

    # Geçiş 3: sayfa sıra eşlemesi
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        pairs = assign_page_order(prods, imgs, used_on(pg))
        apply_pairs(pairs, prods, page, pg, "matched")

    # Geçiş 3b: en yakın y (tablo sayfaları, görsel paylaşımı)
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        need = [p for p in prods if norm_model(p["model"]) not in im_map]
        if not need:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        if not imgs:
            continue
        pairs = assign_nearest_y(prods, imgs, set(im_map.keys()))
        apply_pairs(pairs, prods, page, pg, "pass2", mark_used=False)

    # Geçiş 4: aile grupları (SNX-17-B, SNX-25-C …)
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        pairs = assign_by_family_groups(prods, page, imgs, used_on(pg))
        apply_pairs(pairs, prods, page, pg, "family")

    # Geçiş 5: search_for + spatial
    for p in products:
        key = norm_model(p["model"])
        if key in im_map:
            continue
        pg = int(p.get("page") or 0)
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        imgs = product_images(page)
        mrect = search_rect(page, p["model"], p.get("title", ""))
        if not mrect and p.get("anchorY"):
            mrect = fitz.Rect(
                p.get("anchorX", 0) - 20, p["anchorY"],
                p.get("anchorX", 0) + 20, p["anchorY"] + 10,
            )
        im = match_spatial(imgs, mrect, used_on(pg)) if mrect else None
        if not im:
            free = [x for x in imgs if x["xref"] not in used_on(pg)]
            im = free[0] if free else None
        if not im:
            continue
        im_map[key] = im
        used_by_page[pg].add(im["xref"])
        stats["pass2"] += 1

    # Geçiş 6: kalan xref → kalan ürün (1:1 sıra)
    for pg, prods in sorted(by_page.items()):
        if pg < 1 or pg > doc.page_count:
            continue
        page = doc[pg - 1]
        free = [im for im in product_images(page) if im["xref"] not in used_on(pg)]
        need = [p for p in prods if norm_model(p["model"]) not in im_map]
        free.sort(key=lambda im: (im["y0"], im["x0"]))
        need.sort(key=lambda p: (p.get("anchorY") or 0, p.get("anchorX") or 0))
        for p, im in zip(need, free):
            key = norm_model(p["model"])
            im_map[key] = im
            used_by_page[pg].add(im["xref"])
            stats["pass2"] += 1

    # Geçiş 7: varyant mirası (aynı bbox)
    for p in products:
        key = norm_model(p["model"])
        if key in im_map:
            continue
        for fk in family_keys(p["model"]):
            if fk in im_map:
                im_map[key] = im_map[fk]
                stats["family"] += 1
                break

    # Geçiş 8: eksikler → en yakın görsel
    for p in products:
        key = norm_model(p["model"])
        if key in im_map:
            continue
        pg = int(p.get("page") or 0)
        if pg < 1 or pg > doc.page_count:
            continue
        imgs = product_images(doc[pg - 1])
        im = match_im_for_product(p, imgs)
        if im:
            im_map[key] = im

    all_xrefs: set[int] = set()
    all_used: set[int] = set()
    for v in used_by_page.values():
        all_used |= v
    for pi in range(3, doc.page_count):
        for im in product_images(doc[pi]):
            all_xrefs.add(im["xref"])
    stats["orphan_xrefs"] = len(all_xrefs - all_used)

    # FINAL: her ürün bbox render → doğru kırpım
    model_map: dict[str, str] = {}
    if not dry:
        for p in products:
            key = norm_model(p["model"])
            pg = int(p.get("page") or 0)
            if pg < 1 or pg > doc.page_count:
                continue
            im = im_map.get(key)
            if not im:
                imgs = product_images(doc[pg - 1])
                im = match_im_for_product(p, imgs)
            if not im:
                continue
            rel = save_model_image(doc[pg - 1], im, p["model"], pg)
            if rel:
                model_map[key] = rel
                stats["rendered"] += 1

    doc.close()

    if not dry:
        for p in data.get("products", []):
            rel = model_map.get(norm_model(p.get("model", "")))
            if rel:
                p["localImage"] = rel
                p["imageMethod"] = "bbox-render-v4"
        CATALOG.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    MAP_JSON.write_text(
        json.dumps(
            {
                "mode": "bbox-render-v4",
                "models": model_map,
                "stats": {
                    "catalog": len(products),
                    "mapped": len(model_map),
                    "unmapped": len(products) - len(model_map),
                    **stats,
                },
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"[senox-images] bbox render: {stats['rendered']}")
    print(f"[senox-images] eslesen: {len(model_map)} / {len(products)}")
    print(f"[senox-images] gorselsiz: {len(products) - len(model_map)}")
    print(f"[senox-images] orphan xref: {stats['orphan_xrefs']}")


if __name__ == "__main__":
    main()
