"""Deeper probe: search the Öztiryakiler product page for all *.jpg/*.png URLs and JSON-LD data."""
from __future__ import annotations

import re
import ssl
import sys
import urllib.request

URL = sys.argv[1] if len(sys.argv) > 1 else "https://oztiryakiler.com.tr/urun/tek-inoks-kapi-dik-tip-buzdolabi-k-tip-79k4-06nmv-00/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

ctx = ssl._create_unverified_context()
req = urllib.request.Request(URL, headers={"User-Agent": UA, "Accept": "text/html"})
with urllib.request.urlopen(req, timeout=30, context=ctx) as r:
    html = r.read().decode("utf-8", errors="ignore")

print(f"HTTP OK ({len(html):,} bytes)")
print()

print("=== JSON-LD blocks ===")
jsonld = re.findall(r'<script[^>]+type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.I | re.S)
for i, blk in enumerate(jsonld):
    print(f"--- block {i} ---")
    print(blk.strip()[:2000])
print()

print("=== All *.jpg / *.jpeg / *.png / *.webp URLs in entire HTML (deduplicated) ===")
all_imgs = re.findall(r'https?://[^\s\'"<>]+\.(?:jpg|jpeg|png|webp)', html, re.I)
seen = set()
for u in all_imgs:
    if u not in seen:
        seen.add(u)
        print("  " + u)
print()

print("=== Sample of body around 'gallery' / 'product-image' / 'master-slider' ===")
for kw in ("masterslider", "gallery", "product-image", "ms-slide", "wp-content/uploads/2024", "wp-content/uploads/2025"):
    idx = html.lower().find(kw.lower())
    if idx >= 0:
        print(f"--- match '{kw}' at offset {idx} ---")
        print(html[max(0, idx-100):idx+500])
        print()
