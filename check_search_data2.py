import requests
import re
import json

url = 'https://www.mutbex.com/arama?q=Atalay&page=1'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)

# Find all PRODUCT_DATA
matches = re.findall(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', r.text, re.DOTALL)
print(f'Found {len(matches)} products on page 1')

for i, match in enumerate(matches[:3]):
    print(f'--- Match {i} ---')
    print(match[:500])
    print()