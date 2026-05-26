# -*- coding: utf-8 -*-
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
SNIP = Path(__file__).resolve().parent / "snippets"
TARGETS = [ROOT / "public" / "pfos-teklif-ui.js", ROOT / "dist" / "pfos-teklif-ui.js"]

HELPERS = (SNIP / "pfos-inoksan-helpers.js").read_text(encoding="utf-8")
BUILD_PROFORMA = (SNIP / "pfos-inoksan-build-proforma.js").read_text(encoding="utf-8")
BUILD_V10 = (SNIP / "pfos-inoksan-build-v10.js").read_text(encoding="utf-8")


def patch(path: Path) -> None:
    t = path.read_text(encoding="utf-8")
    if "INOKSAN_COLS" not in t:
        t = t.replace(
            "  var PF_FORM_NO = 'F-220 (D:01.2018)';",
            "  var PF_FORM_NO = 'F-220 (D:01.2018)';" + HELPERS,
        )
    t = re.sub(
        r"  var PF_EXCEL_HEADERS = \[.*?\];",
        """  var PF_EXCEL_HEADERS = [
    'Böl.', 'Grup', 'Poz', 'EK', 'Stok no', 'Tanımı', 'Kaynak',
    'Boy', 'En', 'Yük.', 'Adet', 'Satış', 'Toplam Satış', 'Döviz',
  ];""",
        t,
        count=1,
        flags=re.DOTALL,
    )
    t = t.replace(
        "        lines.push({ kind: 'grup', label: 'A. ' + (z.label || '') });\n        (z.rows || []).forEach",
        "        (z.rows || []).forEach",
    )
    if "function tanimBaslikPlain" not in t:
        t = t.replace(
            "  function rowNamePlain(r) {",
            (SNIP / "pfos-inoksan-tanim-plain.js").read_text(encoding="utf-8")
            + "\n  function rowNamePlain(r) {",
        )
    old_push = """      var r = ln.r;
      aoa.push([
        ln.bol,
        ln.grup,
        ln.poz,
        stokNoPlain(r),
        rowNamePlain(r),
        kaynakPlain(r),
        pfosDimMmPlain(r),
        pfosFmtKwElk(r),
        pfosFmtKwGaz(r),
        ln.adet,
        pfosFmtProformaMoney(ln.birim, cur),
        pfosFmtProformaMoney(ln.line, cur),
        curLabel(cur),
      ]);"""
    new_push = (SNIP / "pfos-inoksan-aoa-push.js").read_text(encoding="utf-8")
    if old_push in t:
        t = t.replace(old_push, new_push)
    def _proforma_repl(_m):
        return BUILD_PROFORMA + "\n\n  function buildPfosSartlarHtml"

    def _v10_repl(_m):
        return BUILD_V10 + "\n\n  function getPfosV10PrintCss"

    t = re.sub(
        r"  function buildPfosProformaTableHtml\(rows, ctx, cur\) \{.*?^  \}\n\n  function buildPfosSartlarHtml",
        _proforma_repl,
        t,
        count=1,
        flags=re.DOTALL | re.MULTILINE,
    )
    t = re.sub(
        r"  function buildPfosTeklifV10Html\(rows, amt, opts, ctx\) \{.*?^  \}\n\n  function getPfosV10PrintCss",
        _v10_repl,
        t,
        count=1,
        flags=re.DOTALL | re.MULTILINE,
    )
    path.write_text(t, encoding="utf-8")
    print("ok", path, "lines", len(t.splitlines()))


if __name__ == "__main__":
    SNIP.mkdir(exist_ok=True)
    for target in TARGETS:
        if target.is_file():
            patch(target)
