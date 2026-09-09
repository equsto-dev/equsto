import json

# New exchange rate
EUR_TRY = 56.02
DISCOUNT = 0.65
KDV = 1.20
MULTIPLIER = DISCOUNT * KDV  # 0.78

def calc_prices(list_eur):
    satis_eur = round(list_eur * MULTIPLIER, 2)
    fiyat_tl = round(satis_eur * EUR_TRY)
    return satis_eur, fiyat_tl

# iCombi Pro products
icombi_pro = [
    ("9890.ICPROXS.00", "ICPROXS", "iCombi Pro XS 6-2/3 Elektrikli", 8580, "Elektrik", "2/3", 6, "iCombi Pro"),
    ("9890.ICPRO61.E0", "ICPRO61.E0", "iCombi Pro 6-1/1 Elektrikli", 10730, "Elektrik", "1/1", 6, "iCombi Pro"),
    ("9890.ICPRO61.0G", "ICPRO61.0G", "iCombi Pro 6-1/1 Gazlı", 12800, "Gaz", "1/1", 6, "iCombi Pro"),
    ("9890.ICPRO62.E0", "ICPRO62.E0", "iCombi Pro 6-2/1 Elektrikli", 16390, "Elektrik", "2/1", 6, "iCombi Pro"),
    ("9890.ICPRO62.G0", "ICPRO62.G0", "iCombi Pro 6-2/1 Gazlı", 19020, "Gaz", "2/1", 6, "iCombi Pro"),
    ("9890.ICPRO10.1E", "ICPRO10.1E", "iCombi Pro 10-1/1 Elektrikli", 15090, "Elektrik", "1/1", 10, "iCombi Pro"),
    ("9890.ICPRO10.1G", "ICPRO10.1G", "iCombi Pro 10-1/1 Gazlı", 17500, "Gaz", "1/1", 10, "iCombi Pro"),
    ("9890.ICPRO10.2E", "ICPRO10.2E", "iCombi Pro 10-2/1 Elektrikli", 21800, "Elektrik", "2/1", 10, "iCombi Pro"),
    ("9890.ICPRO10.2G", "ICPRO10.2G", "iCombi Pro 10-2/1 Gazlı", 25290, "Gaz", "2/1", 10, "iCombi Pro"),
    ("9890.ICPRO20.1E", "ICPRO20.1E", "iCombi Pro 20-1/1 Elektrikli", 25520, "Elektrik", "1/1", 20, "iCombi Pro"),
    ("9890.ICPRO20.1G", "ICPRO20.1G", "iCombi Pro 20-1/1 Gazlı", 28830, "Gaz", "1/1", 20, "iCombi Pro"),
    ("9890.ICPRO20.2E", "ICPRO20.2E", "iCombi Pro 20-2/1 Elektrikli", 36580, "Elektrik", "2/1", 20, "iCombi Pro"),
    ("9890.ICPRO20.2G", "ICPRO20.2G", "iCombi Pro 20-2/1 Gazlı", 41330, "Gaz", "2/1", 20, "iCombi Pro"),
]

