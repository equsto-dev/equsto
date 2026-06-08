#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""s.188-197 PDF metin ↔ p188-197-products.json ↔ site dept doğrulama raporu."""
from __future__ import annotations

import importlib.util
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE = ROOT.parent.parent.parent / "E-TICARET" / "site"
TXT = ROOT / "_pdf-p188-197.txt"
JSON = ROOT / "p188-197-products.json"
REPORT = ROOT / "p188-197-fiyat-audit.json"
REPORT_MD = ROOT / "p188-197-fiyat-audit.md"

spec = importlib.util.spec_from_file_location("parse", ROOT / "parse-pdf-p188-197.py")
parse_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parse_mod)

spec2 = importlib.util.spec_from_file_location(
    "sync_pimak", SITE / "scripts" / "sync-pimak-fiyat-pdf.py"
)
sync_mod = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(sync_mod)

PIMAK_LINE = re.compile(r"^P[Iİi]MAK\.[0-9A-Za-z.]+$", re.I)
PRICE_LINE = sync_mod.PRICE_LINE
DIM_LINE = parse_mod.DIM_LINE
norm_kod = parse_mod.norm_kod
is_code = parse_mod.is_code


def parse_blocks_from_page(body: str, page: int) -> list[dict]:
    """Her 'Ürün Kodu' bloğu: fiyatlar (Fiyat satırından önce) ↔ kodlar (anchor öncesi)."""
    lines = [ln.strip() for ln in body.splitlines() if ln.strip()]
    anchors = [i for i, ln in enumerate(lines) if ln in {"Ürün Kodu", "Product Code"}]
    out: list[dict] = []

    for anchor in anchors:
        codes: list[str] = []
        j = anchor - 1
        while j >= 0:
            s = norm_kod(lines[j])
            if re.fullmatch(r"M0\d{2}T?", s, re.I) or s in {"KOD", "CODE"}:
                j -= 1
                continue
            if not is_code(lines[j]):
                break
            codes.insert(0, s)
            j -= 1
        if not codes:
            continue

        fiyat_idx = None
        for k in range(anchor - 1, -1, -1):
            if lines[k] == "Fiyat":
                fiyat_idx = k
                break
        if fiyat_idx is None:
            continue

        prices: list[float] = []
        k = fiyat_idx - 1
        while k >= 0:
            if lines[k] in {"Dimensions (mm)", "Ebat (mm)"}:
                break
            if lines[k] in {"Fiyat", "Price"}:
                break
            pm = PRICE_LINE.match(lines[k])
            if pm:
                prices.insert(0, sync_mod.parse_eur(pm.group(1)))
            k -= 1

        if len(prices) != len(codes):
            n = min(len(codes), len(prices))
            if n == 0:
                continue
            codes, prices = codes[:n], prices[:n]

        family = parse_mod.normalize_ligatures(
            parse_mod.family_title_before(lines, anchor) or "?"
        )
        for code, price in zip(codes, prices):
            kod = f"PIMAK.{code.split('.', 1)[1]}" if "." in code else code
            out.append(
                {
                    "urun_kodu": kod,
                    "liste_fiyati_eur": price,
                    "pdf_page": page,
                    "aile_hint": family[:60],
                }
            )
    return out


def parse_page_195_truth(body: str) -> list[dict]:
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
            prices.append(sync_mod.parse_eur(pm.group(1)))

    out: list[dict] = []
    n10 = len(codes_10)
    for i, code in enumerate(codes_10):
        out.append(
            {
                "urun_kodu": code,
                "liste_fiyati_eur": prices[i],
                "pdf_page": 195,
                "aile_hint": "Orta Tip Filtreli",
            }
        )
    for i, code in enumerate(codes_00):
        out.append(
            {
                "urun_kodu": code,
                "liste_fiyati_eur": prices[n10 + i],
                "pdf_page": 195,
                "aile_hint": "Orta Tip Filtresiz",
            }
        )
    return out


def extract_truth() -> dict[str, dict]:
    raw = TXT.read_text(encoding="utf-8")
    chunks = re.split(r"=== PAGE (\d+) ===", raw)
    truth: dict[str, dict] = {}
    for page_s, body in zip(chunks[1::2], chunks[2::2]):
        page = int(page_s)
        if page < 188 or page > 197:
            continue
        if page == 195:
            rows = parse_page_195_truth(body)
        else:
            rows = parse_blocks_from_page(body, page)
        for r in rows:
            truth[r["urun_kodu"]] = r
    return truth


def load_site_equsto() -> dict[str, dict]:
    out: dict[str, dict] = {}
    for dept in ("tezgah", "davlumbaz", "market-reyon"):
        path = SITE / "public/data/dept" / f"{dept}.json"
        if not path.exists():
            continue
        for row in json.loads(path.read_text(encoding="utf-8")):
            if row.get("brand") != "Equsto":
                continue
            sku = str(row.get("sku") or "")
            if not sku.startswith("EQUSTO."):
                continue
            pimak = "PIMAK." + sku.replace("EQUSTO.", "")
            out[pimak] = {
                "sku": sku,
                "dept": dept,
                "liste_fiyati_eur": row.get("liste_fiyati_eur"),
                "fiyat_tl": row.get("fiyat_tl"),
            }
    return out


