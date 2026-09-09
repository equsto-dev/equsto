import urllib.request, re
url = "https://equsto.com/shop/pisirme/rational__9890-icpro61-e0"
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')
urls = re.findall(r'https?://[^\s"\'<>]+?\.(?:jpg|jpeg|png|webp|gif)', content)
for u in urls:
    if 'rational' in u.lower() or 'icpro' in u.lower():
        print(u)