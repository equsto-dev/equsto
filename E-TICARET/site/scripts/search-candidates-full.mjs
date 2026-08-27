import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "..");
const EKIP = path.join(SITE, "var/catalog/ekipmanlar.json");

const ekipRaw = JSON.parse(fs.readFileSync(EKIP, "utf8"));
const products = Array.isArray(ekipRaw) ? ekipRaw : ekipRaw.items || [];

const searchQueries = [
  { id: "A1", label: "DİZDEN KUMANDALI EL YIKAMA LAVABOSU", kws: ["lavabo", "basmalı", "diz", "evye", "evyesi"] },
  { id: "A2", label: "İSTİF RAFI (152*46*160)", kws: ["istif", "rafi"] },
  { id: "B1", label: "PANEL TİP SOĞUK ODA (200*300*240)", kws: ["soğuk oda", "oda", "panel", "cr2"] },
  { id: "B2", label: "İSTİF RAFI (137*46*160)", kws: ["istif", "rafi"] },
  { id: "C1", label: "PANEL TİP SOĞUK ODA (200*200*240)", kws: ["soğuk oda", "oda", "panel"] },
  { id: "C2", label: "İSTİF RAFI (152*46*160)", kws: ["istif", "rafi"] },
  { id: "D1", label: "TEK EVİYELİ ÇALIŞMA TEZGAHI (140*70*85)", kws: ["eviyeli", "evyeli", "evye", "tezgah"] },
  { id: "D2", label: "DEPO TİPİ BUZDOLABI, TEK KAPILI (70*85*205)", kws: ["buzdolabı", "dik tip", "tek kapı", "gn 600", "lmv"] },
  { id: "D3", label: "ÇALIŞMA TEZGAHI, TABAN VE ARA RAFLI (160*70*85)", kws: ["tezgah", "ara raflı", "taban"] },
  { id: "D4", label: "MAKE-UP TEZGAH TİPİ BUZDOLABI, 3 SIRA ÇEKMECELİ (140*70*85)", kws: ["çekmeceli", "hazırlık", "pizza", "tag"] },
  { id: "D5", label: "ÇALIŞMA TEZGAHI, TABAN RAFLI (140*70*85)", kws: ["taban raflı", "tezgah"] },
  { id: "D6", label: "SET ALTI DEEP FREEZE (60*60*85)", kws: ["setaltı", "set altı", "dondurucu", "deep", "freeze", "tag 60"] },
  { id: "D7", label: "ÇALIŞMA TEZGAHI - DOLAPLI , ARA RAFLI (190*60*85)", kws: ["dolaplı", "tezgah", "kapılı"] },
  { id: "D8", label: "ÇALIŞMA TEZGAHI -DOLAPLI , ARA RAFLI (170*60*85)", kws: ["dolaplı", "tezgah", "kapılı"] },
  { id: "D9", label: "4 AÇIK ALEVLİ OCAK, SETÜSTÜ (80*70*30)", kws: ["ocak", "setüstü", "alevli"] },
  { id: "D10", label: "FRİTÖZ, İKİ HAZNELİ, ELK. SETÜSTÜ (80*70*30)", kws: ["fritöz", "setüstü", "hazneli", "çift"] },
  { id: "D11", label: "PATATES DİNLENDİRME, ELK. SETÜSTÜ (40*70*30)", kws: ["patates", "dinlendirme"] },
  { id: "D12", label: "PLATE IZGARA, DÜZ, GAZLI, SETÜSTÜ (80*70*30)", kws: ["ızgara", "plate", "düz", "gazlı"] },
  { id: "D13", label: "SETALTI BUZDOLABI, 4 KAPILI (140*70*60)", kws: ["setaltı", "buzdolabı", "kapılı", "tag 47", "tag 37"] },
  { id: "D14", label: "DAVLUMBAZ, ORTA TİP, FİLTRELİ (320*97*50)", kws: ["davlumbaz"] },
  { id: "D15", label: "SİNEK ÖLDÜRÜCÜ", kws: ["sinek", "öldürücü"] },
  { id: "E1", label: "BULAŞIK SIYIRMA TEZGAHI (140*70*85)", kws: ["sıyırma", "bulaşık", "huni", "alma"] },
  { id: "E2", label: "BASKET RAFI (140*40*60)", kws: ["basket", "rafı"] },
  { id: "E3", label: "ÇÖP ARABASI (Ø40*50)", kws: ["çöp", "arabası", "kovası", "konteyner"] },
  { id: "E4", label: "TEK EVYELİ ÇALIŞMA TEZGAHI (140*70*85)", kws: ["eviyeli", "evyeli", "evye", "tezgah"] },
  { id: "E5", label: "BULAŞIK YIKAMA MAKİNASI (500 Tb/saat)", kws: ["bulaşık", "yıkama", "makinası", "oby", "500"] },
  { id: "E6", label: "DUVAR RAFI (140*30*4)", kws: ["duvar rafı", "duvar rafi"] },
  { id: "E7", label: "İSTİF RAFI (152*46*160)", kws: ["istif", "rafi"] },
  { id: "Y1", label: "YER IZGARASI (30*30*14)", kws: ["yer ızgarası", "yer izgarasi", "ızgara", "290", "290*290"] }
];

const results = {};

for (const q of searchQueries) {
  // We will rank matching items based on how many keywords they match
  const scored = products.map(p => {
    const fullName = `${p.name || ""} ${p.sku || ""} ${p.brand || ""} ${p.model || ""} ${p.description || ""}`.toLowerCase();
    let score = 0;
    for (const kw of q.kws) {
      if (fullName.includes(kw.toLowerCase())) {
        score += 1;
      }
    }
    return { product: p, score };
  }).filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || (b.product.images?.length || 0) - (a.product.images?.length || 0));

  results[q.id] = {
    label: q.label,
    matches: scored.slice(0, 15).map(x => ({
      sku: x.product.sku,
      name: x.product.name,
      brand: x.product.brand,
      price: x.product.satis_fiyat_eur ?? x.product.price ?? null,
      images: x.product.images || [],
      score: x.score
    }))
  };
}

const scratchDir = path.join(SITE, "..", "..", "PFOS", "veri");
fs.mkdirSync(scratchDir, { recursive: true });
fs.writeFileSync(path.join(scratchDir, "hamburgerci-candidates-full.json"), JSON.stringify(results, null, 2), "utf8");
console.log("Written candidates to PFOS/veri/hamburgerci-candidates-full.json");
