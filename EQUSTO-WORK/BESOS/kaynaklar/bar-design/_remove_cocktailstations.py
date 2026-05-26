# -*- coding: utf-8 -*-
import re
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\bar-design.html")
t = p.read_text(encoding="utf-8")
orig = len(t.splitlines())

t = t.replace('  <link rel="stylesheet" href="bar-design-cocktailstations.css">\n', "")
t = t.replace('  <script src="eq-bar-design-cocktailstations.js" defer></script>\n', "")

t = re.sub(
    r"\n/\* —— Cocktail Stations · barras-moviles tasarım dili —— \*/\n.*?"
    r"      \.bd-cs-strip--left \.bd-cs-strip-copy,\.bd-cs-strip--right \.bd-cs-strip-copy\{\n"
    r"        grid-column:1;margin:0 16px clamp\(32px,6vw,48px\);padding:24px 20px;\n"
    r"        max-width:none;background:rgba\(0,0,0,.55\);\n"
    r"      \}\n"
    r"    \}\n",
    "\n",
    t,
    count=1,
    flags=re.DOTALL,
)

t = t.replace(
    '        <a href="#bd-cs-seri" data-i18n="besos.hdr_nav_yeni_seri">Yeni Seri</a>\n'
    '        <a href="#bd-cs-seri-iki" data-i18n="besos.hdr_nav_seri_iki">Seri İki</a>\n',
    "",
)

t = re.sub(
    r"\n  <!-- ============ COCKTAIL STATIONS — Yeni Seri \(kart vitrin\) ============ -->.*?"
    r"  <!-- ============ COCKTAIL STATIONS — Seri İki \(barras-moviles\) ============ -->.*?"
    r"  </section>\n\n",
    "\n",
    t,
    count=1,
    flags=re.DOTALL,
)

if "bd-cs-seri" in t or "eq-bar-design-cocktailstations" in t:
    raise SystemExit("cocktailstations remnants remain")

p.write_text(t, encoding="utf-8")
print("ok", orig, "->", len(t.splitlines()))
