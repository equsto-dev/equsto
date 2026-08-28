import { CatalogRow } from "./google-merchant-feed";

export interface ProductDetail {
  sectionName: string;
  attributeName: string;
  attributeValue: string;
}

type Dims = {
  width: string | null;
  depth: string | null;
  height: string | null;
  length: string | null;
};

const TURKISH_DOOR_WORDS: Record<string, number> = {
  bir: 1,
  tek: 1,
  iki: 2,
  ıki: 2,
  cift: 2,
  çift: 2,
  üç: 3,
  uc: 3,
  dört: 4,
  dort: 4,
  beş: 5,
  bes: 5,
  altı: 6,
  alti: 6,
};

function numOr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s && s !== "0" ? s : null;
}

/** "63x53x115" / "45x59,5x200,7" → genişlik × derinlik × yükseklik (birim cm). */
function parseTripleDim(raw: string): { width?: string; depth?: string; height?: string } {
  const m = raw
    .replace(/\bcm\b/gi, "")
    .match(/(\d+(?:[.,]\d+)?)\s*[xX*]\s*(\d+(?:[.,]\d+)?)\s*[xX*]\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return {};
  const toNum = (s: string) => s.replace(",", ".");
  return {
    width: toNum(m[1]),
    depth: toNum(m[2]),
    height: toNum(m[3]),
  };
}

/** specs/name içinde satır bazlı "Ölçü (cm): 190.5x74x111" / "..., 59,5x60,5x181 cm" dims arama. */
function parseSpecsDim(text: string): Dims {
  const out: Dims = { width: null, depth: null, height: null, length: null };
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const isDimLine =
      /ölç[üu]\(?|boyut|ebat|uzunluk|genişlik|derinlik|yükseklik/i.test(line) ||
      /\bcm\b/i.test(line);
    if (!isDimLine) continue;
    if (!/[xX*]/.test(line)) continue;
    const dm = parseTripleDim(line);
    if (!dm.width || !dm.depth || !dm.height) continue;
    if (!out.width) out.width = `${dm.width} cm`;
    if (!out.depth) out.depth = `${dm.depth} cm`;
    if (!out.height) out.height = `${dm.height} cm`;
    break;
  }
  return out;
}

function parseTeknikOzellikler(row: CatalogRow): {
  dims: Dims;
  volume: string | null;
  power: string | null;
  material: string | null;
  barcode: string | null;
  tempRange: string | null;
  doorCount: string | null;
} {
  const dims: Dims = { width: null, depth: null, height: null, length: null };
  let volume = null,
    power = null,
    material = null,
    barcode = null,
    tempRange = null,
    doorCount = null;
  if (!Array.isArray(row.teknik_ozellikler)) {
    return { dims, volume, power, material, barcode, tempRange, doorCount };
  }
  for (const spec of row.teknik_ozellikler) {
    const s = String(spec).trim();
    if (!s) continue;
    const grab = (label: string): string | null => {
      const idx = s.toLowerCase().indexOf(label.toLowerCase());
      if (idx === -1) return null;
      return s.slice(idx + label.length).replace(/^[\s:,]+/, "").trim() || null;
    };
    if (/genişlik|genislik/.test(s)) dims.width = dims.width || grab("Genişlik") || grab("genişlik");
    if (/derinlik/.test(s)) dims.depth = dims.depth || grab("Derinlik") || grab("derinlik");
    if (/yükseklik|yukseklik/.test(s)) dims.height = dims.height || grab("Yükseklik") || grab("yükseklik");
    if (/uzunluk/.test(s)) dims.length = dims.length || grab("Uzunluk") || grab("uzunluk");
    if (/(net hacim|brüt kapasite|net kapasite)/i.test(s)) volume = volume || grab("Hacim") || grab("Kapasite");
    else if (/(\bkapasite\b)/i.test(s) && !/elektrik|balık|kazan|haz/i.test(s)) volume = volume || grab("Kapasite");
    if (/\bgüç\b|guc/i.test(s) && !/(elektrik gücü max)/i.test(s)) power = power || grab("Güç") || grab("güc");
    if (/(malzeme|yüzey|kaplama|body|kasa)/i.test(s)) material = material || grab("Malzeme") || grab("Yüzey") || grab("Kaplama") || grab("Body") || grab("Kasa");
    if (/barkod|barcode/i.test(s)) barcode = barcode || grab("Barkod") || grab("Barcode");
    if (/(çalışma sıcaklığı|çalisma sicakligi|ısı aralığı|isi araligi)/i.test(s)) tempRange = tempRange || grab("Sıcaklık") || grab("sicaklik") || grab("Aralık") || grab("aralik");
    if (/(kapı sayısı|kapi sayisi|door)/i.test(s)) doorCount = doorCount || grab("Sayı") || grab("sayi");
    // Ebat: 63x53x115 (cm)
    if (/^ebat/i.test(s)) {
      const dm = parseTripleDim(s);
      if (dm.width && !dims.width) dims.width = `${dm.width} cm`;
      if (dm.depth && !dims.depth) dims.depth = `${dm.depth} cm`;
      if (dm.height && !dims.height) dims.height = `${dm.height} cm`;
    }
  }
  return { dims, volume, power, material, barcode, tempRange, doorCount };
}

/** name + specs metninden kapı sayısı Türkçe/sayı kalıplarıyla. */
function inferDoorCount(row: CatalogRow, specs: string): string | null {
  const text = String(row.name || "") + " " + specs;
  // "4 CAM KAPI", "2 KAPILI", "CIFT INOX KAPI", "DORT YARIM CAM KAPIL", "3-Kapılı"
  const m = text.match(
    /\b(bir|tek|iki|ıki|cift|çift|üç|uc|dört|dort|beş|bes|altı|alti|\d+)\s*(?:cam\s*)?(?:inox\s*)?(?:kapi|kapı|kapilı|kapılı|kapaklı|kapak)\b/i,
  );
  if (!m) return null;
  const raw = m[1];
  let n: number;
  if (/^\d+$/.test(raw)) {
    n = Number(raw);
    if (n > 12) return null;
  } else {
    n = TURKISH_DOOR_WORDS[raw];
    if (!n) return null;
  }
  return String(n);
}

export function extractTechnicalDetails(row: CatalogRow): ProductDetail[] {
  const details: ProductDetail[] = [];
  const specs = String(row.specs || row.aciklama || "");
  const olculer = (row.olculer || row.olçuler || {}) as Record<string, unknown>;

  let width: string | null = null;
  let depth: string | null = null;
  let height: string | null = null;
  let length: string | null = null;
  let tempRange: string | null = null;
  let doorCount: string | null = null;
  let volume: string | null = null;
  let power: string | null = null;
  let material: string | null = null;
  let barcode: string | null = null;

  // 1. olculer — İnoksan mm, bazı Senox satırları cm değerlerini _mm alanında tutar.
  const ocv = (v: unknown) => (numOr(v) ? Number(numOr(v)!.replace(",", ".")) : NaN);
  const ocw = ocv(olculer.genislik_mm);
  const ocd = ocv(olculer.derinlik_mm);
  const och = ocv(olculer.yukseklik_mm);
  const ocl = ocv(olculer.uzunluk_mm);
  const ocDims = [ocw, ocd, och, ocl].filter((v) => Number.isFinite(v) && v > 0);
  const ocUnit = ocDims.length > 0 && Math.max(...ocDims) < 300 ? "cm" : "mm";
  if (ocw) width = `${ocw} ${ocUnit}`;
  if (ocd) depth = `${ocd} ${ocUnit}`;
  if (och) height = `${och} ${ocUnit}`;
  if (ocl) length = `${ocl} ${ocUnit}`;
  if (olculer.kapasite_lt) volume = `${String(olculer.kapasite_lt).trim()} L`;
  if (olculer.guc_kw) power = `${String(olculer.guc_kw).trim()} kW`;

  // 2. teknik_ozellikler (Electrolux/Öztiryakiler/Pimak vs.)
  const tz = parseTeknikOzellikler(row);
  if (!width) width = tz.dims.width;
  if (!depth) depth = tz.dims.depth;
  if (!height) height = tz.dims.height;
  if (!length) length = tz.dims.length;
  if (!volume) volume = tz.volume;
  if (!power) power = tz.power;
  if (!material) material = tz.material;
  if (!barcode) barcode = tz.barcode;
  if (!tempRange) tempRange = tz.tempRange;
  if (!doorCount) doorCount = tz.doorCount;

  // 3. specs + name serbest metin (Portabianco "Ölçü (cm):", Şenox "59,5x60,5x181 cm")
  if (specs) {
    const sd = parseSpecsDim(`${String(row.name || "")}\n${specs}`);
    if (!width) width = sd.width;
    if (!depth) depth = sd.depth;
    if (!height) height = sd.height;
    if (!length) length = sd.length;

    // Sıcaklık: "(-2°/+8°C)" veya "Isı Aralığı: +1/+9 derece" (Türkçe ASCII normalize)
    const matchText = specs
      .toLowerCase()
      .replace(/[ıİ]/g, "i")
      .replace(/i\u0307/g, "i")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/ş/g, "s");
    const tempMatch =
      matchText.match(/\(\s*([+-]?\d+)\s*\/\s*([+-]?\d+)\s*\)/) ||
      matchText.match(/(?:isi araligi|sicaklik araligi)[:\s]*([+-]?\d+)\s*\/\s*([+-]?\d+)/);
    if (tempMatch) {
      tempRange = `${tempMatch[1].replace(/^\+/, "")}°C / ${tempMatch[2].replace(/^\+/, "")}°C`;
    }

    // Malzeme / Yüzey
    const low = specs.toLowerCase();
    const materialGrab =
      specs.match(/(?:malzeme|yüzey|kaplama|body|kasa)[:\s]+([^.,\n]{2,60})/i);
    if (materialGrab && !material) material = materialGrab[1].trim();
    if (!material) {
      if (/AISI\s*304|304\s*(kalite|paslanmaz)|a4\b/i.test(specs)) material = "304 Paslanmaz Çelik";
      else if (/AISI\s*430|430\s*(kalite|paslanmaz)/i.test(specs)) material = "430 Paslanmaz Çelik";
      else if (low.includes("paslanmaz çelik") || low.includes("inox") || low.includes("krom çelik")) material = "Paslanmaz Çelik";
      else if (low.includes("cam kapı") || low.includes("cam kapak")) material = "Cam Kapı";
      else if (low.includes("galvaniz")) material = "Galvaniz";
      else if (low.includes("boyalı sac") || low.includes("boyalı")) material = "Boyalı Sac";
    }

    // Kapasite
    if (!volume) {
      const volMatch = specs.match(/(\d+(?:[.,]\d+)?)\s*(?:Lt\b|Lit(?:re)?\b|L\b)/i);
      if (volMatch && !/kazan|balık|haz/i.test(volMatch[0])) volume = `${volMatch[1].replace(",", ".")} L`;
    }

    // Güç
    if (!power) {
      const powerMatch = specs.match(/(\d+(?:\.\d+)?)\s*(?:kW|W)\b/i);
      if (powerMatch) power = `${powerMatch[1]} ${powerMatch[2]}`;
    }

    // Barkod
    if (!barcode) {
      const barkod = specs.match(/barkod[:\s]+([0-9]{8,})/i);
      if (barkod) barcode = barkod[1];
    }
  }

  // 4. Kapı sayısı — isim/specs birlikte
  if (!doorCount) doorCount = inferDoorCount(row, specs);

  // Build the details array
  const add = (sectionName: string, attributeName: string, attributeValue: string | null) => {
    if (attributeValue && attributeValue.trim()) {
      details.push({ sectionName, attributeName, attributeValue: attributeValue.trim() });
    }
  };

  add("Dimensions", "Uzunluk (Length)", length);
  add("Dimensions", "Genişlik (Width)", width);
  add("Dimensions", "Derinlik (Depth)", depth);
  add("Dimensions", "Yükseklik (Height)", height);
  add("Technical", "Kapı Sayısı", doorCount);
  add("Technical", "Çalışma Sıcaklığı", tempRange);
  add("Technical", "Kapasite", volume);
  add("Technical", "Güç", power);
  add("Technical", "Barkod", barcode);
  add("Material", "Malzeme", material);

  return details;
}
