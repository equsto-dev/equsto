# -*- coding: utf-8 -*-
"""
Öztiryakiler Fiyat Listesi 2025 (xlsx) + Ürün kataloğu 2026 (pdf)
→ ürün koduna göre eşleştirme, kategori hiyerarşisi, iskonto/fiyat çekimi.

Çıktı:
  scripts/data/ozti-fiyat-2025.json       — fiyat listesi (Sayfa1)
  scripts/data/ozti-katalog-pdf-2026.json — PDF metin + kodlar
  scripts/data/ozti-eslesme-2026.json     — birleşik eşleşme
  scripts/data/ozti-eslesme-ozet.json     — özet istatistik

  python scripts/merge-ozti-fiyat-katalog.py
"""
from __future__ import annotations

import json
import re
from collections import defaultdict
from pathlib import Path

import fitz
import pandas as pd

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
XLSX = Path(r"c:\Users\User\Downloads\Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx")
PDF = Path(r"c:\Users\User\Downloads\Öztiryakiler-Urun-katalogu-2026.pdf")

# Ürün kodu: 7865.N1.80908.10, 79E4.27NMV.00, 79K4.06NMV.00 …
KOD_RE = re.compile(
    r"^[0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{3,48}$",
    re.I,
)

# PDF içinde kod yakalama (daha gevşek)
KOD_FIND_RE = re.compile(
    r"\b([0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,48})\b",
    re.I,
)


def norm_kod(k: str) -> str:
    return re.sub(r"\s+", "", str(k or "").strip()).upper()


def satis_eur_from_liste(liste: float | None, bayi_iskonto: float | None) -> dict:
    """
    Excel «BAYİ İSKONTO» = indirim oranı (0,65 → %65 indirim).
    Satış EUR = liste × (1 − bayi_iskonto) → ödeme çarpanı 0,35.
    """
    out: dict = {
        "satis_fiyati_eur": None,
        "iskonto_yuzde": None,
        "iskonto_tutar_eur": None,
        "odeme_carpani": None,
        "fiyatlandirma": "liste_eur_x_odeme_carpani",
    }
    if liste is None or liste <= 0:
        out["not"] = "liste_fiyati_yok"
        return out
    if bayi_iskonto is None or not (0 < bayi_iskonto < 1):
        out["satis_fiyati_eur"] = round(liste, 2)
        out["iskonto_yuzde"] = 0.0
        out["iskonto_tutar_eur"] = 0.0
        out["odeme_carpani"] = 1.0
        out["not"] = "bayi_iskonto_yok_liste_satis"
        return out
    odeme = 1 - bayi_iskonto
    satis = round(liste * odeme, 2)
    out["satis_fiyati_eur"] = satis
    out["iskonto_yuzde"] = round(bayi_iskonto * 100, 2)
    out["iskonto_tutar_eur"] = round(liste - satis, 2)
    out["odeme_carpani"] = round(odeme, 4)
    return out


def apply_satis_fields(row: dict) -> dict:
    px = satis_eur_from_liste(row.get("liste_fiyati"), row.get("bayi_iskonto"))
    row.update(px)
    return row


def parse_fiyat_listesi() -> list[dict]:
    df = pd.read_excel(XLSX, sheet_name="Sayfa1", header=None)
    # satır 1 = başlık
    rows_out: list[dict] = []
    cat_stack: list[str] = []

    for i in range(2, len(df)):
        raw_kod = df.iloc[i, 0]
        if pd.isna(raw_kod):
            continue
        kod = str(raw_kod).strip()
        if not kod:
            continue

        tanim = df.iloc[i, 1]
        tanim_s = "" if pd.isna(tanim) else str(tanim).strip()
        fiyat = df.iloc[i, 2]
        para = df.iloc[i, 3]
        iskonto = df.iloc[i, 4]
        barkod = df.iloc[i, 5]

        # Kategori başlığı: fiyat yok, kod ürün kodu formatında değil
        if pd.isna(fiyat) and not KOD_RE.match(kod):
            while cat_stack:
                last = cat_stack[-1]
                if kod.startswith(last) or last in kod or kod in last:
                    break
                cat_stack.pop()
            cat_stack.append(kod)
            continue

        if not KOD_RE.match(kod):
            continue

        try:
            fiyat_f = float(fiyat)
        except (TypeError, ValueError):
            fiyat_f = None

        try:
            isk_f = float(iskonto)
        except (TypeError, ValueError):
            isk_f = None

        para_s = "" if pd.isna(para) else str(para).strip()
        barkod_s = "" if pd.isna(barkod) else str(barkod).strip()

        rows_out.append(
            apply_satis_fields(
                {
                    "urun_kodu": kod,
                    "urun_kodu_norm": norm_kod(kod),
                    "urun_tanimi": tanim_s,
                    "liste_fiyati_eur": fiyat_f,
                    "liste_fiyati": fiyat_f,
                    "para_birimi": para_s or "EUR",
                    "bayi_iskonto": isk_f,
                    "barkod": barkod_s,
                    "kategori_yolu": list(cat_stack),
                    "kategori": cat_stack[-1] if cat_stack else "",
                    "kaynak": "ozti-fiyat-listesi-2025-sayfa1",
                    "marka": "Öztiryakiler Endüstriyel Mutfak",
                }
            )
        )

    return rows_out


