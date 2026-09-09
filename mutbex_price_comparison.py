#!/usr/bin/env python3
"""
EQUSTO ↔ MUTBEX Comprehensive Price Comparison
Matches Atalay (575) + Hazırlık (557 unique) = 1132 products with Mutbex prices
"""

import json
import csv
import re
import time
import requests
from bs4 import BeautifulSoup
from urllib.parse import quote_plus, urljoin
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict, Tuple
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class EqustoProduct:
    scope: str  # "ATALAY" or "HAZIRLIK"
    brand: str
    category: str
    subcategory: str
    sku: str
    product_code: str
    barcode: str
    name: str
    price_vat_included: float
    equsto_url: str
    # Additional fields for matching
    model: str = ""
    teknik_ozellikler: List[str] = None
    olculer: Dict = None
    
    def __post_init__(self):
        if self.teknik_ozellikler is None:
            self.teknik_ozellikler = []
        if self.olculer is None:
            self.olculer = {}

@dataclass
class MutbexProduct:
    product_name: str
    brand: str
    product_code: str
    barcode: str
    current_sale_price: float
    old_price: Optional[float]
    stock_status: str
    mutbex_url: str
    mutbex_id: str = ""
    model: str = ""

@dataclass
class MatchResult:
    equsto: EqustoProduct
    mutbex: Optional[MutbexProduct]
    difference_tl: Optional[float]
    difference_percent: Optional[float]
    classification: str
    match_method: str
    confidence: str  # HIGH, MEDIUM, LOW
    stock_status: str
    notes: str

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def normalize_text(text: str) -> str:
    """Normalize text for comparison"""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[_\-\.\s\/]+', ' ', text)
    text = re.sub(r'[^a-z0-9\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_price(text: str) -> Optional[float]:
    """Extract price from text like '21.560 TL' or '81.360 TL'"""
    if not text:
        return None
    # Remove currency symbols and spaces
    text = text.replace('TL', '').replace('tl', '').replace('₺', '').strip()
    # Handle thousand separators
    text = text.replace('.', '').replace(',', '.')
    try:
        return float(text)
    except ValueError:
        # Try to extract number
        match = re.search(r'([\d.,]+)', text)
        if match:
            num = match.group(1).replace('.', '').replace(',', '.')
            try:
                return float(num)
            except ValueError:
                pass
    return None

def parse_mutbex_price(price_text: str) -> Tuple[Optional[float], Optional[float]]:
    """Parse Mutbex price text which may have old and new price"""
    if not price_text:
        return None, None
    
    # Look for patterns like "83.530 TL 79.665 TL" or "59.664 TL 50.172 TL"
    prices = re.findall(r'([\d.]+),?(\d{3})?\s*TL', price_text.replace('.', '').replace(',', '.'))
    
    # Better approach: find all numbers that look like prices
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

# ============================================================
# EQUSTO PRODUCT LOADING
# ============================================================

def load_equsto_products() -> Tuple[List[EqustoProduct], List[EqustoProduct]]:
    """Load and parse Equsto master catalog"""
    data = json.load(open(r'C:\D Disk\EQUSTO-WORK\E-TICARET\site\public\data\equsto-katalog-master.json', encoding='utf-8'))
    products = data.get('products', [])
    
    atalay_products = []
    hazirlik_products = []
    
    for p in products:
        marka = p.get('marka', '')
        dept = p.get('dept', '')
        urun_kategori = p.get('urun_kategori', '')
        urun_alt_kategori = p.get('urun_alt_kategori', '')
        marka_kodu = p.get('marka_kodu', '')
        marka_urun_kodu = p.get('marka_urun_kodu', '')
        equsto_kod = p.get('equsto_kod', '')
        aciklama = p.get('aciklama', '')
        fiyat_tl = p.get('fiyat_tl', 0)
        teknik_ozellikler = p.get('teknik_ozellikler', [])
        olculer = p.get('olculer', {})
        
        sku = marka_urun_kodu or equsto_kod or ""
        product_code = marka_kodu or ""
        name = aciklama or ""
        price = float(fiyat_tl) if fiyat_tl else 0.0
        equsto_url = f"https://equsto.com/shop/{sku.lower()}" if sku else ""
        
        # Determine scope
        is_atalay = 'Atalay' in marka
        is_hazirlik = dept == 'hazirlik' or urun_kategori == 'Hazırlık'
        
        prod = EqustoProduct(
            scope="ATALAY" if is_atalay else "HAZIRLIK",
            brand=marka,
            category=urun_kategori,
            subcategory=urun_alt_kategori,
            sku=sku,
            product_code=product_code,
            barcode="",  # Not available in source
            name=name,
            price_vat_included=price,
            equsto_url=equsto_url,
            model=marka_urun_kodu or "",
            teknik_ozellikler=teknik_ozellikler,
            olculer=olculer
        )
        
        if is_atalay:
            atalay_products.append(prod)
        if is_hazirlik:
            hazirlik_products.append(prod)
    
    # Deduplicate hazirlik by SKU
    seen = set()
    unique_hazirlik = []
    for p in hazirlik_products:
        if p.sku not in seen:
            seen.add(p.sku)
            unique_hazirlik.append(p)
    
    logger.info(f"Loaded {len(atalay_products)} Atalay products")
    logger.info(f"Loaded {len(unique_hazirlik)} unique Hazırlık products")
    
    return atalay_products, unique_hazirlik

# ============================================================
# MUTBEX SCRAPING
# ============================================================

class MutbexScraper:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        })
        self.cache = {}
        self.cache_lock = threading.Lock()
    
    def search(self, query: str, page: int = 1) -> List[Dict]:
        """Search Mutbex and return product list"""
        cache_key = f"{query}_page{page}"
        with self.cache_lock:
            if cache_key in self.cache:
                return self.cache[cache_key]
        
        url = f"https://www.mutbex.com/arama?q={quote_plus(query)}&page={page}"
        try:
            r = self.session.get(url, timeout=30)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"Search failed for '{query}' page {page}: {e}")
            return []
        
        soup = BeautifulSoup(r.text, 'html.parser')
        products = []
        
        # Find product cards
        for card in soup.find_all('a', href=True):
            href = card.get('href', '')
            if not href.startswith('/') or href.startswith('//'):
                continue
            if any(skip in href for skip in ['/iletisim', '/siparis', '/uye-', '/satin-alma', '/kampanya', '/gold', '/arama']):
                continue
            
            # Extract product info from card
            text = card.get_text(strip=True)
            img = card.find('img')
            img_src = img.get('src', '') if img else ''
            
            # Look for price in card
            price_text = ""
            for elem in card.find_all(string=True):
                if 'TL' in elem:
                    price_text += elem + " "
            
            # Look for product code
            code_match = re.search(r'(?:Kodu|Kod|Code)\s*[:：]\s*([A-Z0-9\.\-]+)', text, re.IGNORECASE)
            product_code = code_match.group(1) if code_match else ""
            
            products.append({
                'url': urljoin('https://www.mutbex.com', href),
                'title': text[:200],
                'price_text': price_text.strip(),
                'product_code': product_code,
                'image': img_src,
            })
        
        # Deduplicate by URL
        seen = set()
        unique = []
        for p in products:
            if p['url'] not in seen:
                seen.add(p['url'])
                unique.append(p)
        
        with self.cache_lock:
            self.cache[cache_key] = unique
        
        return unique
    
    def get_product_details(self, url: str) -> Optional[MutbexProduct]:
        """Get detailed product info from product page"""
        with self.cache_lock:
            if url in self.cache:
                return self.cache[url]
        
        try:
            r = self.session.get(url, timeout=30)
            r.raise_for_status()
        except Exception as e:
            logger.warning(f"Failed to fetch product {url}: {e}")
            return None
        
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Extract product name
        title_elem = soup.find('h1') or soup.find('h2', class_=re.compile(r'product|title'))
        name = title_elem.get_text(strip=True) if title_elem else ""
        
        # Extract price
        price_text = ""
        for elem in soup.find_all(string=re.compile(r'TL')):
            price_text += elem.strip() + " "
        
        current_price, old_price = parse_mutbex_price(price_text)
        
        # Extract product code
        product_code = ""
        for elem in soup.find_all(string=re.compile(r'(Kodu|Kod|Code)\s*[:：]', re.I)):
            match = re.search(r'(?:Kodu|Kod|Code)\s*[:：]\s*([A-Z0-9\.\-]+)', elem, re.IGNORECASE)
            if match:
                product_code = match.group(1)
                break
        
        # Extract stock status
        stock_status = "IN_STOCK"
        stock_elem = soup.find(string=re.compile(r'(Stokta|Tükendi|Out of stock|Unavailable|Stok Yok)', re.I))
        if stock_elem:
            stock_status = "OOS"
        
        # Extract brand from breadcrumbs or page
        brand = ""
        breadcrumb = soup.find('nav', class_=re.compile(r'breadcrumb'))
        if breadcrumb:
            for link in breadcrumb.find_all('a'):
                text = link.get_text(strip=True)
                if text and text not in ['Anasayfa', 'Home']:
                    brand = text
                    break
        
        # Extract model from URL
        model = url.split('/')[-1].replace('-', ' ').upper()
        
        mutbex_product = MutbexProduct(
            product_name=name,
            brand=brand,
            product_code=product_code,
            barcode="",
            current_sale_price=current_price or 0.0,
            old_price=old_price,
            stock_status=stock_status,
            mutbex_url=url,
            mutbex_id="",
            model=model
        )
        
        with self.cache_lock:
            self.cache[url] = mutbex_product
        
        return mutbex_product
    
    def find_best_match(self, equsto: EqustoProduct) -> Tuple[Optional[MutbexProduct], str, str]:
        """Find best Mutbex match for an Equsto product"""
        # Strategy 1: Search by model/SKU
        search_terms = []
        if equsto.model:
            search_terms.append(equsto.model)
        if equsto.sku:
            search_terms.append(equsto.sku)
        if equsto.product_code:
            search_terms.append(equsto.product_code)
        # Add normalized name
        search_terms.append(normalize_text(equsto.name)[:50])
        
        best_match = None
        best_method = ""
        best_confidence = "LOW"
        
        for term in search_terms:
            if not term or len(term) < 3:
                continue
            
            # Search first page
            results = self.search(term, 1)
            if not results:
                continue
            
            for result in results[:5]:  # Check top 5
                detail = self.get_product_details(result['url'])
                if not detail:
                    continue
                
                # Calculate match score
                score, method, confidence = self._calculate_match_score(equsto, detail)
                if score > 0 and (best_match is None or score > best_match[0]):
                    best_match = (score, detail, method, confidence)
        
        if best_match:
            return best_match[1], best_match[2], best_match[3]
        return None, "NO_MATCH", "LOW"
    
    def _calculate_match_score(self, equsto: EqustoProduct, mutbex: MutbexProduct) -> Tuple[float, str, str]:
        """Calculate match score between Equsto and Mutbex product"""
        score = 0.0
        method = ""
        confidence = "LOW"
        
        # Normalize for comparison
        eq_model = normalize_text(equsto.model)
        eq_name = normalize_text(equsto.name)
        eq_sku = normalize_text(equsto.sku)
        eq_code = normalize_text(equsto.product_code)
        
        mb_model = normalize_text(mutbex.model)
        mb_name = normalize_text(mutbex.product_name)
        mb_code = normalize_text(mutbex.product_code)
        
        # 1. Exact SKU/Model match
        if eq_model and eq_model == mb_model:
            return 100.0, "EXACT_MODEL", "HIGH"
        if eq_sku and eq_sku == mb_code:
            return 95.0, "EXACT_SKU", "HIGH"
        if eq_code and eq_code == mb_code:
            return 95.0, "EXACT_PRODUCT_CODE", "HIGH"
        
        # 2. Model contained in name or vice versa
        if eq_model and eq_model in mb_name:
            return 90.0, "MODEL_IN_NAME", "HIGH"
        if mb_model and mb_model in eq_name:
            return 90.0, "NAME_CONTAINS_MODEL", "HIGH"
        
        # 3. Brand + normalized name similarity
        eq_brand_norm = normalize_text(equsto.brand)
        mb_brand_norm = normalize_text(mutbex.brand)
        
        if eq_brand_norm and mb_brand_norm and eq_brand_norm == mb_brand_norm:
            # Brand matches, check name similarity
            name_similarity = self._jaccard_similarity(eq_name, mb_name)
            if name_similarity > 0.7:
                return 80.0 + name_similarity * 10, "BRAND_NAME_HIGH", "HIGH"
            elif name_similarity > 0.5:
                return 60.0 + name_similarity * 10, "BRAND_NAME_MEDIUM", "MEDIUM"
            elif name_similarity > 0.3:
                return 40.0 + name_similarity * 10, "BRAND_NAME_LOW", "LOW"
        
        # 4. Technical specs match (for hazirlik products)
        if equsto.teknik_ozellikler:
            # Check if key specs match in Mutbex name
            for spec in equsto.teknik_ozellikler:
                spec_norm = normalize_text(spec)
                if spec_norm and spec_norm in mb_name:
                    score += 5
        
        # 5. Dimensions/capacity match
        if equsto.olculer and isinstance(equsto.olculer, dict):
            for key, val in equsto.olculer.items():
                val_str = normalize_text(str(val))
                if val_str and val_str in mb_name:
                    score += 3
        
        if score > 0:
            if score >= 70:
                confidence = "HIGH"
            elif score >= 40:
                confidence = "MEDIUM"
            else:
                confidence = "LOW"
            return score, "SPEC_MATCH", confidence
        
        return 0.0, "", "LOW"
    
    def _jaccard_similarity(self, s1: str, s2: str) -> float:
        """Jaccard similarity of word sets"""
        set1 = set(s1.split())
        set2 = set(s2.split())
        if not set1 or not set2:
            return 0.0
        intersection = len(set1 & set2)
        union = len(set1 | set2)
        return intersection / union if union > 0 else 0.0

