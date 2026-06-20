/** Katalog satırı / specs metninden elektrik ve gaz kW çözümleme */

import { decodeHtmlEntities } from "@/lib/text/decode-html-entities";
import { resolveCaglayanTeshirKw } from "@/lib/catalog/caglayan-kw";
import {
  parsePimakGucFromTeknikLine,
  parsePimakGucKwValue,
} from "@/lib/catalog/pimak-kw";

export type ResolvedKw = {
  elektrikGucuKw: number | null;
  gazGucuKw: number | null;
};

function foldTr(s: string): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseKwNumber(raw: string | number | null | undefined): number | null {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw > 0 && raw <= 200 ? raw : null;
  }
  const m = String(raw).match(/([\d]+(?:[.,]\d+)?)/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 && n <= 200 ? n : null;
}

type FuelContext = "gaz" | "elk" | "mixed" | "unknown";

/** Metinden yakıt bağlamı — GAZLI ürünlerde Güç yalnızca gaz sütununa gider */
export function fuelContextFromText(text: string): FuelContext {
  const t = String(text ?? "");
  const isGazli =
    /gazl[ıi]|gazli\s|\/\s*gaz\b|dogalgaz|doğalgaz|\blpg\b|komurlu|kömürlü|gazli\s*izgar|gazli\s*ocak|gazli\s*fritoz|gazli\s*firin|gaz\s*baglant|acik alev|açık alev|mavi alev/i.test(
      t,
    );
  const isElk =
    /elektr[ıi]kl[ıi]|induksiyon|indüksiyon|\b230\s*v\b|\b380\s*v\b|\b400\s*v\b|elektrik\s*baglant/i.test(
      t,
    );
  if (isGazli && !isElk) return "gaz";
  if (isElk && !isGazli) return "elk";
  if (isGazli && isElk) return "mixed";
  return "unknown";
}

function assignGenericGucKw(
  kw: number | null,
  fuel: FuelContext,
): Pick<ResolvedKw, "elektrikGucuKw" | "gazGucuKw"> {
  if (kw == null) return { elektrikGucuKw: null, gazGucuKw: null };
  if (fuel === "gaz") return { elektrikGucuKw: null, gazGucuKw: kw };
  if (fuel === "elk") return { elektrikGucuKw: kw, gazGucuKw: null };
  return { elektrikGucuKw: kw, gazGucuKw: null };
}

function kwValuesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.01;
}

/** Gazlı / elektrikli ayrımı — yanlış sütuna yazılmış kW düzelt */
export function reconcileFuelKw(
  kw: ResolvedKw,
  fuel: FuelContext,
): ResolvedKw {
  let { elektrikGucuKw: elk, gazGucuKw: gaz } = kw;
  if (fuel === "gaz") {
    if (!gaz && elk) gaz = elk;
    // Gazlı kombi fırın: fan/kontrol (0.35 kW) + brülör (8+ kW) birlikte kalır
    if (gaz && elk && kwValuesEqual(gaz, elk)) elk = null;
  } else if (fuel === "elk") {
    if (!elk && gaz) elk = gaz;
    if (elk && gaz && kwValuesEqual(elk, gaz)) gaz = null;
  }
  return { elektrikGucuKw: elk, gazGucuKw: gaz };
}

function reconcileFuelKwFromContext(
  kw: ResolvedKw,
  ctx: {
    isim?: string | null;
    urunTipi?: string | null;
    urunAd?: string | null;
    urunAciklama?: string | null;
  },
): ResolvedKw {
  const blob = [ctx.isim, ctx.urunTipi, ctx.urunAd, ctx.urunAciklama]
    .filter(Boolean)
    .join(" ");
  return reconcileFuelKw(kw, fuelContextFromText(blob));
}

function parseSumKwExpression(raw: string): number | null {
  const parts = String(raw ?? "")
    .split("+")
    .map((p) => Number(p.replace(",", ".").trim()))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (!parts.length) return null;
  const sum = parts.reduce((a, b) => a + b, 0);
  return sum > 0 && sum <= 200 ? Math.round(sum * 1000) / 1000 : null;
}

