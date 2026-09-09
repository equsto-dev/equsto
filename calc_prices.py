# Exchange rate from existing data
EUR_TRY = 52.9424

# Price formula: List EUR * 0.65 * 1.20 = List EUR * 0.78
DISCOUNT = 0.65
KDV = 1.20
MULTIPLIER = DISCOUNT * KDV  # 0.78

# iCombi Pro products (from user's price list)
icombi_pro = [
    ("ICPROXS", "iCombi Pro XS 6-2/3 Elektrikli", 8580, "Elektrik", "2/3", 6),
    ("ICPRO61", "iCombi Pro 6-1/1 Elektrikli", 10730, "Elektrik", "1/1", 6),
    ("ICPRO61", "iCombi Pro 6-1/1 Gazlı", 12800, "Gaz", "1/1", 6),
    ("ICPRO62", "iCombi Pro 6-2/1 Elektrikli", 16390, "Elektrik", "2/1", 6),
    ("ICPRO62", "iCombi Pro 6-2/1 Gazlı", 19020, "Gaz", "2/1", 6),
    ("ICPRO101", "iCombi Pro 10-1/1 Elektrikli", 15090, "Elektrik", "1/1", 10),
    ("ICPRO101", "iCombi Pro 10-1/1 Gazlı", 17500, "Gaz", "1/1", 10),
    ("ICPRO102", "iCombi Pro 10-2/1 Elektrikli", 21800, "Elektrik", "2/1", 10),
    ("ICPRO102", "iCombi Pro 10-2/1 Gazlı", 25290, "Gaz", "2/1", 10),
    ("ICPRO201", "iCombi Pro 20-1/1 Elektrikli", 25520, "Elektrik", "1/1", 20),
    ("ICPRO201", "iCombi Pro 20-1/1 Gazlı", 28830, "Gaz", "1/1", 20),
    ("ICPRO202", "iCombi Pro 20-2/1 Elektrikli", 36580, "Elektrik", "2/1", 20),
    ("ICPRO202", "iCombi Pro 20-2/1 Gazlı", 41330, "Gaz", "2/1", 20),
]

# iCombi Classic products (from user's price list)
icombi_classic = [
    ("ICCLSXS", "iCombi Classic 6-2/3 Elektrikli", 6740, "Elektrik", "2/3", 6),
    ("ICCLS61", "iCombi Classic 6-1/1 Elektrikli", 8440, "Elektrik", "1/1", 6),
    ("ICCLS61", "iCombi Classic 6-1/1 Gazlı", 10060, "Gaz", "1/1", 6),
    ("ICCLS62", "iCombi Classic 6-2/1 Elektrikli", 12890, "Elektrik", "2/1", 6),
    ("ICCLS62", "iCombi Classic 6-2/1 Gazlı", 14950, "Gaz", "2/1", 6),
    ("ICCLS101", "iCombi Classic 10-1/1 Elektrikli", 11860, "Elektrik", "1/1", 10),
    ("ICCLS101", "iCombi Classic 10-1/1 Gazlı", 13760, "Gaz", "1/1", 10),
    ("ICCLS102", "iCombi Classic 10-2/1 Elektrikli", 17140, "Elektrik", "2/1", 10),
    ("ICCLS102", "iCombi Classic 10-2/1 Gazlı", 19870, "Gaz", "2/1", 10),
    ("ICCLS201", "iCombi Classic 20-1/1 Elektrikli", 21940, "Elektrik", "1/1", 20),
    ("ICCLS201", "iCombi Classic 20-1/1 Gazlı", 24780, "Gaz", "1/1", 20),
    ("ICCLS202", "iCombi Classic 20-2/1 Elektrikli", 31440, "Elektrik", "2/1", 20),
    ("ICCLS202", "iCombi Classic 20-2/1 Gazlı", 35530, "Gaz", "2/1", 20),
]

# iVario products (from user's price list)
ivario = [
    ("IVARIO2XS", "iVario 2-XS (2x17L)", 11980, "Elektrik", "2x17L"),
    ("IVARIO2S", "iVario Pro 2-S (2x25L)", 17700, "Elektrik", "2x25L"),
    ("IVARIO2SP", "iVario 2-S Basınçlı (2x25L)", 20530, "Elektrik", "2x25L Basınçlı"),
    ("IVARIOL", "iVario Pro L (100L)", 20193, "Elektrik", "100L"),
    ("IVARIOLP", "iVario Pro L Basınçlı (100L)", 23593, "Elektrik", "100L Basınçlı"),
    ("IVARIOXL", "iVario Pro XL (150L)", 26593, "Elektrik", "150L"),
    ("IVARIOXLP", "iVario Pro XL Basınçlı (150L)", 30453, "Elektrik", "150L Basınçlı"),
]

def calc_prices(list_eur):
    satis_eur = round(list_eur * MULTIPLIER, 2)
    fiyat_tl = round(satis_eur * EUR_TRY)
    return satis_eur, fiyat_tl

print("=== iCOMBI PRO ===")
for model_key, name, list_eur, fuel, gn_size, trays in icombi_pro:
    satis_eur, fiyat_tl = calc_prices(list_eur)
    print(f"{name}: List={list_eur} EUR, Satis={satis_eur} EUR, TL={fiyat_tl:,} TL")

print("\n=== iCOMBI CLASSIC ===")
for model_key, name, list_eur, fuel, gn_size, trays in icombi_classic:
    satis_eur, fiyat_tl = calc_prices(list_eur)
    print(f"{name}: List={list_eur} EUR, Satis={satis_eur} EUR, TL={fiyat_tl:,} TL")

print("\n=== iVARIO ===")
for model_key, name, list_eur, fuel, gn_size in ivario:
    satis_eur, fiyat_tl = calc_prices(list_eur)
    print(f"{name}: List={list_eur} EUR, Satis={satis_eur} EUR, TL={fiyat_tl:,} TL")