import json
with open('equsto-v2/public/data/ekipmanlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
pisirme_products = [p for p in data if p.get('dept') == 'pisirme']
print(f'Total products: {len(data)}')
print(f'Pisirme products: {len(pisirme_products)}')
for p in pisirme_products[:30]:
    print(f"  {p.get('name', 'N/A')} | {p.get('category', 'N/A')} | {p.get('brand', 'N/A')}")