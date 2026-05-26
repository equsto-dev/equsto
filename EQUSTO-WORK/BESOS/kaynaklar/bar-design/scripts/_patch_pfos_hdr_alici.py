# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")
start = t.find('    <div class="hdr-alici">')
if start < 0:
    raise SystemExit("hdr-alici block not found")
end = t.find('    <div class="srch">', start)
if end < 0:
    raise SystemExit("srch after hdr-alici not found")
new = """    <button type="button" class="hdr-alici hdr-loc" id="pf-hdr-loc" aria-label="Teslimat adresini düzenle">
        <span class="st-label" data-i18n="common.delivery_to">Teslimat Adresi</span>
        <span class="st-val" id="pf-hdr-loc-val">İstanbul, Türkiye</span>
    </button>
"""
t = t[:start] + new + t[end:]
p.write_text(t, encoding="utf-8")
print("patched hdr-alici")
