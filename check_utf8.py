with open('E-TICARET/site/public/data/dept/pisirme.json', 'rb') as f:
    data = f.read()

# Search for U+FFFD (replacement character) = 0xEF 0xBF 0xBD
print("=== Searching for U+FFFD (replacement char) ===")
count = 0
for i in range(len(data) - 3):
    if data[i:i+3] == b'\xef\xbf\xbd':
        count += 1
        if count <= 5:
            context = data[max(0,i-20):i+20]
            print(f'  at {i}: ...{context}...')
print(f'Total U+FFFD: {count}')

# Search for box drawing chars that might be corruption
# ┼ = 0xE2 0x94 0xBC
print("\n=== Searching for ┼ (0xE2 0x94 0xBC) ===")
count = 0
for i in range(len(data) - 3):
    if data[i:i+3] == b'\xe2\x94\xbc':
        count += 1
        if count <= 5:
            context = data[max(0,i-20):i+20]
            print(f'  at {i}: ...{context}...')
print(f'Total ┼: {count}')

# Check if the file is actually valid UTF-8
print("\n=== Validating UTF-8 ===")
try:
    text = data.decode('utf-8')
    print("File is valid UTF-8")
    # Count Turkish chars in decoded text
    turkish = set()
    for c in text:
        if c in 'ÖİŞĞÜÇöişğüçı':
            turkish.add(c)
    print(f"Turkish chars in decoded text: {sorted(turkish)}")
except UnicodeDecodeError as e:
    print(f"UTF-8 decode error: {e}")

# Check the RATIONAL product names specifically
print("\n=== RATIONAL product name analysis ===")
import json
with open('E-TICARET/site/public/data/dept/pisirme.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

rational = [p for p in data if p.get('brand', '').lower() == 'rational']
for p in rational:
    name = p['name']
    # Check each char
    for i, c in enumerate(name):
        if ord(c) > 127:
            print(f"  {p['sku']}: char {i} = '{c}' (U+{ord(c):04X})")