# -*- coding: utf-8 -*-
"""CDN 404 Öztiryakiler kodları — PDF'den web/ klasörüne görsel çıkar."""
from __future__ import annotations

import json
import re
import shutil
import sys
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
DATA = Path(__file__).resolve().parent / "data"
ESLESME = DATA / "ozti-eslesme-2026.json"
OUT_BASE = ROOT / "public" / "images" / "catalog" / "ozti"
WEB_DIR = OUT_BASE / "web"
MANIFEST_PATH = OUT_BASE / "_manifest.json"
PDF = Path(
    __import__("os").environ.get(
        "OZTI_PDF",
        r"c:\Users\User\Downloads\Öztiryakiler-Urun-katalogu-2026.pdf",
    )
)

KOD_RE = re.compile(r"\b([0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,48})\b", re.I)
MIN_CLIP_W = 200
MIN_CLIP_H = 160
TABLE_PAGE_MIN_CODES = 8
TOP_HALF_RATIO = 0.52


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def slug_file(kod: str) -> str:
    s = "ozti-" + kod.lower().replace(".", "-")
    return "".join(c if c.isalnum() or c in "-" else "" for c in s)


def web_rel(kod: str) -> str:
    return f"images/catalog/ozti/web/{slug_file(kod)}.jpg"


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
    if code_count >= TABLE_PAGE_MIN_CODES:
        return True
    t = text or ""
    if code_count >= 2 and re.search(r"KOD\s*\n\s*T[İI]P", t, re.I):
        return True
    if code_count >= 2 and t.count("FİYAT") >= 2:
        return True
    return False


def clip_near_kod(page: fitz.Page, kod: str) -> fitz.Rect | None:
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


def kod_in_top_half(page: fitz.Page, kod: str) -> bool:
    mid = page.rect.y0 + page.rect.height * TOP_HALF_RATIO
    for r in search_rects(page, kod):
        if r.y0 < mid:
            return True
    return False


def codes_on_page(text: str) -> list[str]:
    found, seen = [], set()
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


def pick_best_page(doc: fitz.Document, kod: str, page_candidates: list[int]) -> int | None:
    best, best_score = None, 10**9
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


def extract_kod(doc: fitz.Document, kod: str, page_no: int) -> Path | None:
    page = doc[page_no - 1]
    text = page.get_text("text") or ""
    codes = codes_on_page(text)
    table_page = is_table_catalog_page(text, len(codes))
    if table_page and not kod_in_top_half(page, kod):
        return None
    clip = clip_near_kod(page, kod)
    if not clip:
        return None
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), clip=clip, alpha=False)
    WEB_DIR.mkdir(parents=True, exist_ok=True)
    out = WEB_DIR / (slug_file(kod) + ".jpg")
    if save_jpg(pix, out):
        p_dir = OUT_BASE / f"p{page_no}"
        p_dir.mkdir(parents=True, exist_ok=True)
        p_out = p_dir / out.name
        if not p_out.exists():
            shutil.copy2(out, p_out)
        return out
    return None


def main() -> None:
    if not PDF.exists():
        raise SystemExit(f"PDF yok: {PDF}")
    if not ESLESME.exists():
        raise SystemExit(f"Eşleşme yok: {ESLESME}")

    kods = [norm_kod(k) for k in sys.argv[1:] if k.strip()]
    if not kods:
        raise SystemExit("Kullanım: python extract-ozti-kods-to-web.py KOD1 KOD2 ...")

    rows = json.loads(ESLESME.read_text(encoding="utf-8"))
    kod_pages: dict[str, list[int]] = defaultdict(list)
    for r in rows:
        k = norm_kod(r.get("urun_kodu"))
        pages = (r.get("pdf") or {}).get("sayfalar") or []
        if k and pages:
            kod_pages[k] = [int(p) for p in pages]

    manifest: dict[str, str] = {}
    if MANIFEST_PATH.exists():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    doc = fitz.open(PDF)
    ok, fail = [], []
    for kod in kods:
        pages = kod_pages.get(kod) or []
        best = pick_best_page(doc, kod, pages) if pages else None
        if not best:
            fail.append(kod)
            print(f"  skip {kod}: sayfa bulunamadi")
            continue
        out = extract_kod(doc, kod, best)
        if out:
            rel = web_rel(kod)
            manifest[kod] = rel
            ok.append(kod)
            print(f"  ok {kod} -> {rel} ({out.stat().st_size} bytes, p{best})")
        else:
            fail.append(kod)
            print(f"  fail {kod}: kırpım yok (p{best})")
    doc.close()

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n[ozti-web] {len(ok)} ok, {len(fail)} fail, manifest {len(manifest)} kod")


if __name__ == "__main__":
    main()
