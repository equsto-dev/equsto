with open('E-TICARET/site/public/data/dept/pisirme.json', 'rb') as f:
    data = f.read()

# Find 'Gazlı' 
idx = data.find(b'Gazl')
if idx >= 0:
    print(f'Gazl at {idx}: {data[idx:idx+20]}')
    for i, b in enumerate(data[idx:idx+20]):
        ch = chr(b) if 32 <= b < 127 else '?'
        print(f'  {idx+i}: 0x{b:02x} ({ch})')

# Find 'Basınçlı'
idx2 = data.find(b'Bas')
if idx2 >= 0:
    print(f'Bas at {idx2}: {data[idx2:idx2+30]}')
    for i, b in enumerate(data[idx2:idx2+30]):
        ch = chr(b) if 32 <= b < 127 else '?'
        print(f'  {idx2+i}: 0x{b:02x} ({ch})')

# Check all occurrences of 0xe2 0x94 0xbc (┼)
print("\n=== All ┼ (0xe2 0x94 0xbc) occurrences ===")
for i in range(len(data) - 3):
    if data[i:i+3] == b'\xe2\x94\xbc':
        context = data[max(0,i-10):i+10]
        print(f'  at {i}: ...{context}...')

# Check all occurrences of 0xc5 0x9f (ş)
print("\n=== All ş (0xc5 0x9f) occurrences ===")
count = 0
for i in range(len(data) - 2):
    if data[i:i+2] == b'\xc5\x9f':
        count += 1
        if count <= 10:
            context = data[max(0,i-10):i+10]
            print(f'  at {i}: ...{context}...')
print(f'Total ş: {count}')

# Check all occurrences of 0xc4 0xb1 (ı)
print("\n=== All ı (0xc4 0xb1) occurrences ===")
count = 0
for i in range(len(data) - 2):
    if data[i:i+2] == b'\xc4\xb1':
        count += 1
        if count <= 10:
            context = data[max(0,i-10):i+10]
            print(f'  at {i}: ...{context}...')
print(f'Total ı: {count}')

# Check all occurrences of 0xc3 0xbc (ü)
print("\n=== All ü (0xc3 0xbc) occurrences ===")
count = 0
for i in range(len(data) - 2):
    if data[i:i+2] == b'\xc3\xbc':
        count += 1
        if count <= 10:
            context = data[max(0,i-10):i+10]
            print(f'  at {i}: ...{context}...')
print(f'Total ü: {count}')