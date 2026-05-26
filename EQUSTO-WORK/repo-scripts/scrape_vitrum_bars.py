"""
scripts/scrape_vitrum_bars.py — Vitrum Bars Catalogue 2025 (ENG) PDF kazıyıcısı.

Girdi (varsayılan):
  c:\\D Disk\\FİYAT LİSTELERİ\\Vitrum+Bars+Catalogue+2025+-+ENG.pdf

Çıktı (varsayılan):
  public/data/vitrum-bars-catalogue.json

Kullanım (proje kökünden):
  python scripts/scrape_vitrum_bars.py
  python scripts/scrape_vitrum_bars.py "<pdf-yolu>" -o public/data/vitrum-bars-catalogue.json

Bağımlılık: PyMuPDF (fitz)  ->  pip install pymupdf

Çıkarılan alanlar (her ürün için):
  page, category, code, name, description,
  totalDimensionsMm, dimensionsMm[ {label,value} ], features[]

Not: 1–22. sayfalar tanıtım/giriş içeriği olduğu için atlanır; 23–25 imzalı barlar
(The Manhattan / The Boulverdier / The Clover) "Signature Bar" kategorisi altında
kod alanı boş olarak yakalanır; 26–64 katalog ürünleri "<Kategori> — <KOD>"
başlık satırından kategori ve ürün kodu birlikte çıkarılır.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import json
import re
import sys
from pathlib import Path

import fitz


DEFAULT_PDF = r"c:\D Disk\FİYAT LİSTELERİ\Vitrum+Bars+Catalogue+2025+-+ENG.pdf"
DEFAULT_OUT = (
    Path(__file__).resolve().parent.parent / "public" / "data" / "vitrum-bars-catalogue.json"
)

HEADER_NOISE = {
    "www.vitrum.lv",
    "Elevating the art",
    "of bar service",
    "Elevating the art of bar service",
    "Key Dimensions (mm)",
    "Materials",
    "Sortaments",
    "INOX",
}

DIMENSION_LABELS = (
    "Total",
    "Sink",
    "Ice Well",
    "Two Ice Well",
    "Ice well",
    "Diameter",
)

# " — " : ASCII boşluk + em-dash (U+2014) + ASCII boşluk
EM_DASH = "\u2014"
TITLE_RE = re.compile(rf"^\s*(.+?)\s+{EM_DASH}\s+(\S.*?)\s*$")

TOTAL3D_RE = re.compile(r"^\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*$")
SIZE2D_RE = re.compile(r"^\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*$")
PURE_NUM_RE = re.compile(r"^\s*\d{2,4}(?:\.\d+)?\s*$")

# Sayfa 23/24/25'te kod satırı yok; isim doğrudan başlık olarak geçiyor.
SIGNATURE_NAMES = {
    "The Manhattan",
    "The Boulverdier",   # PDF içinde bu yazımla geçiyor
    "The Boulevardier",
    "The Clover",
}


def page_lines(page) -> list[str]:
    text = page.get_text("text")
    return [ln.strip() for ln in text.splitlines() if ln.strip()]


def page_spans(page) -> list[dict]:
    """PDF içindeki yerleşik metin yayılımlarını koordinat sırasıyla döndürür."""
    out: list[dict] = []
    data = page.get_text("dict")
    for block in data.get("blocks", []):
        if block.get("type") != 0:
            continue
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                txt = (span.get("text") or "").strip()
                if not txt:
                    continue
                x0, y0, x1, y1 = span["bbox"]
                out.append(
                    {
                        "text": txt,
                        "x": float(x0),
                        "y": float(y0),
                        "w": float(x1 - x0),
                        "h": float(y1 - y0),
                    }
                )
    out.sort(key=lambda s: (round(s["y"], 1), s["x"]))
    return out


def detect_title(lines: list[str]) -> dict | None:
    # Yalnızca teknik datasheet sayfalarını kabul et; pazarlama satırlarındaki
    # ("manufacturing and installing bars — we're …") tireler ürün başlığı değil.
    if "Key Dimensions (mm)" not in lines:
        return None
    for ln in lines:
        m = TITLE_RE.match(ln)
        if m:
            cat = m.group(1).strip()
            code = m.group(2).strip()
            return {"category": cat, "code": code, "name": cat}
    for ln in lines:
        if ln in SIGNATURE_NAMES:
            return {"category": "Signature Bar", "code": None, "name": ln}
    return None


def detect_features(lines: list[str]) -> list[str]:
    out: list[str] = []
    for ln in lines:
        if ln.startswith("\u2192"):  # "→"
            cleaned = ln.lstrip("\u2192").strip()
            if cleaned:
                out.append(cleaned)
    return out


def detect_description(page, title: dict) -> str | None:
    """Açıklama paragrafı PDF düzeninde tek bir bloktur ve birden çok satıra
    yayılabilir (örn. 'streamlined and \nefficient cleaning.'). Bloğa göre
    yakalamak satır-bazlı sezgisellerin küçük son parçaları atmasını önler."""
    title_line = None
    if title.get("code"):
        title_line = f"{title['category']} {EM_DASH} {title['code']}"
    elif title.get("name"):
        title_line = title["name"]

    candidates: list[tuple[float, str]] = []
    for x0, y0, x1, y1, text, _bno, btype in page.get_text("blocks"):
        if btype != 0:
            continue
        raw = (text or "").strip()
        if not raw:
            continue
        joined = " ".join(seg.strip() for seg in raw.splitlines() if seg.strip())
        if not joined:
            continue
        if joined in HEADER_NOISE or joined in DIMENSION_LABELS:
            continue
        if title_line and joined == title_line:
            continue
        if joined.startswith("\u2192"):
            continue
        if joined.startswith("Total"):
            continue
        if joined.startswith("Materials") or joined.startswith("Sortaments"):
            continue
        if TOTAL3D_RE.match(joined) or SIZE2D_RE.match(joined) or PURE_NUM_RE.match(joined):
            continue
        if not re.search(r"[A-Za-z]", joined):
            continue
        # En az 3 kelime + en az 25 karakter + cümle noktalaması: pazarlama
        # açıklamaları bu eşiği aşar; "PE inserts", "korpus 585", "CSF-1260"
        # gibi teknik etiketler aşmaz.
        if len(joined.split()) < 3 or len(joined) < 25:
            continue
        letters = sum(c.isalpha() for c in joined)
        digits = sum(c.isdigit() for c in joined)
        if digits >= letters:
            continue
        candidates.append((float(y0), joined))

    if not candidates:
        return None
    candidates.sort(key=lambda c: c[0])
    return candidates[0][1]


def _value_text(s: dict) -> str | None:
    txt = s["text"]
    if TOTAL3D_RE.match(txt) or SIZE2D_RE.match(txt) or PURE_NUM_RE.match(txt):
        return txt.strip()
    return None


def detect_dimensions(spans: list[dict]) -> tuple[str | None, list[dict]]:
    """Bilinen etiketlerin (Total / Sink / Ice Well / Diameter / ...) tam altındaki
    ölçü yayılımı ile eşleştir; teknik çizim üstündeki başıboş sayıları yutmaz."""
    total: str | None = None
    dims: list[dict] = []
    used: set[int] = set()

    label_indices = [i for i, s in enumerate(spans) if s["text"] in DIMENSION_LABELS]

    def find_value_below(idx: int) -> int | None:
        lx = spans[idx]["x"]
        ly = spans[idx]["y"]
        best: tuple[float, int] | None = None
        for j, s in enumerate(spans):
            if j in used or j == idx:
                continue
            if s["y"] <= ly + 1:
                continue
            dy = s["y"] - ly
            if dy > 40:
                continue
            if abs(s["x"] - lx) > 90:
                continue
            if _value_text(s) is None:
                continue
            if best is None or dy < best[0]:
                best = (dy, j)
        return best[1] if best else None

    for idx in label_indices:
        if idx in used:
            continue
        label = spans[idx]["text"]
        val_idx = find_value_below(idx)
        if val_idx is None:
            continue
        used.add(idx)
        used.add(val_idx)
        value = spans[val_idx]["text"].strip()
        if label == "Total":
            if total is None:
                total = value
            else:
                dims.append({"label": "Total", "value": value})
        else:
            dims.append({"label": label, "value": value})

    return total, dims


def scrape_pdf(path: str) -> list[dict]:
    doc = fitz.open(path)
    products: list[dict] = []
    for i in range(doc.page_count):
        page = doc.load_page(i)
        lines = page_lines(page)
        title = detect_title(lines)
        if not title:
            continue
        features = detect_features(lines)
        description = detect_description(page, title)
        total, dims = detect_dimensions(page_spans(page))
        pno = i + 1
        products.append(
            {
                "page": pno,
                "category": title["category"],
                "code": title.get("code"),
                "name": title.get("name") or title["category"],
                "description": description,
                "totalDimensionsMm": total,
                "dimensionsMm": dims,
                "features": features,
                "image": f"vitrum-drawings/hero_p{pno}.png",
                "drawing": f"vitrum-drawings/tech_p{pno}.png",
            }
        )
    return products


def main() -> int:
    ap = argparse.ArgumentParser(
        description="Vitrum Bars Catalogue 2025 (ENG) PDF kazıyıcı"
    )
    ap.add_argument("pdf", nargs="?", default=DEFAULT_PDF, help="PDF dosya yolu")
    ap.add_argument("-o", "--out", default=str(DEFAULT_OUT), help="Çıkış JSON yolu")
    args = ap.parse_args()

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"PDF bulunamadı: {pdf_path}", file=sys.stderr)
        return 2

    products = scrape_pdf(str(pdf_path))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": pdf_path.name,
        "scrapedAt": _dt.datetime.now(_dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        "count": len(products),
        "products": products,
    }
    out_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Yazıldı: {out_path}  ({len(products)} ürün)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