# ============================================================
# CLASSIFICATION
# ============================================================

def classify_price_difference(equsto_price: float, mutbex_price: float, 
                               confidence: str, notes: str = "") -> str:
    """Classify price difference according to rules"""
    if mutbex_price <= 0:
        return "NO_MATCH"
    
    if "OOS" in notes or mutbex_price is None:
        return "OOS"
    
    diff_pct = ((equsto_price / mutbex_price) - 1) * 100
    
    if equsto_price <= mutbex_price:
        return "EQUSTO_DAHA_UCUZ"
    
    if diff_pct <= 5:
        return "MATCH"
    elif diff_pct <= 15:
        return "MAKUL_FARK"
    elif diff_pct <= 30:
        return "BUYUK_FARK"
    else:
        # Check if technical variant difference
        if "varyant" in notes.lower() or "farklı model" in notes.lower():
            return "MAKUL_FARK"
        return "ANOMALI"

# ============================================================
# MAIN PROCESSING
# ============================================================

def process_products(products: List[EqustoProduct], scope: str, scraper: MutbexScraper) -> List[MatchResult]:
    """Process a list of products and match with Mutbex"""
    results = []
    
    for i, equsto in enumerate(products):
        logger.info(f"[{scope}] Processing {i+1}/{len(products)}: {equsto.sku} - {equsto.name[:60]}")
        
        mutbex, method, confidence = scraper.find_best_match(equsto)
        
        if mutbex:
            diff_tl = equsto.price_vat_included - mutbex.current_sale_price
            diff_pct = ((equsto.price_vat_included / mutbex.current_sale_price) - 1) * 100 if mutbex.current_sale_price > 0 else None
            stock_status = mutbex.stock_status
            classification = classify_price_difference(
                equsto.price_vat_included, 
                mutbex.current_sale_price,
                confidence,
                f"method={method}"
            )
            notes = f"match_method={method}; mutbex_code={mutbex.product_code}"
        else:
            diff_tl = None
            diff_pct = None
            stock_status = "NOT_FOUND"
            classification = "NO_MATCH"
            method = "NONE"
            notes = "No match found on Mutbex"
        
        result = MatchResult(
            equsto=equsto,
            mutbex=mutbex,
            difference_tl=diff_tl,
            difference_percent=diff_pct,
            classification=classification,
            match_method=method,
            confidence=confidence,
            stock_status=stock_status,
            notes=notes
        )
        results.append(result)
        
        # Rate limiting
        time.sleep(0.5)
    
    return results

