import urllib.request, json
url = 'https://equsto.com/data/dept/pisirme.json'
response = urllib.request.urlopen(url)
data = json.load(response)
r = [p for p in data if p.get('brand','').lower()=='rational']
for p in r[:3]:
    print(f'ID: {p.get("id")}')
    print(f'Slug (name): {p.get("name")}')
    print(f'SKU: {p.get("sku")}')
    print()