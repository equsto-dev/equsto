#!/usr/bin/env python3
"""
Bulk scrape Mutbex products for fast local matching
"""

import json
import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin
from collections import defaultdict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MutbexBulkScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        })
        self.products = []
    
    def scrape_search_results(self, query: str, max_pages: int = 50) -> list:
        """Scrape all pages of search results for a query"""
        all_products = []
        
        for page in range(1, max_pages + 1):
            url = f"https://www.mutbex.com/arama?q={quote_plus(query)}&page={page}"
            logger.info(f"Scraping {query} page {page}...")
            
            try:
                r = self.session.get(url, timeout=30)
                r.raise_for_status()
            except Exception as e:
                logger.warning(f"Failed to fetch page {page}: {e}")
                break
            
            soup = BeautifulSoup(r.text, 'html.parser')
            
            # Check if page has products
            product_cards = soup.find_all('a', href=True)
            page_products = []
            
            for card in product_cards:
                href = card.get('href', '')
                if not href.startswith('/') or href.startswith('//'):
                    continue
                if any(skip in href for skip in ['/iletisim', '/siparis', '/uye-', '/satin-alma', '/kampanya', '/gold', '/arama', '/kategori', '/marka']):
                    continue
                
                # Extract product info
                text = card.get_text(strip=True)
                img = card.find('img')
                img_src = img.get('src', '') if img else ''
                
                # Price
                price_text = ""
                for elem in card.find_all(string=True):
                    if 'TL' in elem:
                        price_text += elem.strip() + " "
                
                # Product code
                code_match = re.search(r'(?:Kodu|Kod|Code)\s*[:：]\s*([A-Z0-9\.\-]+)', text, re.IGNORECASE)
                product_code = code_match.group(1) if code_match else ""
                
                page_products.append({
                    'url': urljoin('https://www.mutbex.com', href),
                    'title': text[:300],
                    'price_text': price_text.strip(),
                    'product_code': product_code,
                    'image': img_src,
                })
            
            # Deduplicate
            seen = set()
            unique = []
            for p in page_products:
                if p['url'] not in seen:
                    seen.add(p['url'])
                    unique.append(p)
            
            if not unique:
                logger.info(f"No more products on page {page}, stopping")
                break
            
            all_products.extend(unique)
            logger.info(f"Page {page}: found {len(unique)} products (total: {len(all_products)})")
            
            # Be nice to server
            time.sleep(0.3)
        
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
            
            soup = BeautifulSoup(r.text, 'html.parser')
            
            product_cards = soup.find_all('a', href=True)
            page_products = []
            
            for card in product_cards:
                href = card.get('href', '')
                if not href.startswith('/') or href.startswith('//'):
                    continue
                if any(skip in href for skip in ['/iletisim', '/siparis', '/uye-', '/satin-alma', '/kampanya', '/gold', '/arama', '/kategori', '/marka']):
                    continue
                
                text = card.get_text(strip=True)
                img = card.find('img')
                img_src = img.get('src', '') if img else ''
                
                price_text = ""
                for elem in card.find_all(string=True):
                    if 'TL' in elem:
                        price_text += elem.strip() + " "
                
                code_match = re.search(r'(?:Kodu|Kod|Code)\s*[:：]\s*([A-Z0-9\.\-]+)', text, re.IGNORECASE)
                product_code = code_match.group(1) if code_match else ""
                
                page_products.append({
                    'url': urljoin('https://www.mutbex.com', href),
                    'title': text[:300],
                    'price_text': price_text.strip(),
                    'product_code': product_code,
                    'image': img_src,
                })
            
            seen = set()
            unique = []
            for p in page_products:
                if p['url'] not in seen:
                    seen.add(p['url'])
                    unique.append(p)
            
            if not unique:
                logger.info(f"No more products on page {page}, stopping")
                break
            
            all_products.extend(unique)
            logger.info(f"Page {page}: found {len(unique)} products (total: {len(all_products)})")
            
            time.sleep(0.3)
        
        return all_products
    
    def enrich_product(self, product: dict) -> dict:
        """Get detailed info from product page"""
        url = product['url']
        
        try:
            r = self.session.get(url, timeout=30)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to enrich {url}: {e}")
            return product
        
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Product name
        title_elem = soup.find('h1')
        name = title_elem.get_text(strip=True) if title_elem else product['title']
        
        # Price
        price_text = ""
        for elem in soup.find_all(string=re.compile(r'TL')):
            price_text += elem.strip() + " "
        
        current_price, old_price = self.parse_price(price_text)
        
        # Product code
        product_code = product.get('product_code', '')
        if not product_code:
            for elem in soup.find_all(string=re.compile(r'(Kodu|Kod|Code)\s*[:：]', re.I)):
                match = re.search(r'(?:Kodu|Kod|Code)\s*[:：]\s*([A-Z0-9\.\-]+)', elem, re.IGNORECASE)
                if match:
                    product_code = match.group(1)
                    break
        
        # Stock status
        stock_status = "IN_STOCK"
        stock_elem = soup.find(string=re.compile(r'(Stokta|Tükendi|Out of stock|Unavailable|Stok Yok)', re.I))
        if stock_elem:
            stock_status = "OOS"
        
        # Brand from breadcrumb
        brand = ""
        breadcrumb = soup.find('nav', class_=re.compile(r'breadcrumb'))
        if breadcrumb:
            for link in breadcrumb.find_all('a'):
                text = link.get_text(strip=True)
                if text and text not in ['Anasayfa', 'Home']:
                    brand = text
                    break
        
        # Model from URL
        model = url.split('/')[-1].replace('-', ' ').upper()
        
        product.update({
            'name': name,
            'current_price': current_price,
            'old_price': old_price,
            'product_code': product_code,
            'stock_status': stock_status,
            'brand': brand,
            'model': model,
        })
        
        return product
    
    def parse_price(self, price_text: str):
        """Parse price text"""
        if not price_text:
            return None, None
        
        # Find all price-like numbers
        numbers = re.findall(r'(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*TL', price_text)
        
        current = None
        old = None
        
        for num in numbers:
            val = float(num.replace('.', '').replace(',', '.'))
            if current is None or val < current:
                old = current
                current = val
            elif old is None or val > old:
                old = val
        
        return current, old

