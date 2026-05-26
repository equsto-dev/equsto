"""
scripts/scrape_vitrum_full.py — Vitrum Bars Catalogue 2025 (ENG) PDF
tam-sayfa veri çıkarıcısı.

Mevcut `scrape_vitrum_bars.py` yalnızca 23–64 datasheet sayfalarını
yapılandırılmış ürün JSON'una çevirir. Bu betik ise PDF'in **TÜM 65
sayfasından** ham metin + blok + span verilerini, sayfa boyutlarını ve
PDF metadata'sını ayrı bir JSON dosyasına yazar.

Çıkış:  public/data/vitrum-bars-catalogue-FULL.json
Kilit:  public/data/vitrum-bars-catalogue.json'a dokunulmaz.

Kullanım (proje kökünden):
  python scripts/scrape_vitrum_full.py
  python scripts/scrape_vitrum_full.py "<pdf-yolu>" -o "<json-yolu>"

Bağımlılık: PyMuPDF (fitz)  ->  pip install pymupdf
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import sys
from pathlib import Path

import fitz


DEFAULT_PDF = r"c:\D Disk\FİYAT LİSTELERİ\Vitrum+Bars+Catalogue+2025+-+ENG.pdf"
DEFAULT_OUT = (
    Path(__file__).resolve().parent.parent
    / "public" / "data" / "vitrum-bars-catalogue-FULL.json"
)


def page_lines(page) -> list[str]:
    text = page.get_text("text")
    return [ln for ln in text.splitlines() if ln.strip()]


def page_blocks(page) -> list[dict]:
    out: list[dict] = []
    for x0, y0, x1, y1, text, bno, btype in page.get_text("blocks"):
        if btype != 0:
            continue
        raw = (text or "").strip()
        if not raw:
            continue
        out.append({
            "block": int(bno),
            "x0": round(float(x0), 2),
            "y0": round(float(y0), 2),
            "x1": round(float(x1), 2),
            "y1": round(float(y1), 2),
            "text": raw,
        })
    out.sort(key=lambda b: (round(b["y0"], 1), b["x0"]))
    return out


def page_spans(page) -> list[dict]:
    out: list[dict] = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                txt = (span.get("text") or "").rstrip()
                if not txt.strip():
                    continue
                x0, y0, x1, y1 = span["bbox"]
                out.append({
                    "text": txt,
                    "font": span.get("font"),
                    "size": round(float(span.get("size", 0)), 2),
                    "flags": int(span.get("flags", 0)),
                    "color": int(span.get("color", 0)),
                    "x0": round(float(x0), 2),
                    "y0": round(float(y0), 2),
                    "x1": round(float(x1), 2),
                    "y1": round(float(y1), 2),
                })
    out.sort(key=lambda s: (round(s["y0"], 1), s["x0"]))
    return out


def page_images(page) -> list[dict]:
    out: list[dict] = []
    for img in page.get_images(full=True):
        xref = img[0]
        try:
            info = page.parent.extract_image(xref)
        except Exception:
            info = {}
        out.append({
            "xref": int(xref),
            "smask": int(img[1]) if len(img) > 1 else 0,
            "width": int(img[2]) if len(img) > 2 else 0,
            "height": int(img[3]) if len(img) > 3 else 0,
            "bpc": int(img[4]) if len(img) > 4 else 0,
            "colorspace": img[5] if len(img) > 5 else None,
            "ext": info.get("ext"),
        })
    return out


def page_drawings_count(page) -> int:
    try:
        return len(page.get_drawings())
    except Exception:
        return 0


def scrape_pdf(path: str) -> dict:
    doc = fitz.open(path)
    pages: list[dict] = []
    for i in range(doc.page_count):
        page = doc.load_page(i)
        rect = page.rect
        text = page.get_text("text")
        pages.append({
            "page": i + 1,
            "width": round(float(rect.width), 2),
            "height": round(float(rect.height), 2),
            "rotation": int(page.rotation),
            "text": text,
            "lines": page_lines(page),
            "blocks": page_blocks(page),
            "spans": page_spans(page),
            "images": page_images(page),
            "drawingsCount": page_drawings_count(page),
        })
    return {
        "metadata": doc.metadata,
        "pageCount": doc.page_count,
        "pages": pages,
    }


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Vitrum Bars Catalogue 2025 (ENG) tam-sayfa PDF kazıyıcı"
    )
    ap.add_argument("pdf", nargs="?", default=DEFAULT_PDF, help="PDF dosya yolu")
    ap.add_argument("-o", "--out", default=str(DEFAULT_OUT), help="Çıkış JSON yolu")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"PDF bulunamadı: {pdf_path}", file=sys.stderr)
        return 2

    data = scrape_pdf(str(pdf_path))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": pdf_path.name,
        "sourcePath": str(pdf_path),
        "scrapedAt": _dt.datetime.now(_dt.timezone.utc)
            .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        **data,
    }
    out_path.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    total_lines = sum(len(p["lines"]) for p in data["pages"])
    total_blocks = sum(len(p["blocks"]) for p in data["pages"])
    total_spans = sum(len(p["spans"]) for p in data["pages"])
    total_images = sum(len(p["images"]) for p in data["pages"])
    print(f"Yazıldı: {out_path}")
    print(f"  sayfa : {data['pageCount']}")
    print(f"  satır : {total_lines}")
    print(f"  blok  : {total_blocks}")
    print(f"  span  : {total_spans}")
    print(f"  görsel: {total_images}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
