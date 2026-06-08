# -*- coding: utf-8 -*-
"""PDF s.188-197 metin + fiyat + ürün görselleri çıkarımı."""
import json
import re
import sys
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent.parent.parent / "E-TICARET" / "site"
import importlib.util

spec = importlib.util.spec_from_file_location(
    "sync_pimak_fiyat_pdf", SITE / "scripts" / "sync-pimak-fiyat-pdf.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
extract_pairs_from_page = mod.extract_pairs_from_page
norm_kod = mod.norm_kod

PDF = Path(r"C:/D Disk/FİYAT LİSTELERİ/pimak 27-27-030426.pdf")
OUT_TXT = ROOT / "_pdf-p188-197.txt"
OUT_CODES = ROOT / "p188-197-codes.json"
OUT_IMG = ROOT / "media" / "pdf-p188-197"
OUT_MANIFEST = ROOT / "p188-197-prod-images.json"

MIN_AREA = 50_000
MIN_W = 200
MIN_H = 120


def normalize_ligatures(s: str) -> str:
    return (
        s.replace("\ufb02", "fl")
        .replace("\ufb01", "fi")
        .replace("\ufb00", "ff")
        .replace("\ufb03", "ffi")
        .replace("\ufb04", "ffl")
    )


def is_product_image_block(b: dict) -> bool:
    if b.get("type") != 1:
        return False
    w, h = b.get("width", 0), b.get("height", 0)
    area = w * h
    if area < MIN_AREA or w < MIN_W or h < MIN_H:
        return False
    # tablo şeritleri / ince banner
    if w > 650 and h < 90:
        return False
    return True


def family_titles_on_page(page) -> list[dict]:
    titles = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") != 0:
            continue
        for line in b.get("lines", []):
            text = normalize_ligatures("".join(s["text"] for s in line.get("spans", [])).strip())
            if "|" not in text or len(text) < 12:
                continue
            tr = text.split("|")[0].strip()
            if not re.search(r"[ğüşıöçĞÜŞİÖÇA-Za-z]", tr):
                continue
            titles.append({"y": line["bbox"][1], "name": tr})
    titles.sort(key=lambda x: x["y"])
    return titles


def extract_product_images(page, page_no: int) -> list[dict]:
    saved = []
    for b in page.get_text("dict")["blocks"]:
        if not is_product_image_block(b):
            continue
        ext = b.get("ext", "png")
        idx = len(saved)
        fname = f"p{page_no:03d}-prod{idx:02d}.{ext}"
        out = OUT_IMG / fname
        out.write_bytes(b["image"])
        saved.append(
            {
                "file": fname,
                "path": f"media/pdf-p188-197/{fname}",
                "y": b["bbox"][1],
                "x": b["bbox"][0],
                "w": b.get("width", 0),
                "h": b.get("height", 0),
            }
        )
    saved.sort(key=lambda x: x["y"])
    return saved


doc = fitz.open(PDF)
lines = []
codes: dict[str, dict] = {}
manifest: dict[str, dict] = {}
OUT_IMG.mkdir(parents=True, exist_ok=True)

for pno in range(187, 197):
    page = doc[pno]
    page_no = pno + 1
    text = page.get_text("text")
    lines.append(f"=== PAGE {page_no} ===\n{text}")
    for code, price in extract_pairs_from_page(text):
        k = norm_kod(code)
        codes[k] = {"urun_kodu": code, "liste_fiyati_eur": price, "pdf_page": page_no}

    prod_imgs = extract_product_images(page, page_no)
    manifest[str(page_no)] = {
        "images": prod_imgs,
        "families": family_titles_on_page(page),
    }
    print(f"[p188-197] p{page_no}: {len(prod_imgs)} urun gorseli")

OUT_TXT.write_text("\n\n".join(lines), encoding="utf-8")
OUT_CODES.write_text(json.dumps(codes, ensure_ascii=False, indent=2), encoding="utf-8")
OUT_MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"[p188-197] {len(codes)} kod -> {OUT_CODES.name}")
print(f"[p188-197] metin -> {OUT_TXT.name}")
print(f"[p188-197] gorseller -> {OUT_IMG}")
print(f"[p188-197] manifest -> {OUT_MANIFEST.name}")
