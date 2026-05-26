#!/usr/bin/env python3
"""
advanced-cuisine.com — tam site scrape (Shopify API + HTML + görseller).

Kaynak: https://advanced-cuisine.com/pages/the-space-home ve tüm keşfedilen URL'ler.

Çıktı: external/advanced-cuisine-site/
  manifest.json       — özet
  api/                — products, collections, blogs JSON
  html/               — sayfa HTML'leri
  images/             — ürün ve sayfa görselleri
  urls.txt            — tüm URL listesi

Kullanım:
  python scripts/scrape_advanced_cuisine_site.py
  python scripts/scrape_advanced_cuisine_site.py --skip-images
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

BASE_URL = "https://advanced-cuisine.com"
START_PAGE = f"{BASE_URL}/pages/the-space-home"
ROOT = Path(__file__).resolve().parent.parent / "external" / "advanced-cuisine-site"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoScraper/1.0"

LINK_RE = re.compile(
    r'href=["\']([^"\']+)["\']|src=["\']([^"\']+)["\']',
    re.I,
)


def fetch_bytes(url: str, timeout: int = 90) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    ctx = ssl.create_default_context()
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout) as r:
            return r.read()
    except urllib.error.URLError as e:
        if "CERTIFICATE" in str(e).upper() or "certificate" in str(e).lower():
            insecure = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=insecure, timeout=timeout) as r:
                return r.read()
        raise


def fetch_text(url: str) -> str:
    return fetch_bytes(url).decode("utf-8", errors="replace")


def fetch_json(url: str) -> dict | list:
    return json.loads(fetch_text(url))


def norm_url(href: str) -> str | None:
    if not href or href.startswith("#") or href.startswith("javascript:"):
        return None
    if href.startswith("//"):
        href = "https:" + href
    elif href.startswith("/"):
        href = BASE_URL + href
    if not href.startswith("http"):
        return None
    parsed = urllib.parse.urlparse(href)
    if "advanced-cuisine.com" not in parsed.netloc and "cdn.shopify.com" not in parsed.netloc:
        return None
    return urllib.parse.urlunparse(parsed._replace(fragment=""))


def safe_name(s: str, max_len: int = 120) -> str:
    s = re.sub(r"[^a-zA-Z0-9._-]+", "_", s).strip("_")
    return (s or "file")[:max_len]


def paginate_json(path: str, key: str) -> list:
    items: list = []
    page = 1
    while True:
        sep = "&" if "?" in path else "?"
        url = f"{BASE_URL}{path}{sep}limit=250&page={page}"
        try:
            data = fetch_json(url)
        except Exception as e:
            print(f"[api] stop {path} page={page}: {e}")
            break
        batch = data.get(key, []) if isinstance(data, dict) else []
        if not batch:
            break
        items.extend(batch)
        print(f"[api] {path} page {page}: +{len(batch)} (total {len(items)})")
        if len(batch) < 250:
            break
        page += 1
        time.sleep(0.35)
    return items


def save_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def download_file(url: str, dest: Path) -> bool:
    if dest.is_file() and dest.stat().st_size > 80:
        return True
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(fetch_bytes(url))
        return True
    except Exception as e:
        print(f"[img] skip {url[:80]}… {e}")
        return False


def image_dest(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    tail = Path(parsed.path).name.split("?")[0] or "image"
    ext = Path(tail).suffix.lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".woff2", ".css", ".js"):
        if "width=" in url or ".jpg" in url.lower():
            ext = ".jpg"
        elif ".png" in url.lower():
            ext = ".png"
        else:
            ext = ".bin"
    stem = safe_name(Path(tail).stem or "asset")
    return ROOT / "images" / f"{stem}{ext}"


def html_dest(url: str) -> Path:
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.strip("/") or "index"
    if path.endswith(".json"):
        path = path[:-5]
    name = safe_name(path.replace("/", "__"))
    return ROOT / "html" / f"{name}.html"


def parse_sitemap() -> list[str]:
    urls: list[str] = []
    try:
        xml = fetch_text(f"{BASE_URL}/sitemap.xml")
        root = ET.fromstring(xml)
        ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        for loc in root.findall(".//sm:loc", ns):
            if loc.text:
                urls.append(loc.text.strip())
        # sitemap index
        for sm in root.findall(".//sm:sitemap/sm:loc", ns):
            if not sm.text:
                continue
            try:
                sub = fetch_text(sm.text.strip())
                subroot = ET.fromstring(sub)
                for loc in subroot.findall(".//sm:loc", ns):
                    if loc.text:
                        urls.append(loc.text.strip())
            except Exception as e:
                print(f"[sitemap] sub {sm.text}: {e}")
    except Exception as e:
        print(f"[sitemap] {e}")
    return urls


def extract_links(html: str) -> set[str]:
    found: set[str] = set()
    for m in LINK_RE.finditer(html):
        for g in m.groups():
            if g:
                u = norm_url(g.replace("&amp;", "&"))
                if u:
                    found.add(u)
    return found


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-images", action="store_true")
    ap.add_argument("--skip-html", action="store_true")
    args = ap.parse_args()

    ROOT.mkdir(parents=True, exist_ok=True)
    api_dir = ROOT / "api"
    all_urls: set[str] = {START_PAGE, BASE_URL + "/"}

    print("[1/6] Shopify products…")
    products = paginate_json("/products.json", "products")
    save_json(api_dir / "products.json", {"products": products})

    print("[2/6] Shopify collections…")
    try:
        collections_data = fetch_json(f"{BASE_URL}/collections.json")
        collections = collections_data.get("collections", [])
    except Exception as e:
        print(f"[collections] {e}")
        collections = []
    save_json(api_dir / "collections.json", {"collections": collections})

    collection_products: dict[str, list] = {}
    for col in collections:
        handle = col.get("handle")
        if not handle:
            continue
        try:
            cp = paginate_json(f"/collections/{handle}/products.json", "products")
            collection_products[handle] = cp
            time.sleep(0.3)
        except Exception as e:
            print(f"[col products] {handle}: {e}")
    save_json(api_dir / "collection-products.json", collection_products)

    print("[3/6] Shopify blogs…")
    articles_all: list = []
    try:
        blogs_data = fetch_json(f"{BASE_URL}/blogs.json")
        blogs = blogs_data.get("blogs", [])
    except Exception as e:
        print(f"[blogs] {e}")
        blogs = []
    save_json(api_dir / "blogs.json", {"blogs": blogs})

    for blog in blogs:
        handle = blog.get("handle")
        if not handle:
            continue
        arts = paginate_json(f"/blogs/{handle}/articles.json", "articles")
        articles_all.extend(arts)
        time.sleep(0.3)
    save_json(api_dir / "articles.json", {"articles": articles_all})

    print("[4/6] Sitemap + URL listesi…")
    for u in parse_sitemap():
        nu = norm_url(u)
        if nu:
            all_urls.add(nu)

    for p in products:
        h = p.get("handle")
        if h:
            all_urls.add(f"{BASE_URL}/products/{h}")
            all_urls.add(f"{BASE_URL}/products/{h}.json")
        for im in p.get("images") or []:
            src = im.get("src")
            if src:
                all_urls.add(src)

    for col in collections:
        h = col.get("handle")
        if h:
            all_urls.add(f"{BASE_URL}/collections/{h}")

    for a in articles_all:
        if a.get("url"):
            all_urls.add(a["url"])
        h = a.get("handle")
        blog_id = a.get("blog_id")
        # reconstruct if needed
        for blog in blogs:
            if blog.get("id") == blog_id and h:
                all_urls.add(f"{BASE_URL}/blogs/{blog['handle']}/{h}")

    # common pages from nav
    for path in (
        "/pages/the-space-home",
        "/pages/corporate-home-page",
        "/collections/clear-ice-machines",
        "/collections/neovide",
        "/collections/compostable-vacuum-bags",
    ):
        all_urls.add(BASE_URL + path)

    urls_sorted = sorted(all_urls)
    (ROOT / "urls.txt").write_text("\n".join(urls_sorted) + "\n", encoding="utf-8")

    if not args.skip_html:
        print(f"[5/6] HTML indir ({len(urls_sorted)} URL, advanced-cuisine.com sayfaları)…")
        html_count = 0
        for url in urls_sorted:
            if "advanced-cuisine.com" not in url:
                continue
            if any(
                url.endswith(ext)
                for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".css", ".js", ".woff2", ".json")
            ):
                continue
            if "/cdn/" in url:
                continue
            dest = html_dest(url)
            if dest.is_file() and dest.stat().st_size > 500:
                continue
            try:
                html = fetch_text(url)
                dest.parent.mkdir(parents=True, exist_ok=True)
                dest.write_text(html, encoding="utf-8")
                html_count += 1
                for link in extract_links(html):
                    if "advanced-cuisine.com" in link and link not in all_urls:
                        all_urls.add(link)
                time.sleep(0.4)
            except Exception as e:
                print(f"[html] {url[:70]}… {e}")
        print(f"[html] saved {html_count} pages")

    if not args.skip_images:
        print("[6/6] Görseller…")
        img_urls: set[str] = set()
        for p in products:
            for im in p.get("images") or []:
                src = im.get("src")
                if src:
                    img_urls.add(src.split("?")[0] + ("?" + src.split("?")[1] if "?" in src else ""))
        # from saved HTML
        for hp in (ROOT / "html").glob("*.html"):
            try:
                img_urls |= {u for u in extract_links(hp.read_text(encoding="utf-8", errors="replace")) if re.search(r"\.(jpg|jpeg|png|webp|gif)", u, re.I)}
            except OSError:
                pass

        n_ok = 0
        for i, url in enumerate(sorted(img_urls)):
            dest = image_dest(url)
            if download_file(url, dest):
                n_ok += 1
            if i % 20 == 19:
                time.sleep(0.25)
        print(f"[img] {n_ok}/{len(img_urls)} files")

    manifest = {
        "source": START_PAGE,
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "products": len(products),
        "collections": len(collections),
        "articles": len(articles_all),
        "urls": len(urls_sorted),
        "output": str(ROOT),
    }
    save_json(ROOT / "manifest.json", manifest)

    print("\n=== Bitti ===")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
