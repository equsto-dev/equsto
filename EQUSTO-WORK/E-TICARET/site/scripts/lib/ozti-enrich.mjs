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

/** Liste ↔ katalog kod farkları (O/0, baştaki sıfır, tire). */
export function kodSoftKey(k) {
  return normKod(k)
    .split(".")
    .map((seg) => {
      let p = seg.replace(/O/g, "0");
      if (/^\d+$/.test(p)) return String(parseInt(p, 10));
      return p.replace(/^0+([A-Z])/, "$1");
    })
    .join(".");
}

/** TEMİZLİK / 8899 — fiyatsız kimyasallar sitede yok. */
export function isOztiKimyasalExcluded(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  if (/^8899\./i.test(kod)) return true;
  const hay = foldTr(
    [...(row.kategori_yolu || []), row.kategori, row.urun_tanimi, row.name].join(" "),
  );
  if (/temizlik\s*ve\s*hijyen|yardimci\s*yikama\s*kimyasal/i.test(hay)) return true;
  return false;
}

export function loadPdfByKod() {
  const p = path.join(ROOT, "scripts/data/ozti-katalog-pdf-2026.json");
  if (!fs.existsSync(p)) return new Map();
  const list = JSON.parse(fs.readFileSync(p, "utf8"));
  const map = new Map();
  for (const e of list) {
    const k = normKod(e.urun_kodu_norm || e.urun_kodu);
    if (!k) continue;
    map.set(k, e);
    const soft = kodSoftKey(k);
    if (soft && soft !== k && !map.has(soft)) map.set(soft, e);
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

/** PDF-only / kod önekli bulaşık makinesi adı */
export function pdfYikamaProductName(kod, pdfEntry) {
  const k = normKod(kod);
  const known = {
    "9710.FX10A.00": "OKY FX10A Setaltı Bulaşık Yıkama Makinesi",
    "9710.UX10N.00": "OKY UX10N Setaltı Bulaşık Yıkama Makinesi",
    "9710.AMX10.00": "AMX-10 Bulaşık Yıkama Makinesi",
    "9710.00CSA.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CSA-D",
    "9710.0CSAE.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CS-E-A-D",
    "9710.CNAE0.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-E-A-CDS",
    "9710.0CNAL.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-L-A-CDS",
    "9710.0CNAS.00": "Konveyörlü Otomatik Bulaşık Yıkama Makinesi CN-S-A-CDS",
  };
  if (known[k]) return known[k];
  const text = (pdfEntry?.pdf_metin_parcalari || []).join(" ");
  if (/KONVEYÖRLÜ|KONVEYORLU|OTOMATİK\s*YIKAMA/i.test(text))
    return `Konveyörlü Otomatik Bulaşık Yıkama Makinesi ${k}`;
  if (/AMX/i.test(k) || /AMX-?\d+/i.test(text)) return `AMX Bulaşık Yıkama Makinesi ${k}`;
  if (/OKY|UX10|FX10/i.test(k)) return `OKY Bulaşık Yıkama Makinesi ${k.replace(/^9710\./, "")}`;
  return `Bulaşık Yıkama Makinesi ${k}`;
}

/** Yıkama dept vitrin kategorisi (?tip= eşlemesi) */
export function mapOztiYikamaCategory(name, kod, kategori) {
  const hay = foldTr(`${name || ""} ${kod || ""} ${kategori || ""}`);
  if (/bardak\s*yikama|^073m\.|^074m\./i.test(hay)) return "bardak-yikama";
  if (/flight\s*tip|07[aelr][lr]\./i.test(hay)) return "flight-bulasik";
  if (/^9710\./.test(String(kod || ""))) {
    if (/csa|cnal|cnas|cnae|konveyor|otomatik/.test(hay)) return "konveyorlu-bulasik";
    if (/amx[-.\d]|oky|ux10|fx10/.test(hay)) return "setalti-bulasik";
    return "bulasik-makineleri";
  }
  if (/giyotin|hood\s*type/i.test(hay)) return "giyotin-bulasik";
  if (/konveyor|tunel|tunnel/i.test(hay)) return "konveyorlu-bulasik";
  if (/tirnakli|tırnaklı|rack/i.test(hay)) return "tirnakli-bulasik";
  if (/kazan\s*yikama|kettle\s*wash/i.test(hay)) return "kazan-yikama";
  if (/set\s*alti|setalti|tezgah\s*alti|undercounter/i.test(hay)) return "setalti-bulasik";
  if (/^b\.y\.m\b|b\.y\.m\s|giris.*tezgah|cikis.*tezgah/i.test(hay))
    return "bulasik-makinesi-giris-ve-cikis-tezgahlari";
  if (/el\s*yikama|yikama\s*evye/i.test(hay)) return "el-yikama-evyeleri";
  if (/hunili|siyirma|alma\s*tezgah/i.test(hay))
    return "calisma-tezgahlari-siyirma-hunili-bulasik-alma-tezgahi";
  if (/bulasik\s*makinesi\s*ustu|makinesi\s*ustu\s*evyeli|calisma\s*tezgah/i.test(hay))
    return "calisma-tezgahlari-bulasik-makinesi-tezgahlari";
  if (/göz\s*evye|goz\s*evye|küresel\s*evye|yuvarlak\s*evye|vanety\s*evye/i.test(hay))
    return "el-yikama-evyeleri";
  if (/tezgah|evyeli/i.test(hay)) return "calisma-tezgahlari-bulasik-makinesi-tezgahlari";
  if (/sebze\s*yikama|kazan\s*yikama\s*evye|fircali\s*kazan/i.test(hay)) return "kazan-yikama";
  return "bulasik-makineleri";
}

/** Çay makinası (8574.CM*) ve çay kazanı (8573.CDE* vb.) — kahve PLP değil. 8574.FM = filtre kahve. */
export function isOztiCayEquipment(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^8574\.CM/i.test(kod) || (/^8574\./.test(kod) && /ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(name)))
    return true;
  if (/^8573\./.test(kod) && !/^8573\.000/.test(kod)) return true;
  if (/ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(name)) return true;
  if (/ÇAY\s*KAZANI|CAY\s*KAZANI/i.test(name)) return true;
  return false;
}

/** Filtre kahve makinesi, kahve süt potu, kahveci demlik → kahve PLP. */
export function isOztiKahveAccessory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");
  if (/^8574\.FM/i.test(kod) || /FILTRE\s*KAHVE|FTL\d/i.test(name)) return true;
  if (/^8534\./.test(kod) || /KAHVE\s*SÜT\s*POTU|KAHVE\s*SUT\s*POTU/i.test(name)) return true;
  if (/^8573\.000/.test(kod) || /KAHVECI\s*DEML|DEMLİĞİ|DEMLIK\s*NO\b/i.test(name)) return true;
  return false;
}

