#!/usr/bin/env python3
"""
Equsto Product Canonical URL Audit - Remaining URLs
"""

import asyncio
import aiohttp
import csv
import json
import re
import time
from dataclasses import dataclass
from typing import List
from urllib.parse import urlparse, urljoin
from collections import defaultdict
import sys
from pathlib import Path

# Configuration
OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")
REMAINING_FILE = OUTPUT_DIR / "canonical-remaining-urls.txt"
CSV_PATH = OUTPUT_DIR / "product-canonical-audit.csv"

# Crawl settings
CONCURRENCY = 10
TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10)
RATE_LIMIT_DELAY = 0.1
BATCH_SIZE = 100

@dataclass
class CanonicalResult:
    url: str
    http_status: str
    final_url: str
    canonical: str
    canonical_status: str
    canonical_matches_requested_url: bool
    canonical_matches_final_url: bool
    canonical_is_absolute: bool
    canonical_host: str
    canonical_protocol: str
    issues: str

class CanonicalAuditor:
    def __init__(self):
        self.results = []
        self.semaphore = asyncio.Semaphore(CONCURRENCY)
        self.session = None
        self.processed = 0
        self.start_time = time.time()
        
        # Open CSV in append mode
        self.csv_path = CSV_PATH
        self.csv_file = open(self.csv_path, 'a', newline='', encoding='utf-8')
        self.csv_writer = csv.writer(self.csv_file)
    
    def load_remaining_urls(self) -> List[str]:
        with open(REMAINING_FILE, 'r') as f:
            return [line.strip() for line in f if line.strip()]
    
    def extract_canonical(self, html: str) -> str:
        patterns = [
            r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']',
            r'<link\s+href=["\']([^"\']+)["\']\s+rel=["\']canonical["\']',
        ]
        for pattern in patterns:
            match = re.search(pattern, html, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return ""
    
    def analyze_canonical(self, requested_url: str, final_url: str, canonical: str) -> Dict:
        issues = []
        
        if not canonical:
            return {"issues": "canonical_missing", "canonical_status": "missing"}
        
        canonical_parsed = urlparse(canonical)
        is_absolute = bool(canonical_parsed.scheme and canonical_parsed.netloc)
        if not is_absolute:
            issues.append("canonical_not_absolute")
        
        if canonical_parsed.scheme == "http":
            issues.append("canonical_http")
        
        requested_parsed = urlparse(requested_url)
        final_parsed = urlparse(final_url)
        if canonical_parsed.netloc != requested_parsed.netloc:
            issues.append("canonical_external_host")
        
        req_host = requested_parsed.netloc.lower().replace('www.', '')
        can_host = canonical_parsed.netloc.lower().replace('www.', '')
        if req_host != can_host:
            issues.append("canonical_host_mismatch")
        
        matches_requested = self.normalize_url(canonical) == self.normalize_url(requested_url)
        if not matches_requested:
            issues.append("canonical_not_match_requested")
        
        matches_final = self.normalize_url(canonical) == self.normalize_url(final_url)
        if not matches_final:
            issues.append("canonical_not_match_final")
        
        if canonical != requested_url and canonical != final_url:
            if self.normalize_url(canonical) == self.normalize_url(requested_url):
                issues.append("canonical_encoded_difference")
        
        req_path = requested_parsed.path.rstrip('/')
        can_path = canonical_parsed.path.rstrip('/')
        if req_path != can_path:
            issues.append("canonical_trailing_slash")
        
        if "canonical_missing" in issues:
            canonical_status = "missing"
        elif issues:
            canonical_status = "mismatch"
        else:
            canonical_status = "matching"
        
        return {
            "canonical": canonical,
            "canonical_status": canonical_status,
            "canonical_matches_requested_url": matches_requested,
            "canonical_matches_final_url": matches_final,
            "canonical_is_absolute": is_absolute,
            "canonical_host": canonical_parsed.netloc,
            "canonical_protocol": canonical_parsed.scheme,
            "issues": ";".join(issues) if issues else ""
        }
    
    def normalize_url(self, url: str) -> str:
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()
        host = parsed.netloc.lower()
        path = parsed.path.rstrip('/')
        if not path:
            path = '/'
        return f"{scheme}://{host}{path}"
    
    async def check_url(self, url: str) -> CanonicalResult:
        async with self.semaphore:
            http_status = "ERROR"
            final_url = url
            canonical = ""
            error = ""
            
            try:
                async with self.session.get(
                    url,
                    allow_redirects=True,
                    timeout=TIMEOUT
                ) as resp:
                    http_status = str(resp.status)
                    final_url = str(resp.url)
                    html = await resp.text()
                    canonical = self.extract_canonical(html)
                    
            except asyncio.TimeoutError:
                http_status = "TIMEOUT"
                error = "Request timeout"
            except aiohttp.ClientConnectorError as e:
                http_status = "CONNECTION_ERROR"
                error = str(e)
            except Exception as e:
                http_status = "ERROR"
                error = str(e)
            
            analysis = self.analyze_canonical(url, final_url, canonical)
            
            self.processed += 1
            if self.processed % 100 == 0:
                elapsed = time.time() - self.start_time
                rate = self.processed / elapsed if elapsed > 0 else 0
                print(f"Progress: {self.processed}/{len(self.urls)} ({rate:.1f} urls/s) - {url}")
                sys.stdout.flush()
            
            await asyncio.sleep(RATE_LIMIT_DELAY)
            
            return CanonicalResult(
                url=url,
                http_status=http_status,
                final_url=final_url,
                canonical=analysis.get("canonical", ""),
                canonical_status=analysis.get("canonical_status", "error"),
                canonical_matches_requested_url=analysis.get("canonical_matches_requested_url", False),
                canonical_matches_final_url=analysis.get("canonical_matches_final_url", False),
                canonical_is_absolute=analysis.get("canonical_is_absolute", False),
                canonical_host=analysis.get("canonical_host", ""),
                canonical_protocol=analysis.get("canonical_protocol", ""),
                issues=analysis.get("issues", "")
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
            headers={'User-Agent': 'Equsto-Canonical-Audit/1.0 (+https://equsto.com)'}
        ) as session:
            self.session = session
            print(f"Starting canonical audit with concurrency={CONCURRENCY}...")
            
            batch_results = []
            for i in range(0, len(self.urls), BATCH_SIZE):
                batch_urls = self.urls[i:i + BATCH_SIZE]
                tasks = [self.check_url(url) for url in batch_urls]
                batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                
                for result in batch_results:
                    if isinstance(result, Exception):
                        print(f"Error in batch: {result}")
                        continue
                    self.results.append(result)
                    self.csv_writer.writerow([
                        result.url, result.http_status, result.final_url,
                        result.canonical, result.canonical_status,
                        result.canonical_matches_requested_url,
                        result.canonical_matches_final_url,
                        result.canonical_is_absolute,
                        result.canonical_host,
                        result.canonical_protocol,
                        result.issues
                    ])
                
                self.csv_file.flush()
                print(f"  Batch {i//BATCH_SIZE + 1}/{(len(self.urls) + BATCH_SIZE - 1)//BATCH_SIZE} saved ({min(i+BATCH_SIZE, len(self.urls))}/{len(self.urls)})")
        
        self.csv_file.close()
        print(f"Canonical audit complete. Processed {self.processed} additional URLs.")
    
    def generate_summary(self):
        # Read full CSV
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        canonical_found = 0
        canonical_missing = 0
        canonical_matching = 0
        canonical_mismatch = 0
        external_canonical = 0
        http_canonical = 0
        redirect_canonical = 0
        invalid_canonical = 0
        
        issue_counts = defaultdict(int)
        canonical_to_urls = defaultdict(list)
        
        for r in rows:
            if r['canonical']:
                canonical_found += 1
                canonical_to_urls[r['canonical']].append(r['url'])
            else:
                canonical_missing += 1
            
            if r['canonical_status'] == 'matching':
                canonical_matching += 1
            elif r['canonical_status'] == 'mismatch':
                canonical_mismatch += 1
            
            if r['canonical_host'] and r['canonical_host'] != urlparse(r['url']).netloc:
                external_canonical += 1
            if r['canonical_protocol'] == 'http':
                http_canonical += 1
            if r['http_status'].startswith('3') and r['canonical']:
                redirect_canonical += 1
            if r['canonical'] and r['canonical_is_absolute'].lower() == 'false':
                invalid_canonical += 1
            
            for issue in r['issues'].split(';'):
                if issue:
                    issue_counts[issue] += 1
        
        duplicate_groups = {canon: urls for canon, urls in canonical_to_urls.items() if len(urls) > 1}
        duplicate_canonical_groups = len(duplicate_groups)
        
        return {
            'total_urls': len(rows),
            'canonical_found': canonical_found,
            'canonical_missing': canonical_missing,
            'canonical_matching': canonical_matching,
            'canonical_mismatch': canonical_mismatch,
            'external_canonical': external_canonical,
            'http_canonical': http_canonical,
            'redirect_canonical': redirect_canonical,
            'invalid_canonical': invalid_canonical,
            'duplicate_canonical_groups': duplicate_canonical_groups,
            'duplicate_groups': {canon: urls for canon, urls in duplicate_groups.items()},
            'issue_counts': dict(issue_counts)
        }

async def main():
    auditor = CanonicalAuditor()
    await auditor.run_audit()
    auditor.save_results()
    
    # Generate final summary from full CSV
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    
    canonical_found = 0
    canonical_missing = 0
    canonical_matching = 0
    canonical_mismatch = 0
    external_canonical = 0
    http_canonical = 0
    redirect_canonical = 0
    invalid_canonical = 0
    
    issue_counts = defaultdict(int)
    canonical_to_urls = defaultdict(list)
    
    for r in rows:
        if r['canonical']:
            canonical_found += 1
            canonical_to_urls[r['canonical']].append(r['url'])
        else:
            canonical_missing += 1
        
        if r['canonical_status'] == 'matching':
            canonical_matching += 1
        elif r['canonical_status'] == 'mismatch':
            canonical_mismatch += 1
        
        if r['canonical_host'] and r['canonical_host'] != urlparse(r['url']).netloc:
            external_canonical += 1
        if r['canonical_protocol'] == 'http':
            http_canonical += 1
        if r['http_status'].startswith('3') and r['canonical']:
            redirect_canonical += 1
        if r['canonical'] and r['canonical_is_absolute'].lower() == 'false':
            invalid_canonical += 1
        
        for issue in r['issues'].split(';'):
            if issue:
                issue_counts[issue] += 1
    
    duplicate_groups = {canon: urls for canon, urls in canonical_to_urls.items() if len(urls) > 1}
    duplicate_canonical_groups = len(duplicate_groups)
    
    summary = {
        'total_urls': len(rows),
        'canonical_found': canonical_found,
        'canonical_missing': canonical_missing,
        'canonical_matching': canonical_matching,
        'canonical_mismatch': canonical_mismatch,
        'external_canonical': external_canonical,
        'http_canonical': http_canonical,
        'redirect_canonical': redirect_canonical,
        'invalid_canonical': invalid_canonical,
        'duplicate_canonical_groups': duplicate_canonical_groups,
        'duplicate_groups': {canon: urls for canon, urls in duplicate_groups.items()},
        'issue_counts': dict(issue_counts)
    }
    
    json_path = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit\product-canonical-summary.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    
    errors_path = OUTPUT_DIR / "product-canonical-errors.txt"
    with open(errors_path, 'w', encoding='utf-8') as f:
        for r in rows:
            if r['canonical_status'] != 'matching' or r['issues']:
                f.write(r['url'] + ' | ' + r['canonical_status'] + ' | ' + r['canonical'] + ' | ' + r['issues'] + '\n')
    
    print("\n=== EQUSTO FAZ 1 / GOREV 2 CANONICAL AUDIT ===")
    print(f"Toplam: {summary['total_urls']}")
    print(f"Canonical bulunan: {summary['canonical_found']}")
    print(f"Eksik: {summary['canonical_missing']}")
    print(f"Doğru: {summary['canonical_matching']}")
    print(f"Yanlış: {summary['canonical_mismatch']}")
    print(f"External: {summary['external_canonical']}")
    print(f"HTTP: {summary['http_canonical']}")
    print(f"Redirect canonical: {summary['redirect_canonical']}")
    print(f"Duplicate grup: {summary['duplicate_canonical_groups']}")
    print()
    print("En önemli 20 problem örneği:")
    for issue, count in sorted(summary['issue_counts'].items(), key=lambda x: -x[1])[:20]:
        print(f"  {issue}: {count}")

if __name__ == "__main__":
    import csv
    import asyncio
    from pathlib import Path
    
    # Configuration
    OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")
    REMAINING_FILE = OUTPUT_DIR / "canonical-remaining-urls.txt"
    CSV_PATH = OUTPUT_DIR / "product-canonical-audit.csv"
    
    # Crawl settings
    CONCURRENCY = 10
    TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10)
    RATE_LIMIT_DELAY = 0.1
    BATCH_SIZE = 100
    
    @dataclass
    class CanonicalResult:
        url: str
        http_status: str
        final_url: str
        canonical: str
        canonical_status: str
        canonical_matches_requested_url: bool
        canonical_matches_final_url: bool
        canonical_is_absolute: bool
        canonical_host: str
        canonical_protocol: str
        issues: str

    class CanonicalAuditor:
        def __init__(self):
            self.results = []
            self.semaphore = asyncio.Semaphore(CONCURRENCY)
            self.session = None
            self.processed = 0
            self.start_time = time.time()
            
            self.csv_path = CSV_PATH
            self.csv_file = open(self.csv_path, 'a', newline='', encoding='utf-8')
            self.csv_writer = csv.writer(self.csv_file)
        
        def load_remaining_urls(self) -> List[str]:
            with open(REMAINING_FILE, 'r') as f:
                return [line.strip() for line in f if line.strip()]
        
        def extract_canonical(self, html: str) -> str:
            patterns = [
                r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)["\']',
                r'<link\s+href=["\']([^"\']+)["\']\s+rel=["\']canonical["\']',
            ]
            for pattern in patterns:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    return match.group(1).strip()
            return ""
        
        def analyze_canonical(self, requested_url: str, final_url: str, canonical: str) -> Dict:
            issues = []
            
            if not canonical:
                return {"issues": "canonical_missing", "canonical_status": "missing"}
            
            canonical_parsed = urlparse(canonical)
            is_absolute = bool(canonical_parsed.scheme and canonical_parsed.netloc)
            if not is_absolute:
                issues.append("canonical_not_absolute")
            
            if canonical_parsed.scheme == "http":
                issues.append("canonical_http")
            
            requested_parsed = urlparse(requested_url)
            final_parsed = urlparse(final_url)
            if canonical_parsed.netloc != requested_parsed.netloc:
                issues.append("canonical_external_host")
            
            req_host = requested_parsed.netloc.lower().replace('www.', '')
            can_host = canonical_parsed.netloc.lower().replace('www.', '')
            if req_host != can_host:
                issues.append("canonical_host_mismatch")
            
            matches_requested = self.normalize_url(canonical) == self.normalize_url(requested_url)
            if not matches_requested:
                issues.append("canonical_not_match_requested")
            
            matches_final = self.normalize_url(canonical) == self.normalize_url(final_url)
            if not matches_final:
                issues.append("canonical_not_match_final")
            
            if canonical != requested_url and canonical != final_url:
                if self.normalize_url(canonical) == self.normalize_url(requested_url):
                    issues.append("canonical_encoded_difference")
            
            req_path = requested_parsed.path.rstrip('/')
            can_path = canonical_parsed.path.rstrip('/')
            if req_path != can_path:
                issues.append("canonical_trailing_slash")
            
            if "canonical_missing" in issues:
                canonical_status = "missing"
            elif issues:
                canonical_status = "mismatch"
            else:
                canonical_status = "matching"
            
            return {
                "canonical": canonical,
                "canonical_status": canonical_status,
                "canonical_matches_requested_url": matches_requested,
                "canonical_matches_final_url": matches_final,
                "canonical_is_absolute": is_absolute,
                "canonical_host": canonical_parsed.netloc,
                "canonical_protocol": canonical_parsed.scheme,
                "issues": ";".join(issues) if issues else ""
            }
        
        def normalize_url(self, url: str) -> str:
            parsed = urlparse(url)
            scheme = parsed.scheme.lower()
            host = parsed.netloc.lower()
            path = parsed.path.rstrip('/')
            if not path:
                path = '/'
            return f"{scheme}://{host}{path}"
        
        async def check_url(self, url: str) -> CanonicalResult:
            async with self.semaphore:
                http_status = "ERROR"
                final_url = url
                canonical = ""
                error = ""
                
                try:
                    async with self.session.get(
                        url,
                        allow_redirects=True,
                        timeout=TIMEOUT
                    ) as resp:
                        http_status = str(resp.status)
                        final_url = str(resp.url)
                        html = await resp.text()
                        canonical = self.extract_canonical(html)
                        
                except asyncio.TimeoutError:
                    http_status = "TIMEOUT"
                    error = "Request timeout"
                except aiohttp.ClientConnectorError as e:
                    http_status = "CONNECTION_ERROR"
                    error = str(e)
                except Exception as e:
                    http_status = "ERROR"
                    error = str(e)
                
                analysis = self.analyze_canonical(url, final_url, canonical)
                
                self.processed += 1
                if self.processed % 100 == 0:
                    elapsed = time.time() - self.start_time
                    rate = self.processed / elapsed if elapsed > 0 else 0
                    print(f"Progress: {self.processed}/{len(self.urls)} ({rate:.1f} urls/s) - {url}")
                    sys.stdout.flush()
                
                await asyncio.sleep(RATE_LIMIT_DELAY)
                
                return CanonicalResult(
                    url=url,
                    http_status=http_status,
                    final_url=final_url,
                    canonical=analysis.get("canonical", ""),
                    canonical_status=analysis.get("canonical_status", "error"),
                    canonical_matches_requested_url=analysis.get("canonical_matches_requested_url", False),
                    canonical_matches_final_url=analysis.get("canonical_matches_final_url", False),
                    canonical_is_absolute=analysis.get("canonical_is_absolute", False),
                    canonical_host=analysis.get("canonical_host", ""),
                    canonical_protocol=analysis.get("canonical_protocol", ""),
                    issues=analysis.get("issues", "")
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
                headers={'User-Agent': 'Equsto-Canonical-Audit/1.0 (+https://equsto.com)'}
            ) as session:
                self.session = session
                print(f"Starting canonical audit with concurrency={CONCURRENCY}...")
                
                batch_results = []
                for i in range(0, len(self.urls), BATCH_SIZE):
                    batch_urls = self.urls[i:i + BATCH_SIZE]
                    tasks = [self.check_url(url) for url in batch_urls]
                    batch_results = await asyncio.gather(*tasks, return_exceptions=True)
                    
                    for result in batch_results:
                        if isinstance(result, Exception):
                            print(f"Error in batch: {result}")
                            continue
                        self.results.append(result)
                        self.csv_writer.writerow([
                            result.url, result.http_status, result.final_url,
                            result.canonical, result.canonical_status,
                            result.canonical_matches_requested_url,
                            result.canonical_matches_final_url,
                            result.canonical_is_absolute,
                            result.canonical_host,
                            result.canonical_protocol,
                            result.issues
                        ])
                    
                    self.csv_file.flush()
                    print(f"  Batch {i//BATCH_SIZE + 1}/{(len(self.urls) + BATCH_SIZE - 1)//BATCH_SIZE} saved ({min(i+BATCH_SIZE, len(self.urls))}/{len(self.urls)})")
            
            self.csv_file.close()
            print(f"Canonical audit complete. Processed {self.processed} additional URLs.")
        
        def save_results(self):
            summary = self.generate_summary()
            json_path = OUTPUT_DIR / "product-canonical-summary.json"
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(summary, f, ensure_ascii=False, indent=2)
            print(f"JSON summary saved: {json_path}")
            
            errors_path = OUTPUT_DIR / "product-canonical-errors.txt"
            with open(errors_path, 'w', encoding='utf-8') as f:
                for r in self.results:
                    if r.canonical_status != "matching" or r.issues:
                        f.write(r.url + ' | ' + r.canonical_status + ' | ' + r.canonical + ' | ' + r.issues + '\n')
            print(f"Errors file saved: {errors_path}")
        
        def generate_summary(self):
            with open(CSV_PATH, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
            
            canonical_found = 0
            canonical_missing = 0
            canonical_matching = 0
            canonical_mismatch = 0
            external_canonical = 0
            http_canonical = 0
            redirect_canonical = 0
            invalid_canonical = 0
            
            issue_counts = defaultdict(int)
            canonical_to_urls = defaultdict(list)
            
            for r in rows:
                if r['canonical']:
                    canonical_found += 1
                    canonical_to_urls[r['canonical']].append(r['url'])
                else:
                    canonical_missing += 1
                
                if r['canonical_status'] == 'matching':
                    canonical_matching += 1
                elif r['canonical_status'] == 'mismatch':
                    canonical_mismatch += 1
                
                if r['canonical_host'] and r['canonical_host'] != urlparse(r['url']).netloc:
                    external_canonical += 1
                if r['canonical_protocol'] == 'http':
                    http_canonical += 1
                if r['http_status'].startswith('3') and r['canonical']:
                    redirect_canonical += 1
                if r['canonical'] and r['canonical_is_absolute'].lower() == 'false':
                    invalid_canonical += 1
                
                for issue in r['issues'].split(';'):
                    if issue:
                        issue_counts[issue] += 1
            
            duplicate_groups = {canon: urls for canon, urls in canonical_to_urls.items() if len(urls) > 1}
            duplicate_canonical_groups = len(duplicate_groups)
            
            return {
                'total_urls': len(rows),
                'canonical_found': canonical_found,
                'canonical_missing': canonical_missing,
                'canonical_matching': canonical_matching,
                'canonical_mismatch': canonical_mismatch,
                'external_canonical': external_canonical,
                'http_canonical': http_canonical,
                'redirect_canonical': redirect_canonical,
                'invalid_canonical': invalid_canonical,
                'duplicate_canonical_groups': duplicate_canonical_groups,
                'duplicate_groups': {canon: urls for canon, urls in duplicate_groups.items()},
                'issue_counts': dict(issue_counts)
            }

    async def main():
        auditor = CanonicalAuditor()
        await auditor.run_audit()
        auditor.save_results()
        
        with open(CSV_PATH, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        canonical_found = 0
        canonical_missing = 0
        canonical_matching = 0
        canonical_mismatch = 0
        external_canonical = 0
        http_canonical = 0
        redirect_canonical = 0
        invalid_canonical = 0
        
        issue_counts = defaultdict(int)
        canonical_to_urls = defaultdict(list)
        
        for r in rows:
            if r['canonical']:
                canonical_found += 1
                canonical_to_urls[r['canonical']].append(r['url'])
            else:
                canonical_missing += 1
            
            if r['canonical_status'] == 'matching':
                canonical_matching += 1
            elif r['canonical_status'] == 'mismatch':
                canonical_mismatch += 1
            
            if r['canonical_host'] and r['canonical_host'] != urlparse(r['url']).netloc:
                external_canonical += 1
            if r['canonical_protocol'] == 'http':
                http_canonical += 1
            if r['http_status'].startswith('3') and r['canonical']:
                redirect_canonical += 1
            if r['canonical'] and r['canonical_is_absolute'].lower() == 'false':
                invalid_canonical += 1
            
            for issue in r['issues'].split(';'):
                if issue:
                    issue_counts[issue] += 1
        
        duplicate_groups = {canon: urls for canon, urls in canonical_to_urls.items() if len(urls) > 1}
        duplicate_canonical_groups = len(duplicate_groups)
        
        summary = {
            'total_urls': len(rows),
            'canonical_found': canonical_found,
            'canonical_missing': canonical_missing,
            'canonical_matching': canonical_matching,
            'canonical_mismatch': canonical_mismatch,
            'external_canonical': external_canonical,
            'http_canonical': http_canonical,
            'redirect_canonical': redirect_canonical,
            'invalid_canonical': invalid_canonical,
            'duplicate_canonical_groups': duplicate_canonical_groups,
            'duplicate_groups': {canon: urls for canon, urls in duplicate_groups.items()},
            'issue_counts': dict(issue_counts)
        }
        
        json_path = OUTPUT_DIR / "product-canonical-summary.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, ensure_ascii=False, indent=2)
        
        errors_path = OUTPUT_DIR / "product-canonical-errors.txt"
        with open(errors_path, 'w', encoding='utf-8') as f:
            for r in rows:
                if r['canonical_status'] != 'matching' or r['issues']:
                    f.write(r['url'] + ' | ' + r['canonical_status'] + ' | ' + r['canonical'] + ' | ' + r['issues'] + '\n')
        
        print("\n=== EQUSTO FAZ 1 / GOREV 2 CANONICAL AUDIT ===")
        print(f"Toplam: {summary['total_urls']}")
        print(f"Canonical bulunan: {summary['canonical_found']}")
        print(f"Eksik: {summary['canonical_missing']}")
        print(f"Doğru: {summary['canonical_matching']}")
        print(f"Yanlış: {summary['canonical_mismatch']}")
        print(f"External: {summary['external_canonical']}")
        print(f"HTTP: {summary['http_canonical']}")
        print(f"Redirect canonical: {summary['redirect_canonical']}")
        print(f"Duplicate grup: {summary['duplicate_canonical_groups']}")
        print()
        print("En önemli 20 problem örneği:")
        for issue, count in sorted(summary['issue_counts'].items(), key=lambda x: -x[1])[:20]:
            print(f"  {issue}: {count}")

    asyncio.run(main())