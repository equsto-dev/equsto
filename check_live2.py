import json
with open(r'C:\D Disk\EQUSTO-WORK\live_pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
r = [p for p in data if p.get('brand','').lower()=='rational']
print(f'RATIONAL products in live: {len(r)}')
if r:
    for p in r[:3]:
        print(f'  - {p["name"]}: {p["fiyat_tl"]:,} TL')
else:
    print('No RATIONAL products found')