/**
 * Öztiryakiler — PDF + fiyat listesi → vitrin alanları (specs, keywords, ölçüler).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../..");

export const OZTI_BRAND = "Öztiryakiler Endüstriyel Mutfak";
export const OZTI_BRAND_ID = "oztiryakiler-endustriyel-mutfak";

export function foldTr(s) {
  return String(s || "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i");
}

export function slugify(s) {
  return foldTr(s)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

export function normKod(k) {
  return String(k || "")
    .replace(/\s+/g, "")
    .trim()
    .toUpperCase();
}

export function loadPdfByKod() {
  const p = path.join(ROOT, "scripts/data/ozti-katalog-pdf-2026.json");
  if (!fs.existsSync(p)) return new Map();
  const list = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map();
  for (const e of list) {
    const k = normKod(e.urun_kodu_norm || e.urun_kodu);
    if (k) map.set(k, e);
  }
  return map;
}

/** G×D×Y veya 80*90*85 gibi ölçüleri ürün adı / PDF metninden çıkar. */
export function parseOlculer(text, kod) {
  const hay = String(text || "");
  const out = {};
  const kodEsc = kod ? kod.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

  if (kodEsc) {
    const after = hay.split(new RegExp(kodEsc, "i"))[1] || "";
    const trip = after.match(
      /(\d{2,4})\s*(?:mm)?\s*[x×*]\s*(\d{2,4})\s*(?:mm)?\s*[x×*]\s*(\d{2,4})\s*(?:mm)?/i,
    );
    if (trip) {
      out.genislik_mm = Number(trip[1]);
      out.derinlik_mm = Number(trip[2]);
      out.yukseklik_mm = Number(trip[3]);
    }
  }

  const dim = hay.match(
    /(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*[x×*]\s*(\d{2,4})\s*(?:mm|cm)?/i,
  );
  if (dim && !out.genislik_mm) {
    out.genislik_mm = Number(dim[1]);
    out.derinlik_mm = Number(dim[2]);
    out.yukseklik_mm = Number(dim[3]);
  }

  const cap = hay.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|l\.?t\.?|litre)/i);
  if (cap) out.kapasite_lt = String(cap[1]).replace(",", ".");

  const kw = hay.match(/(\d+(?:[.,]\d+)?)\s*k\s*w\b/i);
  if (kw) out.guc_kw = String(kw[1]).replace(",", ".");

  return Object.keys(out).length ? out : null;
}

/** PDF metnindeki madde işaretli satırlar. */
export function pdfBulletLines(pdfEntry, kod) {
  if (!pdfEntry?.pdf_metin_parcalari?.length) return [];
  const kodU = normKod(kod);
  const lines = [];
  for (const chunk of pdfEntry.pdf_metin_parcalari) {
    for (const ln of String(chunk).split(/\r?\n/)) {
      const t = ln.trim();
      if (!t || t.length < 12) continue;
      if (/^kod$/i.test(t) || /^fiyat$/i.test(t) || /^Ø$/i.test(t)) continue;
      if (normKod(t) === kodU) continue;
      if (/^[0-9]{2,4}\.[A-Z0-9][A-Z0-9.\-]{4,}$/i.test(t)) continue;
      if (/^[•\-–—*·]\s/.test(t) || t.length > 40) {
        lines.push(t.replace(/^[•\-–—*·]+\s*/, ""));
      }
    }
  }
  return [...new Set(lines)].slice(0, 8);
}

export function buildKeywords(row, olculer, category) {
  const parts = [
    OZTI_BRAND,
    "Öztiryakiler",
    row.urun_kodu,
    row.kategori,
    ...(row.kategori_yolu || []),
    category,
    row.barkod,
    row.urun_tanimi,
  ];
  if (olculer) {
    if (olculer.genislik_mm) parts.push(`${olculer.genislik_mm} mm`);
    if (olculer.kapasite_lt) parts.push(`${olculer.kapasite_lt} litre`);
    if (olculer.guc_kw) parts.push(`${olculer.guc_kw} kW`);
  }
  const seen = new Set();
  const kw = [];
  for (const p of parts) {
    const t = String(p || "").trim();
    if (!t || t.length < 2) continue;
    const key = foldTr(t);
    if (seen.has(key)) continue;
    seen.add(key);
    kw.push(t);
  }
  return kw.slice(0, 24);
}

