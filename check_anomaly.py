import csv
with open('04_EQUSTO_MUTBEX_BUYUK_FARK_ANOMALI.tsv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter='\t')
    for row in reader:
        print(f"{row['sku']}: {row['difference_percent']}% ({row['classification']}) - {row['equsto_name'][:50]}")