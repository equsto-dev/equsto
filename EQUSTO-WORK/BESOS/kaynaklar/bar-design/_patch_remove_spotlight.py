from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\index.html")
t = p.read_text(encoding="utf-8")
start = t.find('        <h1 class="eq-mx-page-title">')
if start < 0:
    raise SystemExit("start not found")
end = t.find("        </section>\n      </section>", start)
if end < 0:
    raise SystemExit("end not found")
t = t[:start] + t[end:]
p.write_text(t, encoding="utf-8")
print("removed", end - start, "chars")