def main():
    scraper = MutbexBulkScraper()
    
    # 1. Scrape all Atalay products
    logger.info("=== Scraping Atalay products ===")
    atalay_products = scraper.scrape_search_results("Atalay", max_pages=25)
    logger.info(f"Found {len(atalay_products)} Atalay products")
    
    # 2. Scrape Hazırlık category products
    logger.info("=== Scraping Hazırlık category ===")
    hazirlik_products = scraper.scrape_category("https://www.mutbex.com/hazirlik-ekipmanlari", max_pages=20)
    logger.info(f"Found {len(hazirlik_products)} Hazırlık products")
    
    # 3. Scrape other relevant categories
    categories = [
        "https://www.mutbex.com/endustriyel-mutfak-malzemeleri",
        "https://www.mutbex.com/mutfak-gerecleri",
        "https://www.mutbex.com/tavalar",
        "https://www.mutbex.com/fritozler",
        "https://www.mutbex.com/bulasikhane-ekipmanlari",
        "https://www.mutbex.com/saklama-ve-tasima-ekipmanlari",
    ]
    
    for cat_url in categories:
        logger.info(f"=== Scraping category: {cat_url} ===")
        cat_products = scraper.scrape_category(cat_url, max_pages=10)
        logger.info(f"Found {len(cat_products)} products")
        hazirlik_products.extend(cat_products)
    
    # Combine and deduplicate
    all_mutbex = atalay_products + hazirlik_products
    seen = set()
    unique_mutbex = []
    for p in all_mutbex:
        if p['url'] not in seen:
            seen.add(p['url'])
            unique_mutbex.append(p)
    
    logger.info(f"Total unique Mutbex products: {len(unique_mutbex)}")
    
    # 4. Enrich products (get detailed info)
    logger.info("=== Enriching products with details ===")
    enriched = []
    for i, p in enumerate(unique_mutbex):
        if i % 50 == 0:
            logger.info(f"Enriching {i+1}/{len(unique_mutbex)}")
        enriched.append(scraper.enrich_product(p))
        time.sleep(0.1)  # Be nice
    
    # Save
    with open('mutbex_all_products.json', 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Saved {len(enriched)} enriched products to mutbex_all_products.json")

if __name__ == "__main__":
    main()