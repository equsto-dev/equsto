import json

with open('E-TICARET/site/public/data/dept/pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print(f'Total products: {len(data)}')
rational = [p for p in data if p.get('brand', '').lower() == 'rational']
print(f'RATIONAL products: {len(rational)}')
atalay = [p for p in data if 'atalay' in p.get('brand', '').lower()]
print(f'Atalay products: {len(atalay)}')
electrolux = [p for p in data if 'electrolux' in p.get('brand', '').lower()]
print(f'Electrolux products: {len(electrolux)}')

for p in rational[:5]:
    print(f'  {p["sku"]}: {p["name"]} - images: {p.get("images", [])}')

# Check Turkish characters
for p in rational:
    name = p.get('name', '')
    for char in ['Ö', 'İ', 'Ş', 'Ğ', 'Ü', 'Ç', 'ı']:
        if char in name:
            print(f'  Turkish char {char} in: {name}')

# Check all products for Turkish chars
turkish_chars = set()
for p in data:
    name = p.get('name', '')
    for c in name:
        if c in 'ÖİŞĞÜÇöişğüçı':
            turkish_chars.add(c)
print(f'Turkish chars found in catalog: {sorted(turkish_chars)}')

# Check for corrupted chars
corrupted = set()
for p in data:
    name = p.get('name', '')
    for c in name:
        if c in '��������':  # replacement chars or box drawing
            corrupted.add(c)
print(f'Corrupted chars found: {corrupted}')