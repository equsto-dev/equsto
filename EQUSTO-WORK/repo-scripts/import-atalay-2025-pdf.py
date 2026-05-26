#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ATALAY 2025 YERLİ.pdf → Equsto katalog klasör yapısı
Çıktı: public/data/fiyat-listeleri/atalay/2025-yerli/{dept}/{slug}/urunler.json

Kullanım:
  python scripts/import-atalay-2025-pdf.py
  python scripts/import-atalay-2025-pdf.py "C:\\path\\ATALAY 2025 YERLİ.pdf"
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    print("PyMuPDF gerekli: pip install pymupdf")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\ATALAY 2025 YERLİ.pdf")
OUT_ROOT = ROOT / "public" / "data" / "fiyat-listeleri" / "atalay" / "2025-yerli"

BRAND = "Atalay"
LISTE = "ATALAY 2025 YERLİ"
KAYNAK = "atalay-2025-yerli-pdf"

# Alt kategori → Equsto departman + klasör slug
DEPT_MAP: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"izgara|amerikan|lavata|clam|konvey.r.lü izgara", re.I), "pisirme", "izgaralar"),
    (re.compile(r"fritöz|fritoz", re.I), "pisirme", "fritozler"),
    (re.compile(r"ocak|wok|yer oca|mini ocak|kapalı ate", re.I), "pisirme", "ocaklar"),
    (re.compile(r"fırın|firin|setaltı|pizza|kumpir|mayalandır", re.I), "pisirme", "firinlar"),
    (re.compile(r"kuzine|gemi tipi", re.I), "pisirme", "kuzineler"),
    (re.compile(r"benmari|kaynatma|devrilir tava|makarna|patates", re.I), "pisirme", "benmari-kaynatma"),
    (re.compile(r"döner|doner|piliç|pilic|yatay et", re.I), "pisirme", "doner-pilic"),
    (re.compile(r"salamander", re.I), "pisirme", "salamander"),
    (re.compile(r"tost|waffle|krep", re.I), "pisirme", "tost-waffle"),
    (re.compile(r"ekmek kızart|ekmek kizart", re.I), "pisirme", "ekmek-kizartma"),
    (re.compile(r"türk kahve|turk kahve", re.I), "kahve", "turk-kahve"),
    (re.compile(r"banket", re.I), "sogutma", "banket-arabalari"),
]

ROW_LABELS = {
    "plate": ("plate", "plaka"),
    "plaka": ("plate", "plaka"),
    "voltaj": ("voltaj", "voltaj"),
    "kw": ("kw", "guc_kw"),
    "güç": ("kw", "guc_kw"),
    "guc": ("kw", "guc_kw"),
    "net ölçüler": ("net_olculer", "olculer_net"),
    "net olculer": ("net_olculer", "olculer_net"),
    "paket ölçüleri": ("paket_olculer", "olculer_paket"),
    "paket olculeri": ("paket_olculer", "olculer_paket"),
    "net ağırlık": ("net_agirlik", "agirlik_net"),
    "net agirlik": ("net_agirlik", "agirlik_net"),
    "paket ağırlık": ("paket_agirlik", "agirlik_paket"),
    "paket agirlik": ("paket_agirlik", "agirlik_paket"),
    "fiyat": ("fiyat", "fiyat_euro"),
    "fırın hazne": ("firin_hazne", "firin_hazne"),
    "firin hazne": ("firin_hazne", "firin_hazne"),
}


def slugify(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "").lower()
    tr = str.maketrans("ığüşöçİĞÜŞÖÇ", "igusocigusoc")
    s = s.translate(tr)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "diger"


def norm_label(s: str) -> str:
    s = unicodedata.normalize("NFKC", s or "")
    s = s.replace("\u00a0", " ").strip().lower()
    s = s.replace("ı", "i").replace("ğ", "g").replace("ü", "u").replace("ş", "s").replace("ö", "o").replace("ç", "c")
    return re.sub(r"\s+", " ", s)


def parse_euro(s: str) -> float | None:
    if not s:
        return None
    m = re.search(r"([\d.,]+)\s*euro", s, re.I)
    if not m:
        return None
    raw = m.group(1).strip()
    if "," in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif raw.count(".") > 1 or (len(raw) > 4 and "." in raw):
        raw = raw.replace(".", "")
    return float(raw)


