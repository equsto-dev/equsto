"""Probe a single Öztiryakiler product page and dump candidate image URLs."""
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

og = re.findall(r'<meta[^>]+property=[\'"]og:image[\'"][^>]+content=[\'"]([^\'"]+)[\'"]', html, re.I)
print("og:image:")
for u in og:
    print("  " + u)

print()
print("All <img src=...> on /wp-content/uploads/:")
imgs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+wp-content/uploads[^\'"]+)[\'"]', html, re.I)
seen = set()
for u in imgs:
    if u not in seen:
        seen.add(u)
        print("  " + u)

print()
print("All srcset entries on /wp-content/uploads/:")
srcsets = re.findall(r'srcset=[\'"]([^\'"]+)[\'"]', html, re.I)
seen = set()
for ss in srcsets:
    for part in ss.split(","):
        u = part.strip().split(" ")[0]
        if "wp-content/uploads" in u and u not in seen:
            seen.add(u)
            print("  " + u)

print()
print("data-src/data-large/data-thumb attributes:")
for attr in ("data-src", "data-large_image", "data-thumb", "data-image", "href"):
    matches = re.findall(rf'{attr}=[\'"]([^\'"]+wp-content/uploads[^\'"]+)[\'"]', html, re.I)
    for u in matches:
        print(f"  [{attr}] {u}")