/**
 * Aynı Excel/PDF satırı «Çay ocakları ve kahve» altında; çay → icecek, kahve aksesuar → kahve.
 */
export function mapOztiDeptAccessory(row) {
  const kod = normKod(row.urun_kodu || row.sku);
  const name = String(row.urun_tanimi || row.name || "").toLocaleUpperCase("tr");

  if (isOztiKahveAccessory(row)) return "kahve";
  if (isOztiCayEquipment(row)) return "icecek";
  if (/^8577\.|^0466\.|^0469\.|^0585\.|^8497\./.test(kod)) return "icecek";
  if (/^8593\./.test(kod)) return "icecek";
  if (/^8317\.ZCP/i.test(kod)) return "icecek";
  if (/KONİK\s*BARDAK|KAPAKSIZ\s*SÜRAHİ|KAPAKLI\s*SÜRAHİ|\bSÜRAHİ\b/i.test(name)) return "icecek";
  if (/ÇAY\s*TOPU|ÇAY\s*TABAĞ|MAKASLI\s*ÇAY/i.test(name)) return "icecek";
  if (/SU\s*OTOMATI/i.test(name)) return "icecek";
  if (/POŞET\s*ÇAY\s*STANDI|ÇAY\s*STANDI/i.test(name)) return "icecek";

  return null;
}

/** Döner ocakları / döner makineleri → pişirme (set üstü değil) */
export function isOztiDonerOcak(row) {
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^8859\./i.test(kod)) return true;
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  if (/doner\s*ocag|doner\s*ocagi|doner\s*makin|doner\s*kebap/i.test(name)) return true;
  if (/doner\s*makin|doner\s*ocak/i.test(kat) || /doner\s*makin/i.test(path)) return true;
  return false;
}