export function parseMaxGucKwFromText(text: string): number | null {
  const patterns = [
    /maks\.?\s*g[uü][çc]\s*t[uü]ketimi\s*(?:\(kw\))?\s*[:=]\s*([\d.,]+(?:\s*\+\s*[\d.,]+)?)/i,
    /(?:^|\n)\s*g[uü][çc]\s*t[uü]ketimi\s*[:=]\s*([\d.,]+(?:\s*\+\s*[\d.,]+)?)\s*(?:kW|kw)?/im,
    /max\.?\s*elektrik\s*g[uü]c[uü]\s*[:=]\s*([\d.,]+(?:\s*\+\s*[\d.,]+)?)\s*kw/i,
    /maks\.?\s*elektrik\s*g[uü]c[uü]\s*[:=]\s*([\d.,]+(?:\s*\+\s*[\d.,]+)?)\s*kw/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    if (m[1].includes("+")) {
      const sum = parseSumKwExpression(m[1]);
      if (sum != null) return sum;
    }
    const n = Number(m[1].replace(",", "."));
    if (Number.isFinite(n) && n > 0 && n <= 200) return n;
  }
  return null;
}

function parseWattsToKw(text: string): number | null {
  const patterns = [
    /([\d.,]+)\s*watts?\s*(?:trifaze|triphase|monofaze|mono|sanayi|motor)?/i,
    /([\d.,]+)\s*W\s*(?:trifaze|triphase|monofaze|mono|sanayi|motor)/i,
    /motor[^.\n]{0,48}([\d.,]+)\s*(?:watts?|W)\b/i,
    /([\d.,]+)\s*W\b/i,
    /([\d.,]+)w\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m) continue;
    const w = Number(m[1].replace(",", "."));
    if (Number.isFinite(w) && w >= 50 && w <= 200_000) {
      return Math.round((w / 1000) * 1000) / 1000;
    }
  }
  return null;
}

function parseHorsepowerToKw(text: string): number | null {
  const m = text.match(/([\d.,]+)\s*HP\b/i);
  if (!m) return null;
  const hp = Number(m[1].replace(",", "."));
  if (!Number.isFinite(hp) || hp <= 0 || hp > 50) return null;
  return Math.round(hp * 0.746 * 1000) / 1000;
}

