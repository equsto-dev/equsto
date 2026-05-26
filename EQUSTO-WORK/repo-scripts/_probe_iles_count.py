import re
import ssl
import urllib.request

ctx = ssl._create_unverified_context()
UA = {"User-Agent": "Mozilla/5.0"}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, context=ctx, timeout=60).read().decode("utf-8", "replace")


html = fetch("https://www.iles.com.tr/pisirme-ekipmanlari")
items = re.findall(r'class="productItem\s*"', html)
print("productItem count page1", len(items))
ids = re.findall(r'data-productId="(\d+)"', html)
print("unique productIds", len(set(ids)))

# pager
m = re.search(r"ProductPager\s*=\s*GetPager\((\d+),(\d+),\s*(\d+)", html)
if m:
    print("pager", m.groups())
