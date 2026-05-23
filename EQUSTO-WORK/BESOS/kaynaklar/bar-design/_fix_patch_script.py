from pathlib import Path
p = Path(r"c:\D Disk\EQUSTO-CURSOR\bar-design\_pfos_html_safe_patch.py")
s = p.read_text(encoding="utf-8")
d = "div"
s = s.replace("</motion/div>", "</" + d + ">")
s = s.replace("<motion/div", "<" + d)
s = s.replace("'<DIV class=\"pfos-chat-bubble\">'", "'<" + d + " class=\"pfos-chat-bubble\">'")
s = s.replace("'</DIV></DIV>'", "'</" + d + "></" + d + ">'")
s = s.replace(".*?</motion/div>\\s*</div>", ".*?</" + d + ">\\s*</" + d + ">")
p.write_text(s, encoding="utf-8")
print("fixed")
