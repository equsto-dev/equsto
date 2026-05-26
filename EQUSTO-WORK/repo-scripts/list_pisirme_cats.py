import json
from collections import Counter

p = r"C:\D Disk\EQUSTO-CURSOR\public\data\ekipmanlar.json"
with open(p, "r", encoding="utf-8") as f:
    d = json.load(f)
cats = [x.get("category", "") for x in d if isinstance(x, dict)]
pis = [
    c
    for c in cats
    if c
    and (
        "pisirme" in c
        or c.startswith("sanayi-")
        or c
        in (
            "kuzineler",
            "fritozler",
            "tost-makineleri",
            "pilic-cevirme-makineleri",
            "ocakbasi-izgara",
        )
    )
]
print("unique", len(set(pis)))
for k, v in Counter(pis).most_common(40):
    print(v, k)
