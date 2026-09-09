import json
data = json.load(open('mutbex_complete_products.json', encoding='utf-8'))
print('Total:', len(data))

atalay = [p for p in data if p['brand'] == 'Atalay']
print('Atalay:', len(atalay))

# Check the raw Atalay search products
with open('mutbex_complete_products.json', 'r', encoding='utf-8') as f:
    all_data = json.load(f)

# Check unique codes
codes = set()
for p in atalay:
    codes.add(p['code'])
print('Unique Atalay codes:', len(codes))

# Check if Atalay search had duplicates
# Let's re-run just the Atalay search and count unique
import requests
import re
from urllib.parse import quote_plus

session = requests.Session()
session.headers.update({'User-Agent': 'Mozilla/5.0'})

all_atalay = []
for page in range(1, 26):
    url = f"https://www.mutbex.com/arama?q={quote_plus('Atalay')}&page={page}"
    r = session.get(url, timeout=30)
    matches = re.findall(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', r.text, re.DOTALL)
    for match in matches:
        try:
            data_str = match.replace('\\\\', '\\').replace('\\"', '"').replace('\\/', '/')
            product = json.loads(data_str)
            all_atalay.append(product)
        except:
            pass

print(f'Total Atalay from search (with duplicates): {len(all_atalay)}')

# Unique by mutbex_id
seen = set()
unique = []
for p in all_atalay:
    key = p.get('id', '')
    if key not in seen:
        seen.add(key)
        unique.append(p)

print(f'Unique Atalay from search: {len(unique)}')

for p in unique[:20]:
    price = p.get('total_sale_price') or p.get('total_base_price') or 0
    print(f"  {p.get('code')}: {price} TL - {p.get('name')[:60]}")