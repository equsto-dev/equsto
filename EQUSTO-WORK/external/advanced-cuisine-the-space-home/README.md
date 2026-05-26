# advanced-cuisine.com — The Space Home (snapshot)

Kaynak: [The space home – The Space & Vesta](https://advanced-cuisine.com/pages/the-space-home)

## İçerik

| Dosya / klasör | Açıklama |
|----------------|----------|
| `index.html` | Sayfanın tam HTML çıktısı (Shopify Dawn teması, ~133 KB). |
| `urls-all.txt` | HTML içinden çıkarılan benzersiz `http(s)://` ve `//` adresleri (62 satır). |
| `assets/` | Bu URL’lerden indirilebildiği kadar statik dosya (CSS, JS, görseller, font). |

İndirme sırasında TLS doğrulaması gevşetildi (`curl -k`); yalnızca arşiv / referans içindir.

## Dikkat

- HTML içinde mağaza yapılandırması (ör. `Shopify.features` / `accessToken` benzeri alanlar) bulunabilir; bu tür anahtarlar vitrinde herkese açık olsa da repoya commit etmeden önce gerekiyorsa temizleyin.
- Bazı bağlantılar (sosyal ağ, yönlendirme) uzantısı belirsiz olduğu için `*.bin` olarak kaydedilmiş olabilir.

## Tarih

Otomatik çekim; içerik site tarafından değişebilir.
