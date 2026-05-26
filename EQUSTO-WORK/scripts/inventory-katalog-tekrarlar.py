#!/usr/bin/env python3
"""Katalog klasorlerinde tekrar envanteri — EQUSTO-WORK + eski CURSOR yollari."""
from __future__ import annotations

import hashlib
import json
import os
from collections import defaultdict
from pathlib import Path

ROOTS = {
    "site": Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data"),
    "legacy-public": Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\legacy-public\data"),
    "veri-public-data": Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\veri\public-data"),
    "equsto-v2": Path(r"C:\D Disk\EQUSTO-CURSOR\equsto-v2\public\data"),
    "cursor-public": Path(r"C:\D Disk\EQUSTO-CURSOR\public\data"),
}

KEY_FILES = [
    "ekipmanlar.json",
    "ekipmanlar-lite.json",
    "pfos-zone-catalog.json",
    "pfos-katalog-olcu-mm.json",
    "vitrum-bars-catalogue.json",
    "pfos-all-day-dining-referanslar.json",
    "pfos-s13-388-referanslar.json",
    "pfos-coffee-shop-referanslar.json",
]

DEPLOY_GLOBS = [
    Path(r"C:\D Disk\EQUSTO-CURSOR"),
]


def sha256_short(p: Path, limit_mb: int = 50) -> str:
    h = hashlib.sha256()
    size = p.stat().st_size
    if size > limit_mb * 1024 * 1024:
        return f"large:{size // (1024*1024)}MB"
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()[:12]


def count_json_records(data) -> str:
    if isinstance(data, list):
        return str(len(data))
    if isinstance(data, dict):
        for k in ("items", "products", "urunler", "ekipmanlar", "zones", "referanslar"):
            if k in data and isinstance(data[k], list):
                return f"{k}:{len(data[k])}"
        return f"keys:{len(data)}"
    return "?"


def stat_root(p: Path) -> dict | None:
    if not p.is_dir():
        return None
    files = [x for x in p.rglob("*") if x.is_file()]
    total = sum(x.stat().st_size for x in files)
    dept_dir = p / "dept"
    depts = sorted(x.name for x in dept_dir.iterdir()) if dept_dir.is_dir() else []
    return {"files": len(files), "bytes": total, "depts": depts}


