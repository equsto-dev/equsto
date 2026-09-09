import asyncio
import aiohttp
import csv
import json
import time
from dataclasses import dataclass
from typing import List
from urllib.parse import urljoin
import sys
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")
REMAINING_FILE = OUTPUT_DIR / "remaining-urls.txt"

# Crawl settings
CONCURRENCY = 10
TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10)
MAX_REDIRECTS = 10
RATE_LIMIT_DELAY = 0.1
BATCH_SIZE = 100

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
        self.results = []
        self.semaphore = asyncio.Semaphore(CONCURRENCY)
        self.session = None
        self.processed = 0
        self.start_time = time.time()
        
        # Open CSV in append mode
        self.csv_path = OUTPUT_DIR / "product-url-http-audit.csv"
        self.csv_file = open(self.csv_path, 'a', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
    
    def load_remaining_urls(self) -> List[str]:
        with open(REMAINING_FILE, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    
    async def check_url(self, url: str) -> AuditResult:
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
        self.urls = self.load_remaining_urls()
        print(f"Found {len(self.urls)} remaining URLs to audit")
        
        connector = aiohttp.TCPConnector(
            limit=CONCURRENCY,
            limit_per_host=CONCURRENCY,
            force_close=True,
            enable_cleanup_closed=True
        )
        
        async with aiohttp.ClientSession(
            connector=connector,
            headers={'User-Agent': 'Equsto-SEO-Audit/1.0 (+https://equsto.com)'}
        ) as session:
            self.session = session
            print(f"Starting audit of remaining {len(self.urls)} URLs...")
            
            batch_results = []
            for i in range(0, len(self.urls), 100):
                batch_urls = self.urls[i:i + 100]
                tasks = [self.check_url(url) for url in batch_urls]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, Exception):
                        print(f"Error in batch: {result}")
                        continue
                    
                    self.csv_writer.writerow([
                        result.url, result.status, result.final_url, 
                        result.redirect_count, result.redirect_chain, 
                        result.response_time_ms, result.error
                    ])
                
                print(f"  Batch {i//100 + 1}/{(len(self.urls) + 99)//100} saved ({min(i+100, len(self.urls))}/{len(self.urls)})")
        
        self.csv_file.close()
        print(f"Audit complete. Processed {self.processed} additional URLs.")
    
    def generate_summary(self):
        # Read full CSV
        import csv
        with open(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit\product-url-http-audit.csv", 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        status_counts = {}
        timeouts = 0
        connection_errors = 0
        redirect_chains = 0
        broken = []
        
        for r in rows:
            status = r['status']
            if status.startswith('3'):
                status_key = '3xx'
            elif status.startswith('4'):
                status_key = '4xx'
            elif status.startswith('5'):
                status_key = '5xx'
            elif status == 'TIMEOUT':
                status_key = 'TIMEOUT'
                timeouts += 1
            elif status == 'CONNECTION_ERROR':
                status_key = 'CONNECTION_ERROR'
                connection_errors += 1
            else:
                status_key = status
            
            status_counts[status_key] = status_counts.get(status_key, 0) + 1
            
            if int(r['redirect_count']) > 1:
                redirect_chains += 1
            
            if status != '200':
                broken.append({
                    'url': r['url'], 'status': r['status'],
                    'final_url': r['final_url'], 'error': r['error']
                })
        
        return {
            'total_urls': len(r),
            'status_200': status_counts.get('200', 0),
            'status_3xx': status_counts.get('3xx', 0),
            'status_4xx': status_counts.get('4xx', 0),
            'status_5xx': status_counts.get('5xx', 0),
            'timeouts': timeouts,
            'connection_errors': connection_errors,
            'redirect_chains': sum(1 for r in rows if int(r['redirect_count']) > 1),
            'broken_urls': [{'url': r['url'], 'status': r['status'], 'final_url': r['final_url'], 'error': r['error']} for r in rows if r['status'] != '200'],
            'sitemap_urls': 18794,
            'crawled_urls': len(rows)
        }

async def main():
    auditor = URLAuditor()
    await auditor.run_audit()
    
    # Generate final summary
    import csv
    with open(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit\product-url-http-audit.csv", 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    status_counts = {}
    timeouts = 0
    connection_errors = 0
    broken = []
    
    for r in rows:
        status = r['status']
        if status.startswith('3'):
            status_key = '3xx'
        elif status.startswith('4'):
            status_key = '4xx'
        elif status.startswith('5'):
            status_key = '5xx'
        elif status == 'TIMEOUT':
            status_key = 'TIMEOUT'
            timeouts += 1
        elif status == 'CONNECTION_ERROR':
            status_key = 'CONNECTION_ERROR'
            connection_errors += 1
        else:
            status_key = status
        
        status_counts[status_key] = status_counts.get(status_key, 0) + 1
        
        if r['status'] != '200':
            broken.append({
                'url': r['url'], 'status': r['status'],
                'final_url': r['final_url'], 'error': r['error']
            })
    
    redirect_chains = sum(1 for r in rows if int(r['redirect_count']) > 1)
    
    summary = {
        'total_urls': len(rows),
        'status_200': status_counts.get('200', 0),
        'status_3xx': status_counts.get('3xx', 0),
        'status_4xx': status_counts.get('4xx', 0),
        'status_5xx': status_counts.get('5xx', 0),
        'timeouts': timeouts,
        'connection_errors': connection_errors,
        'redirect_chains': redirect_chains,
        'broken_urls': broken,
        'sitemap_urls': 18794,
        'crawled_urls': len(rows)
    }
    
    import json
    from pathlib import Path
    OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")
    
    json_path = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit\product-url-http-summary.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    errors_path = OUTPUT_DIR / "product-url-errors.txt"
    with open(errors_path, 'w', encoding='utf-8') as f:
        for r in rows:
            if r['status'] != '200':
                f.write(r['url'] + ' | ' + r['status'] + ' | ' + r['final_url'] + ' | ' + r['error'] + '\n')
    
    print("\n=== EQUSTO FAZ 1 / GOREV 1 SONUCU ===")
    print("Toplam urun URL: 18794")
    print("Tarandi:", len(rows))
    print("200:", status_counts.get('200', 0))
    print("3xx:", status_counts.get('3xx', 0))
    print("4xx:", status_counts.get('4xx', 0))
    print("5xx:", status_counts.get('5xx', 0))
    print("Timeout:", timeouts)
    print("Connection error:", connection_errors)
    print("Redirect chain:", redirect_chains)
    print()
    print("KIRIK URL SAYISI:", len(broken))
    print()
    print("En kritik hatalar:")
    for i, b in enumerate(broken[:3], 1):
        print(str(i) + ". " + b['url'] + " - " + b['status'] + " - " + b['final_url'] + " - " + b['error'])

if __name__ == "__main__":
    asyncio.run(main())