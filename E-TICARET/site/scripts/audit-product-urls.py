#!/usr/bin/env python3
"""
Equsto Product URL HTTP Audit
Crawls all product URLs from sitemaps and records HTTP status, redirects, timing, etc.
"""

import asyncio
import aiohttp
import xml.etree.ElementTree as ET
import csv
import json
import time
from dataclasses import dataclass, asdict
from typing import List, Dict, Set
from urllib.parse import urljoin
import sys
from pathlib import Path

# Configuration
SITEMAP_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\public")
OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")
SITEMAP_PATTERNS = [
    "sitemap-shop-products-*.xml",
    "sitemap-shop-products-en-*.xml",
]

# Crawl settings
CONCURRENCY = 10  # Max concurrent requests
TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10)
MAX_REDIRECTS = 10
RATE_LIMIT_DELAY = 0.1  # Seconds between requests per worker
BATCH_SIZE = 100  # Save results every N URLs

@dataclass
class AuditResult:
    url: str
    status: str
    final_url: str
    redirect_count: int
    redirect_chain: str
    response_time_ms: int
    error: str

class URLAuditor:
    def __init__(self):
        self.results: List[AuditResult] = []
        self.semaphore = asyncio.Semaphore(CONCURRENCY)
        self.session: aiohttp.ClientSession = None
        self.processed = 0
        self.start_time = time.time()
        self.csv_path = None
        self.csv_writer = None
        self.csv_file = None
    
    def extract_urls_from_sitemaps(self) -> List[str]:
        """Extract all unique product URLs from sitemap files."""
        urls = set()
        ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for pattern in SITEMAP_PATTERNS:
            for sitemap_file in SITEMAP_DIR.glob(pattern):
                try:
                    tree = ET.parse(sitemap_file)
                    root = tree.getroot()
                    for url_elem in root.findall('sm:url/sm:loc', ns):
                        url = url_elem.text.strip()
                        if url:
                            urls.add(url)
                except Exception as e:
                    print(f"Error parsing {sitemap_file}: {e}")
        
        return sorted(urls)
    
    async def check_url(self, url: str) -> AuditResult:
        """Check a single URL with redirect tracking."""
        async with self.semaphore:
            redirect_chain = []
            redirect_count = 0
            final_url = url
            status = "ERROR"
            error = ""
            response_time_ms = 0
            
            start = time.time()
            current_url = url
            
            try:
                for _ in range(MAX_REDIRECTS + 1):
                    redirect_chain.append(current_url)
                    
                    try:
                        async with self.session.request(
                            "HEAD", current_url,
                            allow_redirects=False,
                            timeout=TIMEOUT
                        ) as resp:
                            response_time_ms = int((time.time() - start) * 1000)
                            status = str(resp.status)
                            
                            if resp.status in (301, 302, 303, 307, 308):
                                location = resp.headers.get('Location')
                                if location:
                                    current_url = urljoin(current_url, location)
                                    redirect_count += 1
                                    continue
                            elif resp.status == 200:
                                final_url = current_url
                                break
                            else:
                                final_url = current_url
                                break
                    except aiohttp.ClientResponseError as e:
                        status = str(e.status)
                        final_url = current_url
                        break
                        
            except asyncio.TimeoutError:
                status = "TIMEOUT"
                error = "Request timeout"
            except aiohttp.ClientConnectorError as e:
                status = "CONNECTION_ERROR"
                error = str(e)
            except Exception as e:
                status = "ERROR"
                error = str(e)
            
            if response_time_ms == 0:
                response_time_ms = int((time.time() - start) * 1000)
            
            self.processed += 1
            if self.processed % 100 == 0:
                elapsed = time.time() - self.start_time
                rate = self.processed / elapsed if elapsed > 0 else 0
                print(f"Progress: {self.processed}/{len(self.urls)} ({rate:.1f} urls/s) - {url}")
                sys.stdout.flush()
            
            await asyncio.sleep(RATE_LIMIT_DELAY)
            
            return AuditResult(
                url=url,
                status=status,
                final_url=final_url,
                redirect_count=redirect_count,
                redirect_chain=" -> ".join(redirect_chain) if redirect_chain else url,
                response_time_ms=response_time_ms,
                error=error
            )
    
    async def run_audit(self):
        """Run the full audit with incremental saving."""
        print("Extracting URLs from sitemaps...")
        self.urls = self.extract_urls_from_sitemaps()
        print(f"Found {len(self.urls)} unique product URLs")
        
        # Initialize incremental CSV
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        self.csv_path = OUTPUT_DIR / "product-url-http-audit.csv"
        self.csv_file = open(self.csv_path, 'w', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
        self.csv_writer.writerow(['url', 'status', 'final_url', 'redirect_count', 'redirect_chain', 'response_time_ms', 'error'])
        self.csv_file.flush()
        
        connector = aiohttp.TCPConnector(
            limit=CONCURRENCY,
            limit_per_host=CONCURRENCY,
            force_close=True,
            enable_cleanup_closed=True
        )
        
        async with aiohttp.ClientSession(
            connector=aiohttp.TCPConnector(
                limit=CONCURRENCY,
                limit_per_host=CONCURRENCY,
                force_close=True,
                enable_cleanup_closed=True
            ),
            headers={'User-Agent': 'Equsto-SEO-Audit/1.0 (+https://equsto.com)'}
        ) as session:
            self.session = session
            print(f"Starting audit with concurrency={CONCURRENCY}...")
            
            # Process in batches for incremental saving
            batch_results = []
            for i in range(0, len(self.urls), BATCH_SIZE):
                batch_urls = self.urls[i:i + BATCH_SIZE]
                tasks = [self.check_url(url) for url in batch_urls]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Write batch to CSV
                for result in batch_results:
                    if isinstance(result, Exception):
                        print(f"Error in batch: {result}")
                        continue
                    self.results.append(result)
                    self.csv_writer.writerow([
                        result.url, result.status, result.final_url, 
                        result.redirect_count, result.redirect_chain, 
                        result.response_time_ms, result.error
                    ])
                
                # Flush CSV periodically
                self.csv_file.flush()
                print(f"  Batch {i//BATCH_SIZE + 1}/{(len(self.urls) + BATCH_SIZE - 1)//BATCH_SIZE} saved ({min(i+BATCH_SIZE, len(self.urls))}/{len(self.urls)})")
        
        self.csv_file.close()
        print(f"Audit complete. Processed {len(self.results)} URLs.")
        return self.results
    
    def save_results(self):
        """Save results to JSON summary, and error text file."""
        # JSON Summary
        summary = self.generate_summary()
        json_path = OUTPUT_DIR / "product-url-http-summary.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        print(f"JSON summary saved: {json_path}")
        
        # Errors text file
        errors_path = OUTPUT_DIR / "product-url-errors.txt"
        with open(errors_path, 'w', encoding='utf-8') as f:
            for r in self.results:
                if r.status not in ('200',):
                    f.write(f"{r.url} | {r.status} | {r.final_url} | {r.error}\n")
        print(f"Errors file saved: {errors_path}")
    
    def generate_summary(self) -> Dict:
        """Generate summary statistics."""
        total = len(self.results)
        status_counts = {}
        timeouts = 0
        connection_errors = 0
        redirect_chains = 0
        broken = []
        
        for r in self.results:
            status_key = r.status
            if status_key.startswith('3'):
                status_key = '3xx'
            elif status_key.startswith('4'):
                status_key = '4xx'
            elif status_key.startswith('5'):
                status_key = '5xx'
            elif status_key == 'TIMEOUT':
                timeouts += 1
                status_key = 'TIMEOUT'
            elif status_key == 'CONNECTION_ERROR':
                connection_errors += 1
                status_key = 'CONNECTION_ERROR'
            
            status_counts[status_key] = status_counts.get(status_key, 0) + 1
            
            if r.redirect_count > 1:
                redirect_chains += 1
            
            if r.status not in ('200',):
                broken.append({
                    'url': r.url,
                    'status': r.status,
                    'final_url': r.final_url,
                    'error': r.error
                })
        
        return {
            'total_urls': total,
            'status_200': status_counts.get('200', 0),
            'status_3xx': status_counts.get('3xx', 0),
            'status_4xx': status_counts.get('4xx', 0),
            'status_5xx': status_counts.get('5xx', 0),
            'timeouts': timeouts,
            'connection_errors': connection_errors,
            'redirect_chains': redirect_chains,
            'broken_urls': broken,
            'sitemap_urls': len(self.urls),
            'crawled_urls': len(self.results)
        }

async def main():
    auditor = URLAuditor()
    await auditor.run_audit()
    auditor.save_results()
    
    # Print summary
    summary = auditor.generate_summary()
    print("\n=== EQUSTO FAZ 1 / GÖREV 1 SONUCU ===")
    print(f"Toplam ürün URL: {summary['total_urls']}")
    print(f"Tarandı: {summary['crawled_urls']}")
    print(f"200: {summary['status_200']}")
    print(f"3xx: {summary['status_3xx']}")
    print(f"4xx: {summary['status_4xx']}")
    print(f"5xx: {summary['status_5xx']}")
    print(f"Timeout: {summary['timeouts']}")
    print(f"Connection error: {summary['connection_errors']}")
    print(f"Redirect chain: {summary['redirect_chains']}")
    print(f"\nKIRIK URL SAYISI: {len(summary['broken_urls'])}")
    print("\nEn kritik hatalar:")
    for i, b in enumerate(summary['broken_urls'][:3], 1):
        print(f"{i}. {b['url']} - {b['status']} - {b['final_url']} - {b['error']}")

if __name__ == "__main__":
    asyncio.run(main())