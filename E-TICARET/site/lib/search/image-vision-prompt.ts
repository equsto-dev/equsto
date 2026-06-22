export const IMAGE_VISION_PROMPT = `Bu görsel bir endüstriyel mutfak / gıda ekipmanı fotoğrafı. Katalogda aranacak ürün TİPİNİ tanımla.
Kurallar:
- "Equsto" veya başka satıcı adını YAZMA (görselde logo/etiket yoksa brand boş kalır).
- q alanında yalnızca ekipman tipi ve görünen model/kod (2-6 Türkçe kelime).
- Davlumbaz, tezgah, buzdolabı, fırın, blender, liyofilizatör, vakum paketleme vb. doğru ayrım yap.
- Cam kubbe/kapak + kompakt mobil gövde → liyofilizatör veya vakum kurutucu (davlumbaz değil).
Sadece JSON döndür (başka metin yok):
{"q":"ürün tipi araması","brand":"görselde okunan marka veya boş","model":"görünen model kodu veya boş"}
Örnek q: "liyofilizatör", "konveksiyonel fırın", "dikey buzdolabı", "bardak yıkama makinesi", "vakum paketleme makinesi"`;
