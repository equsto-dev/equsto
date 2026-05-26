from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")
k_start = t.index("    <!-- 04 Kategoriler -->")
k_end = t.index("    <!-- 05 Konsept -->")
kon_end = t.index("    <!-- Franchise -->")
k_block = t[k_start:k_end]
kon_block = t[k_end:kon_end]
k_block = k_block.replace("<!-- 04 Kategoriler -->", "<!-- 05 Kategoriler -->", 1)
k_block = k_block.replace("sec-num\">04", "sec-num\">05", 1)
kon_block = kon_block.replace("<!-- 05 Konsept -->", "<!-- 04 Konsept -->", 1)
kon_block = kon_block.replace("sec-num\">05", "sec-num\">04", 1)
t2 = t[:k_start] + kon_block + k_block + t[kon_end:]
p.write_text(t2, encoding="utf-8")
print(t2[k_start : k_start + 100])
