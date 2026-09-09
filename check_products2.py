import json
with open('equsto-v2/public/data/ekipmanlar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Group by category for pisirme
pisirme_products = [p for p in data if p.get('dept') == 'pisirme']
categories = {}
for p in pisirme_products:
    cat = p.get('category', 'N/A')
    if cat not in categories:
        categories[cat] = []
    categories[cat].append(p)

print("Categories in pisirme:")
for cat, products in sorted(categories.items()):
    brands = set(p.get('brand', 'N/A') for p in products)
    print(f"  {cat}: {len(products)} products, brands: {brands}")

# Also check brands
brands = {}
for p in pisirme_products:
    b = p.get('brand', 'N/A')
    if b not in brands:
        brands[b] = []
    brands[b].append(p)

print("\nBrands in pisirme:")
for b, products in sorted(brands.items()):
    cats = set(p.get('category', 'N/A') for p in products)
    print(f"  {b}: {len(products)} products, categories: {cats}")