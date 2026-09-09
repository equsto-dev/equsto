import urllib.request, json
url = 'https://equsto.com/data/dept/pisirme.json'
response = urllib.request.urlopen(url)
data = json.load(response)
r = [p for p in data if p.get('brand','').lower()=='rational']
print(f'Total RATIONAL products: {len(r)}')
print()
print('iCombi Pro:')
for p in r:
    if 'iCombi Pro' in p['name']:
        print(f'  {p["name"]}: {p["fiyat_tl"]:,} TL')
print()
print('iCombi Classic:')
for p in r:
    if 'iCombi Classic' in p['name']:
        print(f'  {p["name"]}: {p["fiyat_tl"]:,} TL')
print()
print('iVario:')
for p in r:
    if 'iVario' in p['name']:
        print(f'  {p["name"]}: {p["fiyat_tl"]:,} TL')