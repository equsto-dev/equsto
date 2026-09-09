import json
import os

with open('E-TICARET/site/public/data/dept/pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

rational = [p for p in data if p.get('brand', '').lower() == 'rational']

print("=== RATIONAL Products Details ===")
for p in rational:
    print(f"\nSKU: {p['sku']}")
    print(f"  Name: {p['name']}")
    print(f"  fiyat_tl: {p.get('fiyat_tl', 'N/A')}")
    print(f"  liste_fiyati_eur: {p.get('liste_fiyati_eur', 'N/A')}")
    print(f"  satis_eur_indirimli: {p.get('satis_eur_indirimli', 'N/A')}")
    print(f"  images: {p.get('images', [])}")
    # Check if image exists
    for img in p.get('images', []):
        full_path = os.path.join('E-TICARET/site/public', img)
        exists = os.path.exists(full_path)
        print(f"  Image exists: {exists} -> {full_path}")

# Check Atalay images
print("\n=== Sample Atalay Products ===")
atalay = [p for p in data if 'atalay' in p.get('brand', '').lower()]
for p in atalay[:3]:
    print(f"\nSKU: {p['sku']}")
    print(f"  Name: {p['name']}")
    print(f"  fiyat_tl: {p.get('fiyat_tl', 'N/A')}")
    print(f"  images: {p.get('images', [])}")
    for img in p.get('images', []):
        full_path = os.path.join('E-TICARET/site/public', img)
        exists = os.path.exists(full_path)
        print(f"  Image exists: {exists} -> {full_path}")

# Check Electrolux
print("\n=== Sample Electrolux Products ===")
electrolux = [p for p in data if 'electrolux' in p.get('brand', '').lower()]
for p in electrolux[:3]:
    print(f"\nSKU: {p['sku']}")
    print(f"  Name: {p['name']}")
    print(f"  fiyat_tl: {p.get('fiyat_tl', 'N/A')}")
    print(f"  images: {p.get('images', [])}")
    for img in p.get('images', []):
        full_path = os.path.join('E-TICARET/site/public', img)
        exists = os.path.exists(full_path)
        print(f"  Image exists: {exists} -> {full_path}")