def parse_pdf_katalog() -> dict[str, dict]:
    """Kod → PDF sayfa(lar) ve çevre metin."""
    doc = fitz.open(PDF)
    by_kod: dict[str, dict] = {}

    for i in range(doc.page_count):
        page_no = i + 1
        text = doc[i].get_text("text") or ""
        if len(text.strip()) < 20:
            continue

        lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
        for ln in lines:
            for m in KOD_FIND_RE.finditer(ln):
                k = norm_kod(m.group(1))
                if not KOD_RE.match(k):
                    continue
                entry = by_kod.setdefault(
                    k,
                    {
                        "urun_kodu": m.group(1).strip(),
                        "pdf_sayfalar": [],
                        "pdf_satirlar": [],
                        "pdf_metin_parcalari": [],
                    },
                )
                if page_no not in entry["pdf_sayfalar"]:
                    entry["pdf_sayfalar"].append(page_no)
                if ln not in entry["pdf_satirlar"] and len(entry["pdf_satirlar"]) < 12:
                    entry["pdf_satirlar"].append(ln)
                if len(entry["pdf_metin_parcalari"]) < 3:
                    snippet = text[max(0, text.find(m.group(1)) - 120) : text.find(m.group(1)) + 400]
                    entry["pdf_metin_parcalari"].append(snippet.strip())

        # Sayfa genelinde kod geçiyorsa sayfa numarasını ekle
        for m in KOD_FIND_RE.finditer(text):
            k = norm_kod(m.group(1))
            if KOD_RE.match(k) and k in by_kod and page_no not in by_kod[k]["pdf_sayfalar"]:
                by_kod[k]["pdf_sayfalar"].append(page_no)

    doc.close()
    return by_kod


def merge(fiyat_rows: list[dict], pdf_by_kod: dict[str, dict]) -> tuple[list[dict], dict]:
    merged = []
    fiyat_kodlari = {r["urun_kodu_norm"] for r in fiyat_rows}
    pdf_kodlari = set(pdf_by_kod.keys())

    eslesen = fiyat_kodlari & pdf_kodlari
    sadece_fiyat = fiyat_kodlari - pdf_kodlari
    sadece_pdf = pdf_kodlari - fiyat_kodlari

    for row in fiyat_rows:
        k = row["urun_kodu_norm"]
        pdf = pdf_by_kod.get(k)
        item = {**row, "pdf_eslesme": bool(pdf)}
        if pdf:
            item["pdf"] = {
                "sayfalar": sorted(pdf["pdf_sayfalar"]),
                "satirlar": pdf["pdf_satirlar"][:8],
            }
        merged.append(item)

    # PDF'te olup fiyatta olmayan (örnek kayıt limit 500 dosya boyutu için ayrı liste)
    pdf_only = []
    for k in sorted(sadece_pdf):
        p = pdf_by_kod[k]
        pdf_only.append(
            {
                "urun_kodu": p["urun_kodu"],
                "urun_kodu_norm": k,
                "pdf_sayfalar": sorted(p["pdf_sayfalar"]),
                "pdf_satirlar": p["pdf_satirlar"][:6],
                "kaynak": "ozti-katalog-pdf-2026",
            }
        )

    ozet = {
        "fiyat_listesi_urun": len(fiyat_rows),
        "pdf_kod_sayisi": len(pdf_kodlari),
        "eslesen": len(eslesen),
        "sadece_fiyat_listesinde": len(sadece_fiyat),
        "sadece_pdf_katalogda": len(sadece_pdf),
        "iskonto_gruplari": {},
        "kategori_leaf_sayilari": {},
    }

    isk_counter: dict[str, int] = defaultdict(int)
    cat_counter: dict[str, int] = defaultdict(int)
    for r in fiyat_rows:
        isk = r.get("bayi_iskonto")
        key = str(isk) if isk is not None else "yok"
        isk_counter[key] += 1
        leaf = r.get("kategori") or "(yok)"
        cat_counter[leaf] += 1

    ozet["iskonto_gruplari"] = dict(sorted(isk_counter.items(), key=lambda x: -x[1]))
    ozet["kategori_leaf_sayilari"] = dict(sorted(cat_counter.items(), key=lambda x: -x[1])[:50])

    return merged, ozet, pdf_only


