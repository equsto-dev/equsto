import requests
import re
import json

url = 'https://www.mutbex.com/arama?q=Atalay&page=1'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)

# Find all PRODUCT_DATA
matches = re.findall(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', r.text, re.DOTALL)
print(f'Found {len(matches)} products on page 1')

for i, match in enumerate(matches[:3]):
    try:
        data_str = match.replace('\\\\', '\\').replace('\\"', '"').replace('\\/', '/')
        product = json.loads(data_str)
        print(f'  {i}: {product["name"][:60]} - {product["total_price"]} TL - {product["code"]} - available: {product["available"]}')
    except Exception as e:
        print(f'  {i}: Parse error: {e}')