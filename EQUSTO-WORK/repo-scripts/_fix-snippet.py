from pathlib import Path
import re

p = Path(r"c:\D Disk\EQUSTO-CURSOR\scripts\snippets\pfos-inoksan-helpers.js")
t = p.read_text(encoding="utf-8")
bad = "</" + "motion" + ">"
good = "</" + "div" + ">"
t = t.replace(bad, good)
t = re.sub(r"return html\.split.*?\n  \}", "return html;\n  }", t, count=1)
p.write_text(t, encoding="utf-8")
print("done")