def main() -> None:
    truth = extract_truth()
    parsed = {p["urun_kodu"]: p for p in json.loads(JSON.read_text(encoding="utf-8"))}
    site = load_site_equsto()

    json_vs_truth: list[dict] = []
    site_vs_json: list[dict] = []
    missing_json: list[str] = []
    missing_site: list[str] = []

    for kod, t in sorted(truth.items()):
        p = parsed.get(kod)
        if not p:
            missing_json.append(kod)
            continue
        tp, pp = t["liste_fiyati_eur"], p.get("liste_fiyati_eur")
        if abs(float(tp) - float(pp)) > 0.01:
            json_vs_truth.append(
                {
                    "urun_kodu": kod,
                    "sayfa": t["pdf_page"],
                    "pdf_eur": tp,
                    "json_eur": pp,
                    "fark_eur": round(float(pp) - float(tp), 2),
                }
            )

    for kod, p in parsed.items():
        if kod not in truth:
            continue
        s = site.get(kod)
        if not s:
            missing_site.append(kod)
            continue
        if abs(float(s.get("liste_fiyati_eur") or 0) - float(p.get("liste_fiyati_eur") or 0)) > 0.01:
            site_vs_json.append(
                {
                    "sku": s["sku"],
                    "dept": s["dept"],
                    "json_eur": p.get("liste_fiyati_eur"),
                    "site_eur": s.get("liste_fiyati_eur"),
                }
            )

    by_page = defaultdict(lambda: {"toplam": 0, "uyumlu": 0, "hatali": 0})
    for kod, t in truth.items():
        pg = t["pdf_page"]
        by_page[pg]["toplam"] += 1
        p = parsed.get(kod)
        if p and abs(float(t["liste_fiyati_eur"]) - float(p.get("liste_fiyati_eur", 0))) <= 0.01:
            by_page[pg]["uyumlu"] += 1
        else:
            by_page[pg]["hatali"] += 1

    report = {
        "ozet": {
            "pdf_truth_urun": len(truth),
            "json_urun": len(parsed),
            "site_equsto_pimak_eslesen": len([k for k in truth if k in site]),
            "json_vs_pdf_hata": len(json_vs_truth),
            "site_vs_json_hata": len(site_vs_json),
            "pdf_var_json_yok": len(missing_json),
            "json_var_site_yok": len(missing_site),
        },
        "sayfa_bazli": dict(sorted(by_page.items())),
        "json_vs_pdf_hatalar": json_vs_truth,
        "site_vs_json_hatalar": site_vs_json,
        "pdf_var_json_yok": missing_json[:50],
        "json_var_site_yok_ornek": missing_site[:30],
    }
    REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    lines = [
        "# Pimak s.188–197 fiyat denetim raporu",
        "",
        f"- PDF blok parse (bağımsız): **{len(truth)}** SKU",
        f"- `p188-197-products.json`: **{len(parsed)}** SKU",
        f"- JSON ↔ PDF uyum: **{len(truth) - len(json_vs_truth)}/{len(truth)}**",
        f"- JSON ↔ PDF hata: **{len(json_vs_truth)}**",
        f"- Site (Equsto) ↔ JSON hata: **{len(site_vs_json)}**",
        "",
        "## Sayfa bazlı",
        "",
        "| Sayfa | PDF SKU | Uyumlu | Hatalı |",
        "|------:|--------:|-------:|-------:|",
    ]
    for pg in range(188, 198):
        s = by_page.get(pg, {"toplam": 0, "uyumlu": 0, "hatali": 0})
        lines.append(f"| {pg} | {s['toplam']} | {s['uyumlu']} | {s['hatali']} |")

    if json_vs_truth:
        lines.extend(["", "## JSON ≠ PDF (ilk 40)", ""])
        for h in json_vs_truth[:40]:
            lines.append(
                f"- `{h['urun_kodu']}` s.{h['sayfa']}: PDF **{h['pdf_eur']}** € → JSON **{h['json_eur']}** € (Δ {h['fark_eur']})"
            )
    else:
        lines.extend(["", "## JSON ≠ PDF", "", "Tüm eşleşen SKU'larda liste fiyatı PDF ile uyumlu."])

    if site_vs_json:
        lines.extend(["", "## Site ≠ JSON", ""])
        for h in site_vs_json[:20]:
            lines.append(f"- `{h['sku']}`: JSON {h['json_eur']} vs site {h['site_eur']}")

    REPORT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(json.dumps(report["ozet"], ensure_ascii=False, indent=2))
    print(f"Rapor: {REPORT_MD}")


if __name__ == "__main__":
    main()
