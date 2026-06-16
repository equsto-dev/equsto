import { readFileSync } from "node:fs";
import { join } from "node:path";

export type MutfakBolumProfil = {
  bolum: string;
  kalemSayisi: number;
  toplamAdet: number;
  ekipmanTipleri: string[];
  ornekKalemler: string[];
};

export type MutfakKonseptProfil = {
  motorSlug: string;
  label: string;
  ustSegment: string;
  dukkanSecim: string;
  desc: string;
  kaynakDosya?: string;
  bantId?: string;
  kalemSayisi: number;
  bolumler: MutfakBolumProfil[];
};

export type MutfakKorpus = {
  version: number;
  updated_at: string;
  konseptSayisi: number;
  bolumSayisi: number;
  konseptler: MutfakKonseptProfil[];
  bolumSozlugu: Array<{
    bolum: string;
    konseptler: string[];
    ekipmanTipleri: string[];
    ornekKalemler: string[];
  }>;
};

let cached: MutfakKorpus | null = null;

export function loadMutfakKorpus(): MutfakKorpus | null {
  if (cached) return cached;
  try {
    const p = join(process.cwd(), "public/data/pfos-mutfak-korpus.json");
    cached = JSON.parse(readFileSync(p, "utf8")) as MutfakKorpus;
    return cached;
  } catch {
    return null;
  }
}

/** Claude liste analizi için kısa bağlam — konsept ve bölüm niansları */
export function formatMutfakKorpusForPrompt(maxKonsept = 12): string {
  const korpus = loadMutfakKorpus();
  if (!korpus?.konseptler?.length) return "";

  const lines: string[] = [
    "REFERANS MUTFAK BİLGİSİ (Equsto arşiv projelerinden öğrenilmiş):",
    "Her konsept tipinde hangi mutfak bölümlerinde hangi ekipman sınıfları yaygındır:",
  ];

  for (const k of korpus.konseptler.slice(0, maxKonsept)) {
    const bolumOzet = k.bolumler
      .slice(0, 8)
      .map(
        (b) =>
          `${b.bolum} → ${b.ekipmanTipleri.join(", ")} (ör: ${b.ornekKalemler.slice(0, 2).join("; ")})`,
      )
      .join(" | ");
    lines.push(
      `• ${k.dukkanSecim || k.label} [${k.motorSlug}] (${k.ustSegment}): ${bolumOzet}`,
    );
  }

  const ortakBolumler = (korpus.bolumSozlugu ?? [])
    .filter((b) => b.konseptler.length >= 3)
    .slice(0, 10)
    .map(
      (b) =>
        `${b.bolum}: ${b.ekipmanTipleri.join(", ")} (${b.konseptler.length} konseptte)`,
    );
  if (ortakBolumler.length) {
    lines.push("Ortak mutfak bölümleri:", ...ortakBolumler.map((l) => `  - ${l}`));
  }

  lines.push(
    "Bölüm başlığını dosyadaki gibi koru; bilinmeyen bölüm için poz harfi ve ürün tipine göre en yakın bölümü seç.",
  );
  return lines.join("\n");
}