def classify_subcat(subcat: str) -> tuple[str, str]:
    for pat, dept, group in DEPT_MAP:
        if pat.search(subcat):
            fuel = "elektrikli" if re.search(r"elektrik", subcat, re.I) else ""
            if re.search(r"gaz", subcat, re.I):
                fuel = "gazli" if fuel else "gazli"
            slug = slugify(subcat)
            if group and group not in slug:
                slug = f"{group}-{slug}" if slug != group else group
            return dept, slug[:80]
    fuel = slugify(subcat)
    return "diger", fuel[:80]


def is_subcat_line(line: str) -> bool:
    if "/" not in line or len(line) > 90:
        return False
    return bool(re.search(r"elektrik|gazl|gazlı|gazli", line, re.I))


def transpose_table(rows: list[list]) -> list[dict]:
    if not rows or len(rows) < 2:
        return []
    header = rows[0]
    if not header or norm_label(str(header[0] or "")) != "model":
        return []
    models = [str(c or "").strip() for c in header[1:]]
    models = [m for m in models if m and m.lower() != "model"]
    if not models:
        return []

    attrs: dict[str, list[str]] = {}
    for row in rows[1:]:
        if not row:
            continue
        label = norm_label(str(row[0] or ""))
        key = None
        for k, (_, field) in ROW_LABELS.items():
            if label.startswith(k):
                key = field
                break
        if not key:
            continue
        vals = [str(c or "").strip() for c in row[1 : 1 + len(models)]]
        attrs[key] = vals

    products = []
    for i, model in enumerate(models):
        rec = {"model_kodu": model}
        for ak, vals in attrs.items():
            if i < len(vals):
                rec[ak] = vals[i]
        if rec.get("fiyat_euro") or rec.get("guc_kw") or rec.get("model_kodu"):
            products.append(rec)
    return products


def product_to_equsto(
    rec: dict,
    *,
    serie: str,
    subcat: str,
    dept: str,
    folder_slug: str,
) -> dict:
    model = rec.get("model_kodu", "").strip()
    plate = rec.get("plate", "")
    kw = rec.get("guc_kw", rec.get("kw", ""))
    volt = rec.get("voltaj", "")
    net = rec.get("olculer_net", "")
    paket = rec.get("olculer_paket", "")
    net_kg = rec.get("agirlik_net", "")
    paket_kg = rec.get("agirlik_paket", "")
    euro = parse_euro(rec.get("fiyat_euro", ""))
    firin_hazne = rec.get("firin_hazne", "")

    fuel = "elektrikli" if re.search(r"elektrik", subcat, re.I) else ""
    if re.search(r"gaz", subcat, re.I):
        fuel = "gazlı" if not fuel else fuel + "+gaz"

    name_parts = [BRAND, subcat.split("/")[0].strip(), model]
    if plate and plate.lower() not in ("düz", "duz"):
        name_parts.insert(2, plate)
    name = " ".join(p for p in name_parts if p)

    spec_lines = [
        f"Kaynak: {LISTE}",
        f"Seri: {serie}" if serie else "",
        f"Kategori: {subcat}",
        f"Model: {model}",
    ]
    if plate:
        spec_lines.append(f"Plaka: {plate}")
    if volt:
        spec_lines.append(f"Voltaj: {volt}")
    if kw:
        spec_lines.append(f"Güç (kW): {kw}")
    if firin_hazne:
        spec_lines.append(f"Fırın hazne: {firin_hazne}")
    if net:
        spec_lines.append(f"Net ölçüler (mm): {net}")
    if paket:
        spec_lines.append(f"Paket ölçüleri (mm): {paket}")
    if net_kg:
        spec_lines.append(f"Net ağırlık: {net_kg}")
    if paket_kg:
        spec_lines.append(f"Paket ağırlık: {paket_kg}")
    if euro is not None:
        spec_lines.append(f"Liste fiyatı: {rec.get('fiyat_euro', '')}")

    el_guc = ""
    gaz_guc = ""
    if re.search(r"elektrik", subcat, re.I) and kw:
        el_guc = f"{kw} kW" + (f" · {volt}" if volt else "")
    if re.search(r"gaz", subcat, re.I) and kw:
        gaz_guc = f"{kw} kW"
    elif re.search(r"gaz", subcat, re.I) and not kw and volt:
        gaz_guc = volt

    price = f"{rec.get('fiyat_euro', 'Teklif için iletişim')}"
    if euro is not None:
        price = f"€{euro:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") + " + KDV"

    cat_slug = slugify(subcat.split("/")[0])
    return {
        "category": cat_slug,
        "brand": BRAND,
        "name": name,
        "price": price,
        "specs": "\n".join(x for x in spec_lines if x),
        "sku": model.replace(" ", ""),
        "model": model,
        "tip_kodu": slugify(model),
        "liste": LISTE,
        "kaynak": KAYNAK,
        "dept": dept,
        "alt_kategori": subcat,
        "seri": serie,
        "enerji": fuel or subcat,
        "el_guc": el_guc,
        "gaz_guc": gaz_guc,
        "voltaj": volt,
        "guc_kw": kw,
        "olculer_net_mm": net,
        "olculer_paket_mm": paket,
        "agirlik_net": net_kg,
        "agirlik_paket": paket_kg,
        "fiyat_euro": euro,
        "plaka": plate,
        "equsto_folder": f"{dept}/{folder_slug}",
    }


