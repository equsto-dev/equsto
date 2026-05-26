#!/usr/bin/env python3
"""
iles.com.tr — yalnızca Pişirme Ekipmanları kategorisi (Ticimax).

Kaynak: https://www.iles.com.tr/pisirme-ekipmanlari (?sayfa=N)

Çıktı: data/iles/pisirme/
  _meta.json           — kategori bilgisi
  alt-kategoriler.json — pişirme alt kategorileri
  markalar.json        — listede filtrelenen markalar
  urunler.json         — tüm ürünler (liste sayfası)
  manifest.json        — özet (tarih, sayılar)

Kullanım (proje kökünden):
  python scripts/scrape-iles-pisirme.py
  python scripts/scrape-iles-pisirme.py --max-pages=1   # deneme

Klasörü silmek = bu kategoriyi projeden kaldırmak.
"""
from __future__ import annotations

import argparse
import json
import re
import ssl
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

BASE_URL = "https://www.iles.com.tr"
CATEGORY_PATH = "/pisirme-ekipmanlari"
CATEGORY_SLUG = "pisirme"
OUT_DIR = Path(__file__).resolve().parent.parent / "data" / "iles" / CATEGORY_SLUG
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoScraper/1.0 (+catalog archive)"
DELAY_SEC = 0.45
PISIRME_CATEGORY_ID = 889


def fetch_text(url: str) -> str:
    ctx = ssl.create_default_context()
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9",
        },
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=90) as r:
            return r.read().decode("utf-8", "replace")
    except urllib.error.URLError as e:
        if "CERTIFICATE" in str(e).upper() or "certificate" in str(e).lower():
            insecure = ssl._create_unverified_context()
            with urllib.request.urlopen(req, context=insecure, timeout=90) as r:
                return r.read().decode("utf-8", "replace")
        raise


def parse_price_tr(raw: str | None) -> float | None:
    if not raw:
        return None
    s = unescape(raw).strip()
    s = re.sub(r"[₺\s]", "", s)
    s = s.replace(".", "").replace(",", ".")
    try:
        return round(float(s), 2)
    except ValueError:
        return None


def first_group(block: str, pattern: str) -> str | None:
    m = re.search(pattern, block, re.I | re.S)
    if not m or m.lastindex is None:
        return None
    g = m.group(1)
    return g.strip() if g else None


def parse_product_blocks(html: str) -> list[dict]:
    """Parse product cards from category list HTML."""
    start = html.find('id="ProductPageProductList"')
    chunk = html[start : start + 800_000] if start >= 0 else html

    products: list[dict] = []
    seen: set[str] = set()

    card_re = re.compile(
        r'<div class="productDetail[^"]*"[^>]*data-id="(\d+)"[^>]*data-variant-id="(\d+)"[^>]*>'
        r"(.*?)</div>\s*</div>\s*<div style=\"display: none;\" class=\"urunListeAdet\">",
        re.S | re.I,
    )

    for m in card_re.finditer(chunk):
        pid, vid, body = m.group(1), m.group(2), m.group(3)
        if pid in seen:
            continue
        seen.add(pid)

        name = first_group(body, r'<div class="productName[^"]*"[^>]*>\s*<a[^>]*title="([^"]+)"')
        if not name:
            name = first_group(body, r'<div class="productName[^"]*"[^>]*>\s*<a[^>]*>([^<]+)</a>')
        href = first_group(body, r'<div class="productName[^"]*"[^>]*>\s*<a[^>]*href=[\'"]([^\'"]+)[\'"]')
        brand = first_group(body, r'<div class="productMarka"[^>]*>([^<]+)</div>')
        sku = first_group(body, r'<div class="productStokKodu"[^>]*>\s*<span>([^<]+)</span>')
        discount = parse_price_tr(
            first_group(body, r'<span class="discountPriceSpan"[^>]*>\s*([^<]+)\s*</span>')
        )
        regular = parse_price_tr(
            first_group(body, r'<span class="regularPriceSpan"[^>]*>\s*([^<]+)\s*</span>')
        )

        pos = m.start()
        prev = chunk[max(0, pos - 2500) : pos]
        img_m = re.search(
            r"data-original=['\"](https://static\.ticimax\.cloud[^'\"]+)['\"]",
            prev,
            re.I,
        )
        img = img_m.group(1) if img_m else None
        if not img:
            img_m2 = re.search(r'src="(https://static\.ticimax\.cloud[^"]+)"', prev, re.I)
            img = img_m2.group(1) if img_m2 else None

        url = href or ""
        if url and not url.startswith("http"):
            url = BASE_URL + (url if url.startswith("/") else "/" + url)

        products.append(
            {
                "productId": int(pid),
                "variantId": int(vid),
                "name": unescape(name or "").strip(),
                "brand": unescape(brand or "").strip() or None,
                "sku": (sku or "").strip() or None,
                "url": url,
                "image": img,
                "priceDiscountTry": discount,
                "priceRegularTry": regular,
                "source": "iles.com.tr",
                "category": "Pişirme Ekipmanları",
                "categoryPath": CATEGORY_PATH,
            }
        )

    return products


