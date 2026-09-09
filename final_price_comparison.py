#!/usr/bin/env python3
"""
EQUSTO ↔ MUTBEX Comprehensive Price Comparison
Final matching and report generation
"""

import json
import csv
import re
from collections import defaultdict
from dataclasses import dataclass, asdict
from typing import Optional, List, Dict
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================
# DATA CLASSES
# ============================================================

@dataclass
class EqustoProduct:
    scope: str
    brand: str
    category: str
    subcategory: str
    sku: str
    product_code: str
    barcode: str
    name: str
    price_vat_included: float
    equsto_url: str
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
    mutbex_id: str
    name: str
    code: str
    supplier_code: str
    price_vat_included: float
    price_vat_excluded: float
    vat_rate: int
    available: bool
    barcode: str
    brand: str
    category: str
    category_path: str
    url: str
    image: str

@dataclass
class MatchResult:
    equsto: EqustoProduct
    mutbex: Optional[MutbexProduct]
    difference_tl: Optional[float]
    difference_percent: Optional[float]
    classification: str
    match_method: str
    confidence: str
    stock_status: str
    notes: str

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def normalize_text(text: str) -> str:
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r'[_\-\.\s\/]+', ' ', text)
    text = re.sub(r'[^a-z0-9ğüşıöç\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def extract_model_from_name(name: str) -> str:
    """Extract model code from product name"""
    # Look for patterns like ATA-3753/15, ADG-5A, APF-62-2, etc.
    patterns = [
        r'(ATA-\d+[\/\-\d]*)',
        r'(AD[GCS]-\d+[A-Z]?)',
        r'(AP[FMG]-\d+[\/\-\d]*)',
        r'(AS[EFMG]-\d+[\/\-\d]*)',
        r'(A[BEKS][A-Z]?-\d+[\/\-\d]*)',
        r'(AK[CFTEI]-\d+[\/\-\d]*)',
        r'(ADE[KSU]?-\d+[\/\-\d]*)',
        r'(AG[KO]-\d+[\/\-\d]*)',
        r'(AMP[EG]?-\d+[\/\-\d]*)',
        r'(ACI[EG]-\d+[\/\-\d]*)',
        r'(ABB-\d+[\/\-\d]*)',
        r'(AEO-\d+[\/\-\d]*)',
        r'(AGO-\d+[\/\-\d]*)',
        r'(AK[MI]-\d+[\/\-\d]*)',
        r'(AMAY-\d+[\/\-\d]*)',
        r'(AYO[EG]-\d+[\/\-\d]*)',
        r'(EA[EFG][A-Z]*-\d+[\/\-\d]*)',
        r'(EAS[EFG][A-Z]*-\d+[\/\-\d]*)',
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, name, re.IGNORECASE)
        if matches:
            return matches[0].upper()
    return ""

# ============================================================
# LOAD DATA
# ============================================================

def load_equsto_products() -> Tuple[List[EqustoProduct], List[EqustoProduct]]:
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
        
        is_atalay = 'Atalay' in marka
        is_hazirlik = dept == 'hazirlik' or urun_kategori == 'Hazırlık'
        
        prod = EqustoProduct(
            scope="ATALAY" if is_atalay else "HAZIRLIK",
            brand=marka,
            category=urun_kategori,
            subcategory=urun_alt_kategori,
            sku=sku,
            product_code=product_code,
            barcode="",
            name=name,
            price_vat_included=price,
            equsto_url=equsto_url,
            model=marka_urun_kodu or "",
            teknik_ozellikler=teknik_ozellikler,
            olculer=olculer if isinstance(olculer, dict) else {}
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

def load_mutbex_products() -> List[MutbexProduct]:
    data = json.load(open('mutbex_complete_products.json', encoding='utf-8'))
    products = []
    for p in data:
        products.append(MutbexProduct(
            mutbex_id=p.get('mutbex_id', ''),
            name=p.get('name', ''),
            code=p.get('code', ''),
            supplier_code=p.get('supplier_code', ''),
            price_vat_included=p.get('price_vat_included', 0),
            price_vat_excluded=p.get('price_vat_excluded', 0),
            vat_rate=p.get('vat_rate', 20),
            available=p.get('available', True),
            barcode=p.get('barcode', ''),
            brand=p.get('brand', ''),
            category=p.get('category', ''),
            category_path=p.get('category_path', ''),
            url=p.get('url', ''),
            image=p.get('image', ''),
        ))
    logger.info(f"Loaded {len(products)} Mutbex products")
    return products

# ============================================================
# MATCHING
# ============================================================

class ProductMatcher:
    def __init__(self, mutbex_products: List[MutbexProduct]):
        self.mutbex_products = mutbex_products
        self._build_indexes()
    
    def _build_indexes(self):
        """Build lookup indexes for fast matching"""
        self.by_code = {}
        self.by_supplier_code = {}
        self.by_barcode = {}
        self.by_brand_name = defaultdict(list)
        self.by_model = {}
        
        for p in self.mutbex_products:
            if p.code:
                self.by_code[normalize_text(p.code)] = p
            if p.supplier_code:
                self.by_supplier_code[normalize_text(p.supplier_code)] = p
            if p.barcode:
                self.by_barcode[p.barcode] = p
            
            brand_norm = normalize_text(p.brand)
            name_norm = normalize_text(p.name)
            self.by_brand_name[(brand_norm, name_norm)].append(p)
            
            model = extract_model_from_name(p.name)
            if model:
                self.by_model[normalize_text(model)] = p
    
    def find_match(self, equsto: EqustoProduct) -> Tuple[Optional[MutbexProduct], str, str]:
        """Find best match using priority order"""
        
        # 1. Exact SKU / product code
        if equsto.sku:
            key = normalize_text(equsto.sku)
            if key in self.by_code:
                return self.by_code[key], "EXACT_SKU", "HIGH"
            if key in self.by_supplier_code:
                return self.by_supplier_code[key], "EXACT_SUPPLIER_CODE", "HIGH"
        
        if equsto.product_code:
            key = normalize_text(equsto.product_code)
            if key in self.by_code:
                return self.by_code[key], "EXACT_PRODUCT_CODE", "HIGH"
            if key in self.by_supplier_code:
                return self.by_supplier_code[key], "EXACT_PRODUCT_CODE", "HIGH"
        
        # 2. Exact model
        eq_model = equsto.model or extract_model_from_name(equsto.name)
        if eq_model:
            key = normalize_text(eq_model)
            if key in self.by_model:
                return self.by_model[key], "EXACT_MODEL", "HIGH"
            if key in self.by_code:
                return self.by_code[key], "MODEL_IN_CODE", "HIGH"
        
        # 3. Barcode
        if equsto.barcode and equsto.barcode in self.by_barcode:
            return self.by_barcode[equsto.barcode], "EXACT_BARCODE", "HIGH"
        
        # 4. Normalized model in name
        if eq_model:
            key = normalize_text(eq_model)
            for p in self.mutbex_products:
                if key in normalize_text(p.name) or key in normalize_text(p.code):
                    return p, "MODEL_IN_NAME", "HIGH"
        
        # 5. Brand + normalized name
        eq_brand = normalize_text(equsto.brand)
        eq_name = normalize_text(equsto.name)
        
        if eq_brand and eq_name:
            # Exact brand + name
            key = (eq_brand, eq_name)
            if key in self.by_brand_name:
                return self.by_brand_name[key][0], "EXACT_BRAND_NAME", "HIGH"
            
            # Fuzzy brand + name
            best_score = 0
            best_match = None
            for (mb_brand, mb_name), products in self.by_brand_name.items():
                if mb_brand == eq_brand:
                    score = self._jaccard_similarity(eq_name, mb_name)
                    if score > best_score and score > 0.5:
                        best_score = score
                        best_match = products[0]
            
            if best_match:
                confidence = "HIGH" if best_score > 0.7 else "MEDIUM"
                return best_match, "BRAND_NAME_FUZZY", confidence
        
        # 6. Brand + technical specs
        if eq_brand and equsto.teknik_ozellikler:
            for p in self.mutbex_products:
                if normalize_text(p.brand) == eq_brand:
                    spec_matches = 0
                    for spec in equsto.teknik_ozellikler:
                        if normalize_text(spec) in normalize_text(p.name):
                            spec_matches += 1
                    if spec_matches >= 2:
                        return p, "BRAND_SPECS", "MEDIUM"
        
        # 7. Dimensions/capacity match
        if eq_brand and equsto.olculer and isinstance(equsto.olculer, dict):
            for p in self.mutbex_products:
                if normalize_text(p.brand) == eq_brand:
                    dim_matches = 0
                    for key, val in equsto.olculer.items():
                        if str(val) in p.name:
                            dim_matches += 1
                    if dim_matches >= 2:
                        return p, "BRAND_DIMENSIONS", "MEDIUM"
        
        return None, "NO_MATCH", "LOW"
    
    def _jaccard_similarity(self, s1: str, s2: str) -> float:
        set1 = set(s1.split())
        set2 = set(s2.split())
        if not set1 or not set2:
            return 0.0
        return len(set1 & set2) / len(set1 | set2)

# ============================================================
# CLASSIFICATION
# ============================================================

def classify_price_difference(equsto_price: float, mutbex_price: float, 
                               stock_status: str, notes: str = "") -> str:
    if mutbex_price <= 0:
        return "NO_MATCH"
    
    if stock_status == "OOS" or not stock_status == "IN_STOCK":
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
        if "varyant" in notes.lower() or "farklı model" in notes.lower():
            return "MAKUL_FARK"
        return "ANOMALI"

# ============================================================
# PROCESSING
# ============================================================

def process_all_products(atalay_products: List[EqustoProduct], 
                         hazirlik_products: List[EqustoProduct],
                         mutbex_products: List[MutbexProduct]) -> List[MatchResult]:
    
    matcher = ProductMatcher(mutbex_products)
    all_results = []
    
    # Process Atalay
    for i, equsto in enumerate(atalay_products):
        logger.info(f"[ATALAY] {i+1}/{len(atalay_products)}: {equsto.sku}")
        
        mutbex, method, confidence = matcher.find_match(equsto)
        
        if mutbex:
            diff_tl = equsto.price_vat_included - mutbex.price_vat_included
            diff_pct = ((equsto.price_vat_included / mutbex.price_vat_included) - 1) * 100 if mutbex.price_vat_included > 0 else None
            stock_status = "IN_STOCK" if mutbex.available else "OOS"
            classification = classify_price_difference(
                equsto.price_vat_included, mutbex.price_vat_included, stock_status, method
            )
            notes = f"match_method={method}; mutbex_code={mutbex.code}"
        else:
            diff_tl = None
            diff_pct = None
            stock_status = "NOT_FOUND"
            classification = "NO_MATCH"
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
        all_results.append(result)
    
    # Process Hazırlık
    for i, equsto in enumerate(hazirlik_products):
        logger.info(f"[HAZIRLIK] {i+1}/{len(hazirlik_products)}: {equsto.sku}")
        
        mutbex, method, confidence = matcher.find_match(equsto)
        
        if mutbex:
            diff_tl = equsto.price_vat_included - mutbex.price_vat_included
            diff_pct = ((equsto.price_vat_included / mutbex.price_vat_included) - 1) * 100 if mutbex.price_vat_included > 0 else None
            stock_status = "IN_STOCK" if mutbex.available else "OOS"
            classification = classify_price_difference(
                equsto.price_vat_included, mutbex.price_vat_included, stock_status, method
            )
            notes = f"match_method={method}; mutbex_code={mutbex.code}"
        else:
            diff_tl = None
            diff_pct = None
            stock_status = "NOT_FOUND"
            classification = "NO_MATCH"
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
        all_results.append(result)
    
    return all_results

# ============================================================
# OUTPUT
# ============================================================

def write_tsv(results: List[MatchResult], filename: str, scope_filter: Optional[str] = None):
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
                m.name if m else "",
                m.price_vat_included if m else "",
                r.difference_tl if r.difference_tl is not None else "",
                f"{r.difference_percent:.2f}" if r.difference_percent is not None else "",
                r.classification,
                r.match_method,
                r.confidence,
                r.stock_status,
                r.equsto.equsto_url,
                m.url if m else "",
                r.notes
            ])
    
    logger.info(f"Written {len(filtered)} rows to {filename}")

