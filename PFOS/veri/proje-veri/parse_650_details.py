import json
import re

with open(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650.json", "r", encoding="utf-8") as f:
    data = json.load(f)

pages_text = data["pages_text"]
all_lines = []
for p_idx, text in enumerate(pages_text):
    for line in text.split('\n'):
        all_lines.append((p_idx + 1, line.strip()))

item_lines = []
for page_num, line in all_lines:
    if re.match(r"^\d{2}\s+[A-Z]\d+", line):
        item_lines.append((page_num, line))

print(f"Total item lines: {len(item_lines)}")

parsed_items = []
unparsed = []

# Helper pattern to match the prefix: section, pos, stock_no
prefix_pattern = re.compile(r"^(\d{2})\s+([A-Z]\d+[A-Z]?)\s+(\S+)\s+(.+)$")

for page_num, line in item_lines:
    m = prefix_pattern.match(line)
    if not m:
        unparsed.append((page_num, line, "Prefix mismatch"))
        continue
    
    sec, pos, stock, rest = m.groups()
    
    # Now let's parse the rest from right to left
    # The end of the line has:
    # Option A: ... <Adet> <Price> € <Total> €
    # Option B: ... <Adet> — —
    # Option C: ... <Adet> — — —
    
    tokens = rest.split()
    
    # Let's find where the quantity and prices are
    # Let's work from the end
    # We want to identify:
    # 1. Total Price
    # 2. Unit Price
    # 3. Quantity (Adet)
    # 4. Gas kW (optional)
    # 5. Electric kW (optional)
    # 6. Brand (Marka)
    # 7. Dimension (Ölçü)
    # The remaining tokens in front belong to the Description (Tanımı)
    
    # Let's write a simple parser based on tokens
    try:
        # Check if the last token is "€" or "—"
        # If last token is "€", the total price is tokens[-2]
        if tokens[-1] == "€":
            total_price = tokens[-2]
            # Next is unit price. Should be like tokens[-4] (since tokens[-3] is "€")
            assert tokens[-3] == "€"
            unit_price = tokens[-4]
            # Next is quantity
            qty = tokens[-5]
            consumed = 5
        elif tokens[-1] == "—":
            # Unpriced item, could end in "— —" or "— — —" or "1 — —"
            if tokens[-2] == "—":
                if tokens[-3] == "—":
                    total_price = "—"
                    unit_price = "—"
                    qty = tokens[-4]
                    consumed = 4
                else:
                    total_price = "—"
                    unit_price = "—"
                    qty = tokens[-3]
                    consumed = 3
            else:
                raise Exception("Unknown trailing tokens for unpriced item")
        else:
            raise Exception("Line does not end in € or —")
        
        # Now parse kW if present (between Brand and Quantity)
        kw_tokens = []
        brand_idx = len(tokens) - consumed - 1
        
        # Check if there is kW before quantity
        # e.g., "1.1 kW", "0.28 kW", "3.8 kW"
        # Let's look at tokens[-consumed-1] and tokens[-consumed-2]
        elk_kw = ""
        gaz_kw = ""
        
        # Let's look for kW tokens
        # We can iterate backwards from -consumed-1 to find kW
        back_idx = len(tokens) - consumed - 1
        
        # Let's check for kW
        while back_idx >= 0 and tokens[back_idx] == "kW":
            val = tokens[back_idx-1]
            # Is it electric or gas?
            # In the PDF, "Elk. kW" comes before "Gaz. kW"
            # If we scan backwards, the first kW we see is the last column (Gaz kW if both present, or Elk kW if only one)
            # Let's store them and we'll assign them later.
            kw_tokens.append(val)
            back_idx -= 2
        
        # Assign kW
        if len(kw_tokens) == 2:
            gaz_kw = kw_tokens[0] + " kW"
            elk_kw = kw_tokens[1] + " kW"
        elif len(kw_tokens) == 1:
            # Let's see if the item is gaz or elk. Usually if only one is present, let's look at description or assign to elk_kw for now.
            # In Türk Mutfağı Lokanta, Robot Coupe CL50, Brema CB416 etc. are Elk. kW
            # Ocağı is Gaz. kW. Let's look at the column headers to be precise.
            # We can figure out by looking at the index or just keeping the value.
            # Let's check if the stock no contains "G" or if the name contains "GAZ" or "OCAK"
            desc_so_far = " ".join(tokens[:back_idx+1])
            is_gas = "GAZ" in desc_so_far.upper() or "OCAK" in desc_so_far.upper() or "IZGARA" in desc_so_far.upper()
            if is_gas:
                gaz_kw = kw_tokens[0] + " kW"
            else:
                elk_kw = kw_tokens[0] + " kW"
        
        # Now tokens[back_idx] should be the Brand
        brand = tokens[back_idx]
        back_idx -= 1
        
        # Now tokens[back_idx] should be the Dimension (Ölçü)
        # Note: sometimes dimension is missing or is "—"
        # Let's check if tokens[back_idx] matches a dimension pattern like 1200×700×850, 400×500, etc., or "—"
        # If it doesn't look like a dimension and is just text, it might be part of the description and dimension is "—"
        dim = tokens[back_idx]
        if re.match(r"^[0-9xX×*\-+.,]+$", dim) or dim == "—" or "×" in dim:
            back_idx -= 1
        else:
            dim = "—"
            
        # The rest is the description
        desc = " ".join(tokens[:back_idx+1])
        
        parsed_items.append({
            "page": page_num,
            "section_id": sec,
            "p_no": pos,
            "stock_no": stock,
            "name": desc,
            "dimension": dim,
            "brand": brand,
            "elk_kw": elk_kw,
            "gaz_kw": gaz_kw,
            "qty": int(qty) if qty.isdigit() else qty,
            "unit_price": unit_price,
            "total_price": total_price,
            "line_raw": line
        })
        
    except Exception as e:
        unparsed.append((page_num, line, str(e)))

print(f"Successfully parsed: {len(parsed_items)}")
print(f"Failed to parse: {len(unparsed)}")
for p, l, err in unparsed:
    print(f"Failed Page {p} ({err}): {l}")

with open(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650-parsed.json", "w", encoding="utf-8") as f:
    json.dump(parsed_items, f, ensure_ascii=False, indent=2)
