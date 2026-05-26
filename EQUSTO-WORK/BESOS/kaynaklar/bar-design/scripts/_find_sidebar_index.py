p = r"c:\D Disk\EQUSTO-CURSOR\public\index.html"
with open(p, encoding="utf-8", errors="replace") as f:
    t = f.read()
# find all sidebar-related in body region
i = t.find('<div class="body"')
j = t.find('</div>', t.find('<footer', i))
chunk = t[i:min(i+15000, len(t))]
for needle in ['sidebar', 'eq-sidebar', 'eq-filter', 'cat-', 'filterCat', 'left']:
    print(needle, chunk.count(needle))