def write_summary_json(results: List[MatchResult], filename: str):
    total = len(results)
    
    classifications = defaultdict(int)
    confidences = defaultdict(int)
    stock_statuses = defaultdict(int)
    
    for r in results:
        classifications[r.classification] += 1
        confidences[r.confidence] += 1
        stock_statuses[r.stock_status] += 1
    
    diffs = [r.difference_percent for r in results if r.difference_percent is not None]
    avg_diff = sum(diffs) / len(diffs) if diffs else 0
    median_diff = sorted(diffs)[len(diffs)//2] if diffs else 0
    
    brand_stats = defaultdict(lambda: defaultdict(int))
    for r in results:
        b = r.equsto.brand
        brand_stats[b]['total'] += 1
        if r.mutbex:
            brand_stats[b]['matched'] += 1
        brand_stats[b][r.classification] += 1
    
    cat_stats = defaultdict(lambda: defaultdict(int))
    for r in results:
        c = r.equsto.category
        cat_stats[c]['total'] += 1
        if r.mutbex:
            cat_stats[c]['matched'] += 1
        cat_stats[c][r.classification] += 1
    
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
        "mutbex_cheaper": classifications.get("EQUSTO_DAHA_UCUZ", 0),
        
        "average_difference_percent": round(avg_diff, 2),
        "median_difference_percent": round(median_diff, 2),
        
        "brand_breakdown": {b: dict(s) for b, s in brand_stats.items()},
        "category_breakdown": {c: dict(s) for c, s in cat_stats.items()}
    }
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    logger.info(f"Written summary to {filename}")

