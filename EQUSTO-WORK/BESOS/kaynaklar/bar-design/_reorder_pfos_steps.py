#!/usr/bin/env python3
"""PFOS: s5 (m²) bloğunu s2 sonrasına taşı, adım numaralarını güncelle."""
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\pfos.html")
t = p.read_text(encoding="utf-8")

start = t.index("    <!-- 05 Toplam Alan (m²) -->")
end = t.index("    <!-- 06 Teklif Özeti -->")
s5_block = t[start:end]
t = t[:start] + t[end:]

s5_block = s5_block.replace("<!-- 05 Toplam Alan", "<!-- 03 Toplam Alan", 1)
s5_block = s5_block.replace('<motion/div class="sec-num">05</div>', '<div class="sec-num">03</div>', 1)
s5_block = s5_block.replace('class="sec-num">05</div>', 'class="sec-num">03</motion/div>', 1)
# yalnızca ilk 05 -> 03 (sec-num)
s5_block = s5_block.replace('class="sec-num">05</div>', 'class="sec-num">03</div>', 1)

marker = "    <!-- 03 Konsept -->"
idx = t.index(marker)
t = t[:idx] + s5_block + t[idx:]

t = t.replace(marker, "    <!-- 04 Konsept -->", 1)
t = t.replace(
    'id="s3">\n      <div class="sec-hd">\n        <div class="sec-num">03</div>',
    'id="s3">\n      <div class="sec-hd">\n        <div class="sec-num">04</div>',
    1,
)
t = t.replace("    <!-- 04 Dükkan Türü -->", "    <!-- 05 Dükkan Türü -->", 1)
t = t.replace(
    'id="s4">\n      <div class="sec-hd">\n        <div class="sec-num">04</div>',
    'id="s4">\n      <div class="sec-hd">\n        <div class="sec-num">05</div>',
    1,
)
t = t.replace(
    "Önce toplam alan (m²) seçin; ardından teklifi oluşturun veya detaylandırın.",
    "Teklifi oluşturun veya detaylandırın; gerekirse özette m² değerini güncelleyebilirsiniz.",
    1,
)

p.write_text(t, encoding="utf-8")
print("pfos.html reordered")
