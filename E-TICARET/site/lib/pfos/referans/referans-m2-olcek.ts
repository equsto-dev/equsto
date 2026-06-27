import type { ReferansKalem } from "./referans-types";

function norm(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** PDF referans listesi — adet/ölçü m² ile değiştirilmez */
export function referansListeOlcekAtla(kategoriId: string): boolean {
  return kategoriId.startsWith("bulut-");
}

/** m² / referansM² — 120/175 ≈ 0,69; tavan 1,15 */
export function referansM2Oran(m2: number, referansM2: number): number {
  if (!Number.isFinite(m2) || m2 <= 0) return 1;
  if (!Number.isFinite(referansM2) || referansM2 <= 0) return 1;
  return Math.max(0.55, Math.min(1.15, m2 / referansM2));
}

function scaleDim(n: number, factor: number, min = 80): number {
  return Math.max(min, Math.round(n * factor));
}

/** 325*300*230 veya 200/200*130*130 — yatay ölçüler √oran ile küçülür */
export function scaleReferansOlcuString(olcu: string, oran: number): string {
  const raw = String(olcu ?? "").trim();
  if (!raw || raw === "—" || oran >= 0.995) return raw;

  const dimFactor = Math.sqrt(oran);
  const slash = raw.indexOf("/");
  if (slash >= 0) {
    const left = raw.slice(0, slash);
    const rest = raw.slice(slash + 1);
    const leftNums = [...left.matchAll(/(\d+(?:[.,]\d+)?)/g)].map((m) =>
      scaleDim(Number(m[1].replace(",", ".")), dimFactor),
    );
    const restMatch = rest.match(
      /^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/,
    );
    if (leftNums.length >= 2 && restMatch) {
      return `${leftNums[0]}/${leftNums[1]}*${scaleDim(Number(restMatch[1].replace(",", ".")), dimFactor)}*${scaleDim(Number(restMatch[2].replace(",", ".")), dimFactor, 100)}`;
    }
  }

  const m = raw.match(
    /^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/,
  );
  if (m) {
    const yuk = Math.round(Number(m[3].replace(",", ".")));
    return `${scaleDim(Number(m[1].replace(",", ".")), dimFactor)}*${scaleDim(Number(m[2].replace(",", ".")), dimFactor)}*${yuk}`;
  }

  const two = raw.match(/^(\d+(?:[.,]\d+)?)\*(\d+(?:[.,]\d+)?)$/);
  if (two) {
    return `${scaleDim(Number(two[1].replace(",", ".")), dimFactor)}*${scaleDim(Number(two[2].replace(",", ".")), dimFactor)}`;
  }

  return raw;
}

function olcuFromNotlar(notlar: string | undefined): string {
  const m = String(notlar ?? "").match(/ölçü:\s*(.+)$/i);
  return m ? m[1].trim() : "";
}

function isPanelOdaKalem(k: ReferansKalem): boolean {
  const tip = norm(k.urunTipi).replace(/_/g, "-");
  return /^panel-soguk-oda|^panel-derin-dondurucu-oda/.test(tip);
}

function isIstifRafKalem(k: ReferansKalem): boolean {
  return /istif\s*raf/.test(norm(k.isim));
}

function isTeshirReyonKalem(k: ReferansKalem): boolean {
  return /teshir|teşhir|reyon|vitrin/i.test(norm(k.isim));
}

/** Yalnızca kasap — meze/şarküteri teşhir ve şarküteri soğuk odası çıkar */
export function filterKasapYalnizKalemler(kalemler: ReferansKalem[]): ReferansKalem[] {
  return kalemler.filter((k) => {
    const n = norm(k.isim);
    const bolum = norm(k.altKategori ?? "");
    if (/meze\s*teshir|meze\s*teşhir/.test(n)) return false;
    if (/sarkuteri\s*teshir|şarküteri\s*teşhir/.test(n)) return false;
    if (/sarkuteri\s*soguk\s*oda|şarküteri\s*soğuk\s*oda/.test(bolum)) return false;
    if (k.referansBolumKey === "Ş") return false;
    return true;
  });
}

export function olcekReferansKalemlerForM2(
  kalemler: ReferansKalem[],
  m2: number,
  referansM2: number,
): ReferansKalem[] {
  const oran = referansM2Oran(m2, referansM2);
  if (oran >= 0.995) return kalemler;

  return kalemler.map((k) => {
    let adet = k.adet;
    let notlar = k.notlar;

    if (isIstifRafKalem(k) && adet > 1) {
      adet = Math.max(1, Math.round(adet * oran));
    }

    const olcu = olcuFromNotlar(k.notlar);
    if (olcu && (isPanelOdaKalem(k) || isTeshirReyonKalem(k))) {
      const scaled = scaleReferansOlcuString(olcu, oran);
      if (scaled !== olcu) {
        notlar = `Ölçü: ${scaled}`;
      }
    }

    if (adet === k.adet && notlar === k.notlar) return k;
    return { ...k, adet, notlar };
  });
}
