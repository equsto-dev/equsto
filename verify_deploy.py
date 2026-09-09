import json
data = json.load(open(r'C:\D Disk\EQUSTO-CURSOR\equsto-v2\public\data\dept\pisirme.json', encoding='utf-8'))
r = [p for p in data if p.get('brand','').lower()=='rational']
print(f'RATIONAL products: {len(r)}')
for p in r[:5]:
    print(f'  - {p["name"]}: {p["fiyat_tl"]:,} TL')