function parseElektrikGucuLineValue(raw: string): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const wMatch = s.match(/([\d.,]+)\s*(?:watts?|W)\b/i);
  if (wMatch) return parseWattsToKw(wMatch[0]);
  const n = Number(s.replace(/[^\d.,]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (/kW/i.test(s) || n <= 50) return n <= 200 ? n : null;
  if (n >= 50 && n <= 200_000) return Math.round((n / 1000) * 1000) / 1000;
  return null;
}

/** Specs / açıklama metninden elk. ve gaz kW */
export function parseKwFromText(text: string): ResolvedKw {
  const t = String(text ?? "").replace(/\r/g, "");
  if (!t.trim()) return { elektrikGucuKw: null, gazGucuKw: null };

  const fuel = fuelContextFromText(t);
  let elk: number | null = null;
  let gaz: number | null = null;

  const gazExplicit = t.match(
    /(?:gaz|dogalgaz|doğalgaz)\s*(?:gucu|gücü|baglantisi|bağlantısı)?\s*[:=]?\s*([\d.,]+)\s*kW/i,
  );
  if (gazExplicit) gaz = parseKwNumber(gazExplicit[1]);

  const elkExplicit = t.match(
    /(?:elektrik\s*gucu|elektrik\s*gücü|elektrik\s*baglantisi|elektrik\s*bağlantısı|elk\.?\s*kw|yardimci|yardımcı)\s*(?:\s*max)?\s*[:=]?\s*([\d.,]+)\s*kW/i,
  );
  if (elkExplicit) elk = parseKwNumber(elkExplicit[1]);

  if (!elk && fuel !== "gaz") {
    const subsidiaryMotor =
      /(?:durulama|yikama|yıkama|bosaltma|boşaltma|deterjan|parlat[ıi]c[ıi]|pompas[ıi])\s*motor\s*g[uü]c[uü]/i.test(
        t,
      );
    if (!subsidiaryMotor) {
      const maxGuc = parseMaxGucKwFromText(t);
      if (maxGuc != null) elk = maxGuc;
    }
  }

  if (!elk && fuel !== "gaz") {
    const fromW = parseWattsToKw(t);
    if (fromW != null) elk = fromW;
  }

  if (fuel !== "gaz") {
    const fromHp = parseHorsepowerToKw(t);
    if (fromHp != null) {
      elk = elk != null ? Math.max(elk, fromHp) : fromHp;
    }
  }

  if (!elk && fuel !== "gaz") {
    const elkGucu = t.match(/elektrik\s*g[uü]c[uü]\s*[:=]\s*([\d.,]+(?:[.,]\d+)?(?:\s*W|\s*kW)?)/i);
    if (elkGucu) {
      const parsed = parseElektrikGucuLineValue(elkGucu[1]);
      if (parsed != null) elk = parsed;
    }
  }

  if (!elk && !gaz && fuel !== "gaz") {
    const genericGuc = t.match(
      /(?:^|\n)\s*(?:guc|güc)\s*[:=]?\s*([\d.,]+)\s*kW/im,
    );
    if (genericGuc) {
      const assigned = assignGenericGucKw(parseKwNumber(genericGuc[1]), fuel);
      elk = assigned.elektrikGucuKw;
      gaz = assigned.gazGucuKw;
    }
  } else if (!gaz && fuel === "gaz") {
    const genericGuc = t.match(
      /(?:^|\n)\s*(?:guc|güc)\s*[:=]?\s*([\d.,]+)\s*kW/im,
    );
    if (genericGuc) gaz = parseKwNumber(genericGuc[1]);
  }

  if (!elk && fuel !== "gaz") {
    for (const line of t.split("\n")) {
      const elkLine = line.match(/^elektrik\s*g[uü]c[uü]\s*:\s*(.+)$/i);
      if (elkLine) {
        const parsed = parseElektrikGucuLineValue(elkLine[1]);
        if (parsed != null) {
          elk = parsed;
          break;
        }
      }
      const pimakKw = parsePimakGucFromTeknikLine(line);
      if (pimakKw != null) {
        elk = pimakKw;
        break;
      }
      const pimakRaw = line.match(/g[uü][çc]\s*\([^)]*kw[^)]*\)\s*[:=]?\s*(.+)$/i);
      if (pimakRaw) {
        const p = parsePimakGucKwValue(pimakRaw[1]);
        if (p != null) {
          elk = p;
          break;
        }
      }
    }
  }

  const allKw = [...t.matchAll(/([\d.,]+)\s*kW/gi)]
    .map((m) => parseKwNumber(m[1]))
    .filter((n): n is number => n != null);

  const isGazli = fuel === "gaz" || fuel === "mixed";
  const isElk = fuel === "elk" || fuel === "mixed";

  if (!gaz && isGazli && allKw.length > 0) {
    gaz = allKw[allKw.length - 1] ?? null;
  }
  if (!elk && isElk && !isGazli && allKw.length === 1) {
    elk = allKw[0] ?? null;
  }
  if (!elk && !gaz && allKw.length === 1) {
    const subsidiaryMotor =
      /(?:durulama|yikama|yıkama|bosaltma|boşaltma|deterjan|parlat[ıi]c[ıi]|pompas[ıi])\s*motor\s*g[uü]c[uü]/i.test(
        t,
      );
    if (!subsidiaryMotor) {
      if (fuel === "gaz") gaz = allKw[0] ?? null;
      else if (fuel !== "unknown") elk = allKw[0] ?? null;
      else elk = allKw[0] ?? null;
    }
  }

  return reconcileFuelKw({ elektrikGucuKw: elk, gazGucuKw: gaz }, fuel);
}

type OlcuGuc = {
  guc_kw?: string | number;
  guc_w?: string | number;
  genislik_mm?: number;
  derinlik_mm?: number;
  yukseklik_mm?: number;
};

export function parseKwFromOlcu(olculer: OlcuGuc | null | undefined): ResolvedKw {
  if (!olculer) return { elektrikGucuKw: null, gazGucuKw: null };
  let elk = parseKwNumber(olculer.guc_kw);
  if (elk == null && olculer.guc_w != null) {
    const w = Number(olculer.guc_w);
    if (Number.isFinite(w) && w > 0) {
      elk = w >= 50 ? Math.round((w / 1000) * 1000) / 1000 : w;
    }
  }
  return { elektrikGucuKw: elk, gazGucuKw: null };
}

