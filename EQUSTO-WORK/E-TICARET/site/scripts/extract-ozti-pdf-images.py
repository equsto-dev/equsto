# -*- coding: utf-8 -*-
"""
Öztiryakiler PDF — ürün kodu konumuna göre kırpım (tablo sayfalarında yanlış görsel atamaz).

Kurallar:
  - Tek ürün kodu sayfada → en büyük anlamlı gömülü görsel
  - Çoklu kod → yalnızca search_for(kod) ile bulunan bölge kırpılır; bulunamazsa görsel yok
  - Eski "sayfa üstü / indeks eşlemesi" kaldırıldı

  python scripts/extract-ozti-pdf-images.py
  python scripts/extract-ozti-pdf-images.py --purge
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(__file__).resolve().parent / "data"
ESLESME = DATA / "ozti-eslesme-2026.json"
OUT_BASE = ROOT / "public" / "images" / "catalog" / "ozti"
MANIFEST_PATH = OUT_BASE / "_manifest.json"

PDF = Path(
    os.environ.get(
        "OZTI_PDF",
        r"c:\Users\User\Downloads\Öztiryakiler-Urun-katalogu-2026.pdf",
    )
)

KOD_RE = re.compile(
    r"\b([0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,48})\b",
    re.I,
)

MIN_IMG_W = 160
MIN_IMG_H = 160
MIN_CLIP_W = 200
MIN_CLIP_H = 160
TABLE_PAGE_MIN_CODES = 8
TOP_HALF_RATIO = 0.52


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def slug_file(kod: str) -> str:
    s = "ozti-" + kod.lower().replace(".", "-")
    return "".join(c if c.isalnum() or c in "-" else "" for c in s)


def codes_on_page(text: str) -> list[str]:
    found = []
    seen = set()
    for m in KOD_RE.finditer(text or ""):
        k = norm_kod(m.group(1))
        if k and k not in seen:
            seen.add(k)
            found.append(k)
    return found


def save_jpg(pix: fitz.Pixmap, out: Path) -> bool:
    try:
        if pix.n - pix.alpha > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        pix.save(str(out), jpg_quality=88)
        return out.exists() and out.stat().st_size > 6000
    except Exception:
        return False


def search_rects(page: fitz.Page, kod: str) -> list[fitz.Rect]:
    rects: list[fitz.Rect] = []
    variants = [kod, kod.replace(".", " "), kod.replace(".", "")]
    seen = set()
    for q in variants:
        if not q.strip():
            continue
        try:
            for r in page.search_for(q):
                key = (round(r.x0), round(r.y0), round(r.x1), round(r.y1))
                if key not in seen:
                    seen.add(key)
                    rects.append(r)
        except Exception:
            pass
    return rects


def is_table_catalog_page(text: str, code_count: int) -> bool:
    """Fiyat tablosu / çoklu KOD satırı — fotoğraf yok, kırpım saçma olur."""
    if code_count >= TABLE_PAGE_MIN_CODES:
        return True
    t = text or ""
    if code_count >= 2 and re.search(r"KOD\s*\n\s*T[İI]P", t, re.I):
        return True
    if code_count >= 2 and t.count("FİYAT") >= 2:
        return True
    return False


def clip_near_kod(page: fitz.Page, kod: str) -> fitz.Rect | None:
    """Kod satırının solundaki veya üstündeki ürün fotoğrafı bölgesi."""
    pr = page.rect
    rects = search_rects(page, kod)
    if not rects:
        return None

    r = rects[0]
    candidates = [
        fitz.Rect(
            pr.x0,
            max(pr.y0, r.y0 - 180),
            pr.x0 + pr.width * 0.48,
            min(pr.y1, r.y1 + 120),
        ),
        fitz.Rect(pr.x0, max(pr.y0, r.y0 - 240), max(pr.x0 + 40, r.x0 - 20), min(pr.y1, r.y0 + 50)),
        fitz.Rect(max(pr.x0, r.x0 - 280), max(pr.y0, r.y0 - 300), min(pr.x1, r.x0 + 40), r.y0 - 6),
        fitz.Rect(r.x0 - 20, r.y0 - 20, r.x1 + 20, r.y1 + 20),
    ]
    for c in candidates:
        c &= pr
        if c.width >= MIN_CLIP_W and c.height >= MIN_CLIP_H:
            return c
    return None


def largest_embedded(page: fitz.Page) -> fitz.Pixmap | None:
    best = None
    best_area = 0
    for img in page.get_images(full=True):
        try:
            pix = fitz.Pixmap(page.parent, img[0])
            if pix.n - pix.alpha > 3:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            if pix.width < MIN_IMG_W or pix.height < MIN_IMG_H:
                continue
            area = pix.width * pix.height
            if area > best_area:
                best_area = area
                best = pix
        except Exception:
            continue
    return best


def assign_kod(page_no: int, kod: str, pix: fitz.Pixmap, manifest: dict, stats: dict) -> None:
    out_dir = OUT_BASE / f"p{page_no}"
    out_dir.mkdir(parents=True, exist_ok=True)
    fname = slug_file(kod) + ".jpg"
    out = out_dir / fname
    if save_jpg(pix, out):
        manifest[kod] = f"images/catalog/ozti/p{page_no}/{fname}"
        stats["ok"] += 1
    else:
        stats["skip_small"] += 1


def kod_in_top_half(page: fitz.Page, kod: str) -> bool:
    mid = page.rect.y0 + page.rect.height * TOP_HALF_RATIO
    for r in search_rects(page, kod):
        if r.y0 < mid:
            return True
    return False


def process_page(page: fitz.Page, page_no: int, codes: list[str], manifest: dict, stats: dict) -> None:
    codes = sorted({norm_kod(c) for c in codes if c})
    if not codes:
        return

    text = page.get_text("text") or ""
    table_page = is_table_catalog_page(text, len(codes))

    if len(codes) == 1:
        kod = codes[0]
        if table_page and not kod_in_top_half(page, kod):
            stats["skip_table_page"] += 1
            return
        clip = clip_near_kod(page, kod)
        if clip:
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
            assign_kod(page_no, kod, pix, manifest, stats)
            return
        emb = largest_embedded(page)
        if emb:
            assign_kod(page_no, kod, emb, manifest, stats)
        else:
            stats["skip_no_img"] += 1
        return

    if table_page:
        for kod in codes:
            if kod in manifest:
                continue
            if not kod_in_top_half(page, kod):
                stats["skip_table_page"] += 1
                continue
            clip = clip_near_kod(page, kod)
            if not clip:
                stats["skip_no_hit"] += 1
                continue
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
            assign_kod(page_no, kod, pix, manifest, stats)
        return

    for kod in codes:
        if kod in manifest:
            continue
        clip = clip_near_kod(page, kod)
        if not clip:
            stats["skip_no_hit"] += 1
            continue
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
        assign_kod(page_no, kod, pix, manifest, stats)


def pick_best_page(doc: fitz.Document, kod: str, page_candidates: list[int]) -> int | None:
    """İndeks sayfası yerine ürün detay sayfasını seç (sayfada az kod)."""
    best = None
    best_score = 10**9
    for page_no in page_candidates:
        if page_no < 1 or page_no > doc.page_count:
            continue
        page = doc[page_no - 1]
        text = page.get_text("text") or ""
        codes = codes_on_page(text)
        n = len(codes)
        score = n * 10
        if is_table_catalog_page(text, n):
            score += 50
        if kod not in codes:
            score += 100
        if kod_in_top_half(page, kod):
            score -= 15
        if score < best_score:
            best_score = score
            best = page_no
    return best


def patch_dept_files(manifest: dict) -> int:
    dept_dir = ROOT / "public" / "data" / "dept"
    total = 0
    for dept_file in dept_dir.glob("*.json"):
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        changed = 0
        for row in rows:
            if "öztiryakiler" not in str(row.get("brand", "")).lower():
                continue
            kod = norm_kod(row.get("urun_kodu") or row.get("sku") or "")
            new_img = [manifest[kod]] if kod and kod in manifest else []
            if row.get("images") != new_img:
                row["images"] = new_img
                changed += 1
        if changed:
            dept_file.write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
            print(f"  dept {dept_file.name}: {changed} satir gorsel")
            total += changed
    return total


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--purge", action="store_true", help="Eski ozti görsel klasörünü sil")
    args = parser.parse_args()

    if not PDF.exists():
        raise SystemExit(f"PDF yok: {PDF}")
    if not ESLESME.exists():
        raise SystemExit(f"Önce merge: {ESLESME}")

    if args.purge and OUT_BASE.exists():
        shutil.rmtree(OUT_BASE)
        print("[ozti-images] eski görseller silindi")

    rows = json.loads(ESLESME.read_text(encoding="utf-8"))
    kod_pages: dict[str, list[int]] = defaultdict(list)
    for r in rows:
        k = norm_kod(r.get("urun_kodu"))
        pages = (r.get("pdf") or {}).get("sayfalar") or []
        if k and pages:
            kod_pages[k] = [int(p) for p in pages]

    doc = fitz.open(PDF)
    manifest: dict[str, str] = {}
    stats = {
        "ok": 0,
        "skip_no_hit": 0,
        "skip_no_img": 0,
        "skip_small": 0,
        "skip_table_page": 0,
    }

    by_best_page: dict[int, set[str]] = defaultdict(set)
    for kod, pages in kod_pages.items():
        best = pick_best_page(doc, kod, pages)
        if best:
            by_best_page[best].add(kod)

    for page_no in sorted(by_best_page.keys()):
        process_page(
            doc[page_no - 1],
            page_no,
            list(by_best_page[page_no]),
            manifest,
            stats,
        )

    doc.close()
    OUT_BASE.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"[ozti-images] manifest: {len(manifest)} kod")
    print(f"[ozti-images] stats: {stats}")
    patched = patch_dept_files(manifest)
    print(f"[ozti-images] dept güncellendi: {patched} satır")


if __name__ == "__main__":
    main()
