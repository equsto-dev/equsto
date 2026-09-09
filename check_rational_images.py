import json
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
r = [p for p in data if p.get('brand','').lower()=='rational']
for p in r[:5]:
    print(f'{p["name"]}: images={p.get("images")}')