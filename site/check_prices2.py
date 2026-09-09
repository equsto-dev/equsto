import json
import sys
sys.stdout.reconfigure(encoding='utf-8')
import os
import json
base = 'C:/D Disk/EQUSTO-WORK/E-TICARET/site/public/data'
all_files = ['pisirme.json','sogutma.json','hazirlik.json','dolap.json','icecek.json','kahve.json','servis.json','yikama.json','davlumbaz.json','araba.json','tezgah.json','set-ustu-mutfak.json','market-reyon.json','istif.json','tasima.json']
import glob
import json
data = []
for fn in all_files:
    fp = os.path.join(base, fn)
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            arr = json.load(f)
            for d in arr:
                d['_source_file'] = fn
            data.extend(arr)
test_skus = ['INO-KLG090', 'ABS-20', 'AEI-873', 'EQ-FALCON-SLD-EQ84', 'INO-KKF060', 'SBHDG-2N70E', 'G.ST.75.D.4', '7897.14080.04', '118.WN.350', 'SBB-3N70', '133050', 'EQ-FALCON-EQ172']
for d in data:
    sku = str(d.get('sku') or '')
    model = str(d.get('model') or '')
    if any(s in sku or s in model for s in test_skus):
        print(f"{sku} | model={model} | fiyat_tl={d.get('fiyat_tl')} | price={d.get('price')} | liste_fiyati_eur={d.get('liste_fiyati_eur')} | satis_eur_indirimli={d.get('satis_eur_indirimli')} | iskonto_oran={d.get('iskonto_oran')} | kur_eur_try={d.get('kur_eur_try')} | kdv_oran={d.get('kdv_oran')} | fiyat_tl_net={d.get('fiyat_tl_net')} | fiyat_havale_tl={d.get('fiyat_havale_tl')}")
print("Search complete, total:", len(data))
