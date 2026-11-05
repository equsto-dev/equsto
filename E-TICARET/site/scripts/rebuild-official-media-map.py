#!/usr/bin/env python3
"""Rebuild official-variant-media.json with candidate lists per model."""
from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

UA = "Mozilla/5.0"
BASE = "https://gastrotech.com.tr"
OUT = Path(__file__).resolve().parent / "data" / "gastrotech" / "official-variant-media.json"


def get(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


url = f"{BASE}/api/v1/products/?limit=100"
items = []
while url:
    data = get(url)
    for p in data.get("results") or []:
        if (p.get("brand_slug") or "").lower() in ("gastrotech", "vital", "gtech"):
            items.append(p)
    url = data.get("next")

by: dict[str, dict] = {}
for i, p in enumerate(items, 1):
    d = get(f"{BASE}/api/v1/products/{p['slug']}/")
    variants = {v["id"]: v for v in (d.get("variants") or []) if v.get("id")}
    for m in d.get("product_media") or []:
        if m.get("kind") != "image":
            continue
        v = variants.get(m.get("variant_id"))
        model = (v.get("model_code") if v else "") or ""
        fn = (m.get("filename") or "") + " " + (m.get("alt") or "")
        if not model:
            mm = re.search(r"([A-Za-z]{1,5}[- ]?\d{2,5}[A-Za-z0-9-]*)", fn)
            model = mm.group(1) if mm else ""
        if not model:
            continue
        file_url = m.get("file_url") or ""
        if not file_url:
            continue
        if file_url.startswith("/"):
            file_url = BASE + file_url
        mn = norm(model)
        name_match = bool(mn and mn in norm(fn))
        if not name_match:
            continue
        w, h = m.get("width"), m.get("height")
        if w is None and h is None:
            area = 4_000_000 if m.get("is_primary") else 3_000_000
        else:
            area = int(w or 0) * int(h or 0)
        score = area + (100_000 if m.get("is_primary") else 0)
        entry = {
            "model": model,
            "slug": p["slug"],
            "url": file_url,
            "is_primary": bool(m.get("is_primary")),
            "width": w,
            "height": h,
            "brand": d.get("brand_name"),
            "filename": m.get("filename"),
            "name_match": True,
            "score": score,
        }
        slot = by.setdefault(mn, {"model": model, "candidates": []})
        # dedupe url
        if any(c["url"] == file_url for c in slot["candidates"]):
            continue
        slot["candidates"].append(entry)
    if i % 40 == 0:
        print(i, len(by))
    time.sleep(0.05)

# sort candidates, set top as url for backward compat
for key, slot in by.items():
    slot["candidates"].sort(key=lambda c: -c["score"])
    top = slot["candidates"][0]
    slot.update({k: top[k] for k in ("url", "width", "height", "is_primary", "filename", "brand", "slug")})

OUT.write_text(json.dumps(by, ensure_ascii=False, indent=2), encoding="utf-8")
print("saved", len(by), "→", OUT)
print("sym300 cands", [c["filename"] for c in by.get("sym300", {}).get("candidates", [])])
print("gko9010 cands", [c["filename"] for c in by.get("gko9010", {}).get("candidates", [])])
