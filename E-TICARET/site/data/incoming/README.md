# Gelen fiyat listeleri

PDF dosyalarını buraya koyun; import script’leri önce bu klasöre bakar.

| Dosya adı | Komut |
|-----------|--------|
| `yuksel-yerli-2025.pdf` | `npm run catalog:yuksel:yerli:extract` |
| (özel yol) | `python scripts/import-yuksel-yerli-pdf.py /tam/yol/liste.pdf` |

**Not:** Yönetim panelinde PDF yükleme yok — dosyayı bu klasöre kopyalayıp terminalden komutu çalıştırın.

Bar blender sayfaları (ör. `BAR BLENDER 1280`, 238 €) artık `import-yuksel-yerli-pdf.py` ile okunur.
