from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

k_start = t.index("    <!-- 05 Kategoriler -->")
k_end = t.index("    <!-- Franchise -->")
kat_block = t[k_start:k_end]
t = t[:k_start] + t[k_end:]

ins = t.index("    <!-- 07 Teklif Özeti -->")
kat_block = kat_block.replace("<!-- 05 Kategoriler -->", "<!-- 06 Kategoriler -->", 1)
kat_block = kat_block.replace("sec-num\">05", "sec-num\">06", 1)

t = t[:ins] + kat_block + t[ins:]

t = t.replace("<!-- 06 Dükkan Türü -->", "<!-- 05 Dükkan Türü -->", 1)
# only the s4 section header number
idx = t.index('id="s4"')
chunk = t[idx : idx + 200]
chunk = chunk.replace("sec-num\">06", "sec-num\">05", 1)
t = t[:idx] + chunk + t[idx + 200 :]

p.write_text(t, encoding="utf-8")
print("ok")
