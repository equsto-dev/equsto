"""Hampton By Hilton .xls → JSON kalemler (stdout). xlrd gerekir."""
import json
import re
import sys

try:
    import xlrd
except ImportError:
    sys.stderr.write("xlrd missing: pip install xlrd\n")
    sys.exit(1)

POZ_RE = re.compile(r"^\d{2,3}(\s+\d+)?$", re.I)


def cell_str(v):
    if v is None or v == "":
        return ""
    if isinstance(v, float) and v == int(v):
        return str(int(v))
    return str(v).strip()


def parse_adet(raw):
    if raw is None or raw == "":
        return 1
    if isinstance(raw, (int, float)):
        return max(1, int(round(float(raw))))
    n = re.sub(r"[^\d]", "", str(raw))
    return int(n) if n else 1


def parse_workbook(path):
    sh = xlrd.open_workbook(path).sheet_by_index(0)
    rows = []
    bolum = ""
    bolum_ad = ""
    for r in range(sh.nrows):
        poz = cell_str(sh.cell_value(r, 2)) if sh.ncols > 2 else ""
        ad = cell_str(sh.cell_value(r, 3)) if sh.ncols > 3 else ""
        if not ad:
            continue
        boy = cell_str(sh.cell_value(r, 4)) if sh.ncols > 4 else ""
        en = cell_str(sh.cell_value(r, 5)) if sh.ncols > 5 else ""
        h = cell_str(sh.cell_value(r, 6)) if sh.ncols > 6 else ""
        adet_raw = sh.cell_value(r, 7) if sh.ncols > 7 else ""
        marka = cell_str(sh.cell_value(r, 9)) if sh.ncols > 9 else ""

        if re.search(r"^poz|tanım|tanim", ad, re.I):
            continue
        poz_norm = poz.replace(" ", " ").strip()
        if poz in ("A", "B", "C", "D", "E", "F", "G", "H", "X") and len(ad) > 4:
            bolum_ad = ad
            bolum = poz
            continue
        if not POZ_RE.match(poz_norm) and len(ad) > 6 and not str(adet_raw).strip():
            bolum_ad = ad
            bolum = ad[:1] if ad else bolum
            continue
        if POZ_RE.match(poz_norm) and ad:
            try:
                has_adet = adet_raw != "" and float(adet_raw) > 0
            except (TypeError, ValueError):
                has_adet = False
            if not has_adet:
                continue
            olcu_parts = [x for x in [boy, en, h] if x and x not in ("0", "0.0")]
            olcu = " × ".join(olcu_parts) if olcu_parts else "—"
            parts = [ad]
            if marka:
                parts.append(f"({marka})")
            rows.append(
                {
                    "bolum": bolum,
                    "bolumAd": bolum_ad,
                    "poz": poz_norm.upper().replace("  ", " "),
                    "ad": " ".join(parts),
                    "olcu": olcu,
                    "adet": parse_adet(adet_raw),
                }
            )
    return rows


if __name__ == "__main__":
    path = sys.argv[1]
    print(json.dumps(parse_workbook(path), ensure_ascii=False))
