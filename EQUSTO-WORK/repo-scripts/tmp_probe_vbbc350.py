import re
import ssl
import urllib.request

ctx = ssl._create_unverified_context()
UA = {"User-Agent": "Mozilla/5.0"}
for site, q in [
    ("https://www.cafemarkt.com/?s=VBBC-350S", "cafemarkt"),
    ("https://www.globalmutfak.com/?s=VBBC-350", "globalmutfak"),
    ("https://www.kariyermutfak.com/?s=Vosco+Bar+Arkası+350", "kariyer"),
]:
    try:
        h = urllib.request.urlopen(
            urllib.request.Request(site, headers=UA), context=ctx, timeout=45
        ).read().decode("utf-8", "ignore")
        buyuk = re.findall(r"urunresimleri/buyuk/[^\"'\s<>]+", h, re.I)
        print(q, "len", len(h), "buyuk", len(buyuk))
        for b in buyuk[:3]:
            if "vbbc" in b.lower() or "350" in b or "vosco" in b.lower() or "bar" in b.lower():
                print(" ", b[-60:])
    except Exception as e:
        print(q, e)
