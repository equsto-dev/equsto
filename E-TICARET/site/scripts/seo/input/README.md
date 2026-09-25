# GSC cleanup — ham export

Search Console → Sayfa dizine ekleme → ilgili neden → etkilenen sayfalar CSV’lerini buraya koyun.

Beklenen dosya adları (örnek):

- `gsc-404-YYYYMMDD.csv`
- `gsc-redirect-error-YYYYMMDD.csv`
- `gsc-4xx-YYYYMMDD.csv`
- `gsc-5xx-YYYYMMDD.csv`
- `gsc-403-YYYYMMDD.csv`

Ham CSV’ler büyük olabilir; gerekirse `.gitignore` ile dışarıda tutulur.  
Sınıflandırma çıktısı: `../output/gsc-cleanup-classify.tsv`  
Plan: `../../../docs/GSC-INDEX-TEMIZLIK-PLANI.md`