export function mergeResolvedKw(...parts: ResolvedKw[]): ResolvedKw {
  let elektrikGucuKw: number | null = null;
  let gazGucuKw: number | null = null;
  for (const p of parts) {
    if (p.elektrikGucuKw != null) {
      if (elektrikGucuKw == null || p.elektrikGucuKw > elektrikGucuKw) {
        elektrikGucuKw = p.elektrikGucuKw;
      }
    }
    if (p.gazGucuKw != null) {
      if (gazGucuKw == null || p.gazGucuKw > gazGucuKw) {
        gazGucuKw = p.gazGucuKw;
      }
    }
  }
  return { elektrikGucuKw, gazGucuKw };
}

type KwTextSources = {
  el_guc?: number | null;
  gaz_guc?: number | null;
  sku?: string | null;
  urunAd?: string | null;
  aciklama?: string | null;
  detay?: string | null;
  description?: string | null;
  ozti_web_description?: string | null;
  inoksan_shop_description?: string | null;
  pimak_web_description?: string | null;
  teknik_ozellikler?: string[];
  olculer?: OlcuGuc | null;
};

function kwSourceBlob(src: KwTextSources): string {
  return [
    src.urunAd,
    src.aciklama,
    src.detay,
    src.description,
    src.ozti_web_description,
    src.inoksan_shop_description,
    src.pimak_web_description,
    ...(src.teknik_ozellikler ?? []),
  ]
    .filter(Boolean)
    .join("\n");
}

function fuelContextFromSources(src: KwTextSources): FuelContext {
  return fuelContextFromText(kwSourceBlob(src));
}

/** Öztiryakiler ocak/ızgarada brülör başı güç: 4x6 kW, 2x6kW+2x7,5kW → toplam. */
export function parseBrulorToplamKwFromText(text: string): number | null {
  let best: number | null = null;
  for (const line of String(text ?? "").split("\n")) {
    const terms = [...line.matchAll(/(\d+)\s*[x×]\s*([\d.,]+)\s*k?\s*w/gi)];
    if (!terms.length) continue;
    let sum = 0;
    for (const m of terms) {
      const count = Number(m[1]);
      const kw = Number(String(m[2]).replace(",", "."));
      if (!Number.isFinite(count) || !Number.isFinite(kw)) continue;
      if (count <= 0 || count > 12 || kw <= 0 || kw > 50) continue;
      sum += count * kw;
    }
    if (sum > 0 && sum <= 200 && (best == null || sum > best)) best = sum;
  }
  return best == null ? null : Math.round(best * 100) / 100;
}

/** ekipmanlar.json / AdminUrunRow alanlarından kW */
export function resolveKwFromSources(src: KwTextSources): ResolvedKw {
  const fromFields: ResolvedKw = {
    elektrikGucuKw: parseKwNumber(src.el_guc),
    gazGucuKw: parseKwNumber(src.gaz_guc),
  };
  const texts = [
    src.aciklama,
    src.detay,
    src.description,
    src.ozti_web_description,
    src.inoksan_shop_description,
    src.pimak_web_description,
    ...(src.teknik_ozellikler ?? []),
  ]
    .filter((x): x is string => Boolean(x?.trim()))
    .map((t) => decodeHtmlEntities(t));

  let fromText: ResolvedKw = { elektrikGucuKw: null, gazGucuKw: null };
  for (const text of texts) {
    const p = parseKwFromText(text);
    fromText = mergeResolvedKw(fromText, p);
  }

  const fuel = fuelContextFromSources(src);
  const olcuRaw = parseKwFromOlcu(src.olculer);
  const fromOlcu: ResolvedKw =
    fuel === "gaz"
      ? { elektrikGucuKw: null, gazGucuKw: olcuRaw.elektrikGucuKw ?? olcuRaw.gazGucuKw }
      : olcuRaw;
  const merged = mergeResolvedKw(fromFields, fromText, fromOlcu);
  const fullBlob = kwSourceBlob(src);
  const maxElkFromBlob = parseMaxGucKwFromText(fullBlob);
  if (
    maxElkFromBlob != null &&
    (merged.elektrikGucuKw == null || maxElkFromBlob > merged.elektrikGucuKw)
  ) {
    merged.elektrikGucuKw = maxElkFromBlob;
  }
  const brulorToplam = parseBrulorToplamKwFromText(
    [src.urunAd, src.aciklama, src.detay].filter(Boolean).join("\n"),
  );
  if (
    brulorToplam != null &&
    (fuel === "gaz" || fuel === "mixed") &&
    (!merged.gazGucuKw || merged.gazGucuKw < brulorToplam)
  ) {
    merged.gazGucuKw = brulorToplam;
  }
  if (
    fuel === "gaz" &&
    brulorToplam != null &&
    merged.elektrikGucuKw != null &&
    merged.elektrikGucuKw <= brulorToplam
  ) {
    merged.elektrikGucuKw = null;
  }
  const reconciled = reconcileFuelKw(merged, fuel);
  if (reconciled.elektrikGucuKw == null) {
    const caglayan = resolveCaglayanTeshirKw({
      sku: src.sku,
      urunAd: src.urunAd,
      aciklama: src.aciklama,
      detay: src.detay,
      olculer: src.olculer,
    });
    if (caglayan.elektrikGucuKw != null) {
      reconciled.elektrikGucuKw = caglayan.elektrikGucuKw;
    }
  }
  return reconciled;
}

