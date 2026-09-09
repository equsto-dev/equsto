import urllib.request

# Test CloudFront URLs for all RATIONAL products
import json
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

r = [p for p in data if p.get('brand','').lower()=='rational']

base = "https://dqb0g8etbedva.cloudfront.net"

for p in r:
    if p.get('images') and len(p['images']) > 0:
        img = p['images'][0]
        # Extract filename
        filename = img.split('/')[-1]
        cdn_url = f"{base}/{img}"
        try:
            req = urllib.request.Request(cdn_url, method='HEAD')
            resp = urllib.request.urlopen(req, timeout=10)
            status = resp.getcode()
            ct = resp.headers.get('Content-Type', '')
            cl = resp.headers.get('Content-Length', '')
            print(f"OK {status} | {p['name'][:50]} | {filename} | {ct} | {cl} bytes")
        except Exception as e:
            print(f"FAIL | {p['name'][:50]} | {filename} | {e}")