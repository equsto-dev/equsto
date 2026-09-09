import json

with open(r'C:\D Disk\EQUSTO-WORK\pisirme_20260828.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

total = len(data)
print(f"Total products: {total}")

brands = {}
skus = set()
dup_skus = set()
categories = set()
equstoPage_values = set()

has_fiyat_tl = 0
has_price = 0
has_equstoPage = 0
has_images = 0
has_equsto_site_markup = 0
has_kur_eur_try = 0
has_kdv_oran = 0
has_liste_fiyati = 0
has_olculer_field = 0
has_teknik_ozellikler = 0
has_specs = 0
has_description = 0
has_inoksan_enriched = 0
has_olculer_field = 0
has_equsto_site_markup_field = 0
has_kur_eur_try = 0
has_kdv_oran = 0
has_liste_fiyati = 0

for p in data:
    b = p.get('brand', 'unknown')
    brands[b] = brands.get(b, 0) + 1
    sku = p.get('sku', '')
    if sku:
        if sku in skus:
            dup_skus.add(sku)
        skus.add(sku)
    if p.get('category'):
        categories.add(p.get('category'))
    if p.get('equstoPage') is not None:
        equstoPage_values.add(p.get('equstoPage'))
    if 'fiyat_tl' in p and p.get('fiyat_tl') is not None:
        pass
    if 'price' in p and p.get('price') is not None:
        pass
    if 'equstoPage' in p and p.get('equstoPage') is not None:
        pass
    if 'images' in p and p.get('images'):
        pass
    if 'equsto_site_markup' in p:
        pass
    if 'kur_eur_try' in p:
        pass
    if 'kdv_oran' in p:
        pass
    if 'liste_fiyati' in p or 'liste_fiyati_eur' in p:
        pass
    if 'olculer' in p:
        pass
    if 'teknik_ozellikler' in p:
        pass
    if 'specs' in p:
        pass
    if 'description' in p:
        pass
    if 'inoksan_enriched' in p:
        pass
    if 'olculer' in p:
        pass
    if 'equsto_site_markup' in p:
        pass

# Count properly
has_fiyat_tl = sum(1 for p in data if 'fiyat_tl' in p and p.get('fiyat_tl') is not None)
has_price = sum(1 for p in data if 'price' in p and p.get('price') is not None)
has_equstoPage = sum(1 for p in data if 'equstoPage' in p and p.get('equstoPage') is not None)
has_images = sum(1 for p in data if 'images' in p and p.get('images'))
has_equsto_site_markup = sum(1 for p in data if 'equsto_site_markup' in p)
has_kur_eur_try = sum(1 for p in data if 'kur_eur_try' in p)
has_kdv_oran = sum(1 for p in data if 'kdv_oran' in p)
has_liste_fiyati = sum(1 for p in data if 'liste_fiyati' in p or 'liste_fiyati_eur' in p)
has_olculer_field = sum(1 for p in data if 'olculer' in p)
has_teknik_ozellikler = sum(1 for p in data if 'teknik_ozellikler' in p)
has_specs = sum(1 for p in data if 'specs' in p)
has_description = sum(1 for p in data if 'description' in p)
has_inoksan_enriched = sum(1 for p in data if 'inoksan_enriched' in p)
has_olculer_field = sum(1 for p in data if 'olculer' in p)
has_equsto_site_markup = sum(1 for p in data if 'equsto_site_markup' in p)
has_kur_eur_try = sum(1 for p in data if 'kur_eur_try' in p)
has_kdv_oran = sum(1 for p in data if 'kdv_oran' in p)
has_liste_fiyati = sum(1 for p in data if 'liste_fiyati' in p or 'liste_fiyati_eur' in p)

# Collect categories and brands
brands = {}
skus = set()
dup_skus = set()
categories = set()
equstoPage_values = set()

for p in data:
    b = p.get('brand', 'unknown')
    brands[b] = brands.get(b, 0) + 1
    sku = p.get('sku', '')
    if sku:
        if sku in skus:
            dup_skus.add(sku)
        skus.add(sku)
    if p.get('category'):
        categories.add(p.get('category'))
    if p.get('equstoPage') is not None:
        equstoPage_values.add(p.get('equstoPage'))

print(f"Total products: {len(data)}")
print(f"Unique SKUs: {len(skus)}")
print(f"Duplicate SKUs: {len(dup_skus)}")
if dup_skus:
    print(f"  Duplicate SKUs sample: {list(dup_skus)[:10]}")
print(f"Brands: {brands}")
print(f"Categories ({len(categories)}): {sorted(categories)}")
print(f"Has fiyat_tl: {sum(1 for p in data if 'fiyat_tl' in p)}")
print(f"Has price: {sum(1 for p in data if 'price' in p)}")
print(f"Has equstoPage: {sum(1 for p in data if 'equstoPage' in p)}")
print(f"  equstoPage values sample: {list(equstoPage_values)[:10]}")
print(f"Has images: {sum(1 for p in data if 'images' in p)}")
print(f"Has equsto_site_markup: {has_equsto_site_markup}")
print(f"Has kur_eur_try: {has_kur_eur_try}")
print(f"Has kdv_oran: {has_kdv_oran}")
print(f"Has liste_fiyati/liste_fiyati_eur: {has_liste_fiyati}")
print(f"Has olculer: {has_olculer_field}")
print(f"Has teknik_ozellikler: {has_teknik_ozellikler}")
print(f"Has specs: {has_specs}")
print(f"Has description: {has_description}")
print(f"Has inoksan_enriched: {has_inoksan_enriched}")
print(f"Has olculer field: {has_olculer_field}")
print(f"Has equsto_site_markup field: {has_equsto_site_markup}")
print(f"Brands: {brands}")

# Sample a few products
print("\n--- Sample products ---")
for i, p in enumerate(data[:3]):
    print(f"\nProduct {i+1}:")
    print(f"  id: {p.get('id')}")
    print(f"  sku: {p.get('sku')}")
    print(f"  name: {p.get('name', '')[:80]}")
    print(f"  brand: {p.get('brand')}")
    print(f"  category: {p.get('category')}")
    print(f"  fiyat_tl: {p.get('fiyat_tl')}")
    print(f"  price: {p.get('price')}")
    print(f"  equstoPage: {p.get('equstoPage')}")
    print(f"  images: {p.get('images')}")
    print(f"  equsto_site_markup: {p.get('equsto_site_markup')}")
    print(f"  kur_eur_try: {p.get('kur_eur_try')}")
    print(f"  kdv_oran: {p.get('kdv_oran')}")
    print(f"  liste_fiyati_eur: {p.get('liste_fiyati_eur')}")
    print(f"  category: {p.get('category')}")
    print(f"  images: {p.get('images')}")
    print(f"  equsto_site_markup: {p.get('equsto_site_markup')}")
    print(f"  kur_eur_try: {p.get('kur_eur_try')}")
    print(f"  inoksan_enriched: {p.get('inoksan_enriched')}")
    print(f"  olculer: {p.get('olculer')}")