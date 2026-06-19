import { calculateListeQuote } from "../lib/pfos/liste-fiyat";
import fs from "fs";
import path from "path";
import { db } from "../lib/db";

async function main() {
  const jsonPath = path.join(process.cwd(), "public/data/pfos-projects.json");
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const project = data.projects.find((p: any) => p.id === "2025-116-pizzaci-avcilar");

  if (!project) {
    console.error("Project 2025-116-pizzaci-avcilar not found in JSON!");
    return;
  }

  console.log(`Testing match for project: ${project.baslik} (${project.lines.length} lines)`);

  const satirlar = project.lines.map((l: any) => ({
    bolum: l.poz.charAt(0).toUpperCase(),
    bolumAd: "",
    poz: l.poz,
    ad: l.ad,
    olcu: l.olcu || "—",
    adet: typeof l.adet === "number" ? l.adet : 1,
  }));

  const res = await calculateListeQuote({
    satirlar,
    kaynakDosya: "2025-116-pizzaci-avcilar",
    projeAdi: project.baslik,
    sehir: "İstanbul",
    fiyatStratejisi: "orta", // standard/middle pricing
  });

  console.log("\n--- EŞLEŞME ÖZETİ ---");
  console.log(`Toplam Kalem: ${res.ozet.toplamKalemSayisi}`);
  console.log(`Eşleşen Kalem: ${res.ozet.eslesmeSayisi}`);
  console.log(`Zorunlu Kalemler: ${res.ozet.zorunluKalemSayisi}`);
  console.log(`Eşleşen Zorunlu Kalemler: ${res.ozet.eslesmisZorunluSayisi}`);
  console.log(`Güven Skoru: ${res.guvenSkoru}`);
  console.log(`Toplam Fiyat: ${res.ozet.toplamFiyat?.toLocaleString("tr-TR") ?? "—"} TRY`);

  console.log("\n--- DETAYLI KALEM LİSTESİ ---");
  let unmappedCount = 0;
  let unpricedCount = 0;

  for (const k of res.kalemler) {
    const f = k.urun?.fiyat ?? 0;
    const isMatched = !!k.urun;
    const priceText = f > 0 ? `${f.toLocaleString("tr-TR")} TRY` : "FİYAT YOK";
    
    if (!isMatched) {
      unmappedCount++;
    } else if (f <= 0) {
      unpricedCount++;
    }

    console.log(
      `[${isMatched ? "OK" : "XX"}] Poz: ${k.poz.padEnd(5)} | UrunTipi: ${(k.urunTipi || "—").padEnd(30)} | Ad: ${k.isim.slice(0, 45).padEnd(45)} | Urun: ${(k.urun?.ad || "—").slice(0, 30).padEnd(30)} | Fiyat: ${priceText}`
    );
  }

  console.log("\n--- EKSİKLER ---");
  console.log(`Eşleşmeyen Kalem Sayısı: ${unmappedCount}`);
  console.log(`Fiyatı Olmayan Kalem Sayısı: ${unpricedCount}`);
  
  if (res.uyarilar && res.uyarilar.length > 0) {
    console.log("\n--- UYARILAR ---");
    res.uyarilar.forEach(u => console.log(`- ${u}`));
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await db.$disconnect();
  });
