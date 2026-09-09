import json

with open('E-TICARET/site/public/data/dept/pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check a specific RATIONAL product
for p in data:
    if p.get('sku') == '9890.ICPRO61.0G':
        print(f"Name: {p['name']}")
        print(f"Name bytes: {p['name'].encode('utf-8')}")
        print(f"Specs: {p['specs'][:200]}")
        print(f"Specs bytes: {p['specs'][:200].encode('utf-8')}")
        break

# Check an Atalay product
for p in data:
    if p.get('sku') == 'EAEI-360':
        print(f"\nAtalay Name: {p['name']}")
        print(f"Atalay Name bytes: {p['name'].encode('utf-8')}")
        print(f"Atalay Specs: {p['specs'][:200]}")
        print(f"Atalay Specs bytes: {p['specs'][:200].encode('utf-8')}")
        break

# Check the brand field
for p in data:
    if p.get('sku') == 'EAEI-360':
        print(f"\nBrand: {p['brand']}")
        print(f"Brand bytes: {p['brand'].encode('utf-8')}")
        break