# ============================================================
# OUTPUT GENERATION
# ============================================================

def write_tsv(results: List[MatchResult], filename: str, scope_filter: Optional[str] = None):
    """Write results to TSV"""
    filtered = results
    if scope_filter:
        filtered = [r for r in results if r.equsto.scope == scope_filter]
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f, delimiter='\t')
        writer.writerow([
            'scope', 'brand', 'category', 'subcategory', 'sku', 'product_code', 'barcode',
            'equsto_name', 'equsto_price_vat_included', 'mutbex_name', 'mutbex_price_vat_included',
            'difference_tl', 'difference_percent', 'classification', 'match_method',
            'confidence', 'stock_status', 'equsto_url', 'mutbex_url', 'notes'
        ])
        
        for r in filtered:
            m = r.mutbex
            writer.writerow([
                r.equsto.scope,
                r.equsto.brand,
                r.equsto.category,
                r.equsto.subcategory,
                r.equsto.sku,
                r.equsto.product_code,
                r.equsto.barcode,
                r.equsto.name,
                r.equsto.price_vat_included,
                m.product_name if m else "",
                m.current_sale_price if m else "",
                r.difference_tl if r.difference_tl is not None else "",
                f"{r.difference_percent:.2f}" if r.difference_percent is not None else "",
                r.classification,
                r.match_method,
                r.confidence,
                r.stock_status,
                r.equsto.equsto_url,
                m.mutbex_url if m else "",
                r.notes
            ])
    
    logger.info(f"Written {len(filtered)} rows to {filename}")

