import subprocess, json, sys, os

def run_git_show(commit, filepath):
    cmd = ['git', 'show', f'{commit}:{filepath}']
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=r'C:\D Disk\EQUSTO-WORK', timeout=60)
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
        has_fiyat_tl = 0
        has_price = 0
        has_equstoPage = 0
        has_images = 0
        categories = set()
        
        for p in data:
            b = p.get('brand', 'unknown')
            brands[b] = brands.get(b, 0) + 1
            sku = p.get('sku', '')
            if sku:
                if sku in skus:
                    dup_skus.add(sku)
                skus.add(sku)
            if p.get('fiyat_tl') is not None:
                has_fiyat_tl += 1
            if p.get('price') is not None:
                has_price += 1
            if p.get('equstoPage') is not None:
                has_equstoPage += 1
            if p.get('images') is not None:
                has_images += 1
            if p.get('category'):
                categories.add(p.get('category'))
        
        return {
            'total': total,
            'brands': brands,
            'unique_skus': len(skus),
            'dup_skus': list(dup_skus)[:10],
            'has_fiyat_tl': has_fiyat_tl,
            'has_price': has_price,
            'has_equstoPage': has_equstoPage,
            'has_images': has_images,
            'categories': sorted(categories)
        }
    except Exception as e:
        return {'error': str(e)}

# Check the 2026-08-28 commit (closest to 31.08)
print("=== Analyzing d53dd818 (2026-08-28) ===")
content = run_git_show('d53dd818', 'E-TICARET/site/public/data/dept/pisirme.json')
if content:
    result = analyze_json(content)
    print(json.dumps(result, ensure_ascii=False, indent=2))
else:
    print("Could not retrieve file")

# Also check current production (public folder)
print("\n=== Current production (public folder) ===")
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
result = analyze_json(json.dumps(data))
print(json.dumps(result, ensure_ascii=False, indent=2))

# Check live_pisirme.json
print("\n=== live_pisirme.json ===")
with open(r'C:\D Disk\EQUSTO-WORK\live_pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
result = analyze_json(json.dumps(data))
print(json.dumps(result, ensure_ascii=False, indent=2))