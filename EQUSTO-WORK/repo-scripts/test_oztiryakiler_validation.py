"""Validate which products have real product pages by:
1. Fetching the Öztiryakiler search/catalog page for each model code.
2. Computing MD5 of the image to detect placeholder duplicates.
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
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ctx = ssl._create_unverified_context()

MODEL_RE = re.compile(r'\b([A-Z0-9]{2,6}(?:\.[A-Z0-9]{1,6}){1,4})\b', re.I)


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
        return 0, b""


def main() -> None:
    rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    oz = [r for r in rows if "ztiryakiler" in (r.get("brand") or "").lower()]
    # Fetch first 20 products to see hash distribution and check product page existence
    sample = oz[:20]

    hashes: dict[str, list[str]] = {}
    page_status: list[tuple[str, str, int, str]] = []

    for r in sample:
        name = r.get("name") or ""
        model = extract_model(name)
        if not model:
            continue
        # 1) Get image and compute hash
        img_url = f"https://oztiryakiler.com.tr/ax-images/images/{model}.jpg"
        code, data = http_get(img_url)
        h = hashlib.md5(data).hexdigest() if data else "no-data"
        size = len(data)
        hashes.setdefault(h, []).append(f"{model}  ({size:>7}B)  {name[:55]}")

        # 2) Check the search/catalog: look for the model in oztiryakiler.com.tr's search
        # The site uses /?s=<query> for search
        search_url = f"https://oztiryakiler.com.tr/?s={model}"
        scode, sdata = http_get(search_url, timeout=15)
        body = sdata.decode("utf-8", errors="ignore") if sdata else ""
        # Look for /urun/ links in search results
        product_links = re.findall(r'href=[\'"]([^\'"]+/urun/[^\'"]+)[\'"]', body)
        product_links = list({u for u in product_links})
        match_link = ""
        for u in product_links:
            if model.lower().replace(".", "-") in u.lower():
                match_link = u
                break
        if not match_link and product_links:
            match_link = product_links[0]
        page_status.append((model, name[:50], scode, match_link[:80]))

        time.sleep(0.2)

    print("=== Image hash distribution ===")
    for h, items in sorted(hashes.items(), key=lambda x: -len(x[1])):
        print(f"\nHash {h}  ({len(items)} products):")
        for it in items:
            print(f"  {it}")

    print("\n=== Product page lookup via search ===")
    for m, n, c, link in page_status:
        print(f"  [{c}] {m:25} -> {link}")
        print(f"        {n}")


if __name__ == "__main__":
    main()
