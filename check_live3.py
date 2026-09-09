import urllib.request, json
url = "https://equsto.com/data/dept/pisirme.json"
response = urllib.request.urlopen(url)
data = json.load(response)
print(f'Total products: {len(data)}')
r = [p for p in data if p.get('brand','').lower()=='rational']
print(f'RATIONAL: {len(r)}')
if r:
    for p in r[:3]:
        print(f'  - {p["name"]}: {p["fiyat_tl"]:,} TL')