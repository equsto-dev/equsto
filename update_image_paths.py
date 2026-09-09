import json

with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

updated = 0
for p in data:
    if p.get('brand','').lower() == 'rational':
        sku = p.get('sku')
        if sku:
            # Update image path to use SKU-based filename
            new_images = [f"images/catalog/rational/{sku}.jpg"]
            if p.get('images') != new_images:
                p['images'] = new_images
                updated += 1

print(f"Updated {updated} RATIONAL products")

# Save
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Also update E-TICARET/site
with open(r'C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\dept\pisirme.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done!")