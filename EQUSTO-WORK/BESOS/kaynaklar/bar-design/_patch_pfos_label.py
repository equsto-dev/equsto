from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")
needle = "Bölüm bazlı m²</div>"
repl = 'Bölüm bazlı m² <span style="font-weight:400;color:var(--muted)">(opsiyonel)</span></motion/div>'.replace(
    "</motion/div>", "</motion/div>"
)
repl = 'Bölüm bazlı m² <span style="font-weight:400;color:var(--muted)">(opsiyonel)</span></div>'
if needle not in t:
    raise SystemExit("not found")
t = t.replace(needle, repl, 1)
p.write_text(t, encoding="utf-8")
print("ok")
