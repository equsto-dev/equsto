import urllib.request, re, ssl

# Bypass SSL verification
ssl._create_default_https_context = ssl._create_unverified_context

url = 'https://www.rational-online.com/en_us/icombi-pro/'
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')

# Find image URLs
urls = re.findall(r'https?://[^\s"\'<>]+?\.(?:jpg|jpeg|png|webp)', content)
for u in urls[:20]:
    if 'rational' in u.lower() or 'icombi' in u.lower() or 'media' in u.lower() or 'product' in u.lower():
        print(u)