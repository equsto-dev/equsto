#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Equsto referans proforma xlsx → pfos-referans-projeler.json

Kullanım:
  python scripts/extract-pfos-referans-projeler.py
  python scripts/extract-pfos-referans-projeler.py --root "D:/EQUSTO16052026/EQUSTO-CURSOR/projeler"

Varsayılan dosyalar (root altında):
  2017-050 DOUBLETREE HILTON TOPKAPI/2017-050.xlsx
  2017-044 THC BAKÜ +/2017-044-6.1.xlsx
  2017-120 SÜTİŞ MERSİN/2017-120.xlsx
  2017-204 VADİİSTANBUL/2017-204-4.xlsx
"""
from __future__ import annotations

import argparse
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

DEFAULT_FILES = [
    ("2017-050", "2017-050 DOUBLETREE HILTON TOPKAPI/2017-050.xlsx", "Hotel", "DoubleTree Hilton Topkapı"),
    ("2017-044", "2017-044 THC BAKÜ +/2017-044-6.1.xlsx", "Restaurant", "THC Bakü — All Day Cafe"),
    ("2017-073", "2017-073 THC ABDULLAH GÜL ÜNİVERSİTESİ KAYSERİ/2017-073-1.xlsx", "Restaurant", "THC AGÜ Kayseri — All Day Cafe"),
    ("2017-120", "2017-120 SÜTİŞ MERSİN/2017-120.xlsx", "Restaurant", "Sütiş Mersin — Türk Restoran"),
    ("2017-204", "2017-204 VADİİSTANBUL/2017-204-4.xlsx", "Restaurant", "Vadistanbul"),
]

PROJECT_META = {
    "2017-050": {
        "baslik": "DoubleTree Hilton Topkapı",
        "dukkan": "5 Yıldız Otel",
    },
    "2017-044": {
        "baslik": "THC Bakü",
        "dukkan": "All Dining Cafe (TheHouse Cafe, Happymoons vb)",
        "dukkan_kisa": "All Day Cafe",
    },
    "2017-073": {
        "baslik": "THC AGÜ Kayseri",
        "dukkan": "All Dining Cafe (TheHouse Cafe, Happymoons vb)",
        "dukkan_kisa": "All Day Cafe",
    },
    "2017-120": {
        "baslik": "Sütiş Mersin",
        "dukkan": "Türk Restoran",
    },
    "2017-204": {
        "baslik": "Vadistanbul",
        "dukkan": "Food Court / Çoklu outlet",
    },
}

# Proforma bölüm başlığı → PFOS zone key (Equsto harf kodlu: A- KURU DEPO, M- SICAK MUTFAK, …)
ZONE_LABEL_MAP = [
    (r"^a\s*-\s*kuru|a-\s*kuru\s*depo", "kuru_depo"),
    (r"^f\s*-\s*derin|f-\s*derin\s*dondur", "derin_dondurucu"),
    (r"^c\s*-\s*soguk|^c\s*-\s*soğuk|panel\s*tip\s*soguk", "soguk_oda"),
    (r"^z\s*-\s*cop\s*soguk", "soguk_oda"),
    (r"^e\s*-\s*hazirlik|^e\s*-\s*hazırlık", "sebze_hazirlik"),
    (r"^m\s*-\s*sicak|sicak\s*mutfak", "ana_mutfak"),
    (r"^m\s*-\s*acik|acik\s*mutfak", "show_mutfagi"),
    (r"^d\s*-\s*bulasik|^d\s*-\s*bulaşik|personel\s*bulasik", "bulasikhane"),
    (r"^b\s*-\s*bar|tatli\s*bar", "bar"),
    (r"^c\s*-\s*mutfak", "ana_mutfak"),
    (r"banket\s*hatti|banket\s*arabasi", "acik_bufe"),
    (r"ana\s*mutfak|main\s*kitchen|hot\s*kitchen|sicak\s*mutfak", "ana_mutfak"),
    (r"sebze\s*hazir|sebze\s*hazırl|vegetable|meyve\s*sebze", "sebze_hazirlik"),
    (r"et\s*hazir|et\s*hazırl|kasap|butcher|meat\s*prep", "et_hazirlik"),
    (r"hazirlik\s*mutf|hazırlık\s*mutf|prep\s*kitchen", "sebze_hazirlik"),
    (r"kuru\s*depo|kuru\s*gida|dry\s*storage|ambalaj\s*depo|depolama(?!\s*soğuk)", "kuru_depo"),
    (r"so[gğ]uk\s*mutfak|cold\s*kitchen|so[gğ]uk\s*hava|so[gğ]uk\s*oda|so[gğ]uk\s*depo", "soguk_oda"),
    (r"derin\s*dondur|deep\s*freez|-18|frozen", "derin_dondurucu"),
    (r"bula[sş]ik|yikama\s*mutf|dishwash|wash\s*up", "bulasikhane"),
    (r"pastane|patisserie|pastry|fırın\s*hatt|firin\s*hatt|unlu\s*mam", "pastane"),
    (r"\bbar\b|beverage|içecek\s*hatt", "bar"),
    (r"a[cç]ik\s*b[uü]fe|buffet|brunch\s*b[uü]fe|kahvalti\s*b[uü]fe", "acik_bufe"),
    (r"show\s*mutf|acik\s*mutfak|open\s*kitchen|te[sş]hir\s*alan", "show_mutfagi"),
    (r"izgara|grill\s*line|ocakba[sş]i|kebab", "izgara_meze"),
    (r"banket|banquet|toplanti\s*yemek", "acik_bufe"),
    (r"uretim|üretim|fabrika\s*hatt|production", "pastane"),
    (r"paketleme|packaging", "kuru_depo"),
]

SKIP_LINE = re.compile(
    r"^(poz|toplam|genel|proje|müşteri|musteri|tarih|revizyon|eur|try|usd|"
    r"iskonto|kdv|adet|birim|ölçü|olcu|marka|model|açıklama|aciklama|\d+\s*$)",
    re.I,
)


def norm(s: str) -> str:
    s = (s or "").strip().lower()
    s = (
        s.replace("ı", "i")
        .replace("ğ", "g")
        .replace("ü", "u")
        .replace("ş", "s")
        .replace("ö", "o")
        .replace("ç", "c")
        .replace("â", "a")
        .replace("î", "i")
        .replace("û", "u")
    )
    return re.sub(r"\s+", " ", s)


def map_zone_label(text: str) -> str | None:
    n = norm(text)
    if len(n) < 4 or len(n) > 80:
        return None
    if SKIP_LINE.search(n):
        return None
    if not re.search(
        r"mutfak|depo|hazir|bula[sş]|bar|pastane|bufe|büfe|izgara|banket|"
        r"so[gğ]uk|sicak|uretim|üretim|paket|show|te[sş]hir|yikama",
        n,
    ):
        return None
    for pat, key in ZONE_LABEL_MAP:
        if re.search(pat, n, re.I):
            return key
    return None


def col_row(ref: str) -> tuple[int, int]:
    m = re.match(r"([A-Z]+)(\d+)", ref.upper())
    if not m:
        return 0, 0
    col = 0
    for ch in m.group(1):
        col = col * 26 + (ord(ch) - 64)
    return col, int(m.group(2))


def read_shared_strings(z: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in z.namelist():
        return []
    root = ET.fromstring(z.read("xl/sharedStrings.xml"))
    out = []
    for si in root.findall(".//m:si", NS):
        out.append("".join(si.itertext()).strip())
    return out


def read_sheet_cells(z: zipfile.ZipFile, sheet_path: str, shared: list[str]) -> list[tuple[int, int, str]]:
    root = ET.fromstring(z.read(sheet_path))
    cells: list[tuple[int, int, str]] = []
    for c in root.findall(".//m:c", NS):
        ref = c.get("r") or ""
        col, row = col_row(ref)
        if row < 1:
            continue
        val = ""
        t = c.get("t")
        v = c.find("m:v", NS)
        is_elem = c.find("m:is", NS)
        if t == "s" and v is not None and v.text is not None:
            idx = int(v.text)
            val = shared[idx] if 0 <= idx < len(shared) else ""
        elif v is not None and v.text is not None:
            val = v.text
        elif is_elem is not None:
            val = "".join(is_elem.itertext())
        val = str(val).strip()
        if val:
            cells.append((col, row, val))
    return cells


def extract_xlsx(path: Path) -> dict:
    zones: dict[str, dict] = {}
    current_zone: str | None = None
    sheets_meta = []

    with zipfile.ZipFile(path) as z:
        shared = read_shared_strings(z)
        sheet_files = sorted(
            n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")
        )
        for sheet_path in sheet_files:
            cells = read_sheet_cells(z, sheet_path, shared)
            sheets_meta.append({"path": sheet_path, "cell_count": len(cells)})
            for col, row, text in sorted(cells, key=lambda x: (x[1], x[0])):
                if col > 4:
                    continue
                zk = map_zone_label(text)
                if zk:
                    current_zone = zk
                    if zk not in zones:
                        zones[zk] = {
                            "zone_key": zk,
                            "labels_found": [],
                            "line_count": 0,
                            "sample_lines": [],
                        }
                    if text not in zones[zk]["labels_found"]:
                        zones[zk]["labels_found"].append(text)
                    continue
                if not current_zone:
                    continue
                if re.match(r"^[A-Z]?\d+$", text.strip(), re.I):
                    continue
                if len(text) < 6:
                    continue
                zblock = zones[current_zone]
                zblock["line_count"] += 1
                if len(zblock["sample_lines"]) < 8:
                    zblock["sample_lines"].append(text[:200])

    return {
        "zones": zones,
        "zone_order": list(zones.keys()),
        "sheets": sheets_meta,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--root",
        default=os.environ.get("EQUSTO_PROJELER_ROOT", ""),
        help="projeler/ klasörü (ör. D:/EQUSTO16052026/EQUSTO-CURSOR/projeler)",
    )
    ap.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parents[1] / "public" / "data" / "pfos-referans-projeler.json"),
    )
    args = ap.parse_args()

    roots = []
    if args.root:
        roots.append(Path(args.root))
    roots.extend(
        [
            Path(r"C:/D Disk/EQUSTO-CURSOR/arşiv/projeler"),
            Path(r"C:/D Disk/2017"),
            Path(r"C:/D Disk/EQUSTO16052026/EQUSTO-CURSOR/projeler"),
            Path(r"C:/D Disk/EQUSTO-CURSOR/projeler"),
            Path(r"E:/EQUSTO16052026/EQUSTO-CURSOR/projeler"),
        ]
    )

    existing_by_id: dict[str, dict] = {}
    out_path = Path(args.out)
    if out_path.is_file():
        try:
            prev = json.loads(out_path.read_text(encoding="utf-8"))
            for p in prev.get("projects") or []:
                if p.get("id"):
                    existing_by_id[p["id"]] = p
        except (json.JSONDecodeError, OSError):
            pass

    projects = []
    missing = []

    for pid, rel, konsept, baslik in DEFAULT_FILES:
        found = None
        for root in roots:
            p = root / rel
            if p.is_file():
                found = p
                break
        entry = {
            "id": pid,
            "baslik": baslik,
            "konsept": konsept,
            "source_file": rel,
            "status": "ok" if found else "missing",
        }
        if found:
            try:
                ex = extract_xlsx(found)
                entry["path"] = str(found)
                entry["zones"] = ex["zones"]
                entry["zone_order"] = ex["zone_order"]
                entry["zone_count"] = len(ex["zone_order"])
                entry["sheets"] = ex["sheets"]
            except Exception as e:
                entry["status"] = "error"
                entry["error"] = str(e)
        else:
            missing.append(rel)
            prev = existing_by_id.get(pid)
            if prev and prev.get("status") in ("manual_curated", "ok"):
                entry = {**prev, "status": "manual_curated"}
                if not entry.get("konsept"):
                    entry["konsept"] = konsept
        meta = PROJECT_META.get(pid, {})
        if meta:
            entry.update({k: v for k, v in meta.items() if v})
            if meta.get("baslik"):
                entry["baslik"] = meta["baslik"]
        projects.append(entry)

    # Birleşik zone istatistiği → kural önerisi
    zone_freq: dict[str, int] = {}
    for p in projects:
        if p.get("status") != "ok":
            continue
        for zk in p.get("zone_order") or []:
            zone_freq[zk] = zone_freq.get(zk, 0) + 1

    out = {
        "version": 1,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "projects": projects,
        "aggregate": {
            "zone_frequency": zone_freq,
            "missing_files": missing,
        },
    }

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {out_path} ({len(projects)} projects, {len(missing)} missing)")
    return 0 if not missing else 2


if __name__ == "__main__":
    raise SystemExit(main())
