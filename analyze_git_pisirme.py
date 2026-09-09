import subprocess, json, sys

def run_git_show(commit, filepath):
    cmd = ['git', 'show', f'{commit}:{filepath}']
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=r'C:\D Disk\EQUSTO-WORK')
    if result.returncode != 0:
        return None
    return result.stdout

def analyze_json(json_str):
    try:
        data = json.loads(json_str)
        total = len(data)
        brands = {}
        skus = set()
        dup_skus = set()
        for p in data:
            b = p.get('brand', 'unknown')
            brands[b] = brands.get(b, 0) + 1
            sku = p.get('sku', '')
            if sku:
                if sku in skus:
                    dup_skus.add(sku)
                skus.add(sku)
        price_fields = set()
        image_fields = set()
        has_equsto_page = 0
        categories = set()
        for p in data[:10]:  # sample
            for k, v in p.items():
                if 'price' in k.lower() or 'fiyat' in k.lower():
                    price_fields.add(k)
                if 'image' in k.lower() or 'img' in k.lower():
                    image_fields.add(k)
                if k == 'equstoPage':
                    has_equsto_page += 1
                if 'category' in k.lower() or 'cat' in k.lower():
                    categories.add(k)
        return {
            'total': total,
            'brands': brands,
            'unique_skus': len(skus),
            'dup_skus': list(dup_skus)[:5],
            'price_fields': price_fields,
            'image_fields': image_fields,
            'has_equsto_page': has_equsto_page,
            'categories': categories
        }
    except Exception as e:
        return {'error': str(e)}

# Check commits around 31.08 and nearby
commits = [
    ('d53dd818', '2026-08-28 fix(kur): /api/kur route restore'),
    ('b794394f', '2026-09-01 fix: update 7864.N1.80703.70 price'),
    ('b4d3c637', '2026-09-02 Cafemarkt fiyat eşitleme'),
    ('b4c11c34', '2026-09-02 RATIONAL ürün kataloğu'),
    ('bac71031', '2026-09-02 RATIONAL görselleri'),
]

for commit, desc in commits:
    print(f"\n=== {commit} ({desc}) ===")
    content = run_git_show(commit, 'E-TICARET/site/public/data/dept/pisirme.json')
    if content:
        result = analyze_json(content)
        if 'error' in result:
            print(f"Error: {result['error']}")
        else:
            print(f"Total products: {result['total']}")
            print(f"Unique SKUs: {result['unique_skus']}")
            print(f"Dup SKUs: {result['dup_skus']}")
            print(f"Brands: {result['brands']}")
            print(f"Price fields: {result['price_fields']}")
            print(f"Image fields: {result['image_fields']}")
            print(f"Has equstoPage: {result['has_equsto_page']}")
            print(f"Categories: {result['categories']}")
    else:
        print("File not found in this commit")