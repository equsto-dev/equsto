import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

const queries = [
  { id: "A1", query: "el yikama lavabosu diz", desc: "DİZDEN KUMANDALI EL YIKAMA LAVABOSU" },
  { id: "A2", query: "istif rafi 152", desc: "İSTİF RAFI 152*46*160" },
  { id: "B1", query: "soguk oda 200", desc: "PANEL TİP SOĞUK ODA 200*300*240" },
  { id: "B2", query: "istif rafi 137", desc: "İSTİF RAFI 137*46*160" },
  { id: "C1", query: "soguk oda 200", desc: "PANEL TİP SOĞUK ODA 200*200*240" },
  { id: "C2", query: "istif rafi 152", desc: "İSTİF RAFI 152*46*160" },
  { id: "D1", query: "tek eviyeli calisma tezgah 140", desc: "TEK EVİYELİ ÇALIŞMA TEZGAHI 140*70*85" },
  { id: "D2", query: "dik tip buzdolabi 70", desc: "DEPO TİPİ BUZDOLABI, TEK KAPILI 70*85*205" },
  { id: "D3", query: "calisma tezgah taban ara raf 160", desc: "ÇALIŞMA TEZGAHI, TABAN VE ARA RAFLI 160*70*85" },
  { id: "D4", query: "makeup tezgah tipi", desc: "MAKE-UP TEZGAH TİPİ BUZDOLABI, 3 SIRA ÇEKMECELİ 140*70*85" },
  { id: "D5", query: "calisma tezgah taban raf 140", desc: "ÇALIŞMA TEZGAHI, TABAN RAFLI 140*70*85" },
  { id: "D6", query: "setalti derin dondurucu 60", desc: "SET ALTI DEEP FREEZE 60*60*85" },
  { id: "D7", query: "calisma tezgah dolapli ara raf 190", desc: "ÇALIŞMA TEZGAHI - DOLAPLI , ARA RAFLI 190*60*85" },
  { id: "D8", query: "calisma tezgah dolapli ara raf 170", desc: "ÇALIŞMA TEZGAHI -DOLAPLI , ARA RAFLI 170*60*85" },
  { id: "D9", query: "ocak 4 acik setustu", desc: "4 AÇIK ALEVLİ OCAK, SETÜSTÜ 80*70*30" },
  { id: "D10", query: "fritoz iki hazneli setustu", desc: "FRİTÖZ, İKİ HAZNELİ, ELK. SETÜSTÜ 80*70*30" },
  { id: "D11", query: "patates dinlendirme setustu", desc: "PATATES DİNLENDİRME, ELK. SETÜSTÜ 40*70*30" },
  { id: "D12", query: "plate izgara gazli setustu", desc: "PLATE IZGARA, DÜZ, GAZLI, SETÜSTÜ 80*70*30" },
  { id: "D13", query: "setalti buzdolabi 4", desc: "SETALTI BUZDOLABI, 4 KAPILI 140*70*60" },
  { id: "D14", query: "davlumbaz filtre 320", desc: "DAVLUMBAZ, ORTA TİP, FİLTRELİ 320*97*50" },
  { id: "D15", query: "sinek", desc: "SİNEK ÖLDÜRÜCÜ" },
  { id: "E1", query: "siyirma tezgah", desc: "BULAŞIK SIYIRMA TEZGAHI 140*70*85" },
  { id: "E2", query: "basket rafi", desc: "BASKET RAFI 140*40*60" },
  { id: "E3", query: "cop arabasi", desc: "ÇÖP ARABASI Ø40*50" },
  { id: "E4", query: "tek eviyeli calisma tezgah 140", desc: "TEK EVYELİ ÇALIŞMA TEZGAHI 140*70*85" },
  { id: "E5", query: "bulasik yikama 500", desc: "BULAŞIK YIKAMA MAKİNASI 500" },
  { id: "E6", query: "duvar rafi 140", desc: "DUVAR RAFI 140*30" },
  { id: "E7", query: "istif rafi 152", desc: "İSTİF RAFI 152*46*160" },
  { id: "Y1", query: "yer izgarasi 30", desc: "YER IZGARASI 30*30*14" }
];

console.log("=== ARAMA BAŞLIYOR ===");

for (const q of queries) {
  const terms = q.query.toLowerCase().split(/\s+/);
  const matches = products.filter(p => {
    const fullName = `${p.name || ""} ${p.sku || ""} ${p.brand || ""}`.toLowerCase();
    return terms.every(t => fullName.includes(t));
  });

  console.log(`\nPoz ${q.id} [${q.desc}] -> Bulunan Eşleşmeler (${matches.length}):`);
  matches.slice(0, 3).forEach(m => {
    console.log(`  - SKU: ${m.sku} | Marka: ${m.brand} | Fiyat: ${m.satis_fiyat_eur ?? m.price ?? "Yok"} | Ad: ${m.name}`);
  });
}
