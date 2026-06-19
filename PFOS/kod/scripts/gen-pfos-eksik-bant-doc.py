#!/usr/bin/env python3
"""PFOS konseptleri — ekipman bandı tanımsız liste → .docx (stdlib only)."""
from __future__ import annotations

import html
import zipfile
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "dokuman" / "PFOS-eksik-ekipman-bantlari.docx"

ROWS = [
    ("Restoran", "restaurant_sarkuteri", "Gurme Şarküteri", "—", "40–200", "—"),
    ("Kafe / Coffee Shop", "kafeterya", "Kafeterya", "—", "80–350", "—"),
    ("Pastane & Fırın", "pastane_artisan", "Artisan / butik", "—", "40–120", "—"),
    ("Pastane & Fırın", "pastane_endustriyel", "Endüstriyel fırın", "—", "80–800", "—"),
    ("Fast Food / QSR", "ff_burger", "Burger", "—", "40–180", "—"),
    ("Fast Food / QSR", "ff_pizza_paket", "Pizza (paket)", "—", "35–150", "—"),
    ("Fast Food / QSR", "ff_doner", "Döner / Dürüm", "—", "30–120", "—"),
    ("Fast Food / QSR", "ff_pide", "Pide / Lahmacun", "—", "35–150", "—"),
    ("Bar & Lounge", "bar_wine", "Wine Bar", "—", "50–200", "—"),
    ("Bar & Lounge", "bar_beer", "Beer Pub", "—", "80–400", "—"),
    ("Bar & Lounge", "bar_irish", "Irish Pub", "—", "100–450", "—"),
    ("Bar & Lounge", "bar_lounge", "Lounger Bar", "—", "80–350", "—"),
    ("Otel F&B", "otel_dag", "Dağ-Kayak Oteli", "—", "150–1500", "—"),
    ("Otel F&B", "otel_tatil", "Tatil Oteli", "—", "250–4000", "—"),
    ("Catering", "catering_uretim", "Üretim Fabrikası", "—", "200–3000", "—"),
    ("Catering", "catering_tasima", "Taşıma Yemek", "—", "100–1500", "—"),
    ("Bulut Mutfak", "bulut_grab_go", "Grab&Go", "—", "8–15", "—"),
    ("Bulut Mutfak", "bulut_coffee_counter", "Coffee Counter", "—", "8–15", "—"),
    ("Bulut Mutfak", "bulut_doner", "Döner", "—", "40–120", "—"),
    ("Bulut Mutfak", "bulut_pizza", "Pizza", "—", "35–100", "—"),
    ("Bulut Mutfak", "bulut_pide", "Pide & Lahmacun", "—", "35–100", "—"),
    ("Bulut Mutfak", "bulut_burger", "Burger", "—", "35–100", "—"),
    ("Bulut Mutfak", "bulut_ev_yemek", "Ev Yemekleri", "—", "40–120", "—"),
    ("Bulut Mutfak", "bulut_kebap", "Kebap & Türk Mutfağı", "—", "50–150", "—"),
    ("Üretim / Fabrika", "uretim_500_2000", "500–2000 m²", "—", "500–2000", "—"),
    ("Üretim / Fabrika", "uretim_2000_5000", "2000–5000 m²", "—", "2000–5000", "—"),
    ("Üretim / Fabrika", "uretim_5000_10000", "5000–10000 m²", "—", "5000–10000", "—"),
]

NOTE_ROW = (
    "Restoran",
    "meyhane",
    "Meyhane / Mezeli",
    "meyhane",
    "100–500",
    "Motor şablonu (referans m² bandı yok)",
)


def esc(s: str) -> str:
    return html.escape(s, quote=False)


def cell(text: str, bold: bool = False) -> str:
    t = esc(text)
    if bold:
        return f"<w:r><w:rPr><w:b/></w:rPr><w:t xml:space=\"preserve\">{t}</w:t></w:r>"
    return f"<w:r><w:t xml:space=\"preserve\">{t}</w:t></w:r>"


def row(cells: list[str], header: bool = False) -> str:
    parts = []
    for c in cells:
        parts.append(
            "<w:tc><w:tcPr><w:tcW w:w=\"1600\" w:type=\"dxa\"/></w:tcPr><w:p>"
            + cell(c, bold=header)
            + "</w:p></w:tc>"
        )
    return "<w:tr>" + "".join(parts) + "</w:tr>"


def build_document_xml() -> str:
    headers = [
        "Üst grup",
        "ID (legacy)",
        "Görünen ad",
        "Motor slug",
        "m²",
        "Ekipman bantları",
    ]
    body = [
        "<w:p><w:r><w:rPr><w:b/><w:sz w:val=\"32\"/></w:rPr>"
        f"<w:t>{esc('PFOS — Ekipman bandı tanımsız konseptler')}</w:t></w:r></w:p>",
        "<w:p><w:r><w:t xml:space=\"preserve\">"
        + esc(
            f"Oluşturma: {date.today().isoformat()} · Equsto PFOS konsept matrisi · "
            "Ekipman bantları sütununda «—» olan kayıtlar."
        )
        + "</w:t></w:r></w:p>",
        "<w:p/>",
        "<w:tbl><w:tblPr><w:tblW w:w=\"0\" w:type=\"auto\"/><w:tblBorders>"
        "<w:top w:val=\"single\" w:sz=\"4\"/><w:left w:val=\"single\" w:sz=\"4\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\"/><w:right w:val=\"single\" w:sz=\"4\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\"/><w:insideV w:val=\"single\" w:sz=\"4\"/>"
        "</w:tblBorders></w:tblPr>",
        row(headers, header=True),
    ]
    for r in ROWS:
        body.append(row(list(r)))
    body.append("</w:tbl>")
    body += [
        "<w:p/>",
        "<w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Not (kısmi tanım)</w:t></w:r></w:p>",
        "<w:tbl><w:tblPr><w:tblW w:w=\"0\" w:type=\"auto\"/><w:tblBorders>"
        "<w:top w:val=\"single\" w:sz=\"4\"/><w:left w:val=\"single\" w:sz=\"4\"/>"
        "<w:bottom w:val=\"single\" w:sz=\"4\"/><w:right w:val=\"single\" w:sz=\"4\"/>"
        "<w:insideH w:val=\"single\" w:sz=\"4\"/><w:insideV w:val=\"single\" w:sz=\"4\"/>"
        "</w:tblBorders></w:tblPr>",
        row(headers, header=True),
        row(list(NOTE_ROW)),
        "</w:tbl>",
        "<w:p/>",
        "<w:p><w:r><w:t xml:space=\"preserve\">"
        + esc(
            f"Özet: {len(ROWS)} konseptte ekipman bandı «—»; "
            "meyhane ayrıca yalnızca motor şablonu ile tanımlı."
        )
        + "</w:t></w:r></w:p>",
    ]
    return (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        "<w:body>"
        + "".join(body)
        + "<w:sectPr><w:pgSz w:w=\"11906\" w:h=\"16838\"/>"
        "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\"/></w:sectPr>"
        "</w:body></w:document>"
    )


CONTENT_TYPES = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>"""

RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

DOC_RELS = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>
"""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc_xml = build_document_xml()
    with zipfile.ZipFile(OUT, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("[Content_Types].xml", CONTENT_TYPES)
        zf.writestr("_rels/.rels", RELS)
        zf.writestr("word/_rels/document.xml.rels", DOC_RELS)
        zf.writestr("word/document.xml", doc_xml.encode("utf-8"))
    print(OUT)


if __name__ == "__main__":
    main()
