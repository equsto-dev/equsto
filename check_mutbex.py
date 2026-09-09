import json
data = json.load(open('mutbex_all_products.json', encoding='utf-8'))
print('Total:', len(data))
brands = {}
for p in data:
    b = p.get('brand', '')
    brands[b] = brands.get(b, 0) + 1
print('Brands:', brands)

atalay = [p for p in data if 'Atalay' in p.get('brand', '') or 'atalay' in p.get('model', '').lower()]
print('Atalay products:', len(atalay))

with_price = [p for p in data if p.get('current_price')]
print('Products with price:', len(with_price))

for p in atalay[:5]:
    name = p.get('name', '')
    print(f"  {p.get('model')}: {p.get('current_price')} TL - {name[:60]}")