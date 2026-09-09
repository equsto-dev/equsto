import json
with open('equsto-v2/public/data/ekipmanlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check kombi_firinlar (Rational and Özti)
kombi = [p for p in data if p.get('category') == 'kombi-firinlar']
print(f"kombi-firinlar: {len(kombi)} products")
for p in kombi:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check konveksiyonel-firinlar
konvek = [p for p in data if p.get('category') == 'konveksiyonel-firinlar']
print(f"\nkonveksiyonel-firinlar: {len(konvek)} products")
for p in konvek:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check sanayi-ocaklari
sanayi_ocak = [p for p in data if p.get('category') == 'sanayi-ocaklari']
print(f"\nsanayi-ocaklari: {len(sanayi_ocak)} products")
for p in sanayi_ocak:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check induksiyonlu-ocaklar
induk = [p for p in data if p.get('category') == 'induksiyonlu-ocaklar']
print(f"\ninduksiyonlu-ocaklar: {len(induk)} products")
for p in induk:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check gazli-set-ustu-ocak
gazli_set = [p for p in data if p.get('category') in ['gazli-set-ustu-ocak', 'gazli-set-ustu-ocaklari', 'elektrikli-set-ustu-ocak', 'gazli-elektrikli-set-ustu-ocaklar']]
print(f"\nset-ustu-ocak (all): {len(gazli_set)} products")
for p in gazli_set:
    print(f"  {p.get('name', 'N/A')} | {p.get('category', 'N/A')} | {p.get('brand', 'N/A')}")

# Check fritozler
fritoz = [p for p in data if p.get('category') == 'fritozler']
print(f"\nfritozler: {len(fritoz)} products")
for p in fritoz[:15]:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check sanayi-tipi-izgaralar (Atalay)
izgara_atalay = [p for p in data if p.get('category') == 'sanayi-tipi-izgaralar']
print(f"\nsanayi-tipi-izgaralar: {len(izgara_atalay)} products")
for p in izgara_atalay[:10]:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check yer-izgaralari (Ozti)
yer_izgara = [p for p in data if p.get('category') == 'yer-izgaralari']
print(f"\nyer-izgaralari: {len(yer_izgara)} products")
for p in yer_izgara[:10]:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check elektrikli-kuzineler
kuzine = [p for p in data if p.get('category') in ['elektrikli-kuzineler', 'gazli-firinli-kuzine', 'gazli-firinli-kuziler', 'kuzineler', '900-seri-kuzineler']]
print(f"\nkuzineler (all): {len(kuzine)} products")
for p in kuzine:
    print(f"  {p.get('name', 'N/A')} | {p.get('category', 'N/A')} | {p.get('brand', 'N/A')}")

# Check pizza-firinlari
pizza = [p for p in data if p.get('category') in ['pizza-firinlari', 'konvoyerlu-pizza-firinlari', 'pide-lahmacun-pizza-firinlari']]
print(f"\npizza-firinlari (all): {len(pizza)} products")
for p in pizza:
    print(f"  {p.get('name', 'N/A')} | {p.get('category', 'N/A')} | {p.get('brand', 'N/A')}")

# Check benmariler
benmari = [p for p in data if p.get('category') == 'benmariler']
print(f"\nbenmariler: {len(benmari)} products")
for p in benmari:
    print(f"  {p.get('name', 'N/A')} | {p.get('brand', 'N/A')}")

# Check Rational products
rational = [p for p in data if 'rational' in p.get('category', '').lower() or 'rational' in p.get('name', '').lower()]
print(f"\nRational products: {len(rational)} products")
for p in rational:
    print(f"  {p.get('name', 'N/A')} | {p.get('category', 'N/A')} | {p.get('brand', 'N/A')}")