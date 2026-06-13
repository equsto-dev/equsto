import { resolveTipKodu } from "./tip-kodu";

/** PFOS teşhir reyonu / vitrin — teklif markası Çağlayan Soğutma */
export const CAGLAYAN_MARKA = "Çağlayan Soğutma";

export const TESHIR_VITRIN_TIP_KODLARI = new Set(["teshir_vitrin"]);

function norm(s: string | null | undefined): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/\s+/g, " ")
    .trim();
}

/** Referans adı — soğuk teşhir reyonu / vitrin (buzdolabı hattı hariç) */
export function isTeshirReyonReferansIsim(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  if (!n) return false;
  if (/buz\s*makin|ice\s*maker/.test(n)) return false;
  if (/^buzdolab/.test(n) && !/teshir|teşhir|vitrin|reyon/.test(n)) return false;
  if (/sicak\s*(teshir|teşhir|vitrin|display)/.test(n) && !/soguk|soğuk/.test(n)) {
    return false;
  }
  return (
    /teshir|teşhir|vitrin|reyon|mostra|display/.test(n) ||
    /et\s*teshir|kasap.*teshir|sarkuteri.*teshir|borek\s*teshir|börek\s*teşhir|pastane.*vitrin|pasta.*teshir|pasta\s*dolab|tatli\s*teshir|tatlı\s*teşhir/.test(
      n,
    )
  );
}

/** PFOS pasta dolabı — Çağlayan Yasemin serisi */
export function isPastaDolabiReferans(isim: string | null | undefined): boolean {
  return /\bpasta\s*dolab/i.test(norm(String(isim ?? "")));
}

export function isEtTeshirReyonReferans(isim: string | null | undefined): boolean {
  const n = norm(String(isim ?? ""));
  return (
    /et\s*teshir|kasap|sarkuteri|şarküteri|meat\s*display/.test(n) &&
    /teshir|teşhir|vitrin|reyon|dolab/.test(n)
  );
}

export function isTeshirVitrinTipKodu(tip: string | null | undefined): boolean {
  return TESHIR_VITRIN_TIP_KODLARI.has(resolveTipKodu(String(tip ?? "").trim()));
}

export function isCaglayanTeshirPfosKalem(opts: {
  isim?: string | null;
  urunTipi?: string | null;
}): boolean {
  if (isTeshirVitrinTipKodu(opts.urunTipi)) return true;
  return isTeshirReyonReferansIsim(opts.isim);
}

export function isCaglayanKatalogMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return n.includes("caglayan") || n.includes("çağlayan");
}

export function isCaglayanTeshirRow(row: {
  sku?: string | null;
  marka_ad?: string | null;
  ad?: string | null;
  kategori?: string | null;
}): boolean {
  if (isCaglayanKatalogMarka(row.marka_ad)) return true;
  const blob = norm(`${row.ad ?? ""} ${row.sku ?? ""} ${row.kategori ?? ""}`);
  return /^eq-/.test(String(row.sku ?? "")) || blob.includes("caglayan-");
}

export function isTeshirDisMarka(marka: string | null | undefined): boolean {
  const n = norm(String(marka ?? ""));
  return (
    n.includes("oztiryakiler") ||
    n.includes("ozti") ||
    n.includes("electrolux") ||
    n.includes("equsto") ||
    n.includes("proso")
  );
}

export function isOztiTeshirSku(sku: string | null | undefined): boolean {
  return /^8919\.tsv|^8919\.ts/i.test(String(sku ?? "").trim());
}
