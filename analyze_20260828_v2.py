import json

with open(r'C:\D Disk\EQUSTO-WORK\pisirme_20260828.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

total = len(data)
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
has_equsto_site_markup = sum(1 for p in data if 'equsto_site_markup' in p)
has_kur_eur_try = sum(1 for p in data if 'kur_eur_try' in p)
has_kdv_oran = sum(1 for p in data if 'kdv_oran' in p)
has_liste_fiyati = sum(1 for p in data if 'liste_fiyati' in p or 'liste_fiyati_eur' in p)
has_olculer_field = sum(1 for p in data if 'olculer' in p)
has_teknik_ozellikler = sum(1 for p in data if 'teknik_ozellikler' in p)
has_specs = sum(1 for p in data if 'specs' in p)
has_description = sum(1 for p in data if 'description' in p)
has_inoksan_enriched = sum(1 for p in data if 'inoksan_enriched' in p)

# Write results to file to avoid encoding issues
results = {
    'total': len(data),
    'unique_skus': len(skus),
    'dup_skus': list(dup_skus),
    'brands': brands,
    'categories': sorted(categories),
    'has_fiyat_tl': has_fiyat_tl,
    'has_price': has_price,
    'has_equstoPage': has_equstoPage,
    'has_images': has_images,
    'has_equsto_site_markup': has_equsto_site_markup,
    'has_kur_eur_try': has_kur_eur_try,
    'has_kdv_oran': has_kdv_oran,
    'has_liste_fiyati': has_liste_fiyati,
    'has_olculer_field': has_olculer_field,
    'has_teknik_ozellikler': has_teknik_ozellikler,
    'has_specs': has_specs,
    'has_description': has_description,
    'has_inoksan_enriched': has_inoksan_enriched,
    'has_equsto_site_markup': has_equsto_site_markup,
    'has_kur_eur_try': has_kur_eur_try,
    'has_kdv_oran': has_kdv_oran,
    'has_liste_fiyati': has_liste_fiyati,
    'has_olculer_field': has_olculer_field,
    'has_teknik_ozellikler': has_teknik_ozellikler,
    'has_specs': has_specs,
    'has_description': has_description,
    'has_inoksan_enriched': has_inoksan_enriched,
    'equstoPage_values_sample': list(equstoPage_values)[:10]
}

with open(r'C:\D Disk\EQUSTO-WORK\analysis_20260828.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, ensure_ascii=False, indent=2)

print("Analysis complete. Results saved to analysis_20260828.json")