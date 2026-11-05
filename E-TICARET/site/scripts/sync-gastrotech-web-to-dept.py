#!/usr/bin/env python3
"""Apply images/catalog/gastrotech/web/*.jpg to matching gastrotech dept rows."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEPT = ROOT / "public" / "data" / "dept"
WEB = ROOT / "public" / "images" / "catalog" / "gastrotech" / "web"


def norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


web = {}
for f in WEB.glob("*"):
    if f.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp"):
        continue
    web[norm(f.stem)] = f"images/catalog/gastrotech/web/{f.name}"

print("web files", len(web))
updated = 0
for f in sorted(DEPT.glob("*.json")):
    rows = json.loads(f.read_text(encoding="utf-8"))
    if not isinstance(rows, list):
        continue
    changed = False
    for row in rows:
        rid = str(row.get("id") or "")
        brand = str(row.get("brand") or "").lower()
        if not (rid.startswith("gastrotech__") or brand == "gastrotech"):
            continue
        model = row.get("gastrotech_model") or row.get("model") or row.get("sku")
        if not model:
            continue
        key = norm(model)
        if key not in web:
            continue
        rel = web[key]
        if row.get("image") == rel and row.get("images") == [rel]:
            continue
        row["image"] = rel
        row["images"] = [rel]
        row["gastrotech_image"] = rel
        changed = True
        updated += 1
    if changed:
        f.write_text(json.dumps(rows, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("wrote", f.name)
print("updated rows", updated)
