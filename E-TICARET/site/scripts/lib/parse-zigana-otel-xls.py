"""Zigana resort otel .xls (Lainox ölçekli liste) → JSON kalemler (stdout). xlrd gerekir."""
import json
import re
import sys

try:
    import xlrd
except ImportError:
    sys.stderr.write("xlrd missing: pip install xlrd\n")
    sys.exit(1)

POZ_RE = re.compile(r"^\d{2,3}$")


def section_slug(name: str) -> str:
    s = re.sub(r"[^\w\s-]", "", name, flags=re.UNICODE)
    s = re.sub(r"\s+", "-", s.strip().lower())
    return (s[:48] or "bolum").strip("-")


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
    return 1


def parse_workbook(path):
    sh = xlrd.open_workbook(path).sheet_by_index(0)
    rows = []
    bolum = ""
    bolum_ad = ""
    for r in range(sh.nrows):
        poz = cell_str(sh.cell_value(r, 0)) if sh.ncols > 0 else ""
        ad = cell_str(sh.cell_value(r, 1)) if sh.ncols > 1 else ""
        if not ad and not poz:
            continue
        boy = cell_str(sh.cell_value(r, 2)) if sh.ncols > 2 else ""
        en = cell_str(sh.cell_value(r, 3)) if sh.ncols > 3 else ""
        h = cell_str(sh.cell_value(r, 4)) if sh.ncols > 4 else ""
        adet_raw = sh.cell_value(r, 5) if sh.ncols > 5 else ""

        if re.search(r"^poz|tanım|böl", ad, re.I):
            continue
        if not POZ_RE.match(poz) and len(ad) > 4:
            try:
                has_adet = adet_raw != "" and float(adet_raw) > 0
            except (TypeError, ValueError):
                has_adet = False
            if not has_adet:
                bolum_ad = ad
                bolum = section_slug(ad) or bolum
                continue
        if POZ_RE.match(poz) and ad:
            try:
                has_adet = adet_raw != "" and float(adet_raw) > 0
            except (TypeError, ValueError):
                has_adet = False
            if not has_adet:
                continue
            olcu_parts = [x for x in [boy, en, h] if x and x not in ("0", "0.0")]
            olcu = " × ".join(olcu_parts) if olcu_parts else "—"
            rows.append(
                {
                    "bolum": bolum,
                    "bolumAd": bolum_ad,
                    "poz": poz,
                    "ad": ad,
                    "olcu": olcu,
                    "adet": parse_adet(adet_raw),
                }
            )
    return rows


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    path = sys.argv[1]
    print(json.dumps(parse_workbook(path), ensure_ascii=False))
