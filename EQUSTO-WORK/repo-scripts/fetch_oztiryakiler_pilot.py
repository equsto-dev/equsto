"""Pilot download: 5 sample Öztiryakiler products from oztiryakiler.com.tr.

Saves images to public/data/images-oztiryakiler-pilot/ so we can preview
before overwriting anything.
"""
from __future__ import annotations

import json
import re
import ssl
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR")
JSON_PATH = ROOT / "public" / "data" / "ekipmanlar.json"
OUT_DIR = ROOT / "public" / "data" / "images-oztiryakiler-pilot"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
ctx = ssl._create_unverified_context()

MODEL_RE = re.compile(r'\b([A-Z0-9]{2,6}(?:\.[A-Z0-9]{1,6}){1,4})\b', re.I)


def extract_model(name: str) -> str | None:
    candidates = MODEL_RE.findall(name)
    if not candidates:
        return None
    valid = [c for c in candidates if any(ch.isdigit() for ch in c) and len(c) >= 7]
    if not valid:
        return None
    return max(valid, key=len).upper()


def http_get(url: str, timeout: float = 30.0) -> tuple[int, bytes]:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Referer": "https://oztiryakiler.com.tr/"})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, b""
    except (urllib.error.URLError, OSError, TimeoutError) as e:
        print(f"  [err] {e}")
        return 0, b""


def main() -> None:
    rows = json.loads(JSON_PATH.read_text(encoding="utf-8"))
    oz = [r for r in rows if "ztiryakiler" in (r.get("brand") or "").lower()]

    # Pick a diverse sample: first product of every 90 (-> 5 evenly spaced)
    step = max(1, len(oz) // 5)
    sample = [oz[i] for i in range(0, len(oz), step)][:5]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output directory: {OUT_DIR}\n")

    report = []
    for r in sample:
        name = r.get("name") or ""
        model = extract_model(name)
        print(f"--- {name[:80]}")
        print(f"    model code: {model}")
        if not model:
            report.append({"name": name, "status": "no-model"})
            continue

        downloaded = None
        for ext in ("jpg", "png", "jpeg"):
            url = f"https://oztiryakiler.com.tr/ax-images/images/{model}.{ext}"
            print(f"    GET {url}")
            code, data = http_get(url)
            if code == 200 and len(data) > 1000:
                fname = f"{model}.{ext}"
                dest = OUT_DIR / fname
                dest.write_bytes(data)
                size_kb = len(data) // 1024
                print(f"    -> SAVED {fname} ({size_kb} KB)")
                downloaded = fname
                break
            else:
                print(f"    -> HTTP {code}")
            time.sleep(0.1)

        report.append({
            "name": name,
            "model": model,
            "status": "ok" if downloaded else "miss",
            "file": downloaded,
        })
        print()
        time.sleep(0.2)

    # Write summary
    summary_path = OUT_DIR / "_pilot-report.json"
    summary_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Summary written to {summary_path}")
    print(f"Done. {sum(1 for x in report if x['status'] == 'ok')}/{len(report)} succeeded.")


if __name__ == "__main__":
    main()
