from pathlib import Path

root = Path(r"c:/D Disk/EQUSTO-CURSOR/public")
old = 'createElement("motion")'
new = 'createElement("div")'
for name in ("nav.js", "contact.js"):
    p = root / name
    t = p.read_text(encoding="utf-8")
    n = t.replace(old, new)
    p.write_text(n, encoding="utf-8", newline="\n")
    print(name, "fixed" if n != t else "skip")
