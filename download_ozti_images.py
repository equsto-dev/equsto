import urllib.request, json, os

with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

r = [p for p in data if p.get('brand','').lower()=='rational']

base_url = "https://oztiryakiler.com.tr/ax-images/images/"
local_dir = r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\images\catalog\rational"
local_dir2 = r"C:\D Disk\EQUSTO-CURSOR\equsto-v2\public\images\catalog\rational"

os.makedirs(local_dir, exist_ok=True)
os.makedirs(local_dir2, exist_ok=True)

downloaded = 0
failed = 0

for p in r:
    sku = p.get('sku')
    if sku:
        url = f"{base_url}{sku}.jpg"
        
        local_path = os.path.join(local_dir, f"{sku}.jpg")
        local_path2 = os.path.join(local_dir2, f"{sku}.jpg")
        
        if os.path.exists(local_path):
            print(f"SKIP (exists): {sku}.jpg")
            continue
            
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            response = urllib.request.urlopen(req, timeout=30)
            if response.getcode() == 200:
                content = response.read()
                with open(local_path, 'wb') as f:
                    f.write(content)
                with open(local_path2, 'wb') as f:
                    f.write(content)
                print(f"DOWNLOADED: {sku}.jpg ({len(content)} bytes)")
                downloaded += 1
            else:
                print(f"FAILED {response.getcode()}: {sku}.jpg")
                failed += 1
        except Exception as e:
            print(f"ERROR: {sku}.jpg - {e}")
            failed += 1

print(f"\nDownloaded: {downloaded}, Failed: {failed}")