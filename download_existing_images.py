import urllib.request, json, os

# Load the product data to get the image filenames
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

r = [p for p in data if p.get('brand','').lower()=='rational']

base_url = "https://dqb0g8etbedva.cloudfront.net"
local_dir = r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\images\catalog\rational"
local_dir2 = r"C:\D Disk\EQUSTO-CURSOR\equsto-v2\public\images\catalog\rational"

os.makedirs(local_dir, exist_ok=True)
os.makedirs(local_dir2, exist_ok=True)

downloaded = 0
failed = 0

for p in r:
    if p.get('images') and len(p['images']) > 0:
        img = p['images'][0]
        filename = img.split('/')[-1]
        url = f"{base_url}/{img}"
        
        local_path = os.path.join(local_dir, filename)
        local_path2 = os.path.join(local_dir2, filename)
        
        if os.path.exists(local_path):
            print(f"SKIP (exists): {filename}")
            continue
            
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                if response.getcode() == 200:
                    content = response.read()
                    with open(local_path, 'wb') as f:
                        f.write(content)
                    with open(local_path2, 'wb') as f:
                        f.write(content)
                    print(f"DOWNLOADED: {filename} ({len(content)} bytes)")
                    downloaded += 1
                else:
                    print(f"FAILED {response.getcode()}: {filename}")
                    failed += 1
        except Exception as e:
            print(f"ERROR: {filename} - {e}")
            failed += 1

print(f"\nDownloaded: {downloaded}, Failed: {failed}")