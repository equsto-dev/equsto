"""
Download product images from kariyermutfak.com (Ticimax) into public/data/images/
using paths already listed in public/data/ekipmanlar.json.

Usage:
  python -u scripts/fetch_kariyer_images.py [--limit N] [--dry-run] [--rebuild-index]

Tip: use python -u so progress logs are not buffered when redirecting output.
"""
from __future__ import annotations

import argparse
import html
import json
import re
import ssl
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

BASE = "https://www.kariyermutfak.com"
JSON_PATH = Path(__file__).resolve().parent.parent / "public" / "data" / "ekipmanlar.json"
IMG_DIR = Path(__file__).resolve().parent.parent / "public" / "data" / "images"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) EqustoFetcher/1.0"

_ctx = ssl._create_unverified_context()


def http_get(url: str, timeout: float = 60.0) -> bytes:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.5",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_ctx) as r:
        return r.read()


def norm_key(raw: str) -> str:
    s = html.unescape(raw or "").strip().casefold()
    s = (
        s.replace("ı", "i")
        .replace("İ", "i")
        .replace("i\u0307", "i")
    )
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.casefold()
    s = re.sub(r"[^a-z0-9]+", "", s)
    return s


_DETAIL_LINK_RE = re.compile(
    r'<a[^>]*class="[^"]*\bdetailLink\b[^"]*\bdetailUrl\b[^"]*"[^>]*>',
    re.I,
)


def parse_listing_links(page_html: str) -> list[tuple[str, str]]:
    """Return list of (path, title) for each product on a category listing page."""
    out: list[tuple[str, str]] = []
    for m in _DETAIL_LINK_RE.finditer(page_html):
        tag = m.group(0)
        hm = re.search(r"""href\s*=\s*['"]([^'"]+)['"]""", tag)
        tm = re.search(r"""title\s*=\s*['"]([^'"]*)['"]""", tag)
        if not hm:
            continue
        path = hm.group(1).strip()
        if not path.startswith("/"):
            path = "/" + path
        title = html.unescape(tm.group(1)) if tm else ""
        out.append((path, title))
    return out


_IMG_URL_RE = re.compile(
    r"https://static\.ticimax\.cloud/cdn-cgi/image/[^\s\"'<>]+/3562/[^\s\"'<>]*urunresimleri[^\s\"'<>]*",
    re.I,
)


def extract_product_image_urls(page_html: str) -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for m in _IMG_URL_RE.finditer(page_html):
        u = m.group(0)
        if ".svg" in u.lower():
            continue
        if u not in seen:
            seen.add(u)
            urls.append(u)
    return urls


def listing_max_page(html: str) -> int:
    pages = [int(x) for x in re.findall(r"[?&]sayfa=(\d+)", html)]
    anchors = [
        int(x)
        for x in re.findall(
            r"""productListSetPage\s*\(\s*event\s*,\s*(\d+)\s*\)""",
            html,
            re.I,
        )
    ]
    return max([1] + pages + anchors)


def build_category_index(categories: set[str]) -> dict[str, str]:
    """norm_key(title) -> product path."""
    index: dict[str, str] = {}
    for cat in sorted(categories):
        try:
            first = http_get(f"{BASE}/{cat}").decode("utf-8", errors="ignore")
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            print(f"[warn] category {cat}: {e}")
            continue
        last_pg = listing_max_page(first)
        for page in range(1, last_pg + 1):
            url = f"{BASE}/{cat}" + ("" if page == 1 else f"?sayfa={page}")
            try:
                body = first if page == 1 else http_get(url).decode("utf-8", errors="ignore")
            except (urllib.error.URLError, OSError, TimeoutError) as e:
                print(f"[warn] {cat} p{page}: {e}")
                break
            links = parse_listing_links(body)
            if not links and page > 1:
                break
            for path, title in links:
                k = norm_key(title)
                if k and k not in index:
                    index[k] = path
            time.sleep(0.12)
        time.sleep(0.2)
    return index


