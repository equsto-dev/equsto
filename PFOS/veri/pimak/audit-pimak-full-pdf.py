#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""pimak 27-27-030426.pdf — blok parse ground truth vs site + pimak-fiyat.json."""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent.parent.parent / "E-TICARET" / "site"
PDF = Path(r"C:\D Disk\FİYAT LİSTELERİ\pimak 27-27-030426.pdf")
OUT_JSON = ROOT / "pimak-full-pdf-audit.json"
OUT_MD = ROOT / "pimak-full-pdf-audit.md"

spec = importlib.util.spec_from_file_location("parse", ROOT / "parse-pdf-p188-197.py")
parse_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parse_mod)

spec2 = importlib.util.spec_from_file_location(
    "sync", SITE / "scripts" / "sync-pimak-fiyat-pdf.py"
)
sync_mod = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(sync_mod)

PIMAK_LINE = re.compile(r"^P[Iİi]MAK\.[0-9A-Za-z.]+$", re.I)
DIM_LINE = parse_mod.DIM_LINE
PRICE_LINE = sync_mod.PRICE_LINE
norm_kod = parse_mod.norm_kod
is_code = parse_mod.is_code
is_product_code = parse_mod.is_product_code
parse_eur = sync_mod.parse_eur


def parse_page_195_truth(body: str, page: int) -> list[dict]:
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    dims: list[tuple[int, int, int]] = []
    prices: list[float] = []
    codes_10: list[str] = []
    codes_00: list[str] = []

    for ln in lines:
        s = ln.replace(" ", "").replace("*", "x")
        m = DIM_LINE.match(s)
        if m:
            dims.append((int(m.group(1)), int(m.group(2)), int(m.group(3))))
            continue
        if PIMAK_LINE.match(ln):
            k = norm_kod(ln)
            if k.endswith(".10"):
                codes_10.append(k)
            elif k.endswith(".00"):
                codes_00.append(k)
            continue
        pm = PRICE_LINE.match(ln)
        if pm:
            prices.append(parse_eur(pm.group(1)))

    out: list[dict] = []
    n10 = len(codes_10)
    for i, code in enumerate(codes_10):
        out.append({"urun_kodu": code, "liste_fiyati_eur": prices[i], "pdf_page": page})
    for i, code in enumerate(codes_00):
        out.append(
            {"urun_kodu": code, "liste_fiyati_eur": prices[n10 + i], "pdf_page": page}
        )
    return out


from pimak_pdf_blocks import extract_block_pairs_from_page


def parse_blocks_truth(body: str, page: int) -> list[dict]:
    return extract_block_pairs_from_page(
        body,
        page,
        is_product_code=is_product_code,
        norm_kod=norm_kod,
        price_line=PRICE_LINE,
        parse_eur=parse_eur,
    )


def is_page_195_pattern(body: str) -> bool:
    return "Orta Tip Filtreli" in body and PIMAK_LINE.search(body) is not None


def extract_pdf_truth(pdf_path: Path) -> dict[str, dict]:
    doc = fitz.open(pdf_path)
    truth: dict[str, dict] = {}
    for i, page in enumerate(doc, start=1):
        body = page.get_text("text")
        if is_page_195_pattern(body):
            rows = parse_page_195_truth(body, i)
        else:
            rows = parse_blocks_truth(body, i)
        for r in rows:
            truth[r["urun_kodu"]] = r
    return truth


def load_sync_prices() -> dict[str, float]:
    p = SITE / "scripts/data/pimak-fiyat.json"
    if not p.exists():
        return {}
    data = json.loads(p.read_text(encoding="utf-8"))
    out: dict[str, float] = {}
    for k, v in data.items():
        if k.startswith("_"):
            continue
        if isinstance(v, dict) and "liste_fiyati_eur" in v:
            out[norm_kod(k)] = float(v["liste_fiyati_eur"])
    return out


def site_rows() -> list[dict]:
    rows: list[dict] = []
    for f in (SITE / "public/data/dept").glob("*.json"):
        for r in json.loads(f.read_text(encoding="utf-8")):
            brand = str(r.get("brand") or "")
            kaynak = str(r.get("kaynak") or "")
            if brand == "Equsto" and kaynak == "equsto-katalog-pdf":
                rows.append(r)
            elif "pimak" in brand.lower() or kaynak in {"pimak-pdf", "pimak-web"}:
                rows.append(r)
    return rows


