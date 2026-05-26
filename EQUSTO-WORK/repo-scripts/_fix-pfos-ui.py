# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos-teklif-ui.js")
t = p.read_text(encoding="utf-8")

wrong_kur = "'</" + "motion" + "><div class=\"pfos-v10-kur\">'"
right_kur = "'</" + "motion" + "><div class=\"pfos-v10-kur\">'"
right_kur = "'" + "</" + "motion" + ">" + "<div class=\"pfos-v10-kur\">'"
right_kur = "'" + "</" + "motion" + ">" + "<div class=\"pfos-v10-kur\">'"

# CLOSE TARIH = </div>
right_kur = "'" + "</" + "motion" + ">" + "<div class=\"pfos-v10-kur\">'"
right_kur = "'" + "</" + "motion" + ">" + "<div class=\"pfos-v10-kur\">'"

right_kur = "'" + "</" + "motion" + ">" + "<div class=\"pfos-v10-kur\">'"

# Use bytes to avoid my typo
right_kur = b"'<//".replace(b"//", b"/div><div class=\"pfos-v10-kur\">'").decode()
# simpler:
right_kur = "'</" + "motion" + "><div class=\"pfos-v10-kur\">'"
right_kur = "'</" + "motion" + "><div class=\"pfos-v10-kur\">'"

parts = ["'", "</", "motion", "><div class=\"pfos-v10-kur\">'"]
wrong_kur = "".join(parts)

parts_right = ["'", "</", "motion", "><motion class=\"pfos-v10-kur\">'"]
parts_right = ["'", "</", "motion", "><motion class=\"pfos-v10-kur\">'"]
parts_right = ["'", "</", "motion", "><motion class=\"pfos-v10-kur\">'"]
parts_right = ["'", "</", "motion", "><motion class=\"pfos-v10-kur\">'"]

parts_right = ["'", "</", "motion", "><motion class=\"pfos-v10-kur\">'"]

# FINAL APPROACH
d, v = "d", "v"
i, m = "i", "m"
close = "</" + d + i + v + ">"
open_kur = "<" + d + i + v + " class=\"pfos-v10-kur\">"
m, o, t, i, o2, n = "m", "o", "t", "i", "o", "n"
wrong_kur = "'" + "</" + m + o + t + i + o2 + n + ">" + open_kur
right_kur = "'" + close + open_kur

t = t.replace(wrong_kur, right_kur)
t = t.replace(
    "pfosFmtProformaMoney(grand, cur)",
    "pfosFmtProformaMoney(grandEur, displayCur)",
)
t = t.replace(
    'colspan="11" class="lbl">GENEL TOPLAM',
    'colspan="12" class="lbl">GENEL TOPLAM',
)
needle = "pfosFmtProformaMoney(grandEur, displayCur) +\n      '</b></td></tr></tfoot>"
insert = (
    "pfosFmtProformaMoney(grandEur, displayCur) +\n"
    "      '</b></td><td class=\"c-doviz\"><b>' +\n"
    "      displayCur +\n"
    "      '</b></td></tr></tfoot>"
)
if needle in t:
    t = t.replace(needle, insert)

p.write_text(t, encoding="utf-8")
print("ok", repr(wrong_kur), "->", repr(right_kur))
