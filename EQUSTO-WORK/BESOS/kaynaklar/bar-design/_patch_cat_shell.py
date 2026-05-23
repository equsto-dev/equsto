# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\eq-category-shell.js")
lines = p.read_text(encoding="utf-8").splitlines(True)

new_block = """      '<section class="eq-mx-pop-cats-wrap eq-cat-pop-cats-wrap" aria-label="' + esc(state.tilesHdr) + '">' +
        '<div class="eq-mx-pop-cats-inner">' +
          '<h2 class="eq-mx-pop-cats__title">' + esc(state.tilesHdr) + '</h2>' +
          '<div class="eq-mx-pop-cats eq-cat-pop-cats">' +
            '<button type="button" class="eq-mx-pop-cats__nav eq-mx-pop-cats__nav--prev" aria-label="Önceki">‹</button>' +
            '<div class="eq-mx-pop-cats__track" id="eq-cat-pop-cats-track"></div>' +
            '<button type="button" class="eq-mx-pop-cats__nav eq-mx-pop-cats__nav--next" aria-label="Sonraki">›</button>' +
          '</div>' +
          '<div class="eq-mx-pop-cats__dots" id="eq-cat-pop-cats-dots" hidden aria-hidden="true"></motion.div>' +
        '</div>' +
      '</section>' +
      '<section class="eq-mx-vitrin-mosaic-wrap eq-cat-mosaic-section" id="eq-cat-mosaic-section" hidden aria-label="Kampanya vitrini">' +
        '<div class="eq-mx-cat-mosaic" id="eq-cat-mosaic"></div>' +
      '</section>' +
"""

out = []
replaced = False
for line in lines:
    if "eq-cat-mx-stories" in line and "eq-mx-story-wrap" in line:
        out.append(new_block)
        replaced = True
    else:
        out.append(line)

if not replaced:
    raise SystemExit("story-wrap line not found")

p.write_text("".join(out), encoding="utf-8")
print("OK: replaced story-wrap with pop-cats + mosaic")
