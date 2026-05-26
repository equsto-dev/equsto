"""Improved test for Öztiryakiler URL pattern across all 465 products."""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

JSON_PATH = Path(r"c:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ctx = ssl._create_unverified_context()

# Match Öztiryakiler model codes. Patterns observed:
#   79K4.06NMV.00     digits+letter+digit . digits+letters . digits        (3 parts)
#   7919.06NMV.00     4 digits . digits+letters . digits                   (3 parts)
#   8477.00SSA        digits . digits+letters                              (2 parts)
#   7864.N1.80703.17C 4 parts including alphanumerics                      (4 parts)
# Generalised: alnum dot-separated with 1..4 dots, each segment 1..6 chars,
# at least one digit somewhere, total length >= 7 to avoid noise like "1.5".
MODEL_RE = re.compile(r'\b([A-Z0-9]{2,6}(?:\.[A-Z0-9]{1,6}){1,4})\b', re.I)


def extract_model(name: str) -> str | None:
    candidates = MODEL_RE.findall(name)
    if not candidates:
        return None
    # Filter: must contain a digit and total length >= 7
    valid = [c for c in candidates if any(ch.isdigit() for ch in c) and len(c) >= 7]
    if not valid:
        return None
    return max(valid, key=len).upper()


def head_check(url: str) -> tuple[int, int]:
    req = urllib.request.Request(url, headers={"User-Agent": UA}, method="HEAD")
    try:
        with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
            return r.status, int(r.headers.get("Content-Length", "0") or 0)
    except urllib.error.HTTPError as e:
        return e.code, 0
    except (urllib.error.URLError, OSError, TimeoutError):
        return 0, 0


def main() -> None:
    rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    oz = [r for r in rows if "ztiryakiler" in (r.get("brand") or "").lower()]
    print(f"Total Öztiryakiler products: {len(oz)}")

    no_model = []
    candidates = []
    for r in oz:
        name = r.get("name") or ""
        m = extract_model(name)
        if m:
            candidates.append((m, name))
        else:
            no_model.append(name)

    print(f"Products with extractable model code: {len(candidates)}")
    print(f"Products without model code         : {len(no_model)}")
    if no_model[:5]:
        print("\nSample no-model products:")
        for n in no_model[:5]:
            print(f"  {n}")

    # HEAD-check first 60 candidates with .jpg, .png, .jpeg fallback
    print(f"\nHEAD-checking first 60 candidates against /ax-images/images/{{model}}.jpg ...")
    hits = jpg = png = jpeg = misses = 0
    sample = candidates[:60]
    miss_examples = []
    for model, name in sample:
        ok = False
        for ext in ("jpg", "png", "jpeg", "JPG", "PNG"):
            url = f"https://oztiryakiler.com.tr/ax-images/images/{model}.{ext}"
            code, size = head_check(url)
            if code == 200 and size > 1000:
                hits += 1
                if ext.lower() == "jpg":
                    jpg += 1
                elif ext.lower() == "png":
                    png += 1
                elif ext.lower() == "jpeg":
                    jpeg += 1
                ok = True
                break
            time.sleep(0.05)
        if not ok:
            misses += 1
            if len(miss_examples) < 8:
                miss_examples.append((model, name))

    print(f"\nResults: hits={hits}/{len(sample)}  (jpg={jpg}, png={png}, jpeg={jpeg})  misses={misses}")
    if miss_examples:
        print("\nMisses (first 8):")
        for m, n in miss_examples:
            print(f"  {m:25} {n[:70]}")


if __name__ == "__main__":
    main()
