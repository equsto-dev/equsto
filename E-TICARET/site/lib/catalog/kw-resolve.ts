/** Katalog satırı / specs metninden elektrik ve gaz kW çözümleme */

import { decodeHtmlEntities } from "@/lib/text/decode-html-entities";
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

/** Specs / açıklama metninden elk. ve gaz kW */
export function parseKwFromText(text: string): ResolvedKw {
  const t = String(text ?? "").replace(/\r/g, "");
  if (!t.trim()) return { elektrikGucuKw: null, gazGucuKw: null };

  let elk: number | null = null;
  let gaz: number | null = null;

  const gazExplicit = t.match(
    /(?:gaz|dogalgaz|doğalgaz)\s*(?:gucu|gücü|baglantisi|bağlantısı)?\s*[:=]?\s*([\d.,]+)\s*kW/i,
  );
  if (gazExplicit) gaz = parseKwNumber(gazExplicit[1]);

  const elkExplicit = t.match(
    /(?:guc|güç|elektrik\s*gucu|elektrik\s*gücü|elektrik\s*baglantisi|elektrik\s*bağlantısı|elk\.?\s*kw)\s*[:=]?\s*([\d.,]+)\s*kW/i,
  );
  if (elkExplicit) elk = parseKwNumber(elkExplicit[1]);

  if (!elk) {
    for (const line of t.split("\n")) {
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

  if (!elk) {
    for (const line of t.split("\n")) {
      const trimmed = line.trim();
      if (!/^guc|^güç/i.test(trimmed)) continue;
      const m = trimmed.match(/([\d.,]+)\s*kW/i);
      if (m) {
        elk = parseKwNumber(m[1]);
        break;
      }
    }
  }

  const allKw = [...t.matchAll(/([\d.,]+)\s*kW/gi)]
    .map((m) => parseKwNumber(m[1]))
    .filter((n): n is number => n != null);

  const isGazli = /gazl[ıi]|\/\s*gaz\b|dogalgaz|doğalgaz/i.test(t);
  const isElk = /elektr|230\s*v|380\s*v|400\s*v/i.test(t);

  if (!gaz && isGazli && allKw.length > 0) {
    gaz = allKw[allKw.length - 1] ?? null;
  }
  if (!elk && isElk && !isGazli && allKw.length === 1) {
    elk = allKw[0] ?? null;
  }
  if (!elk && !gaz && allKw.length === 1) {
    if (isGazli) gaz = allKw[0] ?? null;
    else elk = allKw[0] ?? null;
  }

  return { elektrikGucuKw: elk, gazGucuKw: gaz };
}

type OlcuGuc = {
  guc_kw?: string | number;
  guc_w?: string | number;
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
    if (elektrikGucuKw == null && p.elektrikGucuKw != null) {
      elektrikGucuKw = p.elektrikGucuKw;
    }
    if (gazGucuKw == null && p.gazGucuKw != null) gazGucuKw = p.gazGucuKw;
  }
  return { elektrikGucuKw, gazGucuKw };
}

type KwTextSources = {
  el_guc?: number | null;
  gaz_guc?: number | null;
  aciklama?: string | null;
  detay?: string | null;
  description?: string | null;
  ozti_web_description?: string | null;
  inoksan_shop_description?: string | null;
  pimak_web_description?: string | null;
  teknik_ozellikler?: string[];
  olculer?: OlcuGuc | null;
};

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

  return mergeResolvedKw(fromFields, fromText, parseKwFromOlcu(src.olculer));
}

const PASIF_RE =
  /istif\s*raf|duvar\s*raf|servis\s*raf|tava\s*raf|basket\s*raf|\bcop\s*arab|tepsi\s*tasi|firin\s*standi|yer\s*izgar|kokteyl\s*istasyon|notr\s*ara\s*tezgah|nötr\s*ara\s*tezgah|calisma\s*tezgah|çalisma\s*tezgah|evyeli\s*calisma|tek\s*evyeli|çift\s*evyeli|cift\s*evyeli|mermer\s*tablali|polietilen\s*tablali|bym\s*giris|bym\s*cikis|bulasik\s*siyirma|siyirma\s*tezgah|montaj|nakliye|davlumbaz\s*stand/i;

const POWERED_RE =
  /buzdolab|donduruc|soguk\s*oda|derin\s*dondurucu|panel\s*tip|(^|[^a-z])firin|rational|unox|pizza\s*firin|\bocak\b|izgar|fritoz|makarna|salamander|tost\s*mak|mikser|hamur|dograma|bula[sş]ik\s*(?:mak|yikama)|kahve|espresso|degirmen|değirmen|blender|buz\s*makin|sikma|sikac|induksiyon|make.?up|sicak\s*dolap|sushi|rice\s*cooker|spiral|vakum|konveksiyon|davlumbaz|ice\s*maker|sogutma\s*tezgah|tezgah\s*tip\s*buz|cihazalti\s*buz|depo\s*tip\s*buz|çay\s*otomat|cay\s*otomat|on\s*yikama|yikama\s*dusu|sebze\s*yikama|vakum\s*mak|kombi\s*firin|kombine\s*firin|elektrikli\s*firin|gazli\s*ocak|gazli\s*izgara|gazli\s*fritoz/i;

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
  if (POWERED_RE.test(blob)) return false;
  if (PASIF_RE.test(blob)) return true;
  if (/^7897\./.test(String(opts.sku ?? "").trim())) return true;
  if (/^equsto\.\d{5}\./i.test(String(opts.sku ?? "").trim()) && /tezgah|raf/i.test(blob)) {
    return true;
  }
  if (/^53-x-/i.test(String(opts.sku ?? "").trim())) return true;
  if (/^mb\d/i.test(String(opts.sku ?? "").trim())) return true;
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

  if (fromUrun.elektrikGucuKw != null || fromUrun.gazGucuKw != null) {
    return fromUrun;
  }

  const fromAciklama = parseKwFromText(
    decodeHtmlEntities(opts.urun?.teklifAciklama ?? ""),
  );
  if (fromAciklama.elektrikGucuKw != null || fromAciklama.gazGucuKw != null) {
    return fromAciklama;
  }

  if (!isPoweredPfosEkipman(ctx)) {
    return { elektrikGucuKw: null, gazGucuKw: null };
  }

  const hintElk = sanitizeKwHint(
    parseKwNumber(opts.elektrikGucuKwHint),
    opts.isim ?? "",
    "elk",
  );
  const hintGaz = sanitizeKwHint(
    parseKwNumber(opts.gazGucuKwHint),
    opts.isim ?? "",
    "gaz",
  );
  return {
    elektrikGucuKw: hintElk,
    gazGucuKw: hintGaz,
  };
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
