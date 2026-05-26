p = r"c:\D Disk\EQUSTO-CURSOR\public\index.html"
with open(p, encoding="utf-8", errors="replace") as f:
    t = f.read()
i = t.find('<motion class="body"')
if i < 0:
    i = t.find('<motion.div class="body"')
if i < 0:
    i = t.find('<div class="body"')
print("body tag at", i)
print(repr(t[i : i + 120]))
