p = r"c:\D Disk\EQUSTO-CURSOR\public\index.html"
with open(p, encoding="utf-8", errors="replace") as f:
    t = f.read()
for m in ['<motion class="body"', '<div class="body"', 'hero-banner', 'right-col', 'eq-home-cm-mutbex', '</body>']:
    print(m, t.find(m))
i = t.find('<div class="body"')
print(t[i:i+500])
# count sections in eq-home-cm-mutbex
start = t.find('eq-home-cm-mutbex')
end = t.find('</div>', t.find('</main>', start))
# find main.main
mi = t.find('<main', start)
print('main at', mi, t[mi:mi+200])
