"""One-off probe for iles.com.tr structure."""
import json
import re
import ssl
import urllib.request
from pathlib import Path

ctx = ssl._create_unverified_context()
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoScraper/1.0"
ROOT = Path(__file__).resolve().parent.parent / "data" / "iles"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    return urllib.request.urlopen(req, context=ctx, timeout=60).read().decode("utf-8", "replace")


def main() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    html = fetch("https://www.iles.com.tr/")
    (ROOT / "_home.html").write_text(html, encoding="utf-8")
    print("home len", len(html))

    links = set(re.findall(r'href=["\']([^"\']+)["\']', html, re.I))
    pis = sorted({l for l in links if re.search(r"pis|piş|pisir", l, re.I)})
    print("pis links", len(pis))
    for l in pis[:30]:
        print(" ", l)

    cat_url = "https://www.iles.com.tr/pisirme-ekipmanlari"
    cat = fetch(cat_url)
    (ROOT / "_pisirme.html").write_text(cat, encoding="utf-8")
    print("pisirme len", len(cat))

    # product links
    prod_links = sorted(
        {
            l
            for l in re.findall(r'href=["\']([^"\']+)["\']', cat, re.I)
            if l.startswith("/") and "-" in l and "pisirme" not in l.lower()
        }
    )
    print("relative links sample", prod_links[:15], "...", len(prod_links))

    # JSON blobs
    for m in re.finditer(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', cat, re.S | re.I):
        print("ld+json", m.group(1)[:200])

    apis = set(re.findall(r'https?://[^"\']+api[^"\']*', cat, re.I))
    print("api urls", list(apis)[:10])

    # Ticimax / common TR ecommerce
    for kw in ["Ticimax", "ticimax", "ProductList", "kategori", "Category", "page="]:
        print(kw, cat.lower().count(kw.lower()) if kw != "page=" else cat.count("page="))


if __name__ == "__main__":
    main()
