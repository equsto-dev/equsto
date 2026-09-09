import urllib.request, json

# Load the product data to get the SKUs
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

r = [p for p in data if p.get('brand','').lower()=='rational']

base_url = "https://oztiryakiler.com.tr/ax-images/images/"

found = 0
missing = 0

for p in r:
    sku = p.get('sku')
    if sku:
        url = f"{base_url}{sku}.jpg"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=10)
            if response.getcode() == 200:
                print(f"FOUND: {sku}.jpg")
                found += 1
            else:
                print(f"MISSING: {sku}.jpg - HTTP {response.getcode()}")
                missing += 1
        except Exception as e:
            print(f"MISSING: {sku}.jpg - {e}")
            missing += 1

print(f"\nFound: {found}, Missing: {missing}")