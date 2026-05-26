# -*- coding: utf-8 -*-
"""
Tam PDF veri çıkarma: düz metin, yapılandırılmış metin (JSON), SVG vektör,
sayfa bağlantıları, fontlar, annotasyonlar, tablo bulguları.
(Gömülü görseller için extract_caglayan_pdf.py kullanılmalı.)
"""
from __future__ import annotations

import json
from pathlib import Path

import fitz  # PyMuPDF

PDF_PATH = Path(r"c:\D Disk\FİYAT LİSTELERİ\ÇAĞLAYAN SOĞUTMA CATALOG MARKET.pdf")
OUT_ROOT = Path(r"c:\D Disk\EQUSTO-CURSOR\caglayan-sogutma-catalog-export")
TAM_VERI = OUT_ROOT / "tam_veri"


def _link_entry(link: dict) -> dict:
    out = {k: v for k, v in link.items() if k not in {"from", "to"}}
    r = link.get("from")
    if r is not None:
        out["from"] = [r.x0, r.y0, r.x1, r.y1]
    r2 = link.get("to")
    if r2 is not None and hasattr(r2, "x0"):
        out["to"] = [r2.x0, r2.y0, r2.x1, r2.y1]
    return out


def _annot_tip(annot: fitz.Annot) -> str:
    t = annot.type
    if isinstance(t, (list, tuple)) and len(t) >= 2:
        return str(t[1])
    return str(t)


def _annot_entries(page: fitz.Page) -> list[dict]:
    rows: list[dict] = []
    for annot in page.annots() or []:
        try:
            rows.append(
                {
                    "tip": _annot_tip(annot),
                    "rect": [annot.rect.x0, annot.rect.y0, annot.rect.x1, annot.rect.y1],
                    "bilgi": dict(annot.info) if annot.info else {},
                    "içerik": (annot.get_content() or "").strip() or None,
                }
            )
        except Exception:
            continue
    return rows


def _font_rows(page: fitz.Page) -> list[dict]:
    rows: list[dict] = []
    for f in page.get_fonts():
        rows.append(
            {
                "xref": f[0],
                "ext": f[1],
                "tip": f[2],
                "ad": f[3],
                "referans": f[4],
                "kodlama": f[5] if len(f) > 5 else None,
            }
        )
    return rows


def main() -> None:
    if not PDF_PATH.is_file():
        raise SystemExit(f"PDF bulunamadı: {PDF_PATH}")

    TAM_VERI.mkdir(parents=True, exist_ok=True)
    d_metin_duz = TAM_VERI / "metin_duz"
    d_metin_json = TAM_VERI / "metin_yapilandirilmis_json"
    d_svg = TAM_VERI / "vektor_svg"
    d_tablo = TAM_VERI / "tablolar"

    d_ek = TAM_VERI / "sayfa_ekleri"

    for d in (d_metin_duz, d_metin_json, d_svg, d_tablo, d_ek):
        d.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(PDF_PATH)
    try:
        tum_metin_parcalari: list[str] = []
        tum_baglantilar: list[dict] = []
        font_sozluk: dict[str, dict] = {}
        ozet = {
            "kaynak_pdf": str(PDF_PATH),
            "sayfa_sayısı": len(doc),
            "doküman_metadata": dict(doc.metadata),
            "sayfalar": [],
            "tablo_sayısı_toplam": 0,
            "bağlantı_sayısı_toplam": 0,
            "annotasyon_sayısı_toplam": 0,
            "gömülü_dosya_sayısı": doc.embfile_count(),
        }

        for i in range(len(doc)):
            page = doc[i]
            pnum = i + 1
            tag = f"sayfa_{pnum:04d}"

            plain = page.get_text("text") or ""
            (d_metin_duz / f"{tag}.txt").write_text(plain, encoding="utf-8")
            tum_metin_parcalari.append(f"\n\n===== {tag} =====\n\n{plain}")

            jtxt = page.get_text("json") or "{}"
            (d_metin_json / f"{tag}.json").write_text(jtxt, encoding="utf-8")

            svg = page.get_svg_image()
            (d_svg / f"{tag}.svg").write_text(svg, encoding="utf-8")

            links = [_link_entry(l) for l in page.get_links()]
            for L in links:
                L["sayfa"] = pnum
            tum_baglantilar.extend(links)

            fonts = _font_rows(page)
            for fr in fonts:
                font_sozluk[fr["ad"]] = fr

            annots = _annot_entries(page)

            tablo_satirlari: list[dict] = []
            try:
                tf = page.find_tables()
                for ti, tab in enumerate(tf.tables):
                    try:
                        raw = tab.extract()
                    except Exception:
                        raw = None
                    tablo_satirlari.append(
                        {
                            "indeks": ti,
                            "bbox": [tab.bbox.x0, tab.bbox.y0, tab.bbox.x1, tab.bbox.y1],
                            "satırlar": raw,
                        }
                    )
            except Exception:
                pass

            if tablo_satirlari:
                (d_tablo / f"{tag}_tablolar.json").write_text(
                    json.dumps(tablo_satirlari, ensure_ascii=False, indent=2),
                    encoding="utf-8",
                )
                ozet["tablo_sayısı_toplam"] += len(tablo_satirlari)

            sayfa_ozet = {
                "sayfa": pnum,
                "genişlik": float(page.rect.width),
                "yükseklik": float(page.rect.height),
                "bağlantı_sayısı": len(links),
                "font_sayısı": len(fonts),
                "annotasyon_sayısı": len(annots),
                "tablo_sayısı": len(tablo_satirlari),
                "metin_karakter": len(plain),
            }
            ozet["sayfalar"].append(sayfa_ozet)
            ozet["bağlantı_sayısı_toplam"] += len(links)
            ozet["annotasyon_sayısı_toplam"] += len(annots)

            if links or annots:
                (d_ek / f"{tag}_baglanti_ve_annot.json").write_text(
                    json.dumps(
                        {"bağlantılar": links, "annotasyonlar": annots},
                        ensure_ascii=False,
                        indent=2,
                    ),
                    encoding="utf-8",
                )

        (TAM_VERI / "TUM_METIN.txt").write_text(
            "".join(tum_metin_parcalari).lstrip(), encoding="utf-8"
        )
        (TAM_VERI / "tum_baglantilar.json").write_text(
            json.dumps(tum_baglantilar, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        (TAM_VERI / "kullanilan_fontlar.json").write_text(
            json.dumps(
                dict(sorted(font_sozluk.items(), key=lambda x: x[0].lower())),
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )

        try:
            toc = doc.get_toc(simple=False)
        except Exception:
            toc = []
        (TAM_VERI / "icerik_yapisi_toc.json").write_text(
            json.dumps(toc, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        (TAM_VERI / "tam_veri_ozet.json").write_text(
            json.dumps(ozet, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        print("OK", TAM_VERI)
        print("sayfalar", ozet["sayfa_sayısı"])
        print("bağlantı", ozet["bağlantı_sayısı_toplam"])
        print("tablo", ozet["tablo_sayısı_toplam"])
        print("annotasyon", ozet["annotasyon_sayısı_toplam"])
    finally:
        doc.close()


if __name__ == "__main__":
    main()