export function buildAciklama(row, pdfEntry, bullets) {
  const parts = [];
  if (bullets.length) parts.push(bullets.join("\n"));
  else if (row.urun_tanimi) parts.push(String(row.urun_tanimi).trim());
  const pathStr = (row.kategori_yolu || []).filter(Boolean).join(" › ");
  if (pathStr) parts.push(`Kategori: ${pathStr}`);
  return parts.join("\n\n").trim();
}

export function buildTeknikOzellikler(row, pdfEntry, olculer, bullets) {
  const lines = [];
  if (olculer?.genislik_mm) {
    lines.push(`Genişlik: ${olculer.genislik_mm} mm`);
    lines.push(`Derinlik: ${olculer.derinlik_mm} mm`);
    lines.push(`Yükseklik: ${olculer.yukseklik_mm} mm`);
  }
  if (olculer?.kapasite_lt) lines.push(`Kapasite: ${olculer.kapasite_lt} lt`);
  if (olculer?.guc_kw) lines.push(`Güç: ${olculer.guc_kw} kW`);
  if (row.barkod) lines.push(`Barkod: ${row.barkod}`);
  if (pdfEntry?.pdf_sayfalar?.length) {
    lines.push(`Katalog sayfası: ${pdfEntry.pdf_sayfalar.join(", ")}`);
  }
  for (const b of bullets) {
    if (/genişlik|derinlik|yükseklik|güç|voltaj|kapasite|ağırlık|mm|kw|lt/i.test(b)) {
      lines.push(b);
    }
  }
  return [...new Set(lines)];
}

export function buildSpecs(row, pdfEntry, category, pricingLines) {
  const kod = row.urun_kodu;
  const pdfText = (pdfEntry?.pdf_metin_parcalari || []).join("\n");
  const olculer = parseOlculer(`${row.urun_tanimi}\n${pdfText}`, kod);
  const bullets = pdfBulletLines(pdfEntry, kod);
  const teknik = buildTeknikOzellikler(row, pdfEntry, olculer, bullets);
  const aciklama = buildAciklama(row, pdfEntry, bullets);

  const blocks = [String(row.urun_tanimi || kod).trim()];
  if (aciklama && !blocks[0].includes(aciklama.slice(0, 40))) {
    blocks.push("", "Açıklama:", aciklama);
  }
  blocks.push("", ...pricingLines);
  if (teknik.length) {
    blocks.push("", "Teknik Özellikler", ...teknik);
  }
  return {
    specs: blocks.join("\n").trim(),
    aciklama,
    teknik_ozellikler: teknik,
    olculer,
    keywords: buildKeywords(row, olculer, category),
  };
}

