import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tipsJs = fs.readFileSync(path.join(root, "public/eq-dept-tips.js"), "utf8");

function tipKey(t) {
  return String(t).replace(/-/g, "_").replace(/_+$/, "");
}

const labels = new Map();

const reTip = /\{\s*tip:\s*"([^"]+)"[^}]*label:\s*"([^"]+)"/g;
let m;
while ((m = reTip.exec(tipsJs)) !== null) {
  labels.set(tipKey(m[1]), m[2]);
}

/** nav.js flyout — doğru TR etiketleri (otomatik çıkarım üst kategoriyi karıştırabiliyor). */
const NAV_TR = {
  firinlar: "Fırınlar",
  sanayi_ocaklari: "Endüstriyel Ocaklar",
  sanayi_tipi_izgaralar: "Izgaralar",
  kuzineler: "Kuzineler",
  fritozler: "Fritözler",
  doner_ocaklari: "Döner Ocakları",
  tost_makineleri: "Tost Makineleri",
  pilic_cevirme_makineleri: "Piliç Çevirme",
  buzdolaplari: "Buzdolapları",
  tezgah_tipi_buzdolabi: "Tezgah Tipi",
  make_up_dolabi: "Make Up Dolapları",
  cihazalti: "Cihazaltı",
  dik_tip_buzdolap: "Dik Tip",
  pastane_buzdolaplari: "Pastane Buzdolapları",
  buz_makineleri: "Buz Makineleri",
  derin_dondurucular: "Derin Dondurucular",
  soguk_odalar: "Soğuk Odalar",
  sarap_dolaplari: "Şarap Dolapları",
  market_reyonlari: "Market Reyonları",
  espresso_makinesi: "Espresso Makineleri",
  kahve_degirmeni: "Değirmenler",
  filtre_kahve: "Filtre Kahve",
  turk_kahve: "Türk Kahve",
  barista_aksesuarlari: "Barista Aksesuarları",
  setalti_bulasik: "Setaltı Bulaşık Yıkama Makineleri",
  giyotin_bulasik: "Giyotin Tip Bulaşık Yıkama Makineleri",
  konveyorlu_bulasik: "Konveyörlü Bulaşık Yıkama Makineleri",
  tirnakli_bulasik: "Tırnaklı Bulaşık Yıkama Makineleri",
  kazan_yikama: "Kazan Yıkama Makineleri",
  mikserler: "Mikserler",
  blenderlar: "Blenderlar",
  sebze_dograma: "Dilimleme Makineleri",
  kiyma_makinesi: "Kıyma Makineleri",
  vakum_makinesi: "Vakum Makineleri",
  portakal_sikma: "Meyve Sıkacakları",
  soguk_dispenser: "Soğuk İçecek Dispenserleri",
  limonata_serbet: "Soda Makineleri",
  bira_sistemleri: "Bira Sistemleri",
  bar_blender: "Smoothie Blenderlar",
  self_servis_hatti: "Self-Servis Hattı",
  teshir_dolaplari: "Teşhir Dolapları",
};

for (const [k, v] of Object.entries(NAV_TR)) {
  labels.set(k, v);
}

const NAV_EN = {
  firinlar: "Ovens",
  sanayi_ocaklari: "Industrial cookers",
  sanayi_tipi_izgaralar: "Grills",
  kuzineler: "Cooking ranges",
  fritozler: "Fryers",
  doner_ocaklari: "Doner kebab grills",
  tost_makineleri: "Toasters",
  pilic_cevirme_makineleri: "Chicken rotisseries",
  buzdolaplari: "Refrigerators",
  tezgah_tipi_buzdolabi: "Counter-top refrigerators",
  make_up_dolabi: "Make-up cabinets",
  cihazalti: "Undercounter",
  dik_tip_buzdolap: "Upright cabinets",
  pastane_buzdolaplari: "Pastry refrigerators",
  buz_makineleri: "Ice makers",
  derin_dondurucular: "Freezers",
  soguk_odalar: "Cold rooms",
  sarap_dolaplari: "Wine cabinets",
  market_reyonlari: "Retail display cases",
  espresso_makinesi: "Espresso machines",
  kahve_degirmeni: "Coffee grinders",
  filtre_kahve: "Filter coffee",
  turk_kahve: "Turkish coffee",
  barista_aksesuarlari: "Barista accessories",
  setalti_bulasik: "Undercounter dishwashers",
  giyotin_bulasik: "Hood-type dishwashers",
  konveyorlu_bulasik: "Conveyor dishwashers",
  tirnakli_bulasik: "Rack dishwashers",
  kazan_yikama: "Kettle washers",
  mikserler: "Mixers",
  blenderlar: "Blenders",
  sebze_dograma: "Vegetable slicers",
  kiyma_makinesi: "Meat mincers",
  vakum_makinesi: "Vacuum packers",
  portakal_sikma: "Juice extractors",
  soguk_dispenser: "Cold beverage dispensers",
  limonata_serbet: "Soda machines",
  bira_sistemleri: "Draft beer systems",
  bar_blender: "Bar blenders",
  self_servis_hatti: "Self-service line",
  teshir_dolaplari: "Display cabinets",
};

function autoEn(tr, key) {
  if (NAV_EN[key]) return NAV_EN[key];
  let s = String(tr);
  if (/^Proso |^Çağlayan |^Nilüfer$|^Lotus$|^Nergis$/i.test(s) || /^[A-Z][a-z]+$/.test(s) && !/[ğüşıöçĞÜŞİÖÇ]/.test(s)) {
    return s;
  }
  s = s
    .replace(/Ekipmanları/g, "Equipment")
    .replace(/Ekipmanı/g, "Equipment")
    .replace(/Makineleri/g, "Machines")
    .replace(/Makineler/g, "Machines")
    .replace(/Makinesi/g, "Machines")
    .replace(/Dolapları/g, "Cabinets")
    .replace(/Dolaplar/g, "Cabinets")
    .replace(/Dolabı/g, "Cabinet")
    .replace(/Fırınlar/g, "Ovens")
    .replace(/Fırın/g, "Oven")
    .replace(/Ocakları/g, "Cookers")
    .replace(/Ocaklar/g, "Cookers")
    .replace(/Izgaralar/g, "Grills")
    .replace(/Izgara/g, "Grill")
    .replace(/Fritözler/g, "Fryers")
    .replace(/Buzdolapları/g, "Refrigerators")
    .replace(/Buzdolap/g, "Refrigerator")
    .replace(/Dondurucular/g, "Freezers")
    .replace(/Soğuk Odalar/g, "Cold rooms")
    .replace(/Tezgahları/g, "Counters")
    .replace(/Tezgah/g, "Counter")
    .replace(/Yıkama/g, "Washing")
    .replace(/Bulaşık/g, "Dish")
    .replace(/Hazırlık/g, "Prep")
    .replace(/İçecek/g, "Beverage")
    .replace(/Kahve/g, "Coffee")
    .replace(/Çay/g, "Tea")
    .replace(/Teşhir/g, "Display")
    .replace(/Reyonları/g, "Display lines")
    .replace(/Reyonu/g, "Display line");
  return s;
}

const subTr = {};
const subEn = {};
[...labels.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .forEach(([k, v]) => {
    subTr[k] = v;
    subEn[k] = autoEn(v, k);
  });

const scriptsDir = path.join(root, "scripts");
fs.writeFileSync(path.join(scriptsDir, "nav-sub-tr.generated.json"), JSON.stringify(subTr, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(scriptsDir, "nav-sub-en.generated.json"), JSON.stringify(subEn, null, 2) + "\n", "utf8");
console.log("[gen-nav-sub-keys]", Object.keys(subTr).length, "keys");