/** Servis / et askı arabaları — set üstü değil, taşıma PLP */
export function isOztiTasimaAraba(row) {
  if (isOztiDonerOcak(row)) return false;
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^7270\./i.test(kod)) return true;
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  if (kat === "arabalar" || /\barabalar\b/.test(path)) return true;
  if (/banket\s*arab/i.test(kat) || /banket\s*arab/i.test(path)) return true;
  const name = foldTr(row.urun_tanimi || row.name || "");
  if (/et\s*aski\s*arab|tabak\s*tasima\s*arab|yuk\s*tasima\s*arab|servis\s*arab/i.test(name)) return true;
  return false;
}

/** Taşıma dept vitrin kategorisi */
export function mapOztiTasimaCategory(row) {
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  if (/et\s*aski\s*arab/i.test(name) || /^7270\./i.test(String(row.urun_kodu || ""))) {
    return "et-aski-arabasi";
  }
  if (/banket\s*arab/i.test(name) || /banket\s*arab/i.test(kat)) return "banket-arabalari";
  if (kat === "arabalar" || /\barabalar\b/.test(kat)) return "servis-arabalar";
  return slugify(row.kategori) || "diger";
}

/** Bain marie çelik kap/küvet (set üstü) — makine değil */
export function isOztiBainMarieKap(row) {
  const name = foldTr(`${row.urun_tanimi || row.name || ""} ${row.kategori || ""}`);
  if (/bain\s*marie\s*(kapak|kuvet|küvet)/i.test(name)) return true;
  if (/celik\s*saklama/i.test(name) && /bain\s*marie/i.test(name)) return true;
  return false;
}

/** Set üstü / hareketli bain marie üniteleri (GN kaplar hariç) → pişirme PLP */
export function isOztiBainMarieMachine(row) {
  if (isOztiBainMarieKap(row)) return false;
  const name = foldTr(row.urun_tanimi || row.name || "");
  const kat = foldTr(row.kategori || "");
  const path = foldTr((row.kategori_yolu || []).join(" "));
  const hay = `${name} ${kat} ${path}`;
  if (/kaplar\s*haric/i.test(name) && /bain\s*marie/i.test(name)) return true;
  if (/set\s*ustu\s*bain\s*marie/i.test(name)) return true;
  if (/hareketli\s*bain\s*marie/i.test(name)) return true;
  if (/elektrikli\s*bain|gazli.*bain\s*marie|hareketli\s*bain/i.test(kat)) return true;
  return false;
}

/** Pişirme dept vitrin kategorisi */
export function mapOztiPisirmeCategory(row) {
  if (isOztiBainMarieMachine(row)) {
    const name = foldTr(row.urun_tanimi || row.name || "");
    if (/hareketli/i.test(name)) return "hareketli-bain-marie";
    return "setustu-bain-marie";
  }
  if (isOztiDonerOcak(row)) return "doner-ocaklari-";
  return slugify(row.kategori) || "diger";
}

/** Set üstü dept vitrin kategorisi */
export function mapOztiSetUstuCategory(row) {
  if (isOztiBainMarieKap(row)) return "bain-marie-celik-saklama-kaplari";
  return slugify(row.kategori) || "diger";
}

/** İçecek dept alt kategori (facet) */
export function mapOztiIcecekCategory(name, kod) {
  const k = normKod(kod);
  const hay = String(name || "").toLocaleUpperCase("tr");
  if (/^8574\.CM/i.test(k) || (/^8574\./.test(k) && /ÇAY\s*MAKİN|ÇAY\s*MAKIN|CAY\s*MAKIN/i.test(hay)))
    return "cay-makinasi";
  if (
    /^8573\./.test(k) &&
    !/^8573\.000/.test(k) &&
    (/ÇAY\s*KAZANI|CAY\s*KAZANI|CAPPADOCIA|EFES\s*CAY/i.test(hay) || /CDE|CDGE|CSGE|EDE|ESE/i.test(k))
  ) {
    return "cay-kazanlari";
  }
  if (/^8593\./.test(k) || /SU\s*OTOMATI/i.test(hay)) return "su-otomati";
  if (/^8577\.|ÇAY\s*TOPU/i.test(hay)) return "cay-servis-aksesuarlari";
  if (/^0466\.|BARDAK/i.test(hay)) return "icecek-bardaklari";
  if (/^0469\.|SÜRAHİ/i.test(hay)) return "surehi-ve-servis";
  if (/STAND|ZCP/i.test(hay)) return "cay-servis-aksesuarlari";
  return "icecek-diger";
}

