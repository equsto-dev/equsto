import urllib.request, re
url = "https://equsto.com/shop/pisirme/rational__9890-icpro61-e0"
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')
imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
for u in imgs:
    if 'rational' in u.lower() or 'icpro' in u.lower() or 'cloudfront' in u.lower():
        print(u)