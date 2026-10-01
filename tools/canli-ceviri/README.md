# Canlı Çeviri (EN → TR)

Bilgisayarda canlı yayın izlerken anlık İngilizce→Türkçe çeviri.

- **Yayın sesini kapatmaz** — F1 motor / ortam sesi olduğu gibi kalır
- **Varsayılan: altyazı** — ekstra ses yok, gecikme düşük
- **İsteğe bağlı TTS** — Türkçe sesi ayrı cihaza (kulaklık) verir

## Kurulum

```bash
cd tools/canli-ceviri
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

İlk çalıştırmada Argos EN→TR modeli bir kez indirilir.

## Kullanım

```bash
# Ses cihazlarını listele
python canli_ceviri.py --list

# F1 / canlı yayın (önerilen): sadece altyazı
python canli_ceviri.py --in "Hoparlör"

# Altyazı + kulaklıktan Türkçe ses (yayın hoparlörü açık kalır)
python canli_ceviri.py --in "Hoparlör" --out "Kulaklık" --tts
```

`--in` = yayının çıktığı hoparlör (loopback yakalama).  
`--out` = TTS için **farklı** cihaz; aynı cihazı verirsen geri besleme olur.

## Gecikme / gürültü ayarları

| Bayrak | Varsayılan | Ne işe yarar |
|--------|------------|--------------|
| `--model` | `tiny.en` | Hız. Kalite için `base.en` / `small.en` |
| `--chunk` | `1.8` | Max parça (sn). Düşük = daha az gecikme |
| `--silence` | `0.22` | Cümle sonu sessizliği (sn) |
| `--threshold` | `0.012` | Motor gürültüsünde yükselt: `0.02`–`0.04` |
| `--no-ui` | — | Sadece konsol çıktısı |

Örnek (gürültülü F1, daha agresif eşik):

```bash
python canli_ceviri.py --in "Hoparlör" --threshold 0.025 --chunk 1.5
```

## Nasıl çalışır?

1. Hoparlör loopback ile sistem sesini yakalar (yayını susturmaz).
2. Konuşma bandı skoru (300–3400 Hz) motor gürültüsünü ayırır.
3. Kısa parçalar → Whisper (`tiny.en`) → Argos EN→TR.
4. Sonuç altyazı penceresinde gösterilir; `--tts` ile kulaklığa da gider.

Eski TTS-odaklı sürüm: `canli_ceviri_eski.py`.
