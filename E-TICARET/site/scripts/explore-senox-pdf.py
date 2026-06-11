# -*- coding: utf-8 -*-
"""Senox 2026 PDF yapı keşfi."""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

import fitz

PDF = Path(r"c:\D Disk\FİYAT LİSTELERİ\SENOX 2026-1 4 (1).pdf")
OUT = Path(__file__).resolve().parent / "data" / "senox" / "pdf-explore.json"

# Senox model patterns
MODEL_RE = re.compile(
    r"\b(SDS[-\s]?\d+[A-Z0-9\-/]*|BBC[S]?[-\s]?\d+|SBC\d+|SNX\d+[A-Z]*|SMR[-\s]?\d+|"
    r"730[01][A-Z]?|BLK\d+|BZ\d+|WN[-\s]?\d+|WF[-\s]?\d+|MS\d+|SNX[-\s]?\d+|"
    r"SMFER[-\s]?[A-Z0-9\-]+|CF\d+[A-Z]*|SYS[-\s]?\d+[A-Z]*)\b",
    re.I,
)
PRICE_RE = re.compile(r"(\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s*(?:TL|₺)?", re.I)
DIM_RE = re.compile(r"(\d{2,4})\s*[x×X*]\s*(\d{2,4})\s*[x×X*]\s*(\d{2,4})", re.I)


def main():
    doc = fitz.open(PDF)
    n = doc.page_count
    pages_text = 0
    pages_img = 0
    img_sizes = Counter()
    models = Counter()
    sample_pages = []
    img_per_page = []
    text_blocks_sample = []

    for i in range(n):
        page = doc[i]
        text = page.get_text("text") or ""
        if len(text.strip()) > 40:
            pages_text += 1
        imgs = page.get_images(full=True)
        infos = page.get_image_info()
        if imgs:
            pages_img += 1
        img_per_page.append(len(imgs))

        for m in MODEL_RE.findall(text):
            models[m.upper().replace(" ", "-")] += 1

        if len(sample_pages) < 20 and (len(text.strip()) > 100 or len(imgs) >= 2):
            blocks = page.get_text("dict")["blocks"]
            tb = []
            for b in blocks[:8]:
                if b.get("type") == 0:
                    lines = []
                    for ln in b.get("lines", [])[:3]:
                        spans = "".join(s.get("text", "") for s in ln.get("spans", []))
                        if spans.strip():
                            lines.append(spans.strip())
                    if lines:
                        tb.append({"bbox": b.get("bbox"), "text": " | ".join(lines)[:200]})
            sample_pages.append({
                "page": i + 1,
                "text_len": len(text),
                "img_count": len(imgs),
                "img_info_count": len(infos),
                "models": MODEL_RE.findall(text)[:12],
                "text_head": text[:1200],
                "blocks": tb[:6],
                "img_bboxes": [(round(x["bbox"][0]), round(x["bbox"][1]), round(x["bbox"][2]), round(x["bbox"][3]))
                               for x in infos[:8]],
            })

        for img in imgs[:3]:
            try:
                pix = fitz.Pixmap(doc, img[0])
                img_sizes[f"{pix.width}x{pix.height}"] += 1
            except Exception:
                pass

    # xref unique images
    xref_count = len(doc.get_page_images(0)) if n else 0
    all_xrefs = set()
    for i in range(n):
        for img in doc[i].get_images(full=True):
            all_xrefs.add(img[0])

    doc.close()

    result = {
        "pdf": str(PDF),
        "pages": n,
        "pages_with_text": pages_text,
        "pages_with_images": pages_img,
        "unique_embedded_xrefs": len(all_xrefs),
        "avg_imgs_per_page": round(sum(img_per_page) / max(n, 1), 2),
        "max_imgs_page": max(img_per_page) if img_per_page else 0,
        "top_img_sizes": img_sizes.most_common(15),
        "unique_models_in_text": len(models),
        "top_models": models.most_common(30),
        "sample_pages": sample_pages,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: v for k, v in result.items() if k != "sample_pages"}, ensure_ascii=False, indent=2))
    print("written", OUT)


if __name__ == "__main__":
    main()
