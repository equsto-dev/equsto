#!/usr/bin/env node
/**
 * Kafe / Coffee Shop referans listelerinden ortak slot analizi.
 * node veri/analyze-kafe-ortak-slotlar.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(ROOT, "../../E-TICARET/site");
const REF_DIR = path.join(SITE, "public/data/pfos-referans");
const MANIFEST = path.join(SITE, "public/data/pfos-kategoriler.json");

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/\s+/g, " ")
    .trim();
}

const TIP_RULES = [
  { tip: "montaj-nakliye", test: (n) => n.includes("nakliye") || n.includes("montaj") },
  {
    tip: "espresso-2-grup",
    test: (n) =>
      n.includes("espresso") &&
      (n.includes("makina") || n.includes("makin") || n.includes("gruplu")),
  },
  {
    tip: "soguk-tesir-dolabi-pastane",
    test: (n) =>
      n.includes("teshir") ||
      n.includes("teşhir") ||
      (n.includes("soguk") && n.includes("pasta")),
  },
  {
    tip: "sise-sogutucu-3-kapili",
    test: (n) =>
      n.includes("sise") && n.includes("sogut") && (n.includes("uc kapili") || n.includes("3 kapili")),
  },
  {
    tip: "sise-sogutucu-2-kapili",
    test: (n) =>
      n.includes("sise") && n.includes("sogut") && (n.includes("iki kapili") || n.includes("2 kapili")),
  },
  { tip: "bar-buzdolabi", test: (n) => n.includes("sise") && n.includes("sogut") },
  { tip: "kahve-degirmeni", test: (n) => n.includes("degirmen") && !n.includes("makina") },
  { tip: "filter-coffee-makinesi", test: (n) => n.includes("filtre") && n.includes("kahve") },
  {
    tip: "kahve-makinasi-turk",
    test: (n) =>
      (n.includes("turk kahve") || n.includes("türk kahve") || n.includes("atkm")) &&
      n.includes("makina"),
  },
  { tip: "karbuz-makinesi", test: (n) => n.includes("karbuz") && n.includes("makin") },
  { tip: "buz-makinesi-brema-cb425", test: (n) => /brema/.test(n) && /cb425|425/.test(n) },
  {
    tip: "buz-makinesi-brema-cb416",
    test: (n) => /brema/.test(n) && (/cb416|416|42\s*kg|44\s*kg/.test(n) || !/cb425|425/.test(n)),
  },
  {
    tip: "buz-makinesi-90kg",
    test: (n) => /(?:^|\s|,)buz\s+makin/.test(n) && !n.includes("karbuz") && !n.includes("brema"),
  },
  { tip: "glass-washer", test: (n) => n.includes("bardak yik") || n.includes("bardak yık") },
  {
    tip: "calisma-tezgahi-kasa-kahve",
    test: (n) =>
      n.includes("calisma tezgah") && (n.includes("kasa") || n.includes("kahve cekmece")),
  },
  {
    tip: "calisma-tezgahi-dolapli",
    test: (n) =>
      n.includes("calisma tezgah") &&
      (n.includes("dolap") || n.includes("evyeli") || n.includes("evye")),
  },
  {
    tip: "calisma-tezgahi-taban-ara",
    test: (n) => n.includes("calisma tezgah") && n.includes("ara raf"),
  },
  { tip: "calisma-tezgahi", test: (n) => n.includes("calisma tezgah") || n.includes("çalışma tezgah") },
  { tip: "evye-tezgahi-dolapli", test: (n) => n.includes("evye tezgah") || (n.includes("evyeli") && n.includes("tezgah")) },
  { tip: "cop-tezgahi", test: (n) => n.includes("cop tezgah") || n.includes("çöp tezgah") },
  { tip: "cop-arabasi", test: (n) => n.includes("cop araba") || n.includes("çöp araba") },
  { tip: "rinser-evyesi", test: (n) => n.includes("rinser") || n.includes("rincer") || n.includes("durulama") },
  { tip: "bar-kuvet", test: (n) => n.includes("kuvet") },
  {
    tip: "tas-firin",
    test: (n) =>
      n.includes("tas firin") ||
      n.includes("taş fırın") ||
      n.includes("tas taban") ||
      n.includes("taş taban"),
  },
  {
    tip: "konveksiyon-firin-unox",
    test: (n) =>
      (n.includes("firin") || n.includes("fırın")) &&
      (n.includes("unox") || n.includes("jet firin")),
  },
  {
    tip: "konveksiyon-firin-pastane",
    test: (n) =>
      (n === "firin" || n === "fırın") && !n.includes("pizza") && !n.includes("tas") && !n.includes("taş"),
  },
  { tip: "speed-oven-merry-chef", test: (n) => n.includes("merrychef") || n.includes("merry chef") },
  { tip: "bar-blender", test: (n) => n.includes("blender") },
  { tip: "bar-mikser", test: (n) => n.includes("bar mikser") || n.includes("milk frother") },
  { tip: "kokteyl-tezgah", test: (n) => n.includes("kokteyl istasyon") || n.includes("kokteyl tezgah") },
  { tip: "kati-meyve-sikacagi", test: (n) => n.includes("meyve sik") || n.includes("portakal sik") },
  { tip: "yer-izgara-kucuk", test: (n) => n.includes("yer izgar") || n.includes("yer ızgar") },
  { tip: "icecek-havuzu-soguk", test: (n) => n.includes("icecek havuzu") || n.includes("içecek havuzu") },
  {
    tip: "setalti-buzdolabi-tek",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("derin") &&
      !n.includes("derindonduruc") &&
      (n.includes("setalti") || n.includes("set alti") || n.includes("cihazalti") || n.includes("tezgahalti")),
  },
  {
    tip: "depo-buzdolabi-tek-kapili",
    test: (n) =>
      n.includes("buzdolab") &&
      !n.includes("tezgah") &&
      !n.includes("setalti") &&
      (n.includes("depo") || n.includes("dik tip")),
  },
  {
    tip: "setalti-derin-dondurucu",
    test: (n) =>
      (n.includes("derin donduruc") || n.includes("derindonduruc")) &&
      !n.includes("depo") &&
      (n.includes("setalti") || n.includes("set alti") || n.includes("cihazalti") || n.includes("tek kapili") || n.includes("60*60")),
  },
  {
    tip: "depo-derin-dondurucu",
    test: (n) =>
      (n.includes("derin donduruc") || n.includes("derindonduruc")) &&
      !n.includes("setalti") &&
      !n.includes("cihazalti"),
  },
  { tip: "istif-rafi", test: (n) => n.includes("istif raf") },
  {
    tip: "kombi-firin-6t",
    test: (n) =>
      n.includes("kombi") ||
      n.includes("konveksiyon") ||
      (n.includes("firin") && !n.includes("unox") && !n.includes("tas") && !n.includes("taş") && n.length > 12),
  },
  {
    tip: "bulasik-makinesi-setalti",
    test: (n) =>
      (n.includes("bulasik") || n.includes("bulaşık")) &&
      (n.includes("setalti") || n.includes("set alti") || n.includes("500 tb") || n.includes("neo dw")),
  },
  {
    tip: "bulasik-makinesi-giyotin",
    test: (n) =>
      n.includes("giyotin") ||
      ((n.includes("bulasik") || n.includes("bulaşık")) &&
        (n.includes("1000 tb") || (!n.includes("setalti") && !n.includes("bardak") && !n.includes("500 tb")))),
  },
  { tip: "davlumbaz-duvar", test: (n) => n.includes("davlumbaz") },
  { tip: "fritoz-tek", test: (n) => n.includes("fritoz") || n.includes("fritöz") },
  { tip: "yer-izgara", test: (n) => n.includes("izgara") && !n.includes("yer izgar") },
  { tip: "pizza-firin", test: (n) => n.includes("pizza") && n.includes("firin") },
  { tip: "hamur-yogurma", test: (n) => n.includes("hamur") && (n.includes("yogur") || n.includes("yoğur")) },
  { tip: "tezgah-alti-bulasik", test: (n) => n.includes("tezgahalti") && n.includes("bulasik") },
];

/** Matris slotları — tip_kodu → çekirdek slot */
const SLOT_MAP = {
  "espresso-2-grup": { slot: "espresso_makinesi", label: "Espresso makinesi (2 grup)" },
  "kahve-degirmeni": { slot: "kahve_degirmeni", label: "Kahve öğütücü" },
  "filter-coffee-makinesi": { slot: "filtre_kahve", label: "Filtre kahve makinesi" },
  "kahve-makinasi-turk": { slot: "turk_kahve", label: "Türk kahvesi makinesi" },
  "bar-buzdolabi": { slot: "sise_sogutucu", label: "Şişe soğutucu (bar)" },
  "sise-sogutucu-2-kapili": { slot: "sise_sogutucu", label: "Şişe soğutucu (bar)" },
  "sise-sogutucu-3-kapili": { slot: "sise_sogutucu", label: "Şişe soğutucu (bar)" },
  "setalti-buzdolabi-tek": { slot: "setalti_buzdolabi", label: "Tezgah altı buzdolabı" },
  "depo-buzdolabi-tek-kapili": { slot: "depo_buzdolabi", label: "Depo / dik tip buzdolabı" },
  "setalti-derin-dondurucu": { slot: "derin_dondurucu", label: "Derin dondurucu" },
  "depo-derin-dondurucu": { slot: "derin_dondurucu", label: "Derin dondurucu" },
  "soguk-tesir-dolabi-pastane": { slot: "soguk_teshir", label: "Soğuk teşhir vitrini" },
  "buz-makinesi-brema-cb425": { slot: "buz_makinesi", label: "Buz makinesi" },
  "buz-makinesi-brema-cb416": { slot: "buz_makinesi", label: "Buz makinesi" },
  "buz-makinesi-90kg": { slot: "buz_makinesi", label: "Buz makinesi" },
  "karbuz-makinesi": { slot: "karbuz_makinesi", label: "Karpuz makinesi" },
  "glass-washer": { slot: "bardak_yikama", label: "Bardak yıkama makinesi" },
  "calisma-tezgahi-kasa-kahve": { slot: "calisma_tezgahi", label: "Bar çalışma tezgahı" },
  "calisma-tezgahi-dolapli": { slot: "calisma_tezgahi", label: "Bar çalışma tezgahı" },
  "calisma-tezgahi-taban-ara": { slot: "calisma_tezgahi", label: "Bar çalışma tezgahı" },
  "calisma-tezgahi": { slot: "calisma_tezgahi", label: "Bar çalışma tezgahı" },
  "evye-tezgahi-dolapli": { slot: "evye_tezgahi", label: "Evye tezgahı" },
  "cop-tezgahi": { slot: "cop_tezgahi", label: "Çöp tezgahı" },
  "cop-arabasi": { slot: "cop_arabasi", label: "Çöp arabası" },
  "rinser-evyesi": { slot: "evye_rinser", label: "Rinser / durulama evyesi" },
  "bar-kuvet": { slot: "bar_kuvet", label: "Bar küvet (GN)" },
  "bar-blender": { slot: "blender", label: "Blender" },
  "bar-mikser": { slot: "milk_frother", label: "Milk frother / bar mikser" },
  "kokteyl-tezgah": { slot: "kokteyl_stasyon", label: "Kokteyl istasyonu" },
  "kati-meyve-sikacagi": { slot: "meyve_sikacagi", label: "Meyve sıkacağı" },
  "konveksiyon-firin-unox": { slot: "konveksiyon_firin", label: "Konveksiyon fırın" },
  "konveksiyon-firin-pastane": { slot: "konveksiyon_firin", label: "Konveksiyon fırın" },
  "tas-firin": { slot: "tas_firin", label: "Taş tabanlı fırın" },
  "speed-oven-merry-chef": { slot: "speed_oven", label: "Speed oven" },
  "kombi-firin-6t": { slot: "kombi_firin", label: "Kombi fırın" },
  "bulasik-makinesi-setalti": { slot: "bulasik_makinesi", label: "Bulaşık makinesi" },
  "bulasik-makinesi-giyotin": { slot: "bulasik_makinesi", label: "Bulaşık makinesi" },
  "tezgah-alti-bulasik": { slot: "bulasik_makinesi", label: "Bulaşık makinesi" },
  "yer-izgara-kucuk": { slot: "yer_izgarasi", label: "Yer ızgarası" },
  "yer-izgara": { slot: "pisirme_izgara", label: "Pişirme ızgarası / ocak" },
  "davlumbaz-duvar": { slot: "davlumbaz", label: "Davlumbaz" },
  "fritoz-tek": { slot: "fritoz", label: "Fritöz" },
  "icecek-havuzu-soguk": { slot: "icecek_havuzu", label: "İçecek havuzu" },
  "istif-rafi": { slot: "istif_rafi", label: "İstif rafı" },
  "pizza-firin": { slot: "pizza_firin", label: "Pizza fırını" },
  "hamur-yogurma": { slot: "hamur_yogurma", label: "Hamur yoğurma" },
  "montaj-nakliye": { slot: "montaj_nakliye", label: "Montaj / nakliye" },
};