# iCombi Classic products
icombi_classic = [
    ("9890.ICCLSXS.00", "ICCLSXS", "iCombi Classic 6-2/3 Elektrikli", 6740, "Elektrik", "2/3", 6, "iCombi Classic"),
    ("9890.ICCLS61.E0", "ICCLS61.E0", "iCombi Classic 6-1/1 Elektrikli", 8440, "Elektrik", "1/1", 6, "iCombi Classic"),
    ("9890.ICCLS61.0G", "ICCLS61.0G", "iCombi Classic 6-1/1 Gazlı", 10060, "Gaz", "1/1", 6, "iCombi Classic"),
    ("9890.ICCLS62.E0", "ICCLS62.E0", "iCombi Classic 6-2/1 Elektrikli", 12890, "Elektrik", "2/1", 6, "iCombi Classic"),
    ("9890.ICCLS62.G0", "ICCLS62.G0", "iCombi Classic 6-2/1 Gazlı", 14950, "Gaz", "2/1", 6, "iCombi Classic"),
    ("9890.ICCLS10.1E", "ICCLS10.1E", "iCombi Classic 10-1/1 Elektrikli", 11860, "Elektrik", "1/1", 10, "iCombi Classic"),
    ("9890.ICCLS10.1G", "ICCLS10.1G", "iCombi Classic 10-1/1 Gazlı", 13760, "Gaz", "1/1", 10, "iCombi Classic"),
    ("9890.ICCLS10.2E", "ICCLS10.2E", "iCombi Classic 10-2/1 Elektrikli", 17140, "Elektrik", "2/1", 10, "iCombi Classic"),
    ("9890.ICCLS10.2G", "ICCLS10.2G", "iCombi Classic 10-2/1 Gazlı", 19870, "Gaz", "2/1", 10, "iCombi Classic"),
    ("9890.ICCLS20.1E", "ICCLS20.1E", "iCombi Classic 20-1/1 Elektrikli", 21940, "Elektrik", "1/1", 20, "iCombi Classic"),
    ("9890.ICCLS20.1G", "ICCLS20.1G", "iCombi Classic 20-1/1 Gazlı", 24780, "Gaz", "1/1", 20, "iCombi Classic"),
    ("9890.ICCLS20.2E", "ICCLS20.2E", "iCombi Classic 20-2/1 Elektrikli", 31440, "Elektrik", "2/1", 20, "iCombi Classic"),
    ("9890.ICCLS20.2G", "ICCLS20.2G", "iCombi Classic 20-2/1 Gazlı", 35530, "Gaz", "2/1", 20, "iCombi Classic"),
]

# iVario products
ivario = [
    ("9890.IVARIO2XS.00", "IVARIO2XS", "iVario 2-XS (2x17L)", 11980, "Elektrik", "2x17L", None, "iVario"),
    ("9890.IVARIO2S.00", "IVARIO2S", "iVario Pro 2-S (2x25L)", 17700, "Elektrik", "2x25L", None, "iVario"),
    ("9890.IVARIO2SP.00", "IVARIO2SP", "iVario 2-S Basınçlı (2x25L)", 20530, "Elektrik", "2x25L Basınçlı", None, "iVario"),
    ("9890.IVARIOL.00", "IVARIOL", "iVario Pro L (100L)", 20193, "Elektrik", "100L", None, "iVario"),
    ("9890.IVARIOLP.00", "IVARIOLP", "iVario Pro L Basınçlı (100L)", 23593, "Elektrik", "100L Basınçlı", None, "iVario"),
    ("9890.IVARIOXL.00", "IVARIOXL", "iVario Pro XL (150L)", 26593, "Elektrik", "150L", None, "iVario"),
    ("9890.IVARIOXLP.00", "IVARIOXLP", "iVario Pro XL Basınçlı (150L)", 30453, "Elektrik", "150L Basınçlı", None, "iVario"),
]

all_products_data = []
for sku, model, name, list_eur, fuel, gn_size, trays, series in icombi_pro + icombi_classic + ivario:
    satis_eur, fiyat_tl = calc_prices(list_eur)
    all_products_data.append({
        'sku': sku,
        'model': model,
        'name': name,
        'list_eur': list_eur,
        'satis_eur': satis_eur,
        'fiyat_tl': fiyat_tl,
        'fuel': fuel,
        'gn_size': gn_size,
        'trays': trays,
        'series': series
    })

# Print summary
print(f"Total: {len(all_products_data)} products")
print(f"EUR/TRY: {EUR_TRY}")
print(f"Multiplier: {MULTIPLIER}")
print()
for p in all_products_data:
    print(f"{p['name']}: List={p['list_eur']} EUR -> Satis={p['satis_eur']} EUR -> TL={p['fiyat_tl']:,} TL")

# Save for next step
with open('rational_prices_new.json', 'w', encoding='utf-8') as f:
    json.dump(all_products_data, f, ensure_ascii=False, indent=2)