import os
root = r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\public"
for fn in os.listdir(root):
    if not fn.endswith((".js", ".css", ".html")):
        continue
    p = os.path.join(root, fn)
    try:
        t = open(p, encoding="utf-8", errors="replace").read()
    except Exception:
        continue
    if "Servis" in t and ("Teşhir" in t or "Teshir" in t or "teşhir" in t):
        if "servis" in t.lower():
            print(fn)
