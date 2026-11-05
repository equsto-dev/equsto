# -*- coding: utf-8 -*-
"""
Gastrotech 2025-2027 PDF → ürün görselleri + model eşlemesi.

  python scripts/extract-gastrotech-pdf-images.py
  python scripts/extract-gastrotech-pdf-images.py --apply
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz

sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parents[1]
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\Gastrotech 2025-2027 Kataloğu.pdf")
IMG_DIR = ROOT / "public/images/catalog/gastrotech"
MAP_JSON = ROOT / "scripts/data/gastrotech/gastrotech-image-map.json"
CATALOG = ROOT / "scripts/data/gastrotech/gastrotech-catalog-extracted.json"
DEPT_DIR = ROOT / "public/data/dept"
RATIONAL_PAGES = set(range(91, 95))


def norm(s: str) -> str:
    return re.sub(r"[^A-Z0-9]", "", str(s or "").upper())


def is_product_image(im: dict, page_rect: fitz.Rect) -> bool:
    w, h = im["width"], im["height"]
    bbox = im["bbox"]
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    if w < 70 or h < 70:
        return False
    if bw < 40 or bh < 40:
        return False
    if bw * bh > page_rect.width * page_rect.height * 0.55:
        return False
    # İnce şerit / kenar çizgisi
    if bw < 8 or bh < 8 or (bw < 30 and bh > page_rect.height * 0.5):
        return False
    if w * h < 5000:
        return False
    return True


def save_image(doc: fitz.Document, page: fitz.Page, im: dict, dest: Path) -> bool:
    xref = im["xref"]
    bbox = fitz.Rect(im["bbox"]) & page.rect
    try:
        pix = fitz.Pixmap(doc, xref)
        if pix.alpha or pix.n > 3:
            pix = fitz.Pixmap(fitz.csRGB, pix)
        # Çok küçük raster → clip render
        if pix.width < 80 or pix.height < 80:
            raise RuntimeError("small xref")
        pix.save(str(dest), jpg_quality=92)
        if dest.stat().st_size > 800:
            return True
        dest.unlink(missing_ok=True)
    except Exception:
        pass
    try:
        if bbox.width < 30 or bbox.height < 30:
            return False
        pix = page.get_pixmap(matrix=fitz.Matrix(2.5, 2.5), clip=bbox, alpha=False)
        pix.save(str(dest), jpg_quality=90)
        return dest.stat().st_size > 800
    except Exception:
        dest.unlink(missing_ok=True)
        return False


def gallery_model_labels(page: fitz.Page, images: list[dict]) -> list[tuple[str, float, float]]:
    """Görsellerin hemen altındaki model kodları (vitrin satırı)."""
    if not images:
        return []
    words = page.get_text("words")
    # Görsel bantları: y'ye göre kümele
    bands: list[list[dict]] = []
    for im in sorted(images, key=lambda x: (x["bbox"][1], x["bbox"][0])):
        cy = (im["bbox"][1] + im["bbox"][3]) / 2
        placed = False
        for band in bands:
            bcy = sum((b["bbox"][1] + b["bbox"][3]) / 2 for b in band) / len(band)
            if abs(cy - bcy) < 80:
                band.append(im)
                placed = True
                break
        if not placed:
            bands.append([im])

    labels: list[tuple[str, float, float]] = []
    model_re = re.compile(
        r"^(?:"
        r"[A-Z]{1,6}\d{2,}[A-Z0-9\-]*"
        r"|371\d{3}"
        r"|217\d{3}"
        r"|NEVO-\d{2}[A-Z]*"
        r"|ST-?\d{3}[A-Z]*"
        r"|AC-?\d{3}[A-Z]*"
        r"|GT-\d[A-Z0-9\-]*"
        r"|EC|AC|NW|MX"
        r"|PUQ|EK43|M4|PRO|Q"
        r")$",
        re.I,
    )

    for band in bands:
        y_bottom = max(im["bbox"][3] for im in band)
        y_top = min(im["bbox"][1] for im in band)
        # Etiketler görselin 5–55 pt altında
        cands = []
        for w in words:
            x0, y0, x1, y1, text = w[0], w[1], w[2], w[3], w[4]
            if y0 < y_bottom - 2 or y0 > y_bottom + 55:
                continue
            if y0 < y_top:
                continue
            tok = text.strip()
            if model_re.match(tok) or (re.match(r"^[A-Z0-9][A-Z0-9.\-/]{2,20}$", tok, re.I) and re.search(r"\d", tok)):
                cands.append((tok, (x0 + x1) / 2, (y0 + y1) / 2))
        # İki token: EC + 47
        # ayrıca aynı satırda bitişik
        merged = []
        used = set()
        cands_sorted = sorted(cands, key=lambda c: c[1])
        for i, (tok, cx, cy) in enumerate(cands_sorted):
            if i in used:
                continue
            if tok.upper() in {"EC", "AC", "NW", "MX", "EK"} and i + 1 < len(cands_sorted):
                ntok, ncx, ncy = cands_sorted[i + 1]
                if re.fullmatch(r"\d{2,4}", ntok) and abs(ncy - cy) < 8:
                    merged.append((f"{tok} {ntok}", (cx + ncx) / 2, cy))
                    used.add(i)
                    used.add(i + 1)
                    continue
            if tok.upper() in {"PRO", "Q"} and abs(cy - y_bottom) < 60:
                # Puqpress alt etiketleri — sayfa 238'de ayrıca ele alınır
                merged.append((tok, cx, cy))
                used.add(i)
                continue
            if re.fullmatch(r"\d{2,4}", tok):
                continue
            merged.append((tok, cx, cy))
            used.add(i)
        labels.extend(merged)
    return labels


def pair_models_to_images(
    labels: list[tuple[str, float, float]], images: list[dict]
) -> dict[str, dict]:
    """model → en yakın görsel (aynı bant tercihi)."""
    if not labels or not images:
        return {}
    # Her görsel bir kez
    remaining = list(range(len(images)))
    pairs: dict[str, dict] = {}

    # Bantlara ayır
    def band_key(y: float) -> int:
        return int(y // 120)

    labels_by_band: dict[int, list] = defaultdict(list)
    for lab in labels:
        labels_by_band[band_key(lab[2])].append(lab)

    imgs_by_band: dict[int, list[int]] = defaultdict(list)
    for i, im in enumerate(images):
        cy = (im["bbox"][1] + im["bbox"][3]) / 2
        imgs_by_band[band_key(cy)].append(i)

    # Önce aynı bantta x sırasına göre
    for bk, labs in labels_by_band.items():
        # En yakın görsel bandı
        cand_bands = [bk, bk - 1, bk + 1, bk - 2]
        img_idxs = []
        for b in cand_bands:
            img_idxs.extend([i for i in imgs_by_band.get(b, []) if i in remaining])
        if not img_idxs:
            img_idxs = [i for i in remaining]
        labs_sorted = sorted(labs, key=lambda L: L[1])
        imgs_sorted = sorted(img_idxs, key=lambda i: (images[i]["bbox"][0] + images[i]["bbox"][2]) / 2)
        # Eşit sayıda ise sırayla; değilse en yakın x
        if len(labs_sorted) == len(imgs_sorted):
            for lab, ii in zip(labs_sorted, imgs_sorted):
                pairs[lab[0]] = images[ii]
                if ii in remaining:
                    remaining.remove(ii)
        else:
            for lab in labs_sorted:
                best, best_d = None, 1e18
                for ii in list(remaining):
                    icx = (images[ii]["bbox"][0] + images[ii]["bbox"][2]) / 2
                    icy = (images[ii]["bbox"][1] + images[ii]["bbox"][3]) / 2
                    # Görsel modelin üstünde olmalı (veya yakın)
                    if icy > lab[2] + 40:
                        continue
                    d = abs(icx - lab[1]) * 1.0 + abs(icy - lab[2]) * 0.15
                    if d < best_d:
                        best_d, best = d, ii
                if best is not None:
                    pairs[lab[0]] = images[best]
                    remaining.remove(best)
    return pairs


def special_page_pairs(page_no: int, page: fitz.Page, images: list[dict]) -> dict[str, dict]:
    """Scotsman / Gtech / Puqpress özel eşleme."""
    pairs: dict[str, dict] = {}
    imgs = sorted(images, key=lambda im: (im["bbox"][1], im["bbox"][0]))
    if page_no == 226 and len(imgs) >= 2:
        # Sol kolon ST-530ED, sağ AC-517EC (üst fotoğraflar)
        top = sorted([im for im in imgs if im["bbox"][1] < 480], key=lambda im: im["bbox"][0])
        if len(top) >= 2:
            pairs["ST-530ED"] = top[0]
            pairs["AC-517EC"] = top[1]
        return pairs
    if page_no == 238:
        # Üst: EK43 T, EK43 ST | Alt: Q, PRO, M4
        top = sorted([im for im in imgs if im["bbox"][1] < 400], key=lambda im: im["bbox"][0])
        bot = sorted([im for im in imgs if im["bbox"][1] >= 400], key=lambda im: im["bbox"][0])
        if len(top) >= 2:
            pairs["EK 43 T"] = top[0]
            pairs["EK 43 S T"] = top[1]
        if len(bot) >= 3:
            pairs["PUQ PRESS Q"] = bot[0]
            pairs["PUQ PRESS PRO"] = bot[1]
            pairs["M4"] = bot[2]
        elif len(bot) == 2:
            pairs["PUQ PRESS Q"] = bot[0]
            pairs["PUQ PRESS PRO"] = bot[1]
        return pairs
    if 158 <= page_no <= 166:
        # Scotsman: görseller soldan sağa; modeller tabloda EC 47, EC 57...
        text = page.get_text("text")
        models = re.findall(r"\b((?:EC|AC|NW|MX)\s?\d{2,3}|SB\d+|BK-\d+|UBH\s?\d+)\b", text, re.I)
        # tekil sırayı koru
        seen = []
        for m in models:
            mu = re.sub(r"\s+", " ", m.upper().strip())
            mu = re.sub(r"^(EC|AC|NW|MX)(\d)", r"\1 \2", mu)
            if mu not in seen:
                seen.append(mu)
        # logo/banner hariç ürün fotoğrafları (büyük olanlar)
        prod = [im for im in imgs if (im["bbox"][3] - im["bbox"][1]) > 60]
        prod = sorted(prod, key=lambda im: im["bbox"][0])
        for m, im in zip(seen, prod):
            pairs[m] = im
        return pairs
    return pairs


def extract_all(apply: bool) -> None:
    if not PDF.exists():
        raise FileNotFoundError(PDF)
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    doc = fitz.open(PDF)
    catalog = json.loads(CATALOG.read_text(encoding="utf-8")) if CATALOG.exists() else {"products": []}
    catalog_by_page: dict[int, list] = defaultdict(list)
    for p in catalog.get("products", []):
        catalog_by_page[int(p["page"])].append(p)

    image_map: dict[str, dict] = {}  # norm(model) -> {path, page, model}
    saved = 0
    xref_saved: dict[int, str] = {}  # xref -> rel path (reuse)

    for pno in range(1, doc.page_count + 1):
        if pno in RATIONAL_PAGES:
            continue
        page = doc[pno - 1]
        info = [im for im in page.get_image_info(xrefs=True) if is_product_image(im, page.rect)]
        # Tekrarlayan xref'leri tekilleştir (aynı görsel birden fazla bbox)
        uniq = []
        seen_pos = set()
        for im in sorted(info, key=lambda x: (x["bbox"][1], x["bbox"][0])):
            key = (im["xref"], round(im["bbox"][0] / 5), round(im["bbox"][1] / 5))
            if key in seen_pos:
                continue
            seen_pos.add(key)
            uniq.append(im)
        info = uniq

        page_files = []
        for idx, im in enumerate(info):
            fname = f"p{pno:03d}_{idx+1}.jpg"
            dest = IMG_DIR / fname
            rel = f"images/catalog/gastrotech/{fname}"
            if not dest.exists():
                ok = save_image(doc, page, im, dest)
                if not ok:
                    continue
                saved += 1
            elif dest.stat().st_size < 800:
                continue
            im = {**im, "rel_path": rel, "file": fname}
            page_files.append(im)
            xref_saved[im["xref"]] = rel

        if not page_files:
            continue

        pairs = special_page_pairs(pno, page, page_files)
        if not pairs:
            labels = gallery_model_labels(page, page_files)
            pairs = pair_models_to_images(labels, page_files)

        # Katalog modelleriyle tamamla: sayfadaki her ürün için en yakın görsel
        for prod in catalog_by_page.get(pno, []):
            m = prod["model"]
            if any(norm(k) == norm(m) for k in pairs):
                continue
            # labels'ta yoksa tablo satırındaki model konumuna göre
            words = page.get_text("words")
            mx = my = None
            target = norm(m)
            for i, w in enumerate(words):
                if norm(w[4]) == target or (
                    i + 1 < len(words)
                    and norm(w[4] + words[i + 1][4]) == target
                    and abs(w[1] - words[i + 1][1]) < 5
                ):
                    mx = (w[0] + w[2]) / 2
                    my = (w[1] + w[3]) / 2
                    break
                if m.upper().startswith(("EC ", "AC ")) and w[4].upper() in {"EC", "AC"}:
                    if i + 1 < len(words) and words[i + 1][4] == m.split()[-1]:
                        mx = (w[0] + words[i + 1][2]) / 2
                        my = (w[1] + w[3]) / 2
                        break
            if mx is None:
                continue
            best, best_d = None, 1e18
            for im in page_files:
                icx = (im["bbox"][0] + im["bbox"][2]) / 2
                icy = (im["bbox"][1] + im["bbox"][3]) / 2
                if icy > my + 30:
                    continue
                d = abs(icx - mx) + abs(icy - my) * 0.2
                if d < best_d:
                    best_d, best = d, im
            if best is not None and best_d < 280:
                pairs[m] = best

        for model, im in pairs.items():
            rel = im.get("rel_path")
            if not rel:
                continue
            image_map[norm(model)] = {
                "model": model,
                "page": pno,
                "path": rel,
                "bbox": list(im["bbox"]),
            }

        print(f"  p{pno}: {len(page_files)} img, {len(pairs)} paired")

    MAP_JSON.parent.mkdir(parents=True, exist_ok=True)
    MAP_JSON.write_text(
        json.dumps({"count": len(image_map), "images": image_map}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Kaydedilen yeni dosya ≈{saved}, eşleşen model: {len(image_map)} → {MAP_JSON}")

    if apply:
        apply_to_catalog(image_map)


def apply_to_catalog(image_map: dict[str, dict]) -> None:
    updated = 0
    missing = 0
    for file in sorted(DEPT_DIR.glob("*.json")):
        if "_items" in file.name:
            continue
        rows = json.loads(file.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        changed = False
        for row in rows:
            if row.get("kaynak_fiyat_listesi") != "gastrotech-2025-2027" and row.get("fiyat_kaynagi") != "gastrotech-2025-2027":
                # Yeni eklenen Gastrotech / güncellenen kaynaklı
                if not str(row.get("id", "")).startswith(
                    ("gastrotech__", "gtech__", "puqpress__", "mahlkonig__", "vital__", "scotsman__")
                ):
                    continue
                if row.get("kaynak_fiyat_listesi") != "gastrotech-2025-2027":
                    continue
            keys = [
                norm(row.get("gastrotech_model")),
                norm(row.get("model")),
                norm(row.get("sku")),
                norm(row.get("marka_urun_kodu")),
            ]
            if row.get("id") and "__" in str(row["id"]):
                keys.append(norm(str(row["id"]).split("__", 1)[1]))
            hit = None
            for k in keys:
                if k and k in image_map:
                    hit = image_map[k]
                    break
            if not hit:
                # kısmi: EC47 vs EC 47
                for k in keys:
                    if not k:
                        continue
                    for mk, mv in image_map.items():
                        if mk == k or mk.endswith(k) or k.endswith(mk):
                            if abs(len(mk) - len(k)) <= 2:
                                hit = mv
                                break
                    if hit:
                        break
            if not hit:
                if row.get("kaynak_fiyat_listesi") == "gastrotech-2025-2027":
                    missing += 1
                continue
            # Mevcut cafemarkt görseli varsa ve gastrotech değilse — yalnızca boşsa veya gastrotech ürünüyse yaz
            existing = (row.get("images") or [None])[0] or row.get("image") or ""
            if existing and "gastrotech" not in existing and existing.startswith("images/catalog/") and not str(row.get("id", "")).startswith("gastrotech__"):
                # Güncellenen Scotsman/Gtech: katalog görseliyle değiştir (kaynak gastrotech)
                pass
            path = hit["path"]
            if not (ROOT / "public" / path).exists() and not (ROOT / path).exists():
                # path relative to public
                pub = ROOT / "public" / path
                if not pub.exists():
                    missing += 1
                    continue
            row["images"] = [path]
            row["image"] = path
            row["gastrotech_image"] = path
            changed = True
            updated += 1
        if changed:
            tmp = file.with_suffix(file.suffix + f".tmp-{os.getpid()}")
            tmp.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            tmp.replace(file)
    print(f"Apply: updated images={updated}, still missing≈{missing}")


# os for pid
import os  # noqa: E402


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true", help="dept JSON görsellerini güncelle")
    args = ap.parse_args()
    extract_all(apply=args.apply)


if __name__ == "__main__":
    main()
