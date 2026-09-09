import json
data = json.load(open('mutbex_fast_products.json', encoding='utf-8'))
print('Total:', len(data))

atalay = [p for p in data if p['brand'] == 'Atalay']
print('Atalay:', len(atalay))

with_price = [p for p in data if p['price_vat_included'] > 0]
print('With price:', len(with_price))

for p in atalay[:10]:
    print(f"  {p['code']}: {p['price_vat_included']} TL - {p['name'][:60]}")

brands = {}
for p in data:
    b = p['brand']
    brands[b] = brands.get(b, 0) + 1
print('Brands:', brands)