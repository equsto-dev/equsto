import json
import os

with open('E-TICARET/site/public/data/dept/pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check Atalay images
print("=== Sample Atalay Products ===")
atalay = [p for p in data if 'atalay' in p.get('brand', '').lower()]
for p in atalay[:5]:
    print(f"\nSKU: {p['sku']}")
    name = p['name'].encode('ascii', 'replace').decode('ascii')
    print(f"  Name: {name}")
    print(f"  fiyat_tl: {p.get('fiyat_tl', 'N/A')}")
    print(f"  images: {p.get('images', [])}")
    for img in p.get('images', []):
        full_path = os.path.join('E-TICARET/site/public', img)
        exists = os.path.exists(full_path)
        print(f"  Image exists: {exists} -> {full_path}")

# Check Electrolux
print("\n=== Sample Electrolux Products ===")
electrolux = [p for p in data if 'electrolux' in p.get('brand', '').lower()]
for p in electrolux[:5]:
    print(f"\nSKU: {p['sku']}")
    name = p['name'].encode('ascii', 'replace').decode('ascii')
    print(f"  Name: {name}")
    print(f"  fiyat_tl: {p.get('fiyat_tl', 'N/A')}")
    print(f"  images: {p.get('images', [])}")
    for img in p.get('images', []):
        full_path = os.path.join('E-TICARET/site/public', img)
        exists = os.path.exists(full_path)
        print(f"  Image exists: {exists} -> {full_path}")

# Check what rational images exist in public
print("\n=== RATIONAL images in public ===")
rational_img_dir = 'E-TICARET/site/public/images/catalog/rational'
if os.path.exists(rational_img_dir):
    for f in sorted(os.listdir(rational_img_dir)):
        print(f"  {f}")
else:
    print("  Directory not found")