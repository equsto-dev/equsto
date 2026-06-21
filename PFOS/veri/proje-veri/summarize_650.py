import json

with open(r"C:\D Disk\EQUSTO-WORK\PFOS\veri\proje-veri\equsto-teklif-EQS-2026-650-parsed.json", "r", encoding="utf-8") as f:
    items = json.load(f)

# Group by section
sections = {}
for item in items:
    sec = item["section_id"]
    if sec not in sections:
        sections[sec] = []
    sections[sec].append(item)

# Sort sections
sorted_sections = sorted(sections.keys())

section_names = {
    "01": "KURU DEPO",
    "02": "SOĞAN HAZIRLIK",
    "03": "SEBZE HAZIRLIK",
    "04": "ET HAZIRLIK",
    "05": "HAMUR HAZIRLIK",
    "06": "PİŞİRME",
    "07": "SAC TAVA",
    "08": "FIRIN SERVİS HATTı",
    "09": "BULAŞIKHANE",
    "10": "BAR VE PASTA TEŞHİR",
    "11": "YER IZGARASI",
    "12": "MEVCUT CAFE TEŞHİR DOLAPLARI"
}

for sec in sorted_sections:
    name = section_names.get(sec, f"BÖLÜM {sec}")
    print(f"\n=== {sec}. {name} ===")
    for item in sections[sec]:
        print(f"  {item['p_no']}: {item['stock_no']} - {item['name']} | {item['dimension']} | {item['brand']} | Adet: {item['qty']} | Fiyat: {item['unit_price']} €")
