import json
import re

with open(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650.json", "r", encoding="utf-8") as f:
    data = json.load(f)

pages_text = data["pages_text"]
all_lines = []
for p_idx, text in enumerate(pages_text):
    for line in text.split('\n'):
        all_lines.append((p_idx + 1, line))

print(f"Total lines across all pages: {len(all_lines)}")

# Look at lines starting with 2 digits and a letter followed by digits
item_lines = []
for page_num, line in all_lines:
    match = re.match(r"^(\d{2})\s+([A-Z]\d+[A-Z]?)\s+(\S+)", line)
    if match:
        item_lines.append((page_num, line))

print(f"Found {len(item_lines)} lines starting with section and position:")
for p, l in item_lines[:15]:
    print(f"Page {p}: {l}")
