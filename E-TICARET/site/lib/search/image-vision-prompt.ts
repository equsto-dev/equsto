export const IMAGE_VISION_PROMPT = `Bu görsel bir endüstriyel mutfak / gıda ekipmanı fotoğrafı. Katalogda aranacak ürün TİPİNİ tanımla.
Kurallar:
- "Equsto" veya başka satıcı adını YAZMA (görselde logo/etiket yoksa brand boş kalır).
- "endüstriyel" gibi genel sıfatları YAZMA; yalnızca ekipman tipi ve görünen model/kod (2-6 Türkçe kelime).
- Davlumbaz, tezgah, buzdolabı, fırın, blender, liyofilizatör, vakum paketleme vb. doğru ayrım yap.
- Cam kubbe/kapak + kompakt mobil gövde → liyofilizatör veya vakum kurutucu (davlumbaz değil).
- Paslanmaz modüler bar: buz kuyusu/haznesi, speed rail, şişe rafı, lavabo, çekmeceli alt modül → "kokteyl bar istasyonu" veya "modüler kokteyl tezgahı" (bar blender veya salat bar DEĞİL).
Sadece JSON döndür (başka metin yok):
{"q":"ürün tipi araması","brand":"görselde okunan marka veya boş","model":"görünen model kodu veya boş"}
Örnek q: "liyofilizatör", "konveksiyonel fırın", "kokteyl bar istasyonu", "modüler kokteyl tezgahı", "bardak yıkama makinesi"`;