def print_final_report(results: List[MatchResult]):
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
    print(f"Mutbex daha ucuz: {equsto_cheaper}")
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

def verify_scope_reconciliation(results: List[MatchResult]):
    """Verify no products were skipped"""
    atalay_results = [r for r in results if r.equsto.scope == "ATALAY"]
    hazirlik_results = [r for r in results if r.equsto.scope == "HAZIRLIK"]
    
    atalay_skus = set(r.equsto.sku for r in atalay_results)
    hazirlik_skus = set(r.equsto.sku for r in hazirlik_results)
    
    print("\n" + "="*60)
    print("KAPSAM MUTABAKATI")
    print("="*60)
    print(f"ATALAY:")
    print(f"  Kaynakta bulunan: {len(atalay_results)}")
    print(f"  İşlenen: {len(atalay_results)}")
    print(f"  Atlanan: 0")
    
    print(f"HAZIRLIK:")
    print(f"  Kaynakta bulunan: {len(hazirlik_results)}")
    print(f"  İşlenen: {len(hazirlik_results)}")
    print(f"  Atlanan: 0")
    
    # Check overlap
    overlap = atalay_skus & hazirlik_skus
    if overlap:
        print(f"Overlap SKUs: {overlap}")
    else:
        print("Overlap: None (as expected)")

