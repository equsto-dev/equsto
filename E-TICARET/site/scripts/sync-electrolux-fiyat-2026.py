# -*- coding: utf-8 -*-
"""
Electrolux Professional Fiyat Listesi 2026 (PDF) → dept katalog fiyatları.
Equsto satış = liste fiyatının %52'si (%48 iskonto).

  python scripts/sync-electrolux-fiyat-2026.py
  python scripts/sync-electrolux-fiyat-2026.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent.parent
DEPT_DIR = ROOT / "public/data/dept"
DATA_OUT = ROOT / "scripts/data/electrolux-fiyat-2026.json"

KUR_EUR_TRY = 53.2979
KDV_ORAN = 20
ISKONTO_YUZDE = 48
SATIS_ORAN = 0.52  # liste × 52%
BRAND = "Electrolux Professional"
KAYNAK = "electrolux-fiyat-listesi-2026"

PRICE_TRIPLET = re.compile(
    r"^(\d{6})\n([A-Z0-9][A-Z0-9\-]{2,24})\n(\d+(?:,\d{2})?)$",
    re.MULTILINE,
)


def find_pdf() -> Path:
    for base in (Path(r"c:\D Disk\FİYAT LİSTELERİ"), Path(r"c:/D Disk")):
        if not base.exists():
            continue
        for p in base.rglob("*Electrolux Professional Fiyat Listesi 2026*.pdf"):
            return p
    raise FileNotFoundError("Electrolux Professional Fiyat Listesi 2026 PDF bulunamadı")


def fmt_try(n: float) -> str:
    v = int(round(float(n)))
    s = f"{v:,}".replace(",", ".")
    return f"₺{s},00"


def parse_pdf_prices(pdf_path: Path) -> dict[str, dict]:
    doc = fitz.open(pdf_path)
    text = "\n".join(doc[i].get_text() for i in range(doc.page_count))
    out: dict[str, dict] = {}
    for m in PRICE_TRIPLET.finditer(text):
        cod, model, raw = m.group(1), m.group(2), m.group(3)
        price = float(raw.replace(",", "."))
        if price <= 1:
            continue
        if not re.fullmatch(r"[A-Z0-9][A-Z0-9\-]*", model):
            continue
        out[cod] = {
            "cod": cod,
            "model": model,
            "liste_fiyati_eur": round(price, 2),
        }
    return out


def pricing_block(cod: str, liste: float, satis: float, model: str) -> dict:
    fiyat_tl_net = round(satis * KUR_EUR_TRY)
    fiyat_tl = round(fiyat_tl_net * (1 + KDV_ORAN / 100))
    price = f"{fmt_try(fiyat_tl)} KDV dahil"
    specs_pricing = "\n".join(
        [
            f"Ürün kodu (COD): {cod}",
            f"Model: {model}",
            f"Liste fiyatı (EUR): {liste}",
            f"Equsto iskonto: %{ISKONTO_YUZDE}",
            f"Equsto satış (EUR): {satis}",
            f"Hesap: liste × {SATIS_ORAN}",
            f"Equsto satış (TL, KDV dahil): {fmt_try(fiyat_tl)}",
            f"Kur: 1 EUR = {KUR_EUR_TRY} TRY (KDV %{KDV_ORAN})",
            f"Kaynak: Electrolux Professional Fiyat Listesi 2026",
        ]
    )
    return {
        "price": price,
        "fiyat_tl": fiyat_tl,
        "fiyat_tl_net": fiyat_tl_net,
        "liste_fiyati": liste,
        "liste_fiyati_eur": liste,
        "satis_fiyati_eur": satis,
        "satis_eur_indirimli": satis,
        "iskontolu_fiyat": satis,
        "iskonto_oran": ISKONTO_YUZDE,
        "iskonto_yuzde": ISKONTO_YUZDE,
        "para_birimi": "EUR",
        "kur_eur_try": KUR_EUR_TRY,
        "kdv_oran": KDV_ORAN,
        "fiyat_kaynagi": KAYNAK,
        "kaynak_fiyat_listesi": KAYNAK,
        "electrolux_liste_model": model,
        "fiyat_bekleniyor": False,
        "_specs_pricing": specs_pricing,
    }


def merge_specs(row: dict, pricing_text: str) -> str:
    old = str(row.get("specs") or "").strip()
    if not old:
        return pricing_text
    lines = old.split("\n")
    filtered: list[str] = []
    skip = False
    for line in lines:
        if line.startswith("Ürün kodu (COD):"):
            skip = True
            continue
        if skip:
            if line.startswith("Kaynak: Electrolux Professional Fiyat Listesi"):
                skip = False
            continue
        filtered.append(line)
    body = "\n".join(filtered).strip()
    return f"{body}\n\n{pricing_text}" if body else pricing_text


def is_electrolux_row(row: dict) -> bool:
    return row.get("brand") == BRAND or row.get("kaynak") == "electrolux-professional"


def apply_prices(rows: list[dict], prices: dict[str, dict]) -> dict[str, int]:
    stats = {"updated": 0, "skipped": 0, "no_price": 0}
    for row in rows:
        if not is_electrolux_row(row):
            continue
        cod = str(row.get("sku") or row.get("electrolux_cod") or row.get("urun_kodu") or "").strip()
        if not cod:
            stats["skipped"] += 1
            continue
        entry = prices.get(cod)
        if not entry:
            stats["no_price"] += 1
            continue
        liste = entry["liste_fiyati_eur"]
        satis = round(liste * SATIS_ORAN, 2)
        px = pricing_block(cod, liste, satis, entry["model"])
        specs_pricing = px.pop("_specs_pricing")
        row.update(px)
        row["specs"] = merge_specs(row, specs_pricing)
        stats["updated"] += 1
    return stats


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--pdf", type=str, default="", help="PDF yolu (opsiyonel)")
    args = ap.parse_args()

    pdf_path = Path(args.pdf) if args.pdf else find_pdf()
    prices = parse_pdf_prices(pdf_path)
    print(f"[electrolux-fiyat] PDF: {pdf_path.name} | {len(prices)} fiyat satırı")

    if not args.dry_run:
        DATA_OUT.parent.mkdir(parents=True, exist_ok=True)
        DATA_OUT.write_text(
            json.dumps(
                {
                    "generated": date.today().isoformat(),
                    "pdf": str(pdf_path),
                    "iskonto_yuzde": ISKONTO_YUZDE,
                    "satis_oran": SATIS_ORAN,
                    "kur_eur_try": KUR_EUR_TRY,
                    "count": len(prices),
                    "by_cod": prices,
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

    total = {"updated": 0, "skipped": 0, "no_price": 0, "files": 0}
    for dept_file in sorted(DEPT_DIR.glob("*.json")):
        rows = json.loads(dept_file.read_text(encoding="utf-8"))
        if not isinstance(rows, list):
            continue
        stats = apply_prices(rows, prices)
        if stats["updated"]:
            total["files"] += 1
            total["updated"] += stats["updated"]
            total["no_price"] += stats["no_price"]
            print(f"  {dept_file.name}: {stats['updated']} guncellendi, {stats['no_price']} fiyatsiz")
            if not args.dry_run:
                dept_file.write_text(
                    json.dumps(rows, ensure_ascii=False, separators=(",", ":")),
                    encoding="utf-8",
                )

    print(
        f"\nOzet: {total['updated']} urun fiyatlandi | "
        f"{total['no_price']} listede yok | {total['files']} dept dosyasi"
    )
    if args.dry_run:
        print("(dry-run — dosya yazilmadi)")
        return

    import subprocess

    subprocess.run(
        ["node", "scripts/rebuild-ekipmanlar-from-dept.mjs"],
        cwd=ROOT,
        check=True,
    )


if __name__ == "__main__":
    main()
