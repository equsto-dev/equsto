"""Test the URL pattern: https://oztiryakiler.com.tr/ax-images/images/{MODEL}.jpg
on a sample of Öztiryakiler products from ekipmanlar.json."""
from __future__ import annotations

import json
import re
import ssl
import urllib.error
import urllib.request
from pathlib import Path

JSON_PATH = Path(r"c:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ctx = ssl._create_unverified_context()

# Model code regex: matches things like 79K4.06NMV.00, 79E4.27NMV.00, BN7-M-EF-R290 etc.
# Öztiryakiler codes specifically follow: digits + letter + digit + . + digits + LETTERS + . + digits
MODEL_RE = re.compile(r'\b(\d{2,3}[A-Z]\d?\.[\dA-Z]{2,4}[A-Z]{2,4}\.\d{2})\b', re.I)


def extract_model(name: str) -> str | None:
    m = MODEL_RE.search(name)
    return m.group(1) if m else None


def head_check(url: str) -> tuple[int, int]:
    """Return (status_code, content_length). 0 on error."""
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            return r.status, int(r.headers.get("Content-Length", "0") or 0)
    except urllib.error.HTTPError as e:
        return e.code, 0
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        return 0, 0


def main() -> None:
    rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    oz = [r for r in rows if "ztiryakiler" in (r.get("brand") or "").lower()]
    print(f"Total Öztiryakiler products: {len(oz)}\n")

    # Sample: first 15 products
    sample = oz[:15]
    hits = misses = noid = 0
    for r in sample:
        name = r.get("name") or ""
        model = extract_model(name)
        if not model:
            noid += 1
            print(f"[no-model] {name[:80]}")
            continue
        url = f"https://oztiryakiler.com.tr/ax-images/images/{model}.jpg"
        code, size = head_check(url)
        ok = code == 200 and size > 1000
        if ok:
            hits += 1
        else:
            misses += 1
        flag = "OK " if ok else "MISS"
        print(f"[{flag}] {model:20} HTTP={code} size={size:>8}  {name[:60]}")

    print(f"\nResults on {len(sample)} samples: hits={hits} misses={misses} no-model={noid}")


if __name__ == "__main__":
    main()
