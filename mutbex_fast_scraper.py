#!/usr/bin/env python3
"""
Fast Mutbex scraper - extracts PRODUCT_DATA directly from search/category pages
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
        self.products = {}
    
    def extract_products_from_page(self, html: str) -> list:
        """Extract all PRODUCT_DATA from a page"""
        products = []
        matches = re.findall(r'PRODUCT_DATA\.push\(JSON\.parse\(\'(.+?)\'\)\)', html, re.DOTALL)
        
        for match in matches:
            try:
                # Fix escaping
                data_str = match.replace('\\\\', '\\').replace('\\"', '"').replace('\\/', '/')
                product = json.loads(data_str)
                
                # Normalize fields
                normalized = {
                    'mutbex_id': product.get('id', ''),
                    'name': product.get('name', ''),
                    'code': product.get('code', ''),
                    'supplier_code': product.get('supplier_code', ''),
                    'sale_price': product.get('sale_price', 0),  # VAT excluded
                    'total_base_price': product.get('total_base_price', 0),  # VAT included base
                    'total_sale_price': product.get('total_sale_price', 0),  # VAT included sale
                    'vat': product.get('vat', 20),
                    'available': product.get('available', True),
                    'barcode': product.get('barcode', ''),
                    'brand': product.get('brand', ''),
                    'category': product.get('category', ''),
                    'category_id': product.get('category_id', ''),
                    'category_path': product.get('category_path', ''),
                    'url': product.get('url', ''),
                    'image': product.get('image', ''),
                    'currency': product.get('currency', 'EUR'),
                    'currency_target': product.get('currency_target', 'TL'),
                }
                
                # Use total_sale_price as the VAT-included price (customer price)
                price_vat_included = normalized['total_sale_price'] or normalized['total_base_price'] or 0
                
                products.append({
                    'mutbex_id': normalized['mutbex_id'],
                    'name': normalized['name'],
                    'code': normalized['code'],
                    'supplier_code': normalized['supplier_code'],
                    'price_vat_included': price_vat_included,
                    'price_vat_excluded': normalized['sale_price'],
                    'vat_rate': normalized['vat'],
                    'available': normalized['available'],
                    'barcode': normalized['barcode'],
                    'brand': normalized['brand'],
                    'category': normalized['category'],
                    'category_path': normalized['category_path'],
                    'url': f"https://www.mutbex.com/{normalized['url']}" if normalized['url'] else '',
                    'image': normalized['image'],
                })
            except Exception as e:
                logger.debug(f"Failed to parse product: {e}")
                continue
        
        return products
    
    def scrape_search(self, query: str, max_pages: int = 50) -> list:
        """Scrape all pages of search results"""
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
        """Scrape all pages of a category"""
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
    
    # Scrape Atalay
    logger.info("=== Scraping Atalay products ===")
    atalay_products = scraper.scrape_search("Atalay", max_pages=25)
    logger.info(f"Found {len(atalay_products)} Atalay products")
    
    # Scrape relevant categories
    categories = [
        "https://www.mutbex.com/hazirlik-ekipmanlari",
        "https://www.mutbex.com/endustriyel-mutfak-malzemeleri",
        "https://www.mutbex.com/mutfak-gerecleri",
        "https://www.mutbex.com/tavalar",
        "https://www.mutbex.com/fritozler",
        "https://www.mutbex.com/bulasikhane-ekipmanlari",
        "https://www.mutbex.com/saklama-ve-tasima-ekipmanlari",
        "https://www.mutbex.com/icecek-ekipmanlari",
        "https://www.mutbex.com/kahve-makineleri-ve-ekipmanlari",
        "https://www.mutbex.com/acik-bufe-ekipmanlari",
        "https://www.mutbex.com/bar-ekipmanlari",
    ]
    
    all_other_products = []
    for cat_url in categories:
        logger.info(f"=== Scraping category: {cat_url} ===")
        cat_products = scraper.scrape_category(cat_url, max_pages=15)
        logger.info(f"Found {len(cat_products)} products")
        all_other_products.extend(cat_products)
    
    # Combine and deduplicate by mutbex_id
    all_products = atalay_products + all_other_products
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
    with open('mutbex_fast_products.json', 'w', encoding='utf-8') as f:
        json.dump(unique_products, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Saved {len(unique_products)} products to mutbex_fast_products.json")

if __name__ == "__main__":
    main()