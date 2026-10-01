# Canlı Çeviri — Chrome uzantısı (Equsto’dan bağımsız)

Python / 1 GB model **yok**. Mantık:

1. **Önce altyazı** (YouTube vb.) → motor gürültüsü hiç karışmaz  
2. Altyazı yoksa **sekme sesi → Groq Whisper** (bulut, güçlü model)  
3. Doğal Türkçe çeviri (Groq)  
4. **Kadın ses** ile hoparlörde seslendirme (Chrome TTS)  
5. Yayın sesi **kapanmaz**

## Kurulum (2 dk)

1. Ücretsiz anahtar al: https://console.groq.com/keys  
2. Chrome → `chrome://extensions`  
3. **Geliştirici modu** aç  
4. **Paketlenmemiş öğe yükle** → bu klasörü seç (`canli-ceviri-extension`)  
5. Uzantı ikonuna tıkla → API anahtarını yapıştır → yayının olduğu sekmede **Başlat**

## YouTube / F1 için ipucu

Altyazıyı aç (CC). Mod: **Otomatik** veya **Sadece altyazı**.  
Altyazı varken motor sesi çeviriyi bozmaz; bu asıl doğru yol.

## Eski Python programı

`Desktop\canli-ceviri` klasörünü silebilirsin — artık gerekmez:

```powershell
Remove-Item -Recurse -Force $HOME\Desktop\canli-ceviri
```
