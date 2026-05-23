import path from "path";

/** Repo kökündeki v14 Excel şablonu */
export const TEKLIF_V14_TEMPLATE_PATH = path.join(
  process.cwd(),
  "templates",
  "teklif-v14.xlsx",
);

export const TEKLIF_V14_FORM_NO = "EQS-TKL-001";

/** Bölüm başlık satırı (01. BAR & KAHVE …) — pastel yeşil */
export const TEKLIF_BOLUM_ROW_FILL = "#e6f4ea";
export const TEKLIF_BOLUM_ROW_FILL_ARGB = "FFE6F4EA";

export const TEKLIF_V14_TEMPLATE_URL =
  "/data/templates/equsto_teklif_v14.xlsx";

export const TEKLIF_V14_EUR_TRY_URL = "/api/kur";

/** equsto_teklif_v14.xlsx — ŞARTLARIMIZ bloğu */
export const TEKLIF_V14_SARTLAR: string[] = [
  "ŞARTLARIMIZ",
  "  01.   Teklifimiz 7 (YEDİ) gün geçerlidir.",
  "  02.   Fiyatlarımıza KDV dahil değildir, faturada ayrıca eklenecektir.",
  "  03.   Faturamız TL olarak kesilecektir. Tutarlar TCMB Efektif Satış Kuru üzerinden hesaplanmıştır.",
  "  04.   Ödeme; siparişte %50 peşin banka havalesi, kalanı mal tesliminden önce banka havalesi şeklindedir.",
  "  05.   Ödeme şartlarının yerine getirilmesi ile birlikte teklif sipariş statüsüne geçer.",
  "  06.   Montaj satıcıya aittir. Her türlü tesisat ve sarf malzemesi alıcıya aittir.",
  "  07.   Nakliye ve nakliye sigortası satıcıya aittir.",
  "  08.   Her türlü yatay ve dikey taşımacılık alıcıya aittir. Kamyon üstü teslimdir.",
  "  09.   Teslim yeri müşteri adresidir.",
  "  10.   Teslim süresi: kesin siparişinizi takiben 6-8 hafta (üretim programına göre teyit).",
  "  11.   Soğuk odalarda dış ünite mesafesi 10-12 m olarak fiyatlandırılmıştır.",
  "  12.   İş kapsamında değişiklik olması durumunda karşılıklı mutabakatla teklif revize edilir.",
  "  13.   Ölçü bekler çözümünün siparişten sonraki 1 ay içinde tamamlanması gerekir.",
  "  14.   Zamanında ödenmeyen bedel için aylık %5 vade farkı uygulanır.",
  "  15.   Depoda 1 aydan fazla bekleyen mallar için aylık sipariş bedelinin %5'i depo kirasıdır.",
  "  16.   Dijital mutabakatlar yazılı mutabakat gibi sonuç doğurur.",
  "  17.   Equsto.com yapay zekadan yardım alır; hata yapabilir. Nihai teyit satıcı onayındadır.",
];
