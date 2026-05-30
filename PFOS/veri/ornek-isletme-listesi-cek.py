# -*- coding: utf-8 -*-
"""
Dış kaynaktan işletme adı listesi (PFOS için örnek marka havuzu).
AVM/kat ağacı üretmez — yalnızca düz isletmeler[].

  python ornek-isletme-listesi-cek.py zorlu
  python ornek-isletme-listesi-cek.py kanyon
"""
from __future__ import annotations

import html
import json
import re
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

VERI = Path(__file__).resolve().parent
OUT = VERI / "kategori-agaci" / "ornekler"

ITEM_RE_ZORLU = re.compile(
    r'<li\s+class="item"\s+'
    r'data-floor="([^"]*)"\s+'
    r'data-category="([^"]*)"\s+'
    r'data-title="([^"]*)"\s*>'
    r'\s*<a\s+href="([^"]+)"',
    re.I,
)
KANYON_BLOCK_RE = re.compile(
    r'<blockquote>\s*<a\s+href="([^"]+)">([^<]+)</a>',
    re.I,
)

PRESETS = {
    "zorlu": {
        "url": "https://www.zorlucenter.com.tr/avm/magazalar/yiyecek-icecek",
        "kaynakId": "zorlu",
        "kaynakAd": "Zorlu Center mağaza listesi",
        "out": "zorlu-yeme-icecek.json",
    },
    "kanyon": {
        "url": "https://menuburada.com/araclar/avm-listesi-ve-restoranlari/kanyon-avm-levent-istanbul",
        "kaynakId": "kanyon",
        "kaynakAd": "Kanyon Levent — Menü Burada listesi",
        "out": "kanyon-yeme-icecek.json",
    },
}


def tr_fold(s: str) -> str:
    tr = str.maketrans("çğıöşüÇĞİÖŞÜâîû", "cgiosucgiosuaiu")
    return html.unescape(s).translate(tr).lower()


def slugify(s: str) -> str:
    s = tr_fold(s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-") or "x"


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (PFOS veri)"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return resp.read().decode("utf-8", errors="replace")


def parse_zorlu(html_text: str, preset: dict) -> list[dict]:
    host = "https://www.zorlucenter.com.tr"
    out = []
    seen: set[str] = set()
    for _floor, _cat, title, href in ITEM_RE_ZORLU.findall(html_text):
        ad = html.unescape(title).strip()
        sid = slugify(href.rstrip("/").split("/")[-1])
        if sid in seen:
            continue
        seen.add(sid)
        out.append(
            {
                "id": sid,
                "ad": ad,
                "url": href if href.startswith("http") else f"{host}{href}",
            }
        )
    return out


def parse_kanyon(html_text: str, preset: dict) -> list[dict]:
    host = "https://menuburada.com"
    out = []
    seen: set[str] = set()
    for href, name in KANYON_BLOCK_RE.findall(html_text):
        ad = html.unescape(name).strip()
        sid = slugify(href.rstrip("/").split("/")[-1])
        if sid in seen:
            continue
        seen.add(sid)
        out.append(
            {
                "id": sid,
                "ad": ad,
                "url": f"{host}/{href.lstrip('/')}",
            }
        )
    return out


PARSERS = {"zorlu": parse_zorlu, "kanyon": parse_kanyon}


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in PRESETS:
        print("Kullanım:", " | ".join(PRESETS))
        raise SystemExit(1)
    key = sys.argv[1]
    preset = PRESETS[key]
    html_path = Path(sys.argv[2]) if len(sys.argv) > 2 else None
    OUT.mkdir(parents=True, exist_ok=True)

    text = (
        html_path.read_text(encoding="utf-8", errors="replace")
        if html_path
        else fetch(preset["url"])
    )
    isletmeler = PARSERS[key](text, preset)
    doc = {
        "version": "1",
        "kaynak": preset["url"] if not html_path else str(html_path),
        "kaynakId": preset["kaynakId"],
        "kaynakAd": preset["kaynakAd"],
        "guncelleme": datetime.now(timezone.utc).isoformat(),
        "isletmeSayisi": len(isletmeler),
        "isletmeler": isletmeler,
    }
    dest = OUT / preset["out"]
    dest.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
    print("OK ->", dest, len(isletmeler), "isletme")


if __name__ == "__main__":
    main()
