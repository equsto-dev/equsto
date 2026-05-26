from pathlib import Path

for rel in ("public/nav.js", "public/contact.js"):
    p = Path(__file__).resolve().parents[1] / rel
    t = p.read_text(encoding="utf-8")
    n = t.replace('createElement("motion")', 'createElement("div")')
    if n == t:
        print(rel, "no change")
    else:
        p.write_text(n, encoding="utf-8", newline="\n")
        print(rel, "fixed")
