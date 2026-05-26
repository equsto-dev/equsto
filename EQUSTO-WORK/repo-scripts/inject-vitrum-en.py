"""
scripts/inject-vitrum-en.py — Vitrum kataloğuna EN açıklama ve EN feature alanları enjekte eder.

Kaynak  : public/data/vitrum-bars-catalogue-FULL.json   (PDF'den çıkarılan tüm sayfa ham metni)
Hedef   : public/data/vitrum-bars-catalogue.json        (mevcut TR katalog — sadece descriptionEn / featuresEn alanları eklenir)

Mantık:
  - Her ürün sayfası (page 23..64) PDF'in datasheet sayfasıdır.
  - O sayfada `→` ile başlayan satırlar feature bullet'larıdır (EN).
  - İlk anlamlı paragraf (Key Dimensions'a kadar olan, başlık-altı, en az 25 karakter)
    EN ürün açıklamasıdır (orijinal scrape_vitrum_bars.py mantığıyla aynı; sadece
    sonuç İngilizce metin kalır çünkü FULL.json salt PDF metnidir).

Çıktı: orijinal katalog dosyasına yazılır. Mevcut TR alanlar (`description`,
`features`) korunur; yanlarına `descriptionEn` ve `featuresEn` eklenir.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FULL = ROOT / "public" / "data" / "vitrum-bars-catalogue-FULL.json"
CAT  = ROOT / "public" / "data" / "vitrum-bars-catalogue.json"

ARROW = "\u2192"

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
DIM_LABELS = {"Total", "Sink", "Ice Well", "Two Ice Well", "Ice well", "Diameter"}

SIZE2D = re.compile(r"^\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*$")
SIZE3D = re.compile(r"^\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*[xX]\s*(\d{2,4})\s*$")
PURE_NUM = re.compile(r"^\s*\d{2,4}(?:\.\d+)?\s*$")
TITLE_RE = re.compile(r"^\s*(.+?)\s+\u2014\s+(\S.*?)\s*$")
SIGNATURES = {"The Manhattan", "The Boulverdier", "The Boulevardier", "The Clover"}


def detect_features_en(lines: list[str]) -> list[str]:
    out: list[str] = []
    for ln in lines:
        s = ln.strip()
        if s.startswith(ARROW):
            cleaned = s.lstrip(ARROW).strip()
            if cleaned:
                out.append(cleaned)
    return out


def detect_description_en(page: dict) -> str | None:
    """PDF blok-bazlı: title-altı, key dimensions öncesi en uzun anlamlı blok."""
    blocks = page.get("blocks", []) or []
    title_line: str | None = None
    title_y: float = -1.0
    for b in blocks:
        t = (b.get("text") or "").strip()
        if not t:
            continue
        joined = " ".join(seg.strip() for seg in t.splitlines() if seg.strip())
        m = TITLE_RE.match(joined)
        if m:
            title_line = joined
            title_y = float(b.get("y0", 0))
            break
        if joined in SIGNATURES:
            title_line = joined
            title_y = float(b.get("y0", 0))
            break

    candidates: list[tuple[float, str]] = []
    for b in blocks:
        raw = (b.get("text") or "").strip()
        if not raw:
            continue
        joined = " ".join(seg.strip() for seg in raw.splitlines() if seg.strip())
        if not joined:
            continue
        if joined in HEADER_NOISE or joined in DIM_LABELS:
            continue
        if title_line and joined == title_line:
            continue
        if joined.startswith(ARROW):
            continue
        if joined.startswith("Total") or joined.startswith("Materials") or joined.startswith("Sortaments"):
            continue
        if SIZE3D.match(joined) or SIZE2D.match(joined) or PURE_NUM.match(joined):
            continue
        if not re.search(r"[A-Za-z]", joined):
            continue
        if len(joined.split()) < 3 or len(joined) < 25:
            continue
        letters = sum(c.isalpha() for c in joined)
        digits = sum(c.isdigit() for c in joined)
        if digits >= letters:
            continue
        y = float(b.get("y0", 0))
        if title_y >= 0 and y < title_y:
            continue
        candidates.append((y, joined))

    if not candidates:
        return None
    candidates.sort(key=lambda c: c[0])
    return candidates[0][1]


def main() -> int:
    if not FULL.exists():
        print(f"FULL.json yok: {FULL}", file=sys.stderr)
        return 2
    if not CAT.exists():
        print(f"Katalog yok: {CAT}", file=sys.stderr)
        return 2

    full = json.loads(FULL.read_text(encoding="utf-8"))
    cat = json.loads(CAT.read_text(encoding="utf-8"))

    pages_by_no: dict[int, dict] = {p["page"]: p for p in full.get("pages", [])}

    updated = 0
    desc_hits = 0
    feat_hits = 0
    for prod in cat.get("products", []):
        pno = int(prod.get("page") or 0)
        if pno <= 0 or pno not in pages_by_no:
            continue
        page = pages_by_no[pno]
        lines = page.get("lines") or []

        feats_en = detect_features_en(lines)
        if feats_en:
            prod["featuresEn"] = feats_en
            feat_hits += 1

        desc_en = detect_description_en(page)
        if desc_en:
            prod["descriptionEn"] = desc_en
            desc_hits += 1

        updated += 1

    CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Yazıldı: {CAT}")
    print(f"  Ürün       : {len(cat.get('products', []))}")
    print(f"  Güncellenen: {updated}")
    print(f"  EN açıklama: {desc_hits}")
    print(f"  EN özellik : {feat_hits}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