function inferTip(ad, poz) {
  const n = norm(ad);
  for (const rule of TIP_RULES) {
    if (rule.test(n, poz)) return rule.tip;
  }
  return null;
}

function inferSlot(ad, poz) {
  const tip = inferTip(ad, poz);
  if (tip && SLOT_MAP[tip]) return { ...SLOT_MAP[tip], tip };
  const n = norm(ad);
  if (n.includes("buzdolab")) return { slot: "buzdolabi_diger", label: "Buzdolabı (diğer)", tip: null };
  if (n.includes("firin") || n.includes("fırın")) return { slot: "firin_diger", label: "Fırın (diğer)", tip: null };
  if (n.includes("bulasik") || n.includes("bulaşık"))
    return { slot: "bulasik_makinesi", label: "Bulaşık makinesi", tip: null };
  return { slot: "diger", label: "Sınıflandırılamayan", tip: null };
}

function adetSayi(v) {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 1;
}

function loadLists(manifest) {
  const lists = [];
  for (const kat of manifest.kategoriler) {
    const isKafe = (kat.ustKategori || "").includes("Kafe / Coffee Shop");
    if (!isKafe) continue;
    for (const b of kat.bantlar) {
      const file = b.meta?.listeDosya;
      if (!file) continue;
      const fp = path.join(REF_DIR, file);
      if (!fs.existsSync(fp)) continue;
      const raw = JSON.parse(fs.readFileSync(fp, "utf8"));
      lists.push({
        id: `${kat.id}-${b.id}`,
        kategoriId: kat.id,
        kategoriLabel: kat.label,
        bantId: b.id,
        referansM2: b.referansM2 ?? raw.referansM2,
        kaynak: b.meta?.kaynakDosya || raw.kaynakDosya,
        kalemSayisi: raw.kalemler?.length ?? 0,
        kalemler: raw.kalemler ?? [],
      });
    }
  }
  return lists;
}

