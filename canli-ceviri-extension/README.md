# Canlı Çeviri (Chrome uzantısı)

`canli_ceviri.py` akışının uzantı hali:

1. Sekme sesini dinler (her site)
2. Chrome susturmasın diye yayın sesini **tam seviyede** geri çalar
3. Groq Whisper → Türkçe çeviri → **kadın** Google TTS

## Kurulum
1. Eski uzantıyı **Kaldır**, Chrome’u kapat-aç
2. `chrome://extensions` → Geliştirici modu → Paketlenmemiş yükle → bu klasör
3. https://console.groq.com/keys → key al
4. Yayın sekmesinde Başlat

Yayın sesi kapanmaz / kısılmaz. Türkçe ses üstüne biner.