const PASIF_RE =
  /istif\s*raf|duvar\s*raf|servis\s*raf|tava\s*raf|basket\s*raf|\bcop\s*arab|tepsi\s*tasi|firin\s*standi|yer\s*izgar|kokteyl\s*istasyon|notr\s*ara\s*tezgah|nötr\s*ara\s*tezgah|calisma\s*tezgah|çalisma\s*tezgah|evyeli\s*calisma|evyeli\s*tezgah|tek\s*evyeli|çift\s*evyeli|cift\s*evyeli|mermer\s*tablali|polietilen\s*tablali|bym\s*giris|bym\s*cikis|bulasik\s*siyirma|siyirma\s*tezgah|montaj|nakliye|davlumbaz\s*stand|mikser\s*aksesuar|mutfak\s*aksesuar|bar\s*blender\s*hazne|hazne\s*&\s*çubuk|hazne\s*&\s*cubuk|yedek\s*parca|aksesuar\s*paket/i;

const POWERED_RE =
  /buzdolab|donduruc|soguk\s*oda|derin\s*dondurucu|panel\s*tip|(^|[^a-z])firin|rational|unox|pizza\s*firin|\bocak\b|izgar|fritoz|makarna|salamander|tost\s*mak|mikser|hamur|dograma|bula[sş]ik\s*(?:mak|yikama)|kahve|espresso|degirmen|değirmen|blender|buz\s*makin|sikma|sikac|induksiyon|make.?up|sicak\s*dolap|sushi|rice\s*cooker|spiral|vakum|konveksiyon|davlumbaz|ice\s*maker|sogutma\s*tezgah|tezgah\s*tip\s*buz|cihazalti\s*buz|depo\s*tip\s*buz|çay\s*otomat|cay\s*otomat|on\s*yikama|yikama\s*dusu|sebze\s*yikama|vakum\s*mak|kombi\s*firin|kombine\s*firin|elektrikli\s*firin|gazli\s*ocak|gazli\s*izgara|gazli\s*fritoz|teshir|teşhir|reyon|vitrin|display/i;

/** Nötr / filtresiz davlumbaz — fan motoru yok, kW yok */
function isNeutralDavlumbaz(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  sku?: string | null;
  urunAd?: string | null;
}): boolean {
  const blob = foldTr(
    [opts.isim, opts.urunTipi, opts.sku, opts.urunAd].filter(Boolean).join(" "),
  );
  if (!/davlumbaz/.test(blob)) return false;
  if (
    /fan|motor|aspir|santrif|egzoz\s*fan|elektrikli\s*davlumbaz|davlumbaz\s*motor|santrifuj/.test(
      blob,
    )
  ) {
    return false;
  }
  if (/n[oö]tr|filtresiz|pasif/.test(blob)) return true;
  if (/^7885\./.test(String(opts.sku ?? "").trim())) return true;
  if (/^pimak\./i.test(String(opts.sku ?? "").trim())) return true;
  if (/davlumbazlar-/.test(String(opts.urunTipi ?? ""))) return true;
  if (/davlumbaz\s*filtre|filtresi,\s*\d+/i.test(blob)) return true;
  if (/^118\.dvf/i.test(String(opts.sku ?? "").trim())) return true;
  return false;
}

