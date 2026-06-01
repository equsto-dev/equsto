# -*- coding: utf-8 -*-
"""xlsx → stdout JSON (NaN → null) — trial-ozti-equsto-margin.mjs için"""
from __future__ import annotations

import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MERGE = ROOT / "merge-ozti-fiyat-katalog.py"

spec = importlib.util.spec_from_file_location("merge_ozti", MERGE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

rows = mod.parse_fiyat_listesi()


def clean(obj):
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if isinstance(obj, dict):
        return {k: clean(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean(x) for x in obj]
    return obj


print(json.dumps(clean(rows), ensure_ascii=False))
