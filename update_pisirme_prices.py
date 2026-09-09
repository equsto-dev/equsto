import json

# Load new prices
with open('rational_prices_new.json', 'r', encoding='utf-8') as f:
    new_prices = json.load(f)

# Create price lookup by SKU
price_lookup = {p['sku']: p for p in new_prices}

# Load pisirme.json
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Update RATIONAL products
updated = 0
for p in products:
    if p.get('brand', '').lower() == 'rational':
        sku = p.get('sku')
        if sku in price_lookup:
            np = price_lookup[sku]
            p['fiyat_tl'] = np['fiyat_tl']
            p['liste_fiyati_eur'] = np['list_eur']
            p['satis_eur_indirimli'] = np['satis_eur']
            # Update price display
            p['price'] = f"₺{np['fiyat_tl']:,} KDV dahil"
            # Update specs with new prices
            specs = p.get('specs', '')
            lines = specs.split('\n')
            new_lines = []
            for line in lines:
                if line.startswith('Liste fiyatı (EUR):'):
                    new_lines.append(f"Liste fiyatı (EUR): {np['list_eur']}")
                elif line.startswith('Equsto fiyatı'):
                    new_lines.append(f"Equsto fiyatı (%35 iskonto EUR): {np['satis_eur']:.2f}")
                elif line.startswith('Kur: 1 EUR'):
                    new_lines.append(f"Kur: 1 EUR = 56.02 TRY (KDV %20)")
                else:
                    new_lines.append(line)
            p['specs'] = '\n'.join(new_lines)
            updated += 1

print(f"Updated {updated} RATIONAL products")

# Save
with open(r'C:\D Disk\EQUSTO-WORK\public\data\dept\pisirme.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

# Also update E-TICARET/site
with open(r'C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\dept\pisirme.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("Done!")