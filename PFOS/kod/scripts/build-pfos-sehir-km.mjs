/**
 * İstanbul çıkış → il merkezi yol km (kuş uçuşu × yol katsayısı).
 * Çıktı: public/data/pfos-sehir-km.json
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

/** İl merkezi koordinatları (yaklaşık) */
const IL = {
  Adana: [37.0, 35.3213],
  Adıyaman: [37.7648, 38.2786],
  Afyonkarahisar: [38.7507, 30.5567],
  Ağrı: [39.7191, 43.0503],
  Aksaray: [38.3687, 34.037],
  Amasya: [40.6499, 35.8353],
  Ankara: [39.9334, 32.8597],
  Antalya: [36.8969, 30.7133],
  Ardahan: [41.1105, 42.7022],
  Artvin: [41.1828, 41.8183],
  Aydın: [37.856, 27.8416],
  Balıkesir: [39.6484, 27.8826],
  Bartın: [41.5811, 32.461],
  Batman: [37.8812, 41.1351],
  Bayburt: [40.2552, 40.2249],
  Bilecik: [40.1429, 29.9793],
  Bingöl: [38.8855, 40.4966],
  Bitlis: [38.3938, 42.1232],
  Bolu: [40.735, 31.6089],
  Burdur: [37.7203, 30.2908],
  Bursa: [40.1885, 29.061],
  Çanakkale: [40.1553, 26.4142],
  Çankırı: [40.6013, 33.6134],
  Çorum: [40.5506, 34.9556],
  Denizli: [37.7765, 29.0864],
  Diyarbakır: [37.9144, 40.2306],
  Düzce: [40.8438, 31.1565],
  Edirne: [41.6771, 26.5557],
  Elazığ: [38.681, 39.2264],
  Erzincan: [39.75, 39.5],
  Erzurum: [39.9043, 41.2679],
  Eskişehir: [39.7767, 30.5206],
  Gaziantep: [37.0662, 37.3833],
  Giresun: [40.9128, 38.3895],
  Gümüşhane: [40.4386, 39.5086],
  Hakkari: [37.5744, 43.7408],
  Hatay: [36.4018, 36.3498],
  Iğdır: [39.888, 44.0048],
  Isparta: [37.7648, 30.5566],
  İstanbul: [41.0082, 28.9784],
  İzmir: [38.4237, 27.1428],
  Kahramanmaraş: [37.5858, 36.9371],
  Karabük: [41.2061, 32.6204],
  Karaman: [37.1759, 33.2287],
  Kars: [40.6013, 43.0975],
  Kastamonu: [41.3887, 33.7827],
  Kayseri: [38.7312, 35.4787],
  Kilis: [36.7165, 37.1147],
  Kırıkkale: [39.8468, 33.5153],
  Kırklareli: [41.735, 27.2252],
  Kırşehir: [39.1425, 34.1709],
  Kocaeli: [40.7654, 29.9408],
  Konya: [37.8746, 32.4932],
  Kütahya: [39.4167, 29.9833],
  Malatya: [38.3552, 38.3095],
  Manisa: [38.6191, 27.4289],
  Mardin: [37.3212, 40.7245],
  Mersin: [36.8121, 34.6415],
  Muğla: [37.2153, 28.3636],
  Muş: [38.9462, 41.7539],
  Nevşehir: [38.6939, 34.6857],
  Niğde: [37.9667, 34.6833],
  Ordu: [40.9839, 37.8764],
  Osmaniye: [37.0742, 36.2478],
  Rize: [41.0201, 40.5234],
  Sakarya: [40.7569, 30.3781],
  Samsun: [41.2867, 36.33],
  Şanlıurfa: [37.1591, 38.7969],
  Siirt: [37.9333, 41.95],
  Sinop: [42.0267, 35.1551],
  Sivas: [39.7477, 37.0179],
  Şırnak: [37.4187, 42.4918],
  Tekirdağ: [40.978, 27.5117],
  Tokat: [40.3167, 36.55],
  Trabzon: [41.0027, 39.7168],
  Tunceli: [39.1079, 39.5401],
  Uşak: [38.6823, 29.4082],
  Van: [38.4891, 43.4089],
  Yalova: [40.65, 29.2667],
  Yozgat: [39.8181, 34.8147],
  Zonguldak: [41.4564, 31.7987],
};

const CIKIS = { sehir: "İstanbul", lat: 41.0082, lng: 28.9784 };
const YOL_KATSAYI = 1.2;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const km_by_sehir = {};
for (const [name, [lat, lng]] of Object.entries(IL)) {
  const kuş = haversineKm(CIKIS.lat, CIKIS.lng, lat, lng);
  let yol = Math.round(kuş * YOL_KATSAYI);
  if (name === "İstanbul" || name === "Kocaeli" || name === "Yalova") {
    yol = Math.min(yol, name === "İstanbul" ? 25 : name === "Yalova" ? 55 : 95);
  }
  km_by_sehir[name] = yol;
}

const out = {
  version: 1,
  cikis: CIKIS,
  yol_katsayi: YOL_KATSAYI,
  not: "İstanbul depo çıkışı → il merkezi tahmini karayolu km",
  km_by_sehir,
};

const dest = path.join(ROOT, "public/data/pfos-sehir-km.json");
await writeFile(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Wrote", dest, Object.keys(km_by_sehir).length, "il");