def local_image_path(rel: str) -> Path:
    rel = rel.replace("\\", "/")
    if rel.lower().startswith("images/"):
        rel = rel[7:]
    return IMG_DIR / rel


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0, help="Max products to fetch (0=all)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--rebuild-index",
        action="store_true",
        help="Re-scrape category listings even if cache exists",
    )
    ap.add_argument(
        "--categories",
        type=str,
        default="",
        help="Comma-separated category slugs (subset). Empty = use all from JSON.",
    )
    ap.add_argument(
        "--index-cache",
        type=Path,
        default=Path(__file__).resolve().parent.parent / "public" / "data" / ".kariyer_product_index.json",
    )
    args = ap.parse_args()

    rows_all: list = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    cats_all = {r["category"] for r in rows_all if r.get("category")}
    subset = False
    if args.categories.strip():
        allow = {c.strip() for c in args.categories.split(",") if c.strip()}
        rows = [r for r in rows_all if r.get("category") in allow]
        scrape_cats = cats_all & allow
        subset = True
    else:
        rows = rows_all
        scrape_cats = cats_all

    index_path: Path = args.index_cache
    if not args.rebuild_index and index_path.is_file():
        index = json.loads(index_path.read_text(encoding="utf-8"))
        print(f"Loaded index from {index_path} ({len(index)} keys)")
    else:
        print(f"Building index for {len(scrape_cats)} categories…")
        new_idx = build_category_index(scrape_cats)
        if subset and index_path.is_file():
            index = json.loads(index_path.read_text(encoding="utf-8"))
            index.update(new_idx)
            print(f"Merged {len(new_idx)} new keys into existing index")
        else:
            index = new_idx
        index_path.parent.mkdir(parents=True, exist_ok=True)
        index_path.write_text(json.dumps(index, ensure_ascii=False, indent=0), encoding="utf-8")
        print(f"Wrote index ({len(index)} keys) -> {index_path}")

    IMG_DIR.mkdir(parents=True, exist_ok=True)

    matched = skipped = dl = noop = misses = 0
    todo = rows
    if args.limit > 0:
        todo = rows[: args.limit]

    for i, row in enumerate(todo):
        name = row.get("name") or ""
        keys = norm_key(name)
        path = index.get(keys)
        if not path:
            misses += 1
            print(f"[miss] {name[:80]}")
            continue
        matched += 1
        imgs_meta = row.get("images") or []
        try:
            phtml = http_get(BASE + path).decode("utf-8", errors="ignore")
        except (urllib.error.URLError, OSError, TimeoutError) as e:
            print(f"[err] GET {path}: {e}")
            skipped += 1
            time.sleep(0.3)
            continue
        remote_urls = extract_product_image_urls(phtml)
        if not remote_urls:
            print(f"[warn] no images {path}")
            skipped += 1
            continue
        if not imgs_meta:
            skipped += 1
            continue
        for j, meta in enumerate(imgs_meta):
            dest = local_image_path(meta)
            ru = remote_urls[j] if j < len(remote_urls) else remote_urls[-1]
            if args.dry_run:
                noop += 1
                continue
            if dest.is_file() and dest.stat().st_size > 0:
                noop += 1
                continue
            dest.parent.mkdir(parents=True, exist_ok=True)
            try:
                data = http_get(ru)
            except (urllib.error.URLError, OSError, TimeoutError) as e:
                print(f"[err] img {dest.name}: {e}")
                continue
            dest.write_bytes(data)
            dl += 1
        time.sleep(0.12)
        if (i + 1) % 200 == 0:
            print(f"… progress {i+1}/{len(todo)} (downloaded {dl} files)")

    print(
        f"Done. matched={matched} miss_title={misses} skipped={skipped} downloaded={dl} skip_existing_or_dry={noop}"
    )


if __name__ == "__main__":
    main()