def main() -> None:
    out: list[str] = []
    out.append("# Katalog envanteri ve tekrarlar\n")
    out.append("Otomatik uretim: `scripts/inventory-katalog-tekrarlar.py`\n")

    out.append("## 1. Ana veri kokleri\n")
    out.append("| Kok | Dosya | Boyut | dept sayisi |")
    out.append("|-----|-------|-------|-------------|")
    stats = {}
    for name, p in ROOTS.items():
        s = stat_root(p)
        stats[name] = s
        if not s:
            out.append(f"| `{name}` | — | — | — |")
            continue
        mb = s["bytes"] / 1024 / 1024
        out.append(f"| `{name}` | {s['files']:,} | {mb:.1f} MB | {len(s['depts'])} |")

    out.append("\n## 2. Birebir kopya ciftleri\n")
    pairs = [
        ("site", "equsto-v2"),
        ("site", "veri-public-data"),
        ("legacy-public", "cursor-public"),
    ]
    for a, b in pairs:
        sa, sb = stats.get(a), stats.get(b)
        if sa and sb and sa["files"] == sb["files"] and sa["bytes"] == sb["bytes"]:
            out.append(f"- **{a} = {b}** — ayni dosya sayisi ve boyut (tam kopya)")
        elif sa and sb:
            out.append(
                f"- **{a} vs {b}** — dosya {sa['files']:,} vs {sb['files']:,}, "
                f"boyut {sa['bytes']/1024/1024:.1f} vs {sb['bytes']/1024/1024:.1f} MB"
            )

    out.append("\n## 3. Anahtar katalog dosyalari (hash)\n")
    out.append("| Dosya | " + " | ".join(ROOTS.keys()) + " |")
    out.append("|-------|" + "|".join(["---"] * len(ROOTS)) + "|")
    for fn in KEY_FILES:
        row = [fn]
        hashes = {}
        for name, p in ROOTS.items():
            fp = p / fn
            if fp.is_file():
                h = sha256_short(fp)
                try:
                    data = json.loads(fp.read_text(encoding="utf-8"))
                    cnt = count_json_records(data)
                except Exception:
                    cnt = "?"
                cell = f"{h} ({cnt})"
                hashes[name] = h
            else:
                cell = "—"
            row.append(cell)
        out.append("| " + " | ".join(row) + " |")
        uniq = set(hashes.values())
        if len(hashes) > 1 and len(uniq) == 1:
            out.append(f"\n> `{fn}` — tum kopyalarda **ayni hash**\n")

    site_depts = set(stats["site"]["depts"]) if stats.get("site") else set()
    leg_depts = set(stats["legacy-public"]["depts"]) if stats.get("legacy-public") else set()
    only_legacy = sorted(leg_depts - site_depts)
    only_site = sorted(site_depts - leg_depts)

    out.append("\n## 4. Dept (kategori) kataloglari\n")
    out.append(f"- **site** dept: {len(site_depts)}")
    out.append(f"- **legacy-public** dept: {len(leg_depts)}")
    out.append(f"- Ortak: {len(site_depts & leg_depts)}")
    out.append(f"- **Sadece legacy'de** (site'e yuklenebilir aday): **{len(only_legacy)}**")
    if only_site:
        out.append(f"- Sadece site'de: {', '.join(only_site)}")

    out.append("\n### Sadece legacy-public'te olan dept'ler\n")
    out.append("| Dept | JSON | Gorsel (~) |")
    out.append("|------|------|------------|")
    leg = ROOTS["legacy-public"]
    for d in only_legacy[:80]:
        dp = leg / "dept" / d
        jfiles = list(dp.glob("*.json")) if dp.is_dir() else []
        imgs = sum(
            1
            for x in dp.rglob("*")
            if x.is_file() and x.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
        ) if dp.is_dir() else 0
        out.append(f"| `{d}` | {len(jfiles)} | {imgs} |")
    if len(only_legacy) > 80:
        out.append(f"\n… ve {len(only_legacy) - 80} dept daha\n")

    out.append("\n## 5. Site'deki dept'ler (canli v2 katalog)\n")
    site = ROOTS["site"]
    out.append("| Dept | products.json var | gorsel (~) |")
    out.append("|------|-------------------|------------|")
    for d in sorted(site_depts)[:60]:
        dp = site / "dept" / d
        has = (dp / "products.json").is_file() or any(dp.glob("*.json"))
        imgs = sum(
            1
            for x in dp.rglob("*")
            if x.is_file() and x.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"}
        ) if dp.is_dir() else 0
        out.append(f"| `{d}` | {'evet' if has else 'hayir'} | {imgs} |")

    # deploy-stage duplicate clusters
    out.append("\n## 6. Eski deploy / paket klasorleri (CURSOR kok)\n")
    cursor = Path(r"C:\D Disk\EQUSTO-CURSOR")
    clusters = []
    for d in sorted(cursor.iterdir()):
        if not d.is_dir():
            continue
        n = d.name.lower()
        if not any(
            x in n
            for x in (
                "deploy",
                "stage",
                "paket",
                "equsto1605",
                "equsto-site",
                "bar-design",
                "pfos",
            )
        ):
            continue
        files = [x for x in d.rglob("*") if x.is_file()]
        total = sum(x.stat().st_size for x in files)
        has_ekip = (d / "data" / "ekipmanlar.json").is_file() or any(
            d.rglob("ekipmanlar.json")
        )
        clusters.append((total, len(files), d.name, has_ekip))
    clusters.sort(reverse=True)
    out.append("| Klasor | Dosya | MB | ekipmanlar.json |")
    out.append("|--------|-------|-----|----------------|")
    for total, nfiles, name, has_ekip in clusters[:35]:
        out.append(f"| `{name}` | {nfiles:,} | {total/1024/1024:.1f} | {'evet' if has_ekip else 'hayir'} |")

  # Hash duplicate scan: ekipmanlar.json locations
    out.append("\n## 7. ekipmanlar.json kopyalari (hash gruplari)\n")
    ekip_paths: list[Path] = []
    for base in [Path(r"C:\D Disk\EQUSTO-CURSOR"), Path(r"C:\D Disk\EQUSTO-WORK")]:
        if base.is_dir():
            ekip_paths.extend(base.rglob("ekipmanlar.json"))
    by_hash: dict[str, list[str]] = defaultdict(list)
    for p in ekip_paths:
        try:
            if p.stat().st_size > 80 * 1024 * 1024:
                key = f"large:{p.stat().st_size}"
            else:
                key = sha256_short(p)
            by_hash[key].append(str(p))
        except OSError:
            pass
    for i, (h, paths) in enumerate(sorted(by_hash.items(), key=lambda x: -len(x[1])), 1):
        out.append(f"\n### Grup {i} — hash `{h}` ({len(paths)} kopya)\n")
        for p in paths[:12]:
            out.append(f"- `{p}`")
        if len(paths) > 12:
            out.append(f"- … +{len(paths)-12} dosya daha")

    out.append("\n## 8. Onerilen tek kaynaklar (Faz 3 oncesi)\n")
    out.append("| Amac | Tek kaynak | Not |")
    out.append("|------|------------|-----|")
    out.append("| Canli Next.js katalog | `E-TICARET/site/public/data` | Vercel buradan |")
    out.append("| Tam statik arsiv (dept+gorsel) | `E-TICARET/legacy-public/data` | 2,6 GB, yukleme havuzu |")
    out.append("| PFOS listeler | `PFOS/listeler` + site `public/data/pfos-*` | ayna |")
    out.append("| Silinebilir aday | `.deploy-stage*`, `EQUSTO-SITE-PAKET` | deploy anlik kopyalari |")
    out.append("| Eski kod kopyasi | `EQUSTO-CURSOR/equsto-v2` | Faz 3 |")

    report = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\dokuman\KATALOG-ENVANTER.md")
    report.write_text("\n".join(out), encoding="utf-8")
    print(f"Wrote {report}")
    print(f"Legacy-only depts: {len(only_legacy)}")
    print(f"Site depts: {len(site_depts)}")


if __name__ == "__main__":
    main()
