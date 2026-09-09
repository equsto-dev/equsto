import csv
import json
from pathlib import Path

csv_path = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit\product-url-http-audit.csv")
OUTPUT_DIR = Path(r"C:\D Disk\EQUSTO-WORK\E-TICARET\site\audit")

with open(csv_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print('Total processed:', len(rows))

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
        timeouts += 1
        status_key = 'TIMEOUT'
    elif status == 'CONNECTION_ERROR':
        connection_errors += 1
        status_key = 'CONNECTION_ERROR'
    else:
        status_key = status
    
    status_counts[status_key] = status_counts.get(status_key, 0) + 1
    
    if int(r['redirect_count']) > 1:
        redirect_chains += 1
    
    if status != '200':
        broken.append({
            'url': r['url'],
            'status': r['status'],
            'final_url': r['final_url'],
            'error': r['error']
        })

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

json_path = OUTPUT_DIR / "product-url-http-summary.json"
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(summary, f, ensure_ascii=False, indent=2)
print('JSON summary saved')

errors_path = OUTPUT_DIR / "product-url-errors.txt"
with open(errors_path, 'w', encoding='utf-8') as f:
    for r in rows:
        if r['status'] != '200':
            f.write(r['url'] + ' | ' + r['status'] + ' | ' + r['final_url'] + ' | ' + r['error'] + '\n')
print('Errors file saved')

print()
print('=== EQUSTO FAZ 1 / GOREV 1 SONUCU (PARTIAL - 13,101/18,794) ===')
print('Toplam urun URL: 18794')
print('Tarandi:', len(rows))
print('200:', status_counts.get('200', 0))
print('3xx:', status_counts.get('3xx', 0))
print('4xx:', status_counts.get('4xx', 0))
print('5xx:', status_counts.get('5xx', 0))
print('Timeout:', timeouts)
print('Connection error:', connection_errors)
print('Redirect chain:', redirect_chains)
print()
print('KIRIK URL SAYISI:', len(broken))
print()
print('En kritik hatalar:')
for i, b in enumerate(broken[:3], 1):
    print(str(i) + '. ' + b['url'] + ' - ' + b['status'] + ' - ' + b['final_url'] + ' - ' + b['error'])