def write_summary_json(results: List[MatchResult], filename: str):
    """Write summary JSON"""
    total = len(results)
    
    # Overall counts
    classifications = defaultdict(int)
    confidences = defaultdict(int)
    stock_statuses = defaultdict(int)
    
    for r in results:
        classifications[r.classification] += 1
        confidences[r.confidence] += 1
        stock_statuses[r.stock_status] += 1
    
    # Price differences for matched products
    diffs = [r.difference_percent for r in results if r.difference_percent is not None]
    avg_diff = sum(diffs) / len(diffs) if diffs else 0
    median_diff = sorted(diffs)[len(diffs)//2] if diffs else 0
    
    # By brand
    brand_stats = defaultdict(lambda: defaultdict(int))
    for r in results:
        b = r.equsto.brand
        brand_stats[b]['total'] += 1
        if r.mutbex:
            brand_stats[b]['matched'] += 1
        brand_stats[b][r.classification] += 1
    
    # By category
    cat_stats = defaultdict(lambda: defaultdict(int))
    for r in results:
        c = r.equsto.category
        cat_stats[c]['total'] += 1
        if r.mutbex:
            cat_stats[c]['matched'] += 1
        cat_stats[c][r.classification] += 1
    
    # Scope counts
    atalay_count = sum(1 for r in results if r.equsto.scope == "ATALAY")
    hazirlik_count = sum(1 for r in results if r.equsto.scope == "HAZIRLIK")
    
    summary = {
        "total_atalay": atalay_count,
        "total_hazirlik": hazirlik_count,
        "total_previous_approval": 0,
        "total_previous_large_difference": 0,
        "total_unique_products": total,
        
        "total_matches": sum(1 for r in results if r.mutbex),
        "high_confidence_matches": confidences.get("HIGH", 0),
        "medium_confidence_matches": confidences.get("MEDIUM", 0),
        "low_confidence_matches": confidences.get("LOW", 0),
        "no_match": classifications.get("NO_MATCH", 0),
        "oos": classifications.get("OOS", 0),
        
        "equsto_cheaper": classifications.get("EQUSTO_DAHA_UCUZ", 0),
        "match": classifications.get("MATCH", 0),
        "reasonable_difference": classifications.get("MAKUL_FARK", 0),
        "large_difference": classifications.get("BUYUK_FARK", 0),
        "anomaly": classifications.get("ANOMALI", 0),
        "mutbex_cheaper": 0,  # Equsto cheaper is same as mutbex more expensive
        
        "average_difference_percent": round(avg_diff, 2),
        "median_difference_percent": round(median_diff, 2),
        
        "brand_breakdown": {
            b: dict(s) for b, s in brand_stats.items()
        },
        "category_breakdown": {
            c: dict(s) for c, s in cat_stats.items()
        }
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Written summary to {filename}")

def print_final_report(results: List[MatchResult]):
    """Print final summary report"""
    total = len(results)
    atalay = sum(1 for r in results if r.equsto.scope == "ATALAY")
    hazirlik = sum(1 for r in results if r.equsto.scope == "HAZIRLIK")
    
    matched = sum(1 for r in results if r.mutbex)
    high_conf = sum(1 for r in results if r.confidence == "HIGH")
    med_conf = sum(1 for r in results if r.confidence == "MEDIUM")
    low_conf = sum(1 for r in results if r.confidence == "LOW")
    no_match = sum(1 for r in results if r.classification == "NO_MATCH")
    oos = sum(1 for r in results if r.classification == "OOS")
    
    equsto_cheaper = sum(1 for r in results if r.classification == "EQUSTO_DAHA_UCUZ")
    match = sum(1 for r in results if r.classification == "MATCH")
    makul = sum(1 for r in results if r.classification == "MAKUL_FARK")
    buyuk = sum(1 for r in results if r.classification == "BUYUK_FARK")
    anomaly = sum(1 for r in results if r.classification == "ANOMALI")
    
    print("\n" + "="*60)
    print("FINAL REPORT")
    print("="*60)
    print(f"ATALAY: {atalay} ürün")
    print(f"HAZIRLIK: {hazirlik} ürün")
    print(f"UNIQUE TOPLAM: {total} ürün")
    print()
    print(f"Mutbex eşleşmesi: {matched}")
    print(f"HIGH: {high_conf}")
    print(f"MEDIUM: {med_conf}")
    print(f"LOW: {low_conf}")
    print(f"NO_MATCH: {no_match}")
    print(f"OOS: {oos}")
    print()
    print(f"Equsto daha ucuz: {equsto_cheaper}")
    print(f"MATCH: {match}")
    print(f"MAKUL_FARK: {makul}")
    print(f"BUYUK_FARK: {buyuk}")
    print(f"ANOMALI: {anomaly}")
    print(f"Mutbex daha ucuz: {equsto_cheaper}")  # Same as Equsto cheaper
    print()
    
    # Top 20 price differences
    matched_results = [r for r in results if r.difference_percent is not None]
    matched_results.sort(key=lambda x: abs(x.difference_percent or 0), reverse=True)
    
    print("En büyük 20 fiyat farkı:")
    for r in matched_results[:20]:
        print(f"  {r.equsto.sku}: {r.difference_percent:.1f}% ({r.classification}) - {r.equsto.name[:50]}")
    
    print()
    print("En büyük 20 ANOMALİ adayı:")
    anomaly_results = [r for r in results if r.classification == "ANOMALI"]
    anomaly_results.sort(key=lambda x: x.difference_percent or 0, reverse=True)
    for r in anomaly_results[:20]:
        print(f"  {r.equsto.sku}: {r.difference_percent:.1f}% - {r.equsto.name[:50]}")
    
    print()
    print("En çok NO_MATCH olan marka/kategori:")
    no_match_brands = defaultdict(int)
    no_match_cats = defaultdict(int)
    for r in results:
        if r.classification == "NO_MATCH":
            no_match_brands[r.equsto.brand] += 1
            no_match_cats[r.equsto.category] += 1
    
    for brand, count in sorted(no_match_brands.items(), key=lambda x: -x[1])[:10]:
        print(f"  Brand {brand}: {count}")
    for cat, count in sorted(no_match_cats.items(), key=lambda x: -x[1])[:10]:
        print(f"  Category {cat}: {count}")
    
    print()
    print("FİYAT DEĞİŞİKLİĞİ YAPILMADI. DEPLOY YAPILMADI.")

# ============================================================
# MAIN
# ============================================================

def main():
    logger.info("Starting EQUSTO ↔ MUTBEX price comparison")
    
    # Load products
    atalay_products, hazirlik_products = load_equsto_products()
    
    # Combine all products
    all_products = atalay_products + hazirlik_products
    logger.info(f"Total products to process: {len(all_products)}")
    
    # Initialize scraper
    scraper = MutbexScraper()
    
    # Process all products
    logger.info("Processing Atalay products...")
    atalay_results = process_products(atalay_products, "ATALAY", scraper)
    
    logger.info("Processing Hazırlık products...")
    hazirlik_results = process_products(hazirlik_products, "HAZIRLIK", scraper)
    
    all_results = atalay_results + hazirlik_results
    
    # Write output files
    logger.info("Writing output files...")
    
    write_tsv(all_results, "01_EQUSTO_MUTBEX_TUM_KAPSAM_ANALIZI.tsv")
    write_tsv(all_results, "02_EQUSTO_MUTBEX_ATALAY.tsv", scope_filter="ATALAY")
    write_tsv(all_results, "03_EQUSTO_MUTBEX_HAZIRLIK.tsv", scope_filter="HAZIRLIK")
    
    # Large difference + anomaly
    large_diff_results = [r for r in all_results if r.classification in ("BUYUK_FARK", "ANOMALI")]
    write_tsv(large_diff_results, "04_EQUSTO_MUTBEX_BUYUK_FARK_ANOMALI.tsv")
    
    # No match
    no_match_results = [r for r in all_results if r.classification == "NO_MATCH"]
    write_tsv(no_match_results, "05_EQUSTO_MUTBEX_NO_MATCH.tsv")
    
    # OOS
    oos_results = [r for r in all_results if r.classification == "OOS"]
    write_tsv(oos_results, "06_EQUSTO_MUTBEX_OOS.tsv")
    
    # Summary JSON
    write_summary_json(all_results, "07_EQUSTO_MUTBEX_OZET.json")
    
    # Final report
    print_final_report(all_results)
    
    logger.info("Done!")

if __name__ == "__main__":
    main()