def by_kategori_tree(merged: list[dict]) -> dict:
    tree: dict = {}
    for r in merged:
        path = r.get("kategori_yolu") or ["Diğer"]
        node = tree
        for part in path:
            node = node.setdefault(part, {"_urunler": []})
        node.setdefault("_urunler", []).append(
            {
                "urun_kodu": r["urun_kodu"],
                "urun_tanimi": r["urun_tanimi"],
                "liste_fiyati_eur": r.get("liste_fiyati_eur") or r.get("liste_fiyati"),
                "satis_fiyati_eur": r.get("satis_fiyati_eur"),
                "bayi_iskonto": r["bayi_iskonto"],
                "iskonto_yuzde": r.get("iskonto_yuzde"),
                "para_birimi": r["para_birimi"],
                "pdf_eslesme": r["pdf_eslesme"],
                "pdf_sayfalar": (r.get("pdf") or {}).get("sayfalar"),
            }
        )
    return tree


def main() -> None:
    DATA.mkdir(parents=True, exist_ok=True)

    print("[ozti] Fiyat listesi (xlsx Sayfa1)…")
    fiyat = parse_fiyat_listesi()
    (DATA / "ozti-fiyat-2025.json").write_text(
        json.dumps(fiyat, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  -> {len(fiyat)} urun")

    print("[ozti] PDF katalog…")
    pdf_map = parse_pdf_katalog()
    pdf_list = [
        {"urun_kodu_norm": k, **v}
        for k, v in sorted(pdf_map.items(), key=lambda x: x[0])
    ]
    (DATA / "ozti-katalog-pdf-2026.json").write_text(
        json.dumps(pdf_list, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  -> {len(pdf_map)} kod (PDF metninden)")

    print("[ozti] Eşleştirme…")
    merged, ozet, pdf_only = merge(fiyat, pdf_map)
    (DATA / "ozti-eslesme-2026.json").write_text(
        json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (DATA / "ozti-eslesme-pdf-only.json").write_text(
        json.dumps(pdf_only, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    tree = by_kategori_tree(merged)
    (DATA / "ozti-kategoriler-2026.json").write_text(
        json.dumps(tree, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    ozet["fiyatlandirma"] = (
        "satis_fiyati_eur = liste_fiyati_eur × (1 − bayi_iskonto); "
        "ör. bayi_iskonto 0,65 → %65 indirim, ödeme ×0,35"
    )
    ozet["ornek_eslesen"] = [
        {
            "urun_kodu": r["urun_kodu"],
            "kategori": r.get("kategori"),
            "liste_fiyati_eur": r.get("liste_fiyati_eur"),
            "bayi_iskonto": r["bayi_iskonto"],
            "iskonto_yuzde": r.get("iskonto_yuzde"),
            "satis_fiyati_eur": r.get("satis_fiyati_eur"),
            "pdf_sayfa": (r.get("pdf") or {}).get("sayfalar", [])[:3],
        }
        for r in merged if r.get("pdf_eslesme")
    ][:15]
    ozet["ornek_sadece_fiyat"] = [
        {"urun_kodu": r["urun_kodu"], "kategori": r.get("kategori"), "bayi_iskonto": r["bayi_iskonto"]}
        for r in merged if not r.get("pdf_eslesme")
    ][:15]
    (DATA / "ozti-eslesme-ozet.json").write_text(
        json.dumps(ozet, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print("\n=== OZET ===")
    for k, v in ozet.items():
        if k.startswith("ornek_"):
            continue
        print(f"  {k}: {v}")
    print(f"\nÇıktılar: {DATA}")


if __name__ == "__main__":
    main()
