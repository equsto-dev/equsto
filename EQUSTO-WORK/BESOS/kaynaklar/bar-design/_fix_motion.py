from pathlib import Path
p = Path(r"c:\D Disk\EQUSTO-CURSOR\public\eq-category-catalog.js")
t = p.read_text(encoding="utf-8")
t = t.replace("'motion.div'", "'motion.div'")
bad_close = "</" + "motion" + "." + "div>"
good_close = "</" + "motion.div>"
p.write_text(t, encoding="utf-8")
