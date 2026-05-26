# -*- coding: utf-8 -*-
import zipfile
import re
import xml.etree.ElementTree as ET
from pathlib import Path

path = Path(r"c:\D Disk\EQUSTO-CURSOR\notlar\teklif formatı\equsto_teklif_v10.xlsx")
out = Path(r"c:\D Disk\EQUSTO-CURSOR\scripts\teklif-v10-inspect.txt")

lines = []
with zipfile.ZipFile(path) as z:
    ss_xml = z.read("xl/sharedStrings.xml")
    root = ET.fromstring(ss_xml)
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    texts = []
    for si in root.findall(".//m:si", ns):
        parts = []
        for t in si.findall(".//m:t", ns):
            if t.text:
                parts.append(t.text)
        texts.append("".join(parts))
    lines.append("=== SHARED STRINGS (%d) ===" % len(texts))
    for i, t in enumerate(texts):
        lines.append("%d\t%s" % (i, t.replace("\n", " | ")))

    sheet = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
    # dimension
    m = re.search(r'<dimension ref="([^"]+)"', sheet)
    if m:
        lines.append("\n=== DIMENSION ===")
        lines.append(m.group(1))

    # merge cells
    merges = re.findall(r'<mergeCell ref="([^"]+)"', sheet)
    lines.append("\n=== MERGES (%d) ===" % len(merges))
    for mg in merges[:30]:
        lines.append(mg)
    if len(merges) > 30:
        lines.append("... +%d more" % (len(merges) - 30))

    # sample rows with values - parse row elements
    rows = re.findall(r"<row r=\"(\d+)\"[^>]*>(.*?)</row>", sheet, re.DOTALL)
    lines.append("\n=== ROWS WITH CELLS (first 45) ===")
    for rnum, rbody in rows[:45]:
        cells = []
        for cm in re.finditer(
            r'<c r="([A-Z]+)(\d+)"([^>]*)>(?:<v>([^<]*)</v>)?', rbody
        ):
            col, row, attrs, val = cm.group(1), cm.group(2), cm.group(3), cm.group(4) or ""
            t_attr = ""
            if 't="s"' in attrs:
                t_attr = "s"
            elif 't="str"' in attrs:
                t_attr = "str"
            if val:
                display = val
                if t_attr == "s" and val.isdigit():
                    display = texts[int(val)] if int(val) < len(texts) else val
                cells.append("%s%s=%s" % (col, row, display[:40]))
        if cells:
            lines.append("R%s: %s" % (rnum, " | ".join(cells[:12])))

    lines.append("\n=== L/M COLUMNS (formulas & values) ===")
    for cm in re.finditer(r'<c r="(L|M)(\d+)"([^>]*)>(.*?)</c>', sheet, re.DOTALL):
        col, row, attrs, body = cm.group(1), cm.group(2), cm.group(3), cm.group(4)
        f = re.search(r"<f>([^<]*)</f>", body)
        v = re.search(r"<v>([^<]*)</v>", body)
        val = ""
        if f:
            val = "F=" + f.group(1)
        elif v:
            val = "V=" + v.group(1)
            if 't="s"' in attrs and val.startswith("V=") and val[2:].isdigit():
                val = "S=" + texts[int(val[2:])]
        if val:
            lines.append("%s%s %s" % (col, row, val))

out.write_text("\n".join(lines), encoding="utf-8")
print("wrote", out)
