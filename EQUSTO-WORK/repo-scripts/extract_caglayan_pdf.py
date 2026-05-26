# -*- coding: utf-8 -*-
"""Extract page renders and embedded images from Çağlayan Soğutma catalog PDF."""
import json
import os
from pathlib import Path

import fitz  # PyMuPDF

PDF_PATH = Path(r"c:\D Disk\FİYAT LİSTELERİ\ÇAĞLAYAN SOĞUTMA CATALOG MARKET.pdf")
OUT_ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR\caglayan-sogutma-catalog-export")
# 2x matrix ~144 DPI base -> sharper text/line art
ZOOM = 2.0


def main() -> None:
    OUT_ROOT.mkdir(parents=True, exist_ok=True)
    pages_dir = OUT_ROOT / "sayfa_goruntuleri"
    emb_dir = OUT_ROOT / "gömülü_görseller"
    pages_dir.mkdir(exist_ok=True)
    emb_dir.mkdir(exist_ok=True)

    manifest: dict = {
        "kaynak_pdf": str(PDF_PATH),
        "sayfa_sayısı": 0,
        "sayfalar": [],
        "gömülü_görsel_sayısı": 0,
    }

    doc = fitz.open(PDF_PATH)
    manifest["sayfa_sayısı"] = len(doc)
    mat = fitz.Matrix(ZOOM, ZOOM)
    seen_xrefs: set[int] = set()

    for i in range(len(doc)):
        page = doc[i]
        pnum = i + 1
        page_entry: dict = {
            "sayfa": pnum,
            "sayfa_dosyası": f"sayfa_{pnum:04d}.png",
            "gömülü": [],
        }

        pix = page.get_pixmap(matrix=mat, alpha=False)
        pix.save(pages_dir / page_entry["sayfa_dosyası"])

        img_list = page.get_images(full=True)
        for img in img_list:
            xref = img[0]
            if xref in seen_xrefs:
                continue
            seen_xrefs.add(xref)
            try:
                base = doc.extract_image(xref)
            except Exception:
                continue
            ext = base.get("ext", "png")
            name = f"sayfa{pnum:04d}_xref{xref}.{ext}"
            out_path = emb_dir / name
            out_path.write_bytes(base["image"])
            page_entry["gömülü"].append(name)
            manifest["gömülü_görsel_sayısı"] += 1

        manifest["sayfalar"].append(page_entry)

    doc.close()

    (OUT_ROOT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("OK", OUT_ROOT)
    print("sayfalar", manifest["sayfa_sayısı"])
    print("gömülü görsel", manifest["gömülü_görsel_sayısı"])


if __name__ == "__main__":
    main()
