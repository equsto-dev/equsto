#!/usr/bin/env python3
"""Pull extra asset URLs referenced in saved Shopify HTML (logos, CSS backgrounds)."""
from __future__ import annotations

import json
import re
import ssl
import urllib.error
import urllib.request
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent / "public/data/advanced-cuisine-clear-ice"
PAT = re.compile(
    r"https://(?:cdn\.shopify\.com/[^\"'\s>]+|advanced-cuisine\.com/cdn/shop/[^\"'\s>]+)",
    re.I,
)


def fetch(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 EqustoFetcher/1.0"})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=120) as r:
            dest.write_bytes(r.read())
    except urllib.error.URLError as e:
        if "advanced-cuisine.com" in url and "CERTIFICATE" in str(e).upper():
            insecure = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=insecure, timeout=120) as r:
                dest.write_bytes(r.read())
        else:
            raise


def main() -> None:
    found: set[str] = set()
    for fn in ("collection.html", "product-imt300.html", "product-imt200.html"):
        p = BASE / fn
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8", errors="replace")
        for m in PAT.findall(text):
            found.add(m.split('"')[0].split("'")[0])

    known: set[str] = set()
    pj = BASE / "products.json"
    if pj.is_file():
        data = json.loads(pj.read_text(encoding="utf-8"))
        for pr in data.get("products", []):
            for im in pr.get("images", []):
                src = im.get("src") or ""
                if src:
                    known.add(src)

    extra = BASE / "images" / "extras"
    extra.mkdir(parents=True, exist_ok=True)

    n = 0
    for i, url in enumerate(sorted(found)):
        low = url.lower()
        if not any(low.split("?")[0].endswith(ext) for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif")):
            continue
        if url in known:
            continue
        tail = url.split("/")[-1].split("?")[0]
        name = re.sub(r"[^a-zA-Z0-9._-]+", "_", tail)[:100]
        out = extra / f"{i:03d}_{name}"
        if out.is_file() and out.stat().st_size > 50:
            continue
        try:
            fetch(url, out)
            n += 1
        except OSError as e:
            print("skip", url[:90], e)

    print(f"extras: downloaded {n} files (candidates {len(found)})")


if __name__ == "__main__":
    main()