def main() -> None:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.is_file():
        print("PDF bulunamadı:", pdf_path)
        sys.exit(1)

    doc = fitz.open(pdf_path)
    serie = ""
    subcat = ""
    by_folder: dict[str, list[dict]] = {}
    meta_pages: list[dict] = []
    total = 0

    for pi in range(doc.page_count):
        page = doc[pi]
        text = page.get_text()
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("Seri "):
                serie = line
            elif is_subcat_line(line):
                subcat = unicodedata.normalize("NFKC", line)

        if not subcat:
            continue

        dept, folder_slug = classify_subcat(subcat)
        tables = page.find_tables()
        page_count = 0
        for tab in tables.tables:
            try:
                raw = tab.extract()
            except Exception:
                continue
            recs = transpose_table(raw)
            for rec in recs:
                item = product_to_equsto(
                    rec,
                    serie=serie,
                    subcat=subcat,
                    dept=dept,
                    folder_slug=folder_slug,
                )
                key = f"{dept}/{folder_slug}"
                by_folder.setdefault(key, []).append(item)
                total += 1
                page_count += 1

        if page_count:
            meta_pages.append(
                {
                    "page": pi + 1,
                    "seri": serie,
                    "subcat": subcat,
                    "dept": dept,
                    "folder": folder_slug,
                    "count": page_count,
                }
            )

    doc.close()

    OUT_ROOT.mkdir(parents=True, exist_ok=True)

    index = {
        "marka": BRAND,
        "liste": LISTE,
        "kaynak_pdf": str(pdf_path),
        "olusturma": datetime.now(timezone.utc).isoformat(),
        "toplam_urun": total,
        "klasorler": [],
    }

    for key in sorted(by_folder.keys()):
        dept, slug = key.split("/", 1)
        dest_dir = OUT_ROOT / dept / slug
        dest_dir.mkdir(parents=True, exist_ok=True)
        items = by_folder[key]
        with open(dest_dir / "urunler.json", "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        index["klasorler"].append(
            {
                "dept": dept,
                "slug": slug,
                "path": f"{dept}/{slug}",
                "adet": len(items),
                "ornek_alt_kategori": items[0].get("alt_kategori", "") if items else "",
            }
        )

    with open(OUT_ROOT / "_index.json", "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=2)

    with open(OUT_ROOT / "_sayfa-log.json", "w", encoding="utf-8") as f:
        json.dump(meta_pages, f, ensure_ascii=False, indent=2)

    # Tek dosyada birleşik (import kolaylığı)
    all_items = []
    for key in sorted(by_folder.keys()):
        all_items.extend(by_folder[key])
    with open(OUT_ROOT / "tum-urunler.json", "w", encoding="utf-8") as f:
        json.dump(all_items, f, ensure_ascii=False, indent=2)

    print(f"OK: {total} ürün → {OUT_ROOT}")
    print(f"Klasör sayısı: {len(by_folder)}")
    for k in sorted(by_folder.keys()):
        print(f"  {k}: {len(by_folder[k])}")


if __name__ == "__main__":
    main()
