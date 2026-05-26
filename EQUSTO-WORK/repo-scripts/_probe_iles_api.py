"""Probe Ticimax product list API for iles.com.tr."""
import json
import ssl
import urllib.request

ctx = ssl._create_unverified_context()
UA = "Mozilla/5.0 EqustoScraper/1.0"
BASE = "https://www.iles.com.tr"


def post_json(path: str, body: dict) -> tuple[int, str]:
    data = json.dumps(body).encode("utf-8")
    url = BASE + path
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "User-Agent": UA,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")[:2000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:2000]
    except Exception as e:
        return 0, str(e)


def get_json(path: str) -> tuple[int, str]:
    req = urllib.request.Request(
        BASE + path,
        headers={"User-Agent": UA, "Accept": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")[:2000]
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")[:2000]
    except Exception as e:
        return 0, str(e)


body = {
    "CategoryId": 889,
    "Page": 1,
    "PageSize": 80,
    "Sort": 1,
}

candidates = [
    ("/api/Product/GetProductList", body),
    ("/api/Product/GetProducts", body),
    ("/api/ProductList/GetProductList", body),
    ("/api/Product/GetCategoryProducts", body),
    ("/api/Product/GetProductsByCategory", {"categoryId": 889, "page": 1, "pageSize": 80}),
]

for path, b in candidates:
    code, text = post_json(path, b)
    print("POST", path, code, text[:300].replace("\n", " "))
    print()

for path in [
    "/api/Product/GetProductList?categoryId=889&page=1&pageSize=80",
    "/api/Product/GetProducts?kategoriId=889&sayfa=1",
]:
    code, text = get_json(path)
    print("GET", path, code, text[:300].replace("\n", " "))
    print()
