"""Validated pilot: only download Öztiryakiler images for products that have
a real product page on oztiryakiler.com.tr. Confirms the slug contains the
model code (with dots converted to dashes) before trusting the image URL.

Saves images to public/data/images-oztiryakiler-pilot/ for review.
"""
from __future__ import annotations

import hashlib
import json
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
JSON_PATH = ROOT / "public" / "data" / "ekipmanlar.json"
OUT_DIR = ROOT / "public" / "data" / "images-oztiryakiler-pilot"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ctx = ssl._create_unverified_context()

MODEL_RE = re.compile(r'\b([A-Z0-9]{2,6}(?:\.[A-Z0-9]{1,6}){1,4})\b', re.I)
PRODUCT_LINK_RE = re.compile(r'href=[\'"]([^\'"]+/urun/[^\'"]+/)[\'"]', re.I)
PRODUCT_IMG_RE = re.compile(
    r'<a class="gallery swiper-slide"[^>]*href=[\'"]([^\'"]+\.(?:jpg|jpeg|png))[\'"]',
    re.I,
)


def extract_model(name: str) -> str | None:
    candidates = MODEL_RE.findall(name)
    if not candidates:
        return None
    valid = [c for c in candidates if any(ch.isdigit() for ch in c) and len(c) >= 7]
    if not valid:
        return None
    return max(valid, key=len).upper()


def http_get(url: str, timeout: float = 30.0) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://oztiryakiler.com.tr/"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        print(f"    [err] {e}")
        return 0, b""


def find_product_page(model: str) -> str | None:
    """Search oztiryakiler.com.tr and return the canonical product URL if its slug
    contains the model code (dots converted to dashes)."""
    slug_token = model.lower().replace(".", "-")
    code, body = http_get(f"https://oztiryakiler.com.tr/?s={model}", timeout=20)
    if code != 200 or not body:
        return None
    html = body.decode("utf-8", errors="ignore")
    seen: set[str] = set()
    for m in PRODUCT_LINK_RE.finditer(html):
        url = m.group(1)
        if url in seen:
            continue
        seen.add(url)
        # Skip /en/ pages
        if "/en/" in url:
            continue
        if slug_token in url.lower():
            return url
    return None


def extract_image_url(product_html: str) -> str | None:
    m = PRODUCT_IMG_RE.search(product_html)
    return m.group(1) if m else None


def main() -> None:
    rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    oz = [r for r in rows if "ztiryakiler" in (r.get("brand") or "").lower()]

    # Diverse sample: every 50th product, max 10
    step = max(1, len(oz) // 10)
    sample = [oz[i] for i in range(0, len(oz), step)][:10]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    # Clear any prior pilot files (but keep the report)
    for p in OUT_DIR.glob("*.jpg"):
        p.unlink()
    for p in OUT_DIR.glob("*.png"):
        p.unlink()
    for p in OUT_DIR.glob("*.jpeg"):
        p.unlink()

    print(f"Output: {OUT_DIR}\n")
    report = []
    for r in sample:
        name = r.get("name") or ""
        model = extract_model(name)
        print(f"--- {name[:80]}")
        print(f"    model: {model}")
        if not model:
            report.append({"name": name, "status": "no-model"})
            continue

        page_url = find_product_page(model)
        if not page_url:
            print("    -> no matching product page on oztiryakiler.com.tr")
            report.append({"name": name, "model": model, "status": "no-page"})
            time.sleep(0.2)
            continue

        print(f"    page: {page_url}")
        code, body = http_get(page_url)
        if code != 200 or not body:
            print(f"    -> page HTTP {code}")
            report.append({"name": name, "model": model, "status": "page-error", "page": page_url})
            time.sleep(0.2)
            continue

        img_url = extract_image_url(body.decode("utf-8", errors="ignore"))
        if not img_url:
            print("    -> no <img> in product gallery")
            report.append({"name": name, "model": model, "status": "no-img-tag", "page": page_url})
            time.sleep(0.2)
            continue

        print(f"    img:  {img_url}")
        icode, idata = http_get(img_url)
        if icode != 200 or len(idata) < 1000:
            print(f"    -> image HTTP {icode} size={len(idata)}")
            report.append({"name": name, "model": model, "status": "img-error", "img": img_url})
            time.sleep(0.2)
            continue

        ext = Path(img_url).suffix.lstrip(".").lower() or "jpg"
        fname = f"{model}.{ext}"
        dest = OUT_DIR / fname
        dest.write_bytes(idata)
        h = hashlib.md5(idata).hexdigest()
        print(f"    -> SAVED {fname} ({len(idata)//1024} KB, md5={h[:8]})")
        report.append({
            "name": name, "model": model, "status": "ok",
            "page": page_url, "img": img_url, "file": fname, "md5": h,
        })
        time.sleep(0.25)
        print()

    summary = OUT_DIR / "_pilot-report.json"
    summary.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    ok = sum(1 for x in report if x.get("status") == "ok")
    print(f"\nDone: {ok}/{len(report)} succeeded")
    statuses: dict[str, int] = {}
    for r in report:
        statuses[r["status"]] = statuses.get(r["status"], 0) + 1
    for s, c in statuses.items():
        print(f"  {s}: {c}")


if __name__ == "__main__":
    main()
