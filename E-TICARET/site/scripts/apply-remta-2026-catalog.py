import json
import re
import os
import glob
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEPT_DIR = os.path.join(ROOT, 'public/data/dept')
BACKUP_FILE = os.path.join(ROOT, 'scripts/data/backup/remta-catalog-backup-20261015.json')
EXTRACTED_CATALOG = os.path.join(ROOT, 'scripts/data/remta-catalog-2026-extracted.json')

USD_TRY = 49.4945
ISKONTO_ORAN = 38
SATIS_ORAN = 0.62
KDV_ORAN = 20

def norm(code):
    if not code: return ''
    c = str(code).upper().strip()
    c = re.sub(r'[\(\)\-\.\s\/_]', '', c)
    return c

def fmt_try(n):
    v = round(float(n))
    # format with dot as thousand separator
    s = f"{v:,}".replace(',', '.')
    return f"₺{s},00"

def main():
    print(f"=== REMTA 2026 KATALOG UYGULAMA ===")
    print(f"Kur: 1 USD = {USD_TRY} TRY | İskonto: %{ISKONTO_ORAN} | KDV: %{KDV_ORAN}")
    
    # 1. Load backup of old site products
    if not os.path.exists(BACKUP_FILE):
        raise FileNotFoundError(f"Backup file not found: {BACKUP_FILE}")
        
    with open(BACKUP_FILE, 'r', encoding='utf-8') as f:
        backup_products = json.load(f)
    print(f"Yedekten okunan eski Remta ürün sayısı: {len(backup_products)}")
    
    # Index backup products by normalized code and variations
    backup_by_norm = {}
    for p in backup_products:
        sku = p.get('sku') or ''
        model = p.get('model') or ''
        muk = p.get('marka_urun_kodu') or ''
        pid = p.get('id') or ''
        
        keys = [sku, model, muk, pid]
        for k in list(keys):
            if '.' in k: keys.append(k.split('.')[0])
            if '-' in k: keys.append(k.split('-')[0])
            if '__' in k: keys.append(k.split('__')[1])
            keys.append(re.sub(r'(LPG|DG|SIY|GRI|KIR|BEY|SAR|GOLD|SILVER|BRONZ)$', '', k, flags=re.I))
            
        for k in keys:
            nk = norm(k)
            if nk and nk not in backup_by_norm:
                backup_by_norm[nk] = p

    # 2. Load 2026 extracted catalog
    with open(EXTRACTED_CATALOG, 'r', encoding='utf-8') as f:
        catalog_items = json.load(f)
    print(f"2026 Kataloğundaki ürün sayısı: {len(catalog_items)}")
    
    # 3. Categorize 2026 catalog items into target departments
    # Pages mapping:
    # Pages 6-16: sogutma (Slush, Şerbetlikler, Sebil, Teşhir, Kar buz)
    # Pages 17-37: icecek (Sıcak Çikolata, Salep, Çay Makineleri, Semaver, Çay Kazanı)
    # Pages 38-39: kahve (Filtre Kahve)
    # Pages 40-45: icecek (Şerbetlik, Ayranlık, Çorbalık / Servis)
    # Pages 46-79: pisirme (Tost, Waffle, Krep, Izgara, Fritöz, Ocak, Fırın, Döner, Benmari)
    # Pages 80-82: hazirlik (Soğan Doğrama, Dilimleme, Blender, Mikser)
    
    def assign_dept(item):
        pno = item['page']
        c = norm(item['code'])
        # check specific codes first
        if c.startswith(('ST1', 'ST2', 'ST3', 'ST4', 'RTW', 'SYXBJ', 'SK')):
            if pno <= 16:
                return 'sogutma'
            elif pno in range(40, 46):
                return 'icecek'
            else:
                return 'sogutma'
        if c.startswith(('CS', 'DE', 'R47', 'N1', 'EP', 'TT', 'SF', 'GR', 'GZR', 'K3', 'R5', 'S1')):
            if pno in [38, 39] or 'KAHVE' in item.get('category', '').upper():
                return 'kahve'
            return 'icecek'
        if c.startswith(('R12', 'R9', 'R10', 'W1', 'W2', 'W3', 'D0', 'SD', 'BC', 'CE', 'P0', 'P1', 'P2', 'BO', 'DE12L', 'R46')):
            return 'pisirme'
        if pno >= 80:
            return 'hazirlik'
        if pno >= 46:
            return 'pisirme'
        if pno in [38, 39]:
            return 'kahve'
        if pno <= 16:
            return 'sogutma'
        return 'icecek'

    # Build modernized product rows
    new_remta_by_dept = {
        'hazirlik': [],
        'icecek': [],
        'kahve': [],
        'pisirme': [],
        'sogutma': []
    }
    
    seen_ids = set()
    matched_from_backup_count = 0
    new_from_catalog_count = 0

    for cat_item in catalog_items:
        code = cat_item['code'].strip()
        nk = norm(code)
        target_dept = assign_dept(cat_item)
        
        # Calculate pricing
        liste_usd = cat_item['liste_fiyati_usd']
        satis_usd = round(liste_usd * SATIS_ORAN, 2)
        net_tl = round(satis_usd * USD_TRY)
        kdv_dahil_tl = round(net_tl * (1 + KDV_ORAN / 100))
        price_str = f"{fmt_try(kdv_dahil_tl)} KDV dahil"
        
        # Find if matching product in backup
        matched_bp = backup_by_norm.get(nk)
        
        # Determine product ID
        clean_code_id = re.sub(r'[^A-Z0-9]', '', code.upper())
        prod_id = f"remta__{clean_code_id.lower()}"
        
        if prod_id in seen_ids:
            # Handle collision by appending page or variant
            prod_id = f"{prod_id}_p{cat_item['page']}"
        seen_ids.add(prod_id)
        
        # Load extracted images by page if available
        pno = cat_item['page']
        page_imgs = [
            f"images/catalog/remta/p{pno:02d}_{i+1}.jpg"
            for i in range(10)
            if os.path.exists(os.path.join(ROOT, f"public/images/catalog/remta/p{pno:02d}_{i+1}.jpg"))
        ]

        # Build clean Turkish name
        if matched_bp and matched_bp.get('name'):
            matched_from_backup_count += 1
            name = matched_bp['name']
            images = matched_bp.get('images', [])
            if not images or any('placeholder' in img for img in images):
                images = page_imgs if page_imgs else images
            image = matched_bp.get('image') or (images[0] if images else None)
            if not image or 'placeholder' in image:
                image = page_imgs[0] if page_imgs else image
        else:
            new_from_catalog_count += 1
            desc_clean = cat_item.get('description') or ''
            cat_clean = cat_item.get('category') or ''
            name = f"Remta {code} {desc_clean}".strip()
            name = re.sub(r'\s+', ' ', name)
            images = page_imgs if page_imgs else []
            image = page_imgs[0] if page_imgs else None

        specs_text = "\n".join([
            name,
            "",
            f"Model: {code}",
            f"Liste fiyatı (USD): ${liste_usd:,.2f}",
            f"Equsto iskonto: %{ISKONTO_ORAN} (ödeme oranı {SATIS_ORAN})",
            f"Equsto satış (USD): ${satis_usd:,.2f}",
            f"Hesap: liste × {SATIS_ORAN}",
            f"Equsto satış (TL, KDV dahil): {fmt_try(kdv_dahil_tl)}",
            f"Kur: 1 USD = {USD_TRY} TRY (KDV %{KDV_ORAN})",
            f"Ölçüler: {cat_item.get('specs') or ''}",
            f"Kaynak: REMTA 2026 Ürün Kataloğu ve Fiyat Listesi"
        ])
        
        row = {
            "id": prod_id,
            "brand": "Remta",
            "oem_brand": "Remta",
            "marka_kodu": "REMTA",
            "marka_urun_kodu": code,
            "sku": code,
            "model": code,
            "name": name,
            "dept": target_dept,
            "category": target_dept,
            "fiyat_tl": kdv_dahil_tl,
            "fiyat_tl_net": net_tl,
            "price": price_str,
            "liste_fiyati_usd": liste_usd,
            "satis_usd_indirimli": satis_usd,
            "para_birimi": "USD",
            "kur_usd_try": USD_TRY,
            "iskonto_oran": ISKONTO_ORAN,
            "satis_oran": SATIS_ORAN,
            "bayi_iskonto": ISKONTO_ORAN / 100.0,
            "kdv_oran": KDV_ORAN,
            "specs": specs_text,
            "description": name,
            "images": images if images else ["images/catalog/remta-placeholder.jpg"],
            "image": image if image else "images/catalog/remta-placeholder.jpg",
            "equsto_kod": f"EQ-REMTA.{clean_code_id}",
            "kaynak_fiyat_listesi": "remta-katalog-2026",
            "fiyat_kaynagi": "remta-katalog-2026",
            "fiyat_bekleniyor": False,
            "catalog_page": cat_item['page']
        }
        
        # Preserve original categories/tags from backup if available
        if matched_bp:
            for k in ['urun_kategori', 'urun_alt_kategori', 'alt_kategori_1', 'alt_kategori_2', 'kategori_yolu', 'keywords']:
                if k in matched_bp:
                    row[k] = matched_bp[k]
                    
        new_remta_by_dept[target_dept].append(row)

    print(f"Toplam derlenen yeni Remta ürün sayısı: {sum(len(v) for v in new_remta_by_dept.values())}")
    print(f"  - Eski siteden eşleşen (görselleri korunan): {matched_from_backup_count}")
    print(f"  - 2026 Kataloğundan yeni eklenen: {new_from_catalog_count}")
    for d, items in new_remta_by_dept.items():
        print(f"  - {d}: {len(items)} ürün")

    # 4. Update dept files
    # For each dept file, remove old Remta products and add new ones
    dept_files_map = {
        'hazirlik': 'hazirlik.json',
        'icecek': 'icecek.json',
        'kahve': 'kahve.json',
        'pisirme': 'pisirme.json',
        'sogutma': 'sogutma.json'
    }
    
    for dept_name, filename in dept_files_map.items():
        filepath = os.path.join(DEPT_DIR, filename)
        if not os.path.exists(filepath):
            continue
            
        with open(filepath, 'r', encoding='utf-8') as f:
            existing_rows = json.load(f)
            
        # Filter out all old Remta rows
        cleaned_rows = [
            r for r in existing_rows
            if not ((r.get('brand') or '').lower() == 'remta' or (r.get('oem_brand') or '').lower() == 'remta' or str(r.get('id', '')).startswith('remta__'))
        ]
        
        # Append new Remta rows for this department
        new_rows = new_remta_by_dept[dept_name]
        combined_rows = cleaned_rows + new_rows
        
        # Save atomically
        tmp_file = f"{filepath}.tmp"
        with open(tmp_file, 'w', encoding='utf-8') as f:
            json.dump(combined_rows, f, ensure_ascii=False, indent=2)
            
        if os.path.exists(filepath):
            os.remove(filepath)
        os.rename(tmp_file, filepath)
        
        print(f"GÜNCELLENDİ: {filename} -> Toplam: {len(combined_rows)} ürün (Remta: {len(new_rows)})")

    print(f"\nTüm departman JSON dosyaları başarıyla güncellendi!")

if __name__ == '__main__':
    main()