/** Kahve dept vitrin kategorisi (facet / PLP tip) */
export function mapOztiKahveCategory(name, kod) {
  const k = normKod(kod);
  const hay = String(name || "").toLocaleUpperCase("tr");
  if (/^8574\.FM/i.test(k) || /FILTRE\s*KAHVE|FTL\d/i.test(hay) || /BRAVILOR/i.test(hay))
    return "filtre-kahve-makineleri";
  if (/^8534\./.test(k) || /KAHVE\s*SÜT\s*POTU|KAHVE\s*SUT\s*POTU/i.test(hay)) return "kahve-sut-potlari";
  if (/^8573\.000/.test(k) || /KAHVECI\s*DEML/i.test(hay)) return "kahveci-demlik";
  if (/WMF/i.test(hay) || /^9580\./i.test(k)) return "wmf-kahve-makinalari";
  if (/NUOVA|NUOSI|APPIA|ESPRESSO|OSCAR/i.test(hay)) return "espresso-makinesi";
  if (/DEĞİRMEN|DEGIRMEN|GRINDER|MDX/i.test(hay)) return "kahve-degirmeni";
  if (/OTOMATİK\s*KAHVE|OTOMATIK\s*KAHVE/i.test(hay)) return "espresso-makinesi";
  return "kahve-diger";
}

/** Excel kategori → mağaza dept */
export function mapOztiDept(row, setUstuAllow) {
  const kod = String(row.urun_kodu || row.sku || "").trim();
  if (/^9710\./i.test(kod)) return "yikama";
  if (/^07[0-9][A-Z]\./i.test(kod)) return "yikama";

  const accessoryDept = mapOztiDeptAccessory(row);
  if (accessoryDept) return accessoryDept;

  if (isOztiBainMarieMachine(row)) return "pisirme";
  if (isOztiDonerOcak(row)) return "pisirme";
  if (isOztiTasimaAraba(row)) return "tasima";

  const pathHay = (row.kategori_yolu || []).join(" ").toLocaleUpperCase("tr");
  const kat = String(row.kategori || "").toLocaleUpperCase("tr");
  const hay = `${pathHay} ${kat} ${String(row.urun_tanimi || row.name || "")}`;

  if (/SETÜSTÜ\s*MUTFAK|SETUSTU\s*MUTFAK/.test(hay)) return "set-ustu-mutfak";
  if (setUstuAllow?.length) {
    for (const a of setUstuAllow) {
      if (a && kat.indexOf(a) >= 0) return "set-ustu-mutfak";
    }
  }

  const rules = [
    [/SOĞUK\s*ODA|DERİN\s*DONDURUCU\s*ODA|BUZ\s*MAKİN|BUZ\s*MAKIN|SOĞUTUCU|BUZDOLAB|DONDURMA\s*MAKİN/i, "sogutma"],
    [/EL\s*YIKAMA/i, "yikama"],
    [
      /BARDAK\s*YIKAMA|FLIGHT\s*TİP\s*BULAŞIK|HOBART\s*BULAŞIK|SEBZE\s*YIKAMA|KAZAN\s*YIKAMA\s*MAK/i,
      "yikama",
    ],
    [
      /BULAŞIK\s*(MAKİNE|MAKINE|MAKİNASI)|YIKAMA\s*MAKİN|OB[YM]\b|OBY|AMX[-.\d]|OKY|UX10|FX10/i,
      "yikama",
    ],
    [/DAVLUMBAZ|YAĞ\s*TUTUCU/i, "davlumbaz"],
    [
      /KAHVE\s*MAKİN|KAHVE\s*MAKIN|FİLTRE\s*KAHVE|FILTRE\s*KAHVE|OTOMATİK\s*KAHVE|OTOMATIK\s*KAHVE|WMF\s|NUOVA\s*SIMONELLI|ESPRESSO|BARISTA/i,
      "kahve",
    ],
    [/İSTİF\s*RAF/i, "istif"],
    [/KUZİNE|OCAK|IZGARA|FRİTÖZ|FRITOZ|FIRIN|KAYNATMA|BENMARİ|BENMARI|WOK|İNDÜKSİYON|INDUKSIYON|900\s*SERİ|OPTIMUM|LAVATAŞ|D[OÖ]NER\s*OCA[GĞ]|DONER\s*OCAG|PİŞİRİCİ|PISIRICI/i, "pisirme"],
    [/TEZGAH|EVYE|EVYELİ|ÇALIŞMA\s*TEZGAH/i, "tezgah"],
    [/ARABA(?!LI)|TAŞIMA|BANKET|SERVİS\s*ÜNİT/i, "tasima"],
    [/DOLAP|RAF(?!.*İSTİF)/i, "dolap"],
    [/HAZIRLIK|KESME\s*TAHTA|MİKSER|DOĞRAYICI|HAMUR/i, "hazirlik"],
    [/İÇECEK|BAR\s*AKSESUAR|ÇAY\s*KAHVE\s*VE\s*BAR/i, "icecek"],
    [/SERVİS\s*GEREÇ|GASTRONORM|CHAFING|TENCERE|TAVA|GURMEAID|BAKIR\s*SUNUM|MASAÜSTÜ|MELAMİN|HELVA|SIĞ\s*TENCERE|SİLİNDİRİK|PRES\s*BASKI|KARIŞTIRMA|SÜZGEÇ|POLİETİLEN|POLİPROPİLEN|POLİKARBONAT|SİNEK/i, "set-ustu-mutfak"],
    [/BAIN\s*MARIE\s*(KAPAK|KÜVET|KUVET|ÇELİK|CELIK)/i, "set-ustu-mutfak"],
  ];

  for (const [re, dept] of rules) {
    if (re.test(hay)) return dept;
  }
  return "set-ustu-mutfak";
}