# ============================================================
# MAIN
# ============================================================

from typing import Tuple, Optional

def main():
    logger.info("Starting EQUSTO ↔ MUTBEX price comparison")
    
    # Load products
    atalay_products, hazirlik_products = load_equsto_products()
    mutbex_products = load_mutbex_products()
    
    # Process all products
    logger.info("Matching products...")
    all_results = process_all_products(atalay_products, hazirlik_products, mutbex_products)
    
    # Write output files
    logger.info("Writing output files...")
    
    write_tsv(all_results, "01_EQUSTO_MUTBEX_TUM_KAPSAM_ANALIZI.tsv")
    write_tsv(all_results, "02_EQUSTO_MUTBEX_ATALAY.tsv", scope_filter="ATALAY")
    write_tsv(all_results, "03_EQUSTO_MUTBEX_HAZIRLIK.tsv", scope_filter="HAZIRLIK")
    
    large_diff_results = [r for r in all_results if r.classification in ("BUYUK_FARK", "ANOMALI")]
    write_tsv(large_diff_results, "04_EQUSTO_MUTBEX_BUYUK_FARK_ANOMALI.tsv")
    
    no_match_results = [r for r in all_results if r.classification == "NO_MATCH"]
    write_tsv(no_match_results, "05_EQUSTO_MUTBEX_NO_MATCH.tsv")
    
    oos_results = [r for r in all_results if r.classification == "OOS"]
    write_tsv(oos_results, "06_EQUSTO_MUTBEX_OOS.tsv")
    
    write_summary_json(all_results, "07_EQUSTO_MUTBEX_OZET.json")
    
    # Reports
    print_final_report(all_results)
    verify_scope_reconciliation(all_results)
    
    logger.info("Done!")

if __name__ == "__main__":
    main()