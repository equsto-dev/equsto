import json

# Exchange rate from existing data
EUR_TRY = 52.9424
DISCOUNT = 0.65
KDV = 1.20
MULTIPLIER = DISCOUNT * KDV  # 0.78

def calc_prices(list_eur):
    satis_eur = round(list_eur * MULTIPLIER, 2)
    fiyat_tl = round(satis_eur * EUR_TRY)
    return satis_eur, fiyat_tl

def make_rational_product(sku, model, name, list_eur, fuel, gn_size, trays, series, category, subcategory):
    """Create a RATIONAL product entry matching the existing pisirme.json structure"""
    satis_eur, fiyat_tl = calc_prices(list_eur)
    
    # Build specs text
    specs_lines = [
        f"RATIONAL {name}",
        f"Kaynak: RATIONAL Türkiye Resmi Site",
        f"Seri: {series}",
        f"Kategori: {subcategory}",
        f"Model: {model}",
        f"Yakıt Tipi: {fuel}",
        f"GN Kapasitesi: {gn_size}",
        f"Tepsi Kapasitesi: {trays} tepsi" if trays else f"Kapasite: {gn_size}",
        f"Liste fiyatı (EUR): {list_eur}",
        f"Equsto fiyatı (%35 iskonto EUR): {satis_eur:.2f}",
        f"Kur: 1 EUR = {EUR_TRY} TRY (KDV %20)"
    ]
    specs = "\n".join(specs_lines)
    
    # Price display
    price_display = f"₺{fiyat_tl:,} KDV dahil"
    
    # Image path (placeholder - would need actual RATIONAL images)
    img_name = sku.replace(".", "-").replace("9890-", "").lower()
    images = [f"images/catalog/rational/{img_name}.jpg"]
    
    # ID format
    id_str = f"rational__{sku.lower().replace('.', '-')}"
    
    # Category mapping
    if series == "iCombi Pro":
        category = "kombi-firin"
        subcategory = "icombi-pro"
    elif series == "iCombi Classic":
        category = "kombi-firin"
        subcategory = "icombi-classic"
    elif series == "iVario":
        category = "pisirme-diger"
        subcategory = "ivario"
    
    product = {
        "category": category,
        "brand": "Rational",
        "name": f"RATIONAL {name}",
        "price": price_display,
        "specs": specs,
        "images": images,
        "sku": sku,
        "model": model,
        "fiyat_tl": fiyat_tl,
        "liste_fiyati_eur": list_eur,
        "satis_eur_indirimli": satis_eur,
        "iskonto_oran": 35,
        "kaynak_fiyat_listesi": "rational-2026-liste",
        "dept": "pisirme",
        "id": id_str,
        "equsto_kod": f"EQ-RATIONAL-{sku.replace('9890.', '')}",
        "marka_kodu": "RATIONAL",
        "marka_urun_kodu": sku.replace("9890.", ""),
        "urun_kategori": "Pişirme",
        "urun_alt_kategori": "Kombi Fırın" if "iCombi" in series else "iVario",
        "alt_kategori_1": subcategory,
        "alt_kategori_2": series,
        "kategori_yolu": ["Pişirme", "Kombi Fırın" if "iCombi" in series else "iVario", series, subcategory],
        "teknik_ozellikler": [
            f"Yakıt: {fuel}",
            f"GN Kapasitesi: {gn_size}",
            f"Tepsi Sayısı: {trays}" if trays else f"Kapasite: {gn_size}",
            f"Seri: {series}",
        ],
        "description": f"RATIONAL {name} - Profesyonel mutfaklar için {series} serisi {fuel.lower()} kombi fırın. {trays} tepsili {gn_size} GN kapasite. Akıllı pişirme sistemleri, otomatik temizlik ve yüksek enerji verimliliği sunar."
    }
    return product

# iCombi Pro products - using existing SKUs from comparison data
icombi_pro_products = [
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

# iCombi Classic products - using existing SKUs from comparison data
icombi_classic_products = [
    ("9890.ICCLSXS.00", "ICCLSXS", "iCombi Classic 6-2/3 Elektrikli", 6740, "Elektrik", "2/3", 6, "iCombi Classic"),  # NEW
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

# iVario products - ALL NEW (no existing SKUs in comparison data)
# Need to create SKUs following the pattern
ivario_products = [
    ("9890.IVARIO2XS.00", "IVARIO2XS", "iVario 2-XS (2x17L)", 11980, "Elektrik", "2x17L", None, "iVario"),
    ("9890.IVARIO2S.00", "IVARIO2S", "iVario Pro 2-S (2x25L)", 17700, "Elektrik", "2x25L", None, "iVario"),
    ("9890.IVARIO2SP.00", "IVARIO2SP", "iVario 2-S Basınçlı (2x25L)", 20530, "Elektrik", "2x25L Basınçlı", None, "iVario"),
    ("9890.IVARIOL.00", "IVARIOL", "iVario Pro L (100L)", 20193, "Elektrik", "100L", None, "iVario"),
    ("9890.IVARIOLP.00", "IVARIOLP", "iVario Pro L Basınçlı (100L)", 23593, "Elektrik", "100L Basınçlı", None, "iVario"),
    ("9890.IVARIOXL.00", "IVARIOXL", "iVario Pro XL (150L)", 26593, "Elektrik", "150L", None, "iVario"),
    ("9890.IVARIOXLP.00", "IVARIOXLP", "iVario Pro XL Basınçlı (150L)", 30453, "Elektrik", "150L Basınçlı", None, "iVario"),
]

all_products = []
for sku, model, name, list_eur, fuel, gn_size, trays, series in icombi_pro_products:
    all_products.append(make_rational_product(sku, model, name, list_eur, fuel, gn_size, trays, series, "", ""))

for sku, model, name, list_eur, fuel, gn_size, trays, series in icombi_classic_products:
    all_products.append(make_rational_product(sku, model, name, list_eur, fuel, gn_size, trays, series, "", ""))

for sku, model, name, list_eur, fuel, gn_size, trays, series in ivario_products:
    all_products.append(make_rational_product(sku, model, name, list_eur, fuel, gn_size, trays, series, "", ""))

# Print summary
print(f"Total products: {len(all_products)}")
print(f"iCombi Pro: {len(icombi_pro_products)}")
print(f"iCombi Classic: {len(icombi_classic_products)}")
print(f"iVario: {len(ivario_products)}")

# Print price verification for first few
print("\n--- Price Verification ---")
for p in all_products[:5]:
    print(f"{p['name']}: {p['liste_fiyati_eur']} EUR -> {p['satis_eur_indirimli']} EUR -> {p['fiyat_tl']:,} TL")

# Save to JSON file
with open("rational_products.json", "w", encoding="utf-8") as f:
    json.dump(all_products, f, ensure_ascii=False, indent=2)

print("\nSaved to rational_products.json")