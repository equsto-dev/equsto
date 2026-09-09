with open('E-TICARET/site/public/data/dept/pisirme.json', 'rb') as f:
    data = f.read(2000)

# Find 'Gazlı' which should be at position after 'Gazl'
idx = data.find(b'Gazl')
if idx >= 0:
    print(f'Gazl at {idx}: {data[idx:idx+20]}')
    for i, b in enumerate(data[idx:idx+20]):
        ch = chr(b) if 32 <= b < 127 else '?'
        print(f'  {idx+i}: 0x{b:02x} ({ch})')

# Find 'Endüstriyel'
idx2 = data.find(b'End')
if idx2 >= 0:
    print(f'End at {idx2}: {data[idx2:idx2+40]}')
    for i, b in enumerate(data[idx2:idx2+40]):
        ch = chr(b) if 32 <= b < 127 else '?'
        print(f'  {idx2+i}: 0x{b:02x} ({ch})')

# Find 'Pişirme'
idx3 = data.find(b'Pi')
if idx3 >= 0:
    print(f'Pi at {idx3}: {data[idx3:idx3+40]}')
    for i, b in enumerate(data[idx3:idx3+40]):
        ch = chr(b) if 32 <= b < 127 else '?'
        print(f'  {idx3+i}: 0x{b:02x} ({ch})')