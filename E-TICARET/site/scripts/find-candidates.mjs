import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

console.log(`Toplam ürün sayısı: ${products.length}`);

function search(kws, max = 15) {
  const terms = kws.toLowerCase().split(/\s+/);
  const matches = products.filter(p => {
    const fullName = `${p.name || ""} ${p.sku || ""} ${p.brand || ""} ${p.model || ""}`.toLowerCase();
    return terms.every(t => fullName.includes(t));
  });
  return matches.slice(0, max);
}

const targets = [
  { label: "A1-Dizden Kumandali El Yikama", kw: "el yikama" },
  { label: "A1-Dizden Kumandali El Yikama (Diz)", kw: "diz" },
  { label: "A2-Istif Rafi 152", kw: "istif rafi 152" },
  { label: "B1-Panel Tip Soguk Oda 200*300", kw: "soguk oda" },
  { label: "B1-Panel Tip Soguk Oda (CR)", kw: "cr" },
  { label: "D1-Tek Eviyeli Tezgah 140", kw: "eviyeli 140" },
  { label: "D1-Tek Eviyeli Tezgah (Evyeli)", kw: "evyeli" },
  { label: "D1-Tek Eviyeli Tezgah (Evyeli 70)", kw: "evyeli 70" },
  { label: "D2-Depo Tipi Tek Kapili Buzdolabi", kw: "dik tip buzdolabi" },
  { label: "D2-Depo Tipi Tek Kapili Buzdolabi (600 L)", kw: "600" },
  { label: "D4-Make-up Cekmeceli Buzdolabi", kw: "hazirlik" },
  { label: "D4-Make-up Cekmeceli Buzdolabi (tag)", kw: "tag" },
  { label: "D6-Set Alti Deep Freeze", kw: "derin dondurucu setustu" },
  { label: "D6-Set Alti Deep Freeze (setalti)", kw: "setalti dondurucu" },
  { label: "D6-Set Alti Deep Freeze (tag 60)", kw: "tag" },
  { label: "D7-Dolapli Ara Rafli Tezgah 190", kw: "dolapli 190" },
  { label: "D7-Dolapli Ara Rafli Tezgah (dolapli)", kw: "dolapli" },
  { label: "D9-4 Acik Alevli Ocak Setustu", kw: "ocak 4" },
  { label: "D9-4 Acik Alevli Ocak (setustu)", kw: "setustu ocak" },
  { label: "D10-Fritoz Cift Hazneli", kw: "fritoz 70" },
  { label: "D10-Fritoz Cift Hazneli (fritoz)", kw: "fritoz" },
  { label: "D11-Patates Dinlendirme", kw: "patates" },
  { label: "D12-Plate Izgara Duz Gazli", kw: "izgara duz" },
  { label: "D12-Plate Izgara (plate)", kw: "plate" },
  { label: "D13-Setalti Buzdolabi 4 Kapili", kw: "4 kapili" },
  { label: "D13-Setalti Buzdolabi 4 Kapili (tag 4)", kw: "tag 4" },
  { label: "D14-Davlumbaz 320", kw: "davlumbaz" },
  { label: "E1-Siyirma Tezgahi", kw: "siyirma" },
  { label: "E2-Basket Rafi", kw: "basket" },
  { label: "E3-Cop Arabasi", kw: "cop arabasi" },
  { label: "E3-Cop Arabasi (cop)", kw: "cop" },
  { label: "E5-Bulasik Yikama Makinesi 500", kw: "oby 50" },
  { label: "Y1-Yer Izgarasi 30*30", kw: "yer izgarasi" },
  { label: "Y1-Yer Izgarasi 30*30 (30)", kw: "izgara 30" }
];

for (const t of targets) {
  const res = search(t.kw);
  console.log(`\n======================================`);
  console.log(`TARGET: ${t.label} (Query: "${t.kw}") - Bulunan: ${res.length}`);
  console.log(`======================================`);
  for (const p of res) {
    console.log(`SKU: ${p.sku} | Marka: ${p.brand} | Fiyat: ${p.satis_fiyat_eur ?? p.price ?? "Yok"}`);
    console.log(`Ad: ${p.name}`);
    if (p.images && p.images.length > 0) {
      console.log(`Gorsel: ${p.images[0].path || p.images[0].url || p.images[0]}`);
    } else {
      console.log(`Gorsel: YOK`);
    }
  }
}