function analyze(lists) {
  const n = lists.length;
  const slotStats = new Map();

  for (const list of lists) {
    const seenInList = new Map();
    for (const k of list.kalemler) {
      if (norm(k.ad).includes("nakliye") || norm(k.ad).includes("montaj")) continue;
      const { slot, label, tip } = inferSlot(k.ad, k.poz);
      const adet = adetSayi(k.adet);
      if (!slotStats.has(slot)) {
        slotStats.set(slot, {
          slot,
          label,
          listCount: 0,
          lists: [],
          totalAdet: 0,
          ornekler: [],
          tips: new Set(),
        });
      }
      const st = slotStats.get(slot);
      if (!seenInList.has(slot)) {
        seenInList.set(slot, true);
        st.listCount++;
        st.lists.push(list.id);
      }
      st.totalAdet += adet;
      st.tips.add(tip || inferTip(k.ad, k.poz) || "?");
      if (st.ornekler.length < 4) st.ornekler.push(k.ad);
    }
  }

  const rows = [...slotStats.values()]
    .map((st) => ({
      ...st,
      tips: [...st.tips],
      pct: Math.round((st.listCount / n) * 1000) / 10,
      ortAdet: Math.round((st.totalAdet / st.listCount) * 10) / 10,
      katman:
        st.listCount / n >= 0.78
          ? "cekirdek"
          : st.listCount / n >= 0.55
            ? "ortak"
            : st.listCount / n >= 0.33
              ? "opsiyonel"
              : "nadir",
    }))
    .sort((a, b) => b.listCount - a.listCount || b.totalAdet - a.totalAdet);

  const cekirdek = rows.filter((r) => r.katman === "cekirdek");
  const ortak = rows.filter((r) => r.katman === "ortak");
  const opsiyonel = rows.filter((r) => r.katman === "opsiyonel");

  const listOzet = lists.map((l) => ({
    id: l.id,
    label: l.kategoriLabel,
    m2: l.referansM2,
    kalem: l.kalemSayisi,
    kaynak: l.kaynak,
  }));

  const matrisOnerisi = cekirdek
    .concat(ortak.slice(0, 4))
    .filter((r) => r.slot !== "montaj_nakliye" && r.slot !== "diger")
    .map((r) => ({
      slot: r.slot,
      label: r.label,
      zorunlu: r.katman === "cekirdek",
      ortAdet: r.ortAdet,
      listelerdePct: r.pct,
    }));

  return {
    tarih: new Date().toISOString().slice(0, 10),
    listeSayisi: n,
    listeler: listOzet,
    katmanlar: {
      cekirdek: cekirdek.length,
      ortak: ortak.length,
      opsiyonel: opsiyonel.length,
      nadir: rows.filter((r) => r.katman === "nadir").length,
    },
    slotlar: rows,
    matrisOnerisi,
    notEslesmeyen: rows.filter((r) => r.slot === "diger"),
  };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const lists = loadLists(manifest);
const report = analyze(lists);

const outJson = path.join(ROOT, "kafe-ortak-slot-analizi.json");
fs.writeFileSync(outJson, JSON.stringify(report, null, 2));

console.log("=== KAFE ORTAK SLOT ANALİZİ ===");
console.log(`Liste sayısı: ${report.listeSayisi}`);
console.log("\nListeler:");
for (const l of report.listeler) {
  console.log(`  • ${l.id} (${l.m2} m², ${l.kalem} kalem)`);
}
console.log(`\nKatman: çekirdek=${report.katmanlar.cekirdek} ortak=${report.katmanlar.ortak} opsiyonel=${report.katmanlar.opsiyonel}`);
console.log("\n--- ÇEKİRDEK (≥78% listelerde) ---");
for (const r of report.slotlar.filter((x) => x.katman === "cekirdek")) {
  console.log(`  ${r.label.padEnd(28)} ${r.listCount}/${report.listeSayisi} (${r.pct}%) ort.adet≈${r.ortAdet}`);
}
console.log("\n--- ORTAK (55–77%) ---");
for (const r of report.slotlar.filter((x) => x.katman === "ortak")) {
  console.log(`  ${r.label.padEnd(28)} ${r.listCount}/${report.listeSayisi} (${r.pct}%)`);
}
console.log("\n--- Matris önerisi (çekirdek + üst ortak) ---");
for (const m of report.matrisOnerisi) {
  console.log(`  [${m.zorunlu ? "Z" : "O"}] ${m.label} (~${m.ortAdet} ad)`);
}
console.log(`\nJSON: ${outJson}`);