/** Excel kategori → mağaza dept */
export function mapOztiDept(row, setUstuAllow) {
  const pathHay = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const hay = `${pathHay} ${kat}`;

  if (/SETÜSTÜ\s*MUTFAK|SETUSTU\s*MUTFAK/.test(hay)) return "set-ustu-mutfak";
  if (setUstuAllow?.length) {
    for (const a of setUstuAllow) {
      if (a && kat.indexOf(a) >= 0) return "set-ustu-mutfak";
    }
  }

  const rules = [
    [/SOĞUK\s*ODA|DERİN\s*DONDURUCU\s*ODA|BUZ\s*MAKİN|BUZ\s*MAKIN|SOĞUTUCU|BUZDOLAB|DONDURMA\s*MAKİN/i, "sogutma"],
    [/BULAŞIK|YIKAMA\s*MAKİN|OBM\s|AMX|OKY|UX10|FX10/i, "yikama"],
    [/DAVLUMBAZ|YAĞ\s*TUTUCU/i, "davlumbaz"],
    [/ÇAY\s*OCAĞ|KAHVE\s*MAKİN|KAHVE\s*MAKIN/i, "kahve"],
    [/İSTİF\s*RAF/i, "istif"],
    [/KUZİNE|OCAK|IZGARA|FRİTÖZ|FRITOZ|FIRIN|KAYNATMA|BENMARİ|BENMARI|WOK|İNDÜKSİYON|INDUKSIYON|900\s*SERİ|OPTIMUM|LAVATAŞ|DÖNER\s*OCAĞ|PİŞİRİCİ|PISIRICI/i, "pisirme"],
    [/TEZGAH|EVYE|EVYELİ|ÇALIŞMA\s*TEZGAH|EL\s*YIKAMA/i, "tezgah"],
    [/ARABA|TAŞIMA|BANKET|SERVİS\s*ÜNİT/i, "tasima"],
    [/DOLAP|RAF(?!.*İSTİF)/i, "dolap"],
    [/HAZIRLIK|KESME\s*TAHTA|MİKSER|DOĞRAYICI|HAMUR/i, "hazirlik"],
    [/İÇECEK|BAR\s*AKSESUAR/i, "icecek"],
    [/SERVİS\s*GEREÇ|GASTRONORM|CHAFING|TENCERE|TAVA|GURMEAID|BAKIR\s*SUNUM|MASAÜSTÜ|MELAMİN|BAIN\s*MARIE|HELVA|SIĞ\s*TENCERE|SİLİNDİRİK|PRES\s*BASKI|KARIŞTIRMA|SÜZGEÇ|POLİETİLEN|POLİPROPİLEN|POLİKARBONAT|SİNEK/i, "set-ustu-mutfak"],
  ];

  for (const [re, dept] of rules) {
    if (re.test(hay)) return dept;
  }
  return "set-ustu-mutfak";
}

export function oztiSatisEur(liste, bayiIsk) {
  const L = Number(liste);
  if (!(L > 0)) return null;
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return Math.round(L * 100) / 100;
  return Math.round(L * (1 - isk) * 100) / 100;
}

export function oztiIskontoYuzde(bayiIsk) {
  const isk = Number(bayiIsk);
  if (!Number.isFinite(isk) || isk <= 0 || isk >= 1) return 0;
  return Math.round(isk * 10000) / 100;
}

/** Fiyat listesi 2025: satış EUR = liste × (1 − bayi_iskonto). */
export function oztiPricingFields(row) {
  const liste = Number(row.liste_fiyati_eur ?? row.liste_fiyati) || 0;
  const bayi = Number(row.bayi_iskonto);
  const iskPct = oztiIskontoYuzde(bayi);
  const odeme =
    iskPct > 0 && bayi > 0 && bayi < 1
      ? Math.round((1 - bayi) * 10000) / 10000
      : 1;
  const satis =
    oztiSatisEur(liste, bayi) ??
    (Number(row.satis_fiyati_eur) > 0 ? Number(row.satis_fiyati_eur) : null);

  return {
    liste_fiyati: liste || null,
    liste_fiyati_eur: liste || null,
    alis_fiyati: satis,
    alis_fiyati_eur: satis,
    satis_fiyati_eur: satis,
    satis_eur_indirimli: satis,
    iskontolu_fiyat: satis,
    bayi_iskonto: Number.isFinite(bayi) ? bayi : null,
    odeme_carpani: odeme,
    iskonto_yuzde: iskPct,
    iskonto_oran: iskPct,
    para_birimi: row.para_birimi || "EUR",
    fiyat_kaynagi: "ozti-fiyat-listesi-2025",
    stok_no: row.urun_kodu,
  };
}

export function oztiPricingLines(row) {
  const px = oztiPricingFields(row);
  const liste = px.liste_fiyati_eur;
  const satis = px.satis_fiyati_eur;
  const iskPct = px.iskonto_yuzde;
  const odeme = px.odeme_carpani;
  return [
    `Ürün kodu: ${row.urun_kodu}`,
    `Liste fiyatı (EUR): ${liste ?? "—"}`,
    `Bayi iskonto: %${iskPct || "—"} (ödeme çarpanı ${odeme})`,
    `Equsto satış (EUR): ${satis ?? "—"}`,
    `Hesap: liste × (1 − bayi iskonto)`,
    `Kategori: ${row.kategori || ""}`,
    "Kaynak: Öztiryakiler Fiyat Listesi 2025",
  ];
}

export function isOztiBrand(row) {
  return /öztiryaki|oztiryaki/i.test(String(row.brand || ""));
}
