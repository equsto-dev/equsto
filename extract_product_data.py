import requests
from bs4 import BeautifulSoup
import re
import json

url = 'https://www.mutbex.com/atalay-15-tepsilik-tepsi-tasima-arabasi-37x53-cm-ata-3753-15'
r = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=30)

# Find PRODUCT_DATA in script
match = re.search(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', r.text, re.DOTALL)
if match:
    data_str = match.group(1)
    # Fix escaping
    data_str = data_str.replace('\\\\', '\\')
    data_str = data_str.replace('\\"', '"')
    data_str = data_str.replace('\\/', '/')
    print(data_str[:1000])
    try:
        product = json.loads(data_str)
        print('Product:', json.dumps(product, ensure_ascii=False, indent=2))
    except Exception as e:
        print('Parse error:', e)
        # Try alternative
        try:
            product = json.loads(match.group(1))
            print('Direct parse:', json.dumps(product, ensure_ascii=False, indent=2))
        except Exception as e2:
            print('Direct parse error:', e2)

# Also check HTML price elements
soup = BeautifulSoup(r.text, 'html.parser')
for elem in soup.find_all(class_=['product-current-price', 'current-price', 'product-price']):
    print(f'Class: {elem.get("class")} -> {elem.get_text(strip=True)}')