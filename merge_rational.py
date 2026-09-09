import json

# Read existing pisirme.json
with open(r"C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json", "r", encoding="utf-8") as f:
    existing_products = json.load(f)

print(f"Existing products: {len(existing_products)}")

# Remove any existing RATIONAL products (by brand or id)
filtered_products = [p for p in existing_products if p.get("brand", "").lower() != "rational" and not p.get("id", "").startswith("rational__")]
print(f"After removing RATIONAL: {len(filtered_products)}")

# Read generated RATIONAL products
with open(r"C:\D Disk\EQUSTO-WORK\rational_products.json", "r", encoding="utf-8") as f:
    rational_products = json.load(f)

print(f"RATIONAL products to add: {len(rational_products)}")

# Merge
merged_products = filtered_products + rational_products
print(f"Total products after merge: {len(merged_products)}")

# Write back to pisirme.json
with open(r"C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json", "w", encoding="utf-8") as f:
    json.dump(merged_products, f, ensure_ascii=False, indent=2)

print("Done! pisirme.json updated.")

# Verify
rational_count = sum(1 for p in merged_products if p.get("brand", "").lower() == "rational")
print(f"RATIONAL products in final file: {rational_count}")

# Print RATIONAL product names for verification
for p in merged_products:
    if p.get("brand", "").lower() == "rational":
        print(f"  - {p['name']}: {p['fiyat_tl']:,} TL (List: {p['liste_fiyati_eur']} EUR)")