def sku_to_pimak_key(sku: str) -> str:
    s = norm_kod(sku)
    if s.startswith("EQUSTO."):
        return "PIMAK." + s[7:]
    return s


def main() -> None:
    if not PDF.exists():
        print("PDF yok:", PDF, file=sys.stderr)
        sys.exit(1)

    truth = extract_pdf_truth(PDF)
    sync = load_sync_prices()
    site = site_rows()

    site_vs_truth: list[dict] = []
    site_no_pdf: list[str] = []
    sync_vs_truth: list[dict] = []

    for r in site:
        key = sku_to_pimak_key(str(r.get("sku") or r.get("urun_kodu") or ""))
        if not key or key == "PIMAK.":
            continue
        t = truth.get(key)
        site_eur = float(r.get("liste_fiyati_eur") or 0)
        if not t:
            if site_eur > 0:
                site_no_pdf.append(key)
            continue
        pdf_eur = float(t["liste_fiyati_eur"])
        if abs(site_eur - pdf_eur) > 0.01:
            site_vs_truth.append(
                {
                    "sku": r.get("sku"),
                    "urun_kodu": key,
                    "sayfa": t["pdf_page"],
                    "pdf_eur": pdf_eur,
                    "site_eur": site_eur,
                    "fark": round(site_eur - pdf_eur, 2),
                }
            )

    for k, t in truth.items():
        s = sync.get(k)
        if s is None:
            continue
        if abs(float(s) - float(t["liste_fiyati_eur"])) > 0.01:
            sync_vs_truth.append(
                {
                    "urun_kodu": k,
                    "sayfa": t["pdf_page"],
                    "pdf_eur": t["liste_fiyati_eur"],
                    "sync_eur": s,
                }
            )

    by_page = defaultdict(lambda: {"pdf": 0, "site_ok": 0, "site_bad": 0})
    for k, t in truth.items():
        by_page[t["pdf_page"]]["pdf"] += 1
    for h in site_vs_truth:
        by_page[h["sayfa"]]["site_bad"] += 1
    for r in site:
        key = sku_to_pimak_key(str(r.get("sku") or ""))
        t = truth.get(key)
        if t and abs(float(r.get("liste_fiyati_eur") or 0) - float(t["liste_fiyati_eur"])) <= 0.01:
            by_page[t["pdf_page"]]["site_ok"] += 1

    report = {
        "ozet": {
            "pdf_sayfa": 218,
            "pdf_truth_sku": len(truth),
            "sync_fiyat_satiri": len(sync),
            "site_pimak_equsto_pdf": len(site),
            "site_vs_pdf_hata": len(site_vs_truth),
            "site_pdf_yok": len(site_no_pdf),
            "sync_vs_pdf_hata": len(sync_vs_truth),
        },
        "site_vs_pdf_hatalar": site_vs_truth,
        "sync_vs_pdf_hatalar": sync_vs_truth[:100],
        "site_pdf_yok_ornek": site_no_pdf[:50],
    }
    OUT_JSON.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Pimak full PDF fiyat denetimi",
        "",
        f"Kaynak: `{PDF}`",
        "",
        f"- Blok parse SKU: **{len(truth)}**",
        f"- sync-pimak-fiyat.json: **{len(sync)}** satır",
        f"- Site (Equsto PDF + Pimak): **{len(site)}** ürün",
        f"- Site ↔ PDF hata: **{len(site_vs_truth)}**",
        f"- sync ↔ PDF hata: **{len(sync_vs_truth)}**",
        "",
    ]
    if site_vs_truth:
        lines.append("## Site ≠ PDF")
        lines.append("")
        for h in site_vs_truth[:60]:
            lines.append(
                f"- `{h['sku']}` s.{h['sayfa']}: PDF **{h['pdf_eur']}** € → site **{h['site_eur']}** €"
            )
    else:
        lines.append("Site fiyatları PDF blok parse ile uyumlu.")

    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report["ozet"], ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