/** Raf, tezgah, araç vb. — kW yazılmaz */
export function isPasifPfosEkipman(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  sku?: string | null;
  urunAd?: string | null;
}): boolean {
  const blob = foldTr(
    [opts.isim, opts.urunTipi, opts.sku, opts.urunAd].filter(Boolean).join(" "),
  );
  if (PASIF_RE.test(blob)) return true;
  if (/^7897\./.test(String(opts.sku ?? "").trim())) return true;
  if (isNeutralDavlumbaz(opts)) return true;
  if (/^equsto\.\d{5}\./i.test(String(opts.sku ?? "").trim()) && /tezgah|raf/i.test(blob)) {
    return true;
  }
  if (/^53-x-/i.test(String(opts.sku ?? "").trim())) return true;
  if (/^mb\d/i.test(String(opts.sku ?? "").trim())) return true;
  if (POWERED_RE.test(blob)) return false;
  return false;
}

export function isPoweredPfosEkipman(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  sku?: string | null;
  urunAd?: string | null;
}): boolean {
  if (isPasifPfosEkipman(opts)) return false;
  const blob = foldTr(
    [opts.isim, opts.urunTipi, opts.sku, opts.urunAd].filter(Boolean).join(" "),
  );
  return POWERED_RE.test(blob);
}

/** Proforma satırı — katalog öncelikli; pasif ekipmanda boş */
export function resolveTeklifKw(opts: {
  isim?: string | null;
  urunTipi?: string | null;
  urun?: {
    sku?: string | null;
    ad?: string | null;
    teklifAciklama?: string | null;
    elektrikGucuKw?: number | null;
    gazGucuKw?: number | null;
  } | null;
  elektrikGucuKwHint?: number | null;
  gazGucuKwHint?: number | null;
}): ResolvedKw {
  const ctx = {
    isim: opts.isim,
    urunTipi: opts.urunTipi,
    sku: opts.urun?.sku,
    urunAd: opts.urun?.ad,
  };
  if (isPasifPfosEkipman(ctx)) {
    return { elektrikGucuKw: null, gazGucuKw: null };
  }

  const fromUrun: ResolvedKw = {
    elektrikGucuKw:
      opts.urun?.elektrikGucuKw != null && opts.urun.elektrikGucuKw > 0
        ? opts.urun.elektrikGucuKw
        : null,
    gazGucuKw:
      opts.urun?.gazGucuKw != null && opts.urun.gazGucuKw > 0
        ? opts.urun.gazGucuKw
        : null,
  };

  const fromAciklama = mergeResolvedKw(
    parseKwFromText(decodeHtmlEntities(opts.urun?.teklifAciklama ?? "")),
    parseKwFromText(decodeHtmlEntities(opts.urun?.ad ?? "")),
    parseKwFromText(decodeHtmlEntities(opts.isim ?? "")),
  );
  const merged = mergeResolvedKw(fromUrun, fromAciklama);
  if (merged.elektrikGucuKw != null || merged.gazGucuKw != null) {
    return reconcileFuelKwFromContext(merged, {
      isim: opts.isim,
      urunTipi: opts.urunTipi,
      urunAd: opts.urun?.ad,
      urunAciklama: opts.urun?.teklifAciklama,
    });
  }

  if (!isPoweredPfosEkipman(ctx)) {
    return { elektrikGucuKw: null, gazGucuKw: null };
  }

  const fuel = fuelContextFromText(
    [opts.isim, opts.urunTipi, opts.urun?.ad].filter(Boolean).join(" "),
  );
  let hintElk = sanitizeKwHint(
    parseKwNumber(opts.elektrikGucuKwHint),
    opts.isim ?? "",
    "elk",
  );
  let hintGaz = sanitizeKwHint(
    parseKwNumber(opts.gazGucuKwHint),
    opts.isim ?? "",
    "gaz",
  );
  if (fuel === "gaz" && hintElk && !hintGaz) {
    hintGaz = hintElk;
    hintElk = null;
  }
  return reconcileFuelKw(
    { elektrikGucuKw: hintElk, gazGucuKw: hintGaz },
    fuel,
  );
}

function sanitizeKwHint(
  hint: number | null,
  isim: string,
  type: "elk" | "gaz",
): number | null {
  if (hint == null) return null;
  const n = foldTr(isim);
  if (/cay\s*otomat|çay\s*otomat/.test(n) && hint >= 10) return null;
  if (type === "gaz" && hint >= 50) return null;
  if (type === "elk" && hint >= 100) return null;
  return hint;
}
