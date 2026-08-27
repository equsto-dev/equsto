import json
import shutil
from pathlib import Path

sogutma = Path(r"c:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\dept\sogutma.json")
brema = Path(r"c:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\dept\sogutma_brema_items.json")
backup = sogutma.with_suffix(sogutma.suffix + '.bak')

shutil.copyfile(sogutma, backup)
print(f"Backup written to: {backup}")

with sogutma.open('r', encoding='utf-8') as f:
    src_data = json.load(f)

import re

with brema.open('r', encoding='utf-8') as f:
    raw = f.read()
    # remove control characters except for common whitespace (\t,\n,\r)
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', raw)
    brema_items = json.loads(cleaned)

if not isinstance(src_data, list):
    print('ERROR: sogutma.json root is not a JSON array')
    raise SystemExit(1)

if not isinstance(brema_items, list):
    print('ERROR: sogutma_brema_items.json root is not a JSON array')
    raise SystemExit(1)

initial_count = len(src_data)

# Append items, avoiding duplicate ids
existing_ids = {item.get('id') for item in src_data if isinstance(item, dict)}
added = 0
for item in brema_items:
    if not isinstance(item, dict):
        continue
    if item.get('id') in existing_ids:
        # skip duplicates
        continue
    src_data.append(item)
    added += 1

with sogutma.open('w', encoding='utf-8') as f:
    json.dump(src_data, f, ensure_ascii=False, indent=2)

print(f"Merged {added} Brema items into sogutma.json (was {initial_count}, now {len(src_data)})")
