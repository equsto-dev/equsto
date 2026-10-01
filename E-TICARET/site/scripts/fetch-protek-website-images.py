#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PRO-TEK ürün görsellerini firma sitesinden (protekhijyen.com.tr) çeker.

Katalog PDF kırpımı kullanılmaz — WordPress ürün featured image + sayfa görselleri.

  python3 scripts/fetch-protek-website-images.py
  python3 scripts/fetch-protek-website-images.py --codes PH5103,PH5421
"""
from __future__ import annotations

import argparse
import io
import json
import re
import ssl
import time
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "scripts/data/protek/protek-catalog.json"
MAP_OUT = ROOT / "scripts/data/protek/website-image-map.json"
IMG_OUT = ROOT / "public/data/protek/images"
WP_PRODUCTS = "https://www.protekhijyen.com.tr/wp-json/wp/v2/product"
UA = "Mozilla/5.0 EqustoBot/1.0 (protek image sync)"
CTX = ssl.create_default_context()


def fetch_bytes(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, context=CTX, timeout=timeout) as r:
        return r.read()


def fetch_json(url: str) -> object:
    return json.loads(fetch_bytes(url).decode("utf-8"))


def list_wp_products() -> list[dict]:
    out: list[dict] = []
    page = 1
    while True:
        url = f"{WP_PRODUCTS}?per_page=50&page={page}&_embed=1"
        batch = fetch_json(url)
        if not isinstance(batch, list) or not batch:
            break
        out.extend(batch)
        if len(batch) < 50:
            break
        page += 1
        time.sleep(0.2)
    return out


def extract_codes(blob: str) -> list[str]:
    return sorted({f"PH{m}" for m in re.findall(r"PH\s*[-]?\s*(\d{3,5})", blob, re.I)})


def featured_url(p: dict) -> str:
    emb = p.get("_embedded") or {}
    media = emb.get("wp:featuredmedia") or []
    if not media:
        return ""
    m = media[0]
    return str(m.get("source_url") or "")


def page_images(link: str) -> list[str]:
    try:
        html = fetch_bytes(link).decode("utf-8", "ignore")
    except Exception:
        return []
    imgs = re.findall(
        r"(https://www\.protekhijyen\.com\.tr/wp-content/uploads/[^\"']+\.(?:jpg|jpeg|png|webp))",
        html,
        re.I,
    )
    # drop wordpress thumbs
    imgs = [u for u in imgs if not re.search(r"-\d{2,3}x\d{2,3}\.", u)]
    return list(dict.fromkeys(imgs))


def pick_image(code: str, featured: str, link: str) -> str:
    digits = code[2:]
    candidates: list[str] = []
    if featured:
        candidates.append(featured)
    if link:
        candidates.extend(page_images(link))
    # prefer filename containing code digits
    prefer = [u for u in candidates if re.search(rf"(?i)(?:ph[-_]?)?{digits}", u)]
    if prefer:
        return prefer[0]
    return candidates[0] if candidates else ""


def build_mapping(products: list[dict], our_codes: set[str]) -> dict[str, dict]:
    rows = []
    for p in products:
        title = ((p.get("title") or {}).get("rendered") or "")
        slug = p.get("slug") or ""
        link = p.get("link") or ""
        content = ((p.get("content") or {}).get("rendered") or "")
        blob = " ".join([title, slug, link, content])
        codes = [c for c in extract_codes(blob) if c in our_codes]
        feat = featured_url(p)
        if not codes and not feat:
            continue
        rows.append(
            {
                "title": re.sub(r"<[^>]+>", "", title),
                "slug": slug,
                "link": link,
                "codes": codes,
                "featured": feat,
            }
        )

    mapping: dict[str, dict] = {}
    for row in rows:
        for code in row["codes"]:
            url = pick_image(code, row["featured"], row["link"])
            if not url:
                continue
            # keep higher-confidence (filename match) over generic shared featured
            prev = mapping.get(code)
            score = 2 if re.search(rf"(?i)(?:ph[-_]?)?{code[2:]}", url) else 1
            if not prev or score > int(prev.get("_score") or 0):
                mapping[code] = {
                    "url": url,
                    "link": row["link"],
                    "title": row["title"],
                    "slug": row["slug"],
                    "_score": score,
                }
    for v in mapping.values():
        v.pop("_score", None)
    return mapping


def save_jpeg(data: bytes, dest: Path) -> tuple[int, int]:
    im = Image.open(io.BytesIO(data)).convert("RGB")
    w, h = im.size
    if max(w, h) > 1400:
        scale = 1400 / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "JPEG", quality=90, optimize=True)
    return im.size


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--codes", default="", help="Comma-separated PH codes (optional)")
    args = ap.parse_args()
    only = {c.strip().upper().replace(" ", "") for c in args.codes.split(",") if c.strip()}

    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    our_codes = {p["code"] for p in catalog.get("products") or []}
    if only:
        our_codes &= only

    print(f"WP ürünleri çekiliyor… (hedef {len(our_codes)} kod)")
    products = list_wp_products()
    print(f"WP ürün: {len(products)}")
    mapping = build_mapping(products, our_codes)
    print(f"Eşleşen: {len(mapping)} / {len(our_codes)}")

    MAP_OUT.parent.mkdir(parents=True, exist_ok=True)
    MAP_OUT.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    ok = fail = 0
    for code in sorted(mapping):
        info = mapping[code]
        dest = IMG_OUT / f"{code.lower()}.jpg"
        try:
            data = fetch_bytes(info["url"])
            size = save_jpeg(data, dest)
            print(f"OK {code} {size[0]}x{size[1]} ← {info['url'].rsplit('/', 1)[-1]}")
            ok += 1
        except Exception as e:
            print(f"FAIL {code}: {e}")
            fail += 1
        time.sleep(0.1)

    missing = sorted(our_codes - set(mapping))
    print(f"Bitti: ok={ok} fail={fail} missing={len(missing)}")
    if missing:
        print("Eksik:", ", ".join(missing))


if __name__ == "__main__":
    main()
