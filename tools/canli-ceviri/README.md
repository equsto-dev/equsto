# Canlı Çeviri (EN → TR seslendirme)

Bilgisayarda canlı yayın izlerken anlık İngilizce→Türkçe **sesli** çeviri.

- **Yayın susmaz** — F1 motor / ortam sesi hoparlörde kalır
- **Türkçe ses de hoparlöre** gider (yayınla karışık)
- TTS sırasında loopback geçici kilitlenir → kendi sesini tekrar çevirmez
- İsteğe bağlı altyazı penceresi (`--no-ui` ile kapat)

## Kurulum

```powershell
cd tools\canli-ceviri
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Kullanım

```powershell
python canli_ceviri.py --list

# Önerilen: yayın + Türkçe aynı hoparlörde
python canli_ceviri.py --in "Hoparlör"

# Çıkışı açıkça seç
python canli_ceviri.py --in "Hoparlör" --out "Hoparlör"

# Altyazı penceresi istemiyorsan
python canli_ceviri.py --in "Hoparlör" --no-ui
```

`--list` çıktısındaki hoparlör adını `--in` için kullan.  
`--out` vermezsen Türkçe ses de aynı hoparlöre / sistem varsayılanına gider.

## Ayarlar

| Bayrak | Varsayılan | Ne işe yarar |
|--------|------------|--------------|
| `--volume` | `0.9` | Türkçe ses seviyesi (0–1) |
| `--model` | `tiny.en` | Hız. Kalite: `base.en` |
| `--threshold` | `0.012` | Motor gürültüsünde: `0.02`–`0.04` |
| `--chunk` | `1.8` | Max parça (sn) |
| `--max-lag` | `4.0` | Gerideyse TTS atlanır |

```powershell
python canli_ceviri.py --in "Hoparlör" --threshold 0.025 --volume 0.85
```

## Nasıl çalışır?

1. Hoparlör loopback ile yayın sesini yakalar (susturmaz).
2. Konuşma bandı skoru motor gürültüsünü ayırır.
3. Whisper → Argos EN→TR → Edge TTS.
4. Türkçe ses **hoparlöre** basılır; bu sırada yakalama durur (geri besleme yok).
5. TTS bitince tekrar dinlemeye devam eder.
