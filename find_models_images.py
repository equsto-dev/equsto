import urllib.request, re, ssl

ssl._create_default_https_context = ssl._create_unverified_context

url = 'https://www.rational-online.com/en_us/icombi-pro/models/'
response = urllib.request.urlopen(url)
content = response.read().decode('utf-8')

# Find all image URLs
urls = re.findall(r'https?://[^\s"\'<>]+?\.(?:jpg|jpeg|png|webp)', content)
for u in urls:
    print(u)