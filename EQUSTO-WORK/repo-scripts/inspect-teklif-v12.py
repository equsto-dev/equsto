# -*- coding: utf-8 -*-
import zipfile
import re
import xml.etree.ElementTree as ET
from pathlib import Path

def inspect(path: Path) -> str:
    lines = [f"FILE: {path.name}"]
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
        sheet = z.read("xl/worksheets/sheet1.xml").decode("utf-8")
        m = re.search(r'<dimension ref="([^"]+)"', sheet)
        lines.append("DIM: " + (m.group(1) if m else "?"))
        merges = re.findall(r'<mergeCell ref="([^"]+)"', sheet)
        lines.append("MERGES: %d %s" % (len(merges), ", ".join(merges[:20])))
        rows = re.findall(r'<row r="(\d+)"[^>]*>(.*?)</row>', sheet, re.DOTALL)
        for rnum, rbody in rows[:30]:
            cells = []
            for cm in re.finditer(
                r'<c r="([A-Z]+)(\d+)"([^>]*)>(?:<v>([^<]*)</v>)?', rbody
            ):
                col, row, attrs, val = cm.group(1), cm.group(2), cm.group(3), cm.group(4) or ""
                if val:
                    display = val
                    if 't="s"' in attrs and val.isdigit():
                        display = texts[int(val)] if int(val) < len(texts) else val
                    cells.append("%s%s=%s" % (col, row, display[:50]))
            if cells:
                lines.append("R%s: %s" % (rnum, " | ".join(cells[:14])))
        for cm in re.finditer(r'<c r="(L|M)(\d+)"([^>]*)>(.*?)</c>', sheet, re.DOTALL):
            col, row, attrs, body = cm.group(1), cm.group(2), cm.group(3), cm.group(4)
            f = re.search(r"<f>([^<]*)</f>", body)
            v = re.search(r"<v>([^<]*)</v>", body)
            if f or v:
                lines.append(
                    "%s%s %s" % (col, row, ("F=" + f.group(1)) if f else ("V=" + v.group(1)))
                )
    return "\n".join(lines)


out = Path(__file__).resolve().parent / "teklif-v12-inspect.txt"
parts = []
for name in ("equsto_teklif_v10.xlsx", "equsto_teklif_v12.xlsx"):
    p = Path(r"c:\D Disk\EQUSTO-CURSOR\arşiv\notlar\teklif formatı") / name
    if p.exists():
        parts.append(inspect(p))
        parts.append("---")
    else:
        parts.append("MISSING " + str(p))
out.write_text("\n".join(parts), encoding="utf-8")
print("wrote", out)
