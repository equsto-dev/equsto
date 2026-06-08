# -*- coding: utf-8 -*-
"""
Cafemarkt Hoshizaki buz makineleri → Equsto sogutma.json
Fiyat: Hoshizaki xlsx «NET SATIŞ FİYATI» (EUR), TL = net × kur × 1.20 KDV.

  python scripts/sync-hoshizaki-fiyat-katalog.py
  python scripts/sync-hoshizaki-fiyat-katalog.py --dry-run

Önerilen akış (teknik PDF + NET fiyat):
  python scripts/sync-hoshizaki-fiyat-katalog.py
  node scripts/patch-ozti-pdf-enrich.mjs --dept sogutma
  python scripts/sync-hoshizaki-fiyat-katalog.py
  node scripts/rebuild-ekipmanlar-from-dept.mjs
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SOGUTMA = ROOT / "public/data/dept/sogutma.json"
KUR_EUR_TRY = 53.2979
KDV_ORAN = 20
BRAND = "Öztiryakiler Endüstriyel Mutfak"
CATEGORY = "buz-makineleri"
DEPT = "sogutma"
FIYAT_KAYNAGI = "hoshizaki-fiyat-listesi-net-satis"

# Cafemarkt vitrinindeki modeller → Excel AX kodu (B-240 / IM-240NE-HC-32 listede yok)
CAFEMARKT_AX = [
    "9805.IM100.HC",
    "9805.IM240A.NEH",  # cafemarkt: IM-210ANE-HC
    "9805.IM45CNE.HC",
    "9805.XNEHC.32",
    "9805.IM240N.EHC",
    "9805.00IMD.00",
    "9805.IM65N.EHC",
    "9805.IM45N.EHC",
    "9805.IM30CN.EHC",
    "9805.0B140.SA",
    "9805.IM240X.NHC",
    "9805.IM240D.NHC",
    "9805.AWNE.HC",
    "9805.FM480.AKE",  # cafemarkt: FM-480AWG-HC-SB
    "9805.IM130N.EHC",
    "9805.XNEHC.23",
    "9805.240HC.23",
]


def find_xlsx() -> Path:
    for base in (Path(r"c:\D Disk\FİYAT LİSTELERİ"), Path(r"c:/D Disk")):
        if not base.exists():
            continue
        for p in base.rglob("*.xlsx"):
            if "HOSH" in p.name.upper():
                return p
    raise FileNotFoundError("Hoshizaki fiyat listesi xlsx bulunamadı")


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def fmt_try(n: float) -> str:
    v = int(round(float(n)))
    s = f"{v:,}".replace(",", ".")
    return f"₺{s},00"


def product_id(ax: str) -> str:
    return f"oztiryakiler-endustriyel-mutfak__{ax.lower().replace('.', '-')}"


def image_rel(ax: str) -> str:
    slug = "ozti-" + ax.lower().replace(".", "-")
    return f"images/catalog/ozti/web/{slug}.jpg"


def pricing_fields(net_eur: float, liste_eur: float | None, ax: str, tanim: str) -> dict:
    net = round(float(net_eur), 2)
    liste = round(float(liste_eur), 2) if liste_eur and float(liste_eur) > 0 else None
    fiyat_tl_net = round(net * KUR_EUR_TRY)
    fiyat_tl = round(fiyat_tl_net * (1 + KDV_ORAN / 100))
    price = f"{fmt_try(fiyat_tl)} KDV dahil"
    specs_head = (tanim or ax).strip()
    specs = "\n".join(
        [
            specs_head,
            "",
            f"Ürün kodu: {ax}",
            f"Hoshizaki net satış (EUR): {net}",
            f"Equsto satış (EUR): {net}",
            f"Equsto satış (TL, KDV dahil): {fmt_try(fiyat_tl)}",
            f"Kur: 1 EUR = {KUR_EUR_TRY} TRY (KDV %{KDV_ORAN})",
            "Kategori: BUZ MAKİNELERİ",
            "Kaynak: Hoshizaki Fiyat Listesi — NET SATIŞ",
        ]
    )
    return {
        "price": price,
        "specs": specs,
        "aciklama": f"{specs_head}\n\nKategori: BUZ MAKİNELERİ",
        "liste_fiyati": liste,
        "liste_fiyati_eur": liste,
        "liste_fiyati_tl": None,
        "alis_fiyati": net,
        "alis_fiyati_eur": net,
        "alis_fiyati_tl": None,
        "satis_fiyati_eur": net,
        "satis_fiyati_tl": None,
        "satis_eur_indirimli": net,
        "iskontolu_fiyat": net,
        "equsto_kar_oran": None,
        "bayi_iskonto": None,
        "odeme_carpani": None,
        "kalan_oran": None,
        "iskonto_yuzde": None,
        "iskonto_oran": None,
        "para_birimi": "EUR",
        "fiyat_kaynagi": FIYAT_KAYNAGI,
        "kaynak": FIYAT_KAYNAGI,
        "kaynak_fiyat_listesi": FIYAT_KAYNAGI,
        "kur_eur_try": KUR_EUR_TRY,
        "fiyat_tl_net": fiyat_tl_net,
        "fiyat_tl": fiyat_tl,
        "kdv_oran": KDV_ORAN,
    }


def load_excel() -> dict[str, dict]:
    xlsx = find_xlsx()
    df = pd.read_excel(xlsx, sheet_name=0, header=0)
    ax_col = df.columns[0]
    liste_col = df.columns[5]
    net_col = df.columns[6]
    out: dict[str, dict] = {}
    for _, row in df.iterrows():
        ax = norm_kod(row[ax_col])
        if not ax.startswith("9805."):
            continue
        net = row[net_col]
        if pd.isna(net) or float(net) <= 0:
            continue
        liste = row[liste_col]
        liste_f = float(liste) if pd.notna(liste) and float(liste) > 0 else None
        out[ax] = {
            "ax": ax,
            "tanim": str(row.get("Ürün Tanımı") or row.iloc[1] or ax).strip(),
            "model": str(row.get("Model name") or "").strip(),
            "net_eur": float(net),
            "liste_eur": liste_f,
        }
    return out


def base_row(ax: str, excel: dict, template: dict | None) -> dict:
    e = excel[ax]
    name = e["tanim"].upper() if e["tanim"] else f"HOSHIZAKI {e['model']}"
    px = pricing_fields(e["net_eur"], e["liste_eur"], ax, name)
    row: dict = {
        "category": CATEGORY,
        "brand": BRAND,
        "name": name,
        "sku": ax,
        "model": ax,
        "urun_kodu": ax,
        "stok_no": ax,
        "dept": DEPT,
        "oem_brand": "Hoshizaki",
        "vitrin_arka_plan": False,
        "id": product_id(ax),
        "images": [image_rel(ax)],
        "keywords": [
            BRAND,
            "Öztiryakiler",
            ax,
            "BUZ MAKİNELERİ",
            CATEGORY,
            "Hoshizaki",
            name,
        ],
        "teknik_ozellikler": [],
        "olculer": {},
    }
    row.update(px)
    if template:
        for k in (
            "barkod",
            "teknik_ozellikler",
            "olculer",
            "pdf_eslesme",
            "pdf_sayfalar",
            "images",
            "keywords",
        ):
            if template.get(k):
                row[k] = template[k]
        if template.get("specs") and template.get("pdf_eslesme"):
            # PDF zenginleştirilmiş specs — fiyat bloğunu güncelle, teknik kısmı koru
            old = str(template["specs"])
            teknik = ""
            if "Teknik Özellikler" in old:
                teknik = old.split("Teknik Özellikler", 1)[1]
                row["specs"] = px["specs"] + "\n\nTeknik Özellikler" + teknik
    return row


def main() -> None:
    import sys

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    excel = load_excel()
    missing_ax = [ax for ax in CAFEMARKT_AX if ax not in excel]
    if missing_ax:
        raise SystemExit(f"Excel'de bulunamayan AX kodları: {missing_ax}")

    rows: list[dict] = json.loads(SOGUTMA.read_text(encoding="utf-8"))
    by_sku = {norm_kod(r.get("sku") or r.get("urun_kodu")): r for r in rows}

    stats = {"updated": 0, "added": 0}
    for ax in CAFEMARKT_AX:
        tpl = by_sku.get(ax)
        new_row = base_row(ax, excel, tpl)
        if tpl:
            idx = next(i for i, r in enumerate(rows) if norm_kod(r.get("sku")) == ax)
            rows[idx] = {**tpl, **new_row}
            stats["updated"] += 1
            print(f"[guncelle] {ax} -> {new_row['price']}")
        else:
            rows.append(new_row)
            by_sku[ax] = new_row
            stats["added"] += 1
            print(f"[yeni] {ax} -> {new_row['price']}")

    print(f"\nÖzet: {stats['updated']} güncellendi, {stats['added']} eklendi")
    if args.dry_run:
        print("(dry-run — dosya yazılmadı)")
        return

    SOGUTMA.write_text(json.dumps(rows, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Yazıldı: {SOGUTMA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
