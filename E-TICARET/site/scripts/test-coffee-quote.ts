import { calculateQuote } from "../lib/pfos/core/calculator";
import { resolveTemplateForQuote } from "../lib/pfos/core/templates";

async function main() {
  const req = {
    konsept: "coffee-shop" as const,
    m2: 200,
    sehir: "istanbul",
    fiyatStratejisi: "orta" as const,
  };
  const template = await resolveTemplateForQuote(req.konsept, req.m2);
  const sonuc = await calculateQuote(req, template);

  let priced = 0;
  let zero = 0;
  for (const k of sonuc.kalemler) {
    const f = k.urun?.fiyat ?? 0;
    if (f > 0) priced++;
    else zero++;
    console.log(
      k.referansPoz ?? k.poz,
      k.isim.slice(0, 35).padEnd(35),
      k.urun?.marka?.slice(0, 20) ?? "—",
      f > 0 ? `₺${Math.round(f * k.adet).toLocaleString("tr-TR")}` : "₺0",
    );
  }
  console.log("\nToplam:", sonuc.ozet.toplamFiyat);
  console.log("Fiyatlı:", priced, "Sıfır:", zero, "/", sonuc.kalemler.length);
}

main().catch(console.error);