def extract_breadcrumb(html: str) -> dict | None:
    m = re.search(r"globalModel\.breadCrumb\s*=\s*(\{.*?\});", html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def extract_pager(html: str) -> tuple[int, int, int]:
    m = re.search(r"ProductPager\s*=\s*GetPager\((\d+),\s*(\d+),\s*(\d+)", html)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3))
    pages = [int(x) for x in re.findall(r"productListSetPage\(event,(\d+)\)", html)]
    return 0, 1, max(pages) if pages else 1


def extract_filters_json(html: str) -> list | None:
    m = re.search(r"filterMenu\.Filters\s*=\s*(\[.*?\]);", html, re.S)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def find_category_node(nodes: list, cat_id: int) -> dict | None:
    for n in nodes:
        if n.get("Type") != "kategori":
            continue
        if n.get("Id") == cat_id:
            return n
        found = find_category_node(n.get("Elements") or [], cat_id)
        if found:
            return found
    return None


def extract_alt_categories(html: str) -> list[dict]:
    filters = extract_filters_json(html)
    if not filters:
        return []
    cat_filter = next((f for f in filters if f.get("FilterType") == "Category"), None)
    if not cat_filter:
        return []
    pisirme = find_category_node(cat_filter.get("Elements") or [], PISIRME_CATEGORY_ID)
    if not pisirme:
        return []
    return [
        {
            "id": c.get("Id"),
            "name": c.get("Name"),
            "path": c.get("Value"),
            "url": BASE_URL + (c.get("Value") or ""),
        }
        for c in (pisirme.get("Elements") or [])
        if c.get("Type") == "kategori"
    ]


def extract_brands(html: str) -> list[dict]:
    filters = extract_filters_json(html)
    if not filters:
        return []
    for f in filters:
        if f.get("FilterType") == "Brand":
            return [
                {"name": e.get("Name"), "value": e.get("Value")}
                for e in (f.get("Elements") or [])
                if e.get("Type") == "marka"
            ]
    return []


def save_json(path: Path, obj: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser(description="iles.com.tr Pişirme kategorisi scrape")
    ap.add_argument("--max-pages", type=int, default=0, help="0 = tüm sayfalar")
    args = ap.parse_args()

    print(f"[iles] Kategori: {CATEGORY_PATH}")
    print(f"[iles] Çıktı: {OUT_DIR}")

    url0 = BASE_URL + CATEGORY_PATH
    html0 = fetch_text(url0)
    breadcrumb = extract_breadcrumb(html0)
    total, _cur, page_size = extract_pager(html0)
    total_pages = max(1, (total + page_size - 1) // page_size) if total else 8
    if args.max_pages > 0:
        total_pages = min(total_pages, args.max_pages)

    alt_cats = extract_alt_categories(html0)
    brands = extract_brands(html0)

    all_products: dict[int, dict] = {}
    for page in range(1, total_pages + 1):
        url = url0 if page == 1 else f"{url0}?sayfa={page}"
        print(f"[iles] Sayfa {page}/{total_pages} … {url}")
        html = html0 if page == 1 else fetch_text(url)
        batch = parse_product_blocks(html)
        for p in batch:
            all_products[p["productId"]] = p
        print(f"       +{len(batch)} ürün (benzersiz toplam: {len(all_products)})")
        if page < total_pages:
            time.sleep(DELAY_SEC)

    products = sorted(all_products.values(), key=lambda x: x["productId"])
    fetched_at = datetime.now(timezone.utc).isoformat()

    meta = {
        "source": "iles.com.tr",
        "slug": CATEGORY_SLUG,
        "name": breadcrumb.get("tanim") if breadcrumb else "Pişirme Ekipmanları",
        "categoryId": breadcrumb.get("id") if breadcrumb else PISIRME_CATEGORY_ID,
        "parentCategoryId": breadcrumb.get("pid") if breadcrumb else 5,
        "url": url0,
        "path": CATEGORY_PATH,
        "productCountListed": total or len(products),
        "productCountFetched": len(products),
        "pageSize": page_size,
        "pagesFetched": total_pages,
        "fetchedAt": fetched_at,
    }
    if breadcrumb:
        meta["seo"] = {
            "title": breadcrumb.get("seoSayfaBaslik"),
            "description": breadcrumb.get("seoSayfaAciklama"),
            "keywords": breadcrumb.get("seoAnahtarKelime"),
        }

    manifest = {
        "source": BASE_URL,
        "category": CATEGORY_SLUG,
        "fetchedAt": fetched_at,
        "products": len(products),
        "altCategories": len(alt_cats),
        "brands": len(brands),
        "outputDir": "data/iles/pisirme",
    }

    save_json(OUT_DIR / "_meta.json", meta)
    save_json(OUT_DIR / "alt-kategoriler.json", alt_cats)
    save_json(OUT_DIR / "markalar.json", brands)
    save_json(OUT_DIR / "urunler.json", products)
    save_json(OUT_DIR / "manifest.json", manifest)

    print(f"\n[iles] Tamam: {len(products)} ürün → {OUT_DIR}")
    if total and len(products) < total:
        print(f"[iles] Uyarı: sitede {total} ürün bildiriliyor, {len(products)} parse edildi.")


if __name__ == "__main__":
    main()
