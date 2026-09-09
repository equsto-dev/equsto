#!/usr/bin/env python3
"""
Fast Mutbex scraper - prioritizes Atalay search, adds other brands from categories
"""

import json
import re
import time
import requests
from urllib.parse import quote_plus
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MutbexFastScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        })
    
    def extract_products_from_page(self, html: str) -> list:
        """Extract all PRODUCT_DATA from a page"""
        products = []
        matches = re.findall(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', html, re.DOTALL)
        
        for match in matches:
            try:
                data_str = match.replace('\\\\', '\\').replace('\\"', '"').replace('\\/', '/')
                product = json.loads(data_str)
                
                price_vat_included = product.get('total_sale_price') or product.get('total_base_price') or 0
                
                products.append({
                    'mutbex_id': product.get('id', ''),
                    'name': product.get('name', ''),
                    'code': product.get('code', ''),
                    'supplier_code': product.get('supplier_code', ''),
                    'price_vat_included': price_vat_included,
                    'price_vat_excluded': product.get('sale_price', 0),
                    'vat_rate': product.get('vat', 20),
                    'available': product.get('available', True),
                    'barcode': product.get('barcode', ''),
                    'brand': product.get('brand', ''),
                    'category': product.get('category', ''),
                    'category_id': product.get('category_id', ''),
                    'category_path': product.get('category_path', ''),
                    'url': f"https://www.mutbex.com/{product.get('url', '')}" if product.get('url') else '',
                    'image': product.get('image', ''),
                })
            except Exception as e:
                logger.debug(f"Failed to parse product: {e}")
                continue
        
        return products
    
    def scrape_search(self, query: str, max_pages: int = 50) -> list:
        all_products = []
        for page in range(1, max_pages + 1):
            url = f"https://www.mutbex.com/arama?q={quote_plus(query)}&page={page}"
            logger.info(f"Scraping search '{query}' page {page}...")
            try:
                r = self.session.get(url, timeout=30)
                r.raise_for_status()
            except Exception as e:
                logger.warning(f"Failed to fetch page {page}: {e}")
                break
            
            products = self.extract_products_from_page(r.text)
            if not products:
                logger.info(f"No products on page {page}, stopping")
                break
            
            all_products.extend(products)
            logger.info(f"Page {page}: found {len(products)} products (total: {len(all_products)})")
            time.sleep(0.2)
        return all_products
    
    def scrape_category(self, category_url: str, max_pages: int = 50) -> list:
        all_products = []
        for page in range(1, max_pages + 1):
            url = f"{category_url}?page={page}"
            logger.info(f"Scraping category page {page}...")
            try:
                r = self.session.get(url, timeout=30)
                r.raise_for_status()
            except Exception as e:
                logger.warning(f"Failed to fetch page {page}: {e}")
                break
            
            products = self.extract_products_from_page(r.text)
            if not products:
                logger.info(f"No products on page {page}, stopping")
                break
            
            all_products.extend(products)
            logger.info(f"Page {page}: found {len(products)} products (total: {len(all_products)})")
            time.sleep(0.2)
        return all_products

def main():
    scraper = MutbexFastScraper()
    
    # 1. Scrape ALL Atalay products from search (most comprehensive)
    logger.info("=== Scraping Atalay products (search) ===")
    atalay_products = scraper.scrape_search("Atalay", max_pages=25)
    logger.info(f"Found {len(atalay_products)} Atalay products from search")
    
    # 2. Scrape categories for OTHER brands (not Atalay)
    categories = [
        "https://www.mutbex.com/hazirlik-ekipmanlari",
        "https://www.mutbex.com/tavalar",
        "https://www.mutbex.com/fritozler",
        "https://www.mutbex.com/bulasikhane-ekipmanlari",
        "https://www.mutbex.com/saklama-ve-tasima-ekipmanlari",
        "https://www.mutbex.com/icecek-ekipmanlari",
        "https://www.mutbex.com/kahve-makineleri-ve-ekipmanlari",
        "https://www.mutbex.com/acik-bufe-ekipmanlari",
        "https://www.mutbex.com/bar-ekipmanlari",
        "https://www.mutbex.com/mutfak-gerecleri",
        "https://www.mutbex.com/endustriyel-mutfak-malzemeleri",
    ]
    
    other_products = []
    for cat_url in categories:
        logger.info(f"=== Scraping category: {cat_url} ===")
        cat_products = scraper.scrape_category(cat_url, max_pages=15)
        # Filter out Atalay (already have from search)
        non_atalay = [p for p in cat_products if p['brand'] != 'Atalay']
        logger.info(f"Found {len(non_atalay)} non-Atalay products")
        other_products.extend(non_atalay)
    
    # Combine: ALL Atalay + non-Atalay from categories
    all_products = atalay_products + other_products
    
    # Deduplicate by mutbex_id (keep first occurrence)
    seen = set()
    unique_products = []
    for p in all_products:
        key = p['mutbex_id'] or p['url']
        if key not in seen:
            seen.add(key)
            unique_products.append(p)
    
    logger.info(f"Total unique products: {len(unique_products)}")
    
    # Count by brand
    brands = defaultdict(int)
    for p in unique_products:
        brands[p['brand']] += 1
    logger.info(f"Brands: {dict(brands)}")
    
    # Save
    with open('mutbex_complete_products.json', 'w', encoding='utf-8') as f:
        json.dump(unique_products, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Saved {len(unique_products)} products to mutbex_complete_products.json")

if __name__ == "__main__":
    main()