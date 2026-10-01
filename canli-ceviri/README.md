# Canlı Çeviri (bağımsız)

Bilgisayarda canlı yayın izlerken anlık İngilizce→Türkçe **sesli** çeviri.
Equsto veya başka bir siteye bağlı değildir.

- Yayın susmaz (F1 motor sesi kalır)
- Türkçe ses aynı hoparlöre gider
- TTS sırasında geri besleme engellenir

## Kurulum (Windows PowerShell)

Bu klasörde:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python canli_ceviri.py --list
python canli_ceviri.py --in "Hoparlör"
```

## Kullanım

```powershell
python canli_ceviri.py --in "Hoparlör"
python canli_ceviri.py --in "Hoparlör" --no-ui
python canli_ceviri.py --in "Hoparlör" --volume 0.85 --threshold 0.025
```

`--list` ile hoparlör adını öğren. `--out` vermezsen Türkçe ses aynı hoparlöre gider.
