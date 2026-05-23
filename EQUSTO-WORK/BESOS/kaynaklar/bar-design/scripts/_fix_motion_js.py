from pathlib import Path
import re

paths = [
    Path(r"c:\D Disk\EQUSTO-CURSOR\public\eq-bar-design-cocktailstations.js"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\dist\eq-bar-design-cocktailstations.js"),
    Path(r"c:\D Disk\EQUSTO-CURSOR\bar-design\EQUSTO-BAR-DESIGN-PAKET\eq-bar-design-cocktailstations.js"),
]
for p in paths:
    if not p.exists():
        continue
    lines = p.read_text(encoding="utf-8").splitlines(keepends=True)
    out = []
    skip_until = -1
    i = 0
    while i < len(lines):
        if i < skip_until:
            i += 1
            continue
        line = lines[i]
        if "root.innerHTML = root.innerHTML" in line:
            j = i + 1
            while j < len(lines) and ".replace(" in lines[j]:
                j += 1
            i = j
            continue
        if re.match(r"\s*\)\s*$", line.rstrip()) and i + 1 < len(lines) and lines[i + 1].strip().startswith(".replace("):
            out.append("    );\n" if line.strip() == ")" else line.replace(")", ");", 1))
            j = i + 1
            while j < len(lines) and ".replace(" in lines[j]:
                j += 1
            i = j
            continue
        if line.strip().startswith(".replace(") and "motion" in line:
            i += 1
            continue
        if 'el.innerHTML = el.innerHTML.replace' in line:
            i += 1
            continue
        out.append(line.replace('"</motion>";', '"</motion>";'))
        i += 1
    text = "".join(out)
    text = text.replace("<motion ", "<div ")
    text = text.replace("</motion>", "</div>")
    p.write_text(text, encoding="utf-8")
    print("ok", p.name, "motion=", "<motion" in text)
