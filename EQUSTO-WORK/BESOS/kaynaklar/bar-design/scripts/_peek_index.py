import re
p = r"c:\D Disk\EQUSTO-CURSOR\public\index.html"
with open(p, encoding="utf-8", errors="replace") as f:
    t = f.read()
for m in ["eq-filter-col", "eq-sidebar", "hero eq-home-hero", "eq-mx-vitrin", "eq-home-cm-shop", "main class"]:
    print(m, t.find(m))
i = t.find('class="hero eq-home-hero-ads"')
j = t.find('<motion class="eq-home-cm', i)
if j < 0:
    j = t.find('class="eq-home-cm eq-home-cm-shop', i)
print("slice len", j - i if j > i else 0)
out = t[i : j + 1200 if j > i else i + 3500]
open(r"c:\D Disk\EQUSTO-CURSOR\bar-design\scripts\_peek_index_out.txt", "w", encoding="utf-8").write(out)
print("wrote", len(out), "chars")