/** Excel Sayfa1 — para sütunu TL ise liste zaten TRY; EUR kur ile çarpılmaz. */
export function isOztiListeTl(row) {
  const p = String(row?.para_birimi || row?.para || "")
    .trim()
    .toUpperCase();
  return p === "TL" || p === "TRY" || p === "₺";
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

export const OZTI_KDV_ORAN = 20;

export function oztiFmtTry(n) {
  const v = Math.round(Number(n));
  if (!(v > 0)) return "";
  return `₺${v.toLocaleString("tr-TR")},00`;
}

/** Mağaza etiketi — yalnızca KDV dahil TL (build + canlı kur güncellemesi). */
export function oztiPriceLabelTl(pricing) {
  const kdvDahil = Number(pricing?.fiyat_tl);
  if (kdvDahil > 0) return `${oztiFmtTry(kdvDahil)} KDV dahil`;
  return "";
}

/** Fiyat listesi 2025: satış = liste × (1 − bayi_iskonto); EUR satırlar × kur; TL satırlar doğrudan TRY. */
export function oztiPricingFields(row, kurTry) {
  const liste = Number(row.liste_fiyati_eur ?? row.liste_fiyati) || 0;
  const bayi = Number(row.bayi_iskonto);
  const tlListe = isOztiListeTl(row);
  const iskPct = oztiIskontoYuzde(bayi);
  const odeme =
    iskPct > 0 && bayi > 0 && bayi < 1
      ? Math.round((1 - bayi) * 10000) / 10000
      : 1;
  const satis =
    oztiSatisEur(liste, bayi) ??
    (Number(row.satis_fiyati_eur) > 0 ? Number(row.satis_fiyati_eur) : null) ??
    (Number(row.satis_fiyati_tl) > 0 ? Number(row.satis_fiyati_tl) : null);

  const kur = Number(kurTry);
  let fiyat_tl_net = null;
  let fiyat_tl = null;
  let price = "";
  if (satis > 0) {
    if (tlListe) {
      fiyat_tl_net = Math.round(satis);
      fiyat_tl = Math.round(fiyat_tl_net * (1 + OZTI_KDV_ORAN / 100));
      price = oztiPriceLabelTl({ fiyat_tl });
    } else if (kur > 0) {
      fiyat_tl_net = Math.round(satis * kur);
      fiyat_tl = Math.round(fiyat_tl_net * (1 + OZTI_KDV_ORAN / 100));
      price = oztiPriceLabelTl({ fiyat_tl });
    }
  }

  return {
    liste_fiyati: liste || null,
    liste_fiyati_eur: tlListe ? null : liste || null,
    liste_fiyati_tl: tlListe ? liste || null : null,
    alis_fiyati: satis,
    alis_fiyati_eur: tlListe ? null : satis,
    alis_fiyati_tl: tlListe ? satis : null,
    satis_fiyati_eur: tlListe ? null : satis,
    satis_fiyati_tl: tlListe ? satis : null,
    satis_eur_indirimli: tlListe ? null : satis,
    iskontolu_fiyat: satis,
    bayi_iskonto: Number.isFinite(bayi) ? bayi : null,
    odeme_carpani: odeme,
    iskonto_yuzde: iskPct,
    iskonto_oran: iskPct,
    para_birimi: row.para_birimi || (tlListe ? "TL" : "EUR"),
    fiyat_kaynagi: "ozti-fiyat-listesi-2025",
    stok_no: row.urun_kodu,
    kur_eur_try: tlListe ? null : kur > 0 ? kur : null,
    fiyat_tl_net,
    fiyat_tl,
    kdv_oran: OZTI_KDV_ORAN,
    price,
  };
}

/** @deprecated Mağazada kullanılmaz — yalnızca specs satırı */
export function oztiPriceLabelEur(pricing) {
  return oztiPriceLabelTl(pricing);
}

export function oztiPricingLines(row, kurTry) {
  const px = oztiPricingFields(row, kurTry);
  const tlListe = isOztiListeTl(row);
  const liste = tlListe ? px.liste_fiyati_tl : px.liste_fiyati_eur;
  const satis = tlListe ? px.satis_fiyati_tl : px.satis_fiyati_eur;
  const iskPct = px.iskonto_yuzde;
  const odeme = px.odeme_carpani;
  const birim = tlListe ? "TL" : "EUR";
  const lines = [
    `Ürün kodu: ${row.urun_kodu}`,
    `Liste fiyatı (${birim}): ${liste ?? "—"}`,
    `Bayi iskonto: %${iskPct || "—"} (ödeme çarpanı ${odeme})`,
    `Equsto satış (${birim}): ${satis ?? "—"}`,
    `Hesap: liste × (1 − bayi iskonto)`,
  ];
  if (px.fiyat_tl > 0) {
    lines.push(
      `Equsto satış (TL, KDV dahil): ${oztiFmtTry(px.fiyat_tl)}`,
      px.kur_eur_try
        ? `Kur: 1 EUR = ${px.kur_eur_try} TRY (KDV %${px.kdv_oran})`
        : tlListe
          ? `Para birimi: TL (kur çevrimi yok, KDV %${px.kdv_oran})`
          : "",
    );
  }
  lines.push(`Kategori: ${row.kategori || ""}`, "Kaynak: Öztiryakiler Fiyat Listesi 2025");
  return lines;
}

export function isOztiBrand(row) {
  return /öztiryaki|oztiryaki/i.test(String(row.brand || ""));
}

const OZTI_AX_BASE = "https://oztiryakiler.com.tr/ax-images/images";

/** Üretici CDN — dosya adı: {ÜRÜN_KODU}.jpg */
export function oztiAxImageUrl(kod) {
  const k = normKod(kod);
  if (!k) return "";
  return `${OZTI_AX_BASE}/${encodeURIComponent(k)}.jpg`;
}

/** `ozti-8574-cm080-00` → `8574.CM080.00` (fetch-ozti-web-images slugFile tersi). */
export function oztiKodFromWebSlug(slug) {
  const parts = String(slug || "")
    .replace(/^ozti-/i, "")
    .split("-")
    .filter(Boolean);
  if (parts.length < 2) return "";
  return parts.map((p) => p.toUpperCase()).join(".");
}

/**
 * Vitrin `images[]` — yalnızca repodaki yerel dosya yolları.
 */
export function oztiCatalogImageHref(_kod, localRel) {
  const rel = String(localRel || "").replace(/\\/g, "/");
  if (/^images\/catalog\/ozti\//i.test(rel)) return rel;
  if (rel && !/^https?:\/\//i.test(rel)) return rel;
  return "";
}

/** `images/catalog/ozti/web/ozti-8574-cm080-00.jpg` — canlıda eq-site-urls → ax-images CDN. */
export function oztiWebImageRel(kod) {
  const k = normKod(kod);
  if (!/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(k)) return "";
  const slug =
    "ozti-" +
    k
      .toLowerCase()
      .replace(/\./g, "-")
      .replace(/[^a-z0-9-]/g, "");
  return `images/catalog/ozti/web/${slug}.jpg`;
}

/** Yerel manifest → yoksa web sentetik yol (CDN yedek). */
export function oztiVitrinImageHref(kod, manifestRel) {
  return oztiCatalogImageHref(kod, manifestRel) || oztiWebImageRel(kod);
}
