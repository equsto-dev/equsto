import urllib.request, re
url = "https://equsto.com/shop/pisirme/rational__9890-icpro61-e0"
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')
# Find all img src
imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', content)
for u in imgs:
    print(u)