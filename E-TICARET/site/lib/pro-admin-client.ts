/** Yönetim paneli — /api istekleri (Bearer) */

export const PRO_TOKEN_KEY = "equsto_pro_admin_token";

export type AdminUrunApiRow = {
  id: string;
  ad: string;
  sku: string | null;
  tip_kodu: string | null;
  kategori: string;
  kategori_ad?: string;
  marka_id: string | null;
  marka_ad: string;
  fiyat_tl: number;
  el_guc: number | null;
  gaz_guc: number | null;
  stok?: number;
  gorsel_url: string | null;
  durum: "aktif" | "pasif";
  readonly?: boolean;
};

export type UrunMetaBrand = { id: string; slug: string; name: string };
export type UrunMetaCategory = { id: string; slug: string; name: string };

export type UrunMetaResponse = {
  success?: boolean;
  brands?: UrunMetaBrand[];
  categories?: UrunMetaCategory[];
  error?: string;
};

export type UrunlerResponse = {
  success?: boolean;
  ok?: boolean;
  data?: AdminUrunApiRow[];
  count?: number;
  source?: string;
  error?: string;
};

export type SearchCheckResponse = {
  configured?: boolean;
  missing?: string[];
  index?: string;
  error?: string;
};

/** .env / Vercel satırından kopyalanan tırnakları kaldırır */
export function normalizeProToken(raw: string): string {
  let s = String(raw ?? "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function getProToken(): string {
  if (typeof window === "undefined") return "";
  return normalizeProToken(localStorage.getItem(PRO_TOKEN_KEY) || "");
}

export function setProToken(token: string) {
  localStorage.setItem(PRO_TOKEN_KEY, normalizeProToken(token));
}

export function clearProToken() {
  localStorage.removeItem(PRO_TOKEN_KEY);
}

async function parseJson<T>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

export type UrunlerQuery = {
  marka?: string;
  kategori?: string;
  q?: string;
};

export async function fetchUrunlerMeta(): Promise<{
  brands: UrunMetaBrand[];
  categories: UrunMetaCategory[];
  error?: string;
}> {
  const token = getProToken().trim();
  const res = await fetch("/api/urunler/meta", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const body = await parseJson<UrunMetaResponse>(res);
  if (!res.ok || body.error) {
    return { brands: [], categories: [], error: body.error || `HTTP ${res.status}` };
  }
  return { brands: body.brands || [], categories: body.categories || [] };
}

export async function fetchUrunler(
  query?: UrunlerQuery,
  tokenOverride?: string,
): Promise<{
  rows: AdminUrunApiRow[];
  source: string;
  error?: string;
  status?: number;
}> {
  const token = (tokenOverride ?? getProToken()).trim();
  const params = new URLSearchParams();
  if (query?.marka) params.set("marka", query.marka);
  if (query?.kategori) params.set("kategori", query.kategori);
  if (query?.q) params.set("q", query.q);
  const qs = params.toString();
  const res = await fetch(`/api/urunler${qs ? `?${qs}` : ""}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<UrunlerResponse>(res);
  if (!res.ok || body.error || body.success === false) {
    const err = body.error || `HTTP ${res.status}`;
    return {
      rows: [],
      source: "",
      error: res.status === 401 ? "Yetkisiz — token Vercel EQUSTO_ADMIN_BEARER ile aynı olmalı" : err,
      status: res.status,
    };
  }
  return {
    rows: body.data || [],
    source: body.source || "unknown",
  };
}

export type AdminUrunSavePayload = {
  ad: string;
  sku?: string | null;
  kategori: string;
  marka_id: string;
  fiyat_tl: number;
  el_guc?: number | null;
  gaz_guc?: number | null;
  stok?: number;
  durum?: "aktif" | "pasif";
  aciklama?: string | null;
};

export async function saveUrun(
  payload: AdminUrunSavePayload,
  id?: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken().trim();
  const url = id ? `/api/urunler/${encodeURIComponent(id)}` : "/api/urunler";
  const res = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ error?: string; success?: boolean }>(res);
  if (!res.ok || body.error) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function deleteUrun(id: string): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken().trim();
  const res = await fetch(`/api/urunler/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<{ error?: string }>(res);
  if (!res.ok || body.error) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export type BearerHint = {
  configured?: boolean;
  length?: number;
  prefix?: string;
  hint?: string;
  error?: string;
};

export type BearerCheckResult = {
  ok: boolean;
  error?: string;
  expectedLen?: number;
  gotLen?: number;
  expectedPrefix?: string;
  gotPrefix?: string;
  hint?: string;
};

export async function fetchBearerHint(): Promise<BearerHint> {
  const res = await fetch("/api/yonetim/bearer-hint", { cache: "no-store" });
  const body = await parseJson<BearerHint & { success?: boolean; error?: string }>(res);
  if (!res.ok) return { error: body.error || `HTTP ${res.status}` };
  return body;
}

/** Giriş öncesi — token Vercel env ile eşleşiyor mu? */
export async function probeAdminToken(token: string): Promise<BearerCheckResult> {
  const t = normalizeProToken(token);
  if (!t) return { ok: false, error: "Token boş" };

  const res = await fetch("/api/yonetim/bearer-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: t }),
  });
  const body = await parseJson<{
    success?: boolean;
    ok?: boolean;
    error?: string;
    expectedLen?: number;
    gotLen?: number;
    expectedPrefix?: string;
    hint?: string;
    reason?: string;
  }>(res);

  if (!res.ok && body.error) {
    return { ok: false, error: body.error };
  }

  if (body.ok === true) return { ok: true };

  const msg =
    body.hint ||
    (body.expectedLen != null && body.gotLen != null
      ? `Token eşleşmedi (${body.gotLen} karakter, sunucu ${body.expectedLen}${body.expectedPrefix ? `, ön ek ${body.expectedPrefix}` : ""}). Vercel göz ikonundan kopyalayın — sohbetteki örnek key farklı olabilir.`
      : "Token Vercel EQUSTO_ADMIN_BEARER ile aynı değil.");

  return {
    ok: false,
    error: msg,
    expectedLen: body.expectedLen,
    gotLen: body.gotLen,
    hint: body.hint,
  };
}

export async function fetchSearchCheck(): Promise<SearchCheckResponse> {
  const res = await fetch("/api/search?check=1");
  return parseJson<SearchCheckResponse>(res);
}

export async function fetchSearchPreview(q: string) {
  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`);
  return parseJson<{ hits?: unknown[]; estimatedTotalHits?: number; error?: string }>(res);
}

export async function fetchKur() {
  const res = await fetch("/api/kur");
  return parseJson<{
    rate?: number;
    success?: boolean;
    date?: string;
    source?: string;
    fallback?: boolean;
  }>(res);
}

export type EticaretKampanya = {
  ad: string;
  desc?: string;
  acik?: string;
  start?: string;
  end?: string;
  active: boolean;
  aktif?: boolean;
};

export type EticaretKupon = {
  kod: string;
  tutar?: number;
  yuzde?: number;
  ind?: number;
  tip?: string;
  lim?: number | null;
  ku?: number;
  aktif: boolean;
};

export type EticaretBanner = {
  url: string;
  aciklama?: string;
  baslik?: string;
  konum?: "anasayfa_hero" | "anasayfa_alt" | string;
  image?: string;
  icon?: string;
  aktif?: boolean;
  ab_variant?: "A" | "B" | string;
};

export type EticaretIcerik = {
  k: EticaretKampanya[];
  kp: EticaretKupon[];
  b: EticaretBanner[];
  dy: unknown[];
  r: unknown[];
  a: Record<string, unknown>;
};

export const EMPTY_ETICARET_ICERIK: EticaretIcerik = {
  k: [],
  kp: [],
  b: [],
  dy: [],
  r: [],
  a: {},
};

export async function fetchEticaretIcerik(): Promise<{
  data: EticaretIcerik;
  error?: string;
}> {
  const token = getProToken();
  const res = await fetch("/api/eticaret-icerik", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const body = await parseJson<{
    success?: boolean;
    data?: EticaretIcerik;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { data: { ...EMPTY_ETICARET_ICERIK }, error: body.error || `HTTP ${res.status}` };
  }
  const data = body.data ?? EMPTY_ETICARET_ICERIK;
  return {
    data: {
      k: Array.isArray(data.k) ? data.k : [],
      kp: Array.isArray(data.kp) ? data.kp : [],
      b: Array.isArray(data.b) ? data.b : [],
      dy: Array.isArray(data.dy) ? data.dy : [],
      r: Array.isArray(data.r) ? data.r : [],
      a: typeof data.a === "object" && data.a ? data.a : {},
    },
  };
}

export async function saveEticaretIcerik(
  payload: EticaretIcerik,
): Promise<{ data?: EticaretIcerik; error?: string }> {
  const token = getProToken();
  const res = await fetch("/api/eticaret-icerik", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{
    success?: boolean;
    data?: EticaretIcerik;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { data: body.data ?? payload };
}

export async function deleteEticaretItem(
  type: "kampanya" | "kupon",
  index: number,
): Promise<{ data?: EticaretIcerik; error?: string }> {
  const token = getProToken();
  const q = new URLSearchParams({ type, index: String(index) });
  const res = await fetch(`/api/eticaret-icerik?${q}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<{
    success?: boolean;
    data?: EticaretIcerik;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { data: body.data };
}

export async function fetchFiyatlarMap(): Promise<{
  map: Record<string, number>;
  error?: string;
}> {
  const token = getProToken();
  const res = await fetch("/api/market?kind=fiyatlar", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const body = await parseJson<{
    success?: boolean;
    data?: Record<string, number>;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { map: {}, error: body.error || `HTTP ${res.status}` };
  }
  return { map: body.data && typeof body.data === "object" ? body.data : {} };
}

export async function saveFiyatlarMap(
  fiyatlar: Record<string, number>,
): Promise<{ count?: number; error?: string }> {
  const token = getProToken();
  const res = await fetch("/api/market?kind=fiyatlar", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ fiyatlar }),
  });
  const body = await parseJson<{ success?: boolean; count?: number; error?: string }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { count: body.count };
}

export type PublishCheckItem = {
  id: string;
  label: string;
  url: string;
  ok: boolean;
  detail?: string;
};

export async function fetchPublishChecks(): Promise<PublishCheckItem[]> {
  const endpoints: Omit<PublishCheckItem, "ok" | "detail">[] = [
    { id: "ekipmanlar", label: "Vitrin kataloğu", url: "/data/ekipmanlar.json" },
    { id: "fiyatlar", label: "Fiyat listesi", url: "/data/fiyatlar.json" },
    { id: "eticaret", label: "E-ticaret içeriği", url: "/api/eticaret-icerik" },
    { id: "search", label: "Meilisearch API", url: "/api/search?check=1" },
    { id: "sitemap", label: "Sitemap", url: "/sitemap.xml" },
    { id: "feed", label: "Google Merchant feed", url: "/feeds/google-products.xml" },
    { id: "llms", label: "llms.txt (AI keşif)", url: "/llms.txt" },
    { id: "robots", label: "robots.txt", url: "/robots.txt" },
  ];

  const results = await Promise.all(
    endpoints.map(async (item) => {
      try {
        const res = await fetch(item.url, { cache: "no-store" });
        let detail = `HTTP ${res.status}`;
        let ok = res.ok;

        if (item.id === "ekipmanlar" && res.ok) {
          const rows = await res.json();
          const count = Array.isArray(rows) ? rows.length : 0;
          detail = `${count} ürün`;
        }
        if (item.id === "fiyatlar" && res.ok) {
          const file = await res.json();
          const inner =
            file?.data && typeof file.data === "object" ? file.data : file;
          const count =
            inner && typeof inner === "object" && !Array.isArray(inner)
              ? Object.keys(inner).length
              : 0;
          detail = `${count} fiyat anahtarı`;
        }
        if (item.id === "eticaret" && res.ok) {
          const body = await res.json();
          const et = body?.data;
          if (et && typeof et === "object") {
            const k = Array.isArray(et.k) ? et.k.length : 0;
            const kp = Array.isArray(et.kp) ? et.kp.length : 0;
            const b = Array.isArray(et.b) ? et.b.length : 0;
            detail = `${k} kampanya · ${kp} kupon · ${b} banner`;
          }
        }
        if (item.id === "search" && res.ok) {
          const body = await res.json();
          ok = !!body.configured;
          detail = ok
            ? `İndeks: ${body.index || "equsto_products"}`
            : `Eksik: ${JSON.stringify(body.missing || [])}`;
        }

        return { ...item, ok, detail };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "İstek başarısız";
        return { ...item, ok: false, detail: msg };
      }
    }),
  );
  return results;
}

export type CatalogStats = {
  ekipmanlar: number;
  withImage: number;
  brands: number;
};

export type EkipmanRow = {
  id?: string;
  name?: string;
  brand?: string;
  dept?: string;
  category?: string;
  images?: string[];
  specs?: string;
  aciklama?: string;
  keywords?: string[];
  olculer?: Record<string, string | number> | null;
  teknik_ozellikler?: string[];
  urun_kodu?: string;
  sku?: string;
  model?: string;
  kaynak?: string;
  kaynak_fiyat_listesi?: string;
};

export type ProjeAkisData = {
  questions?: unknown[];
  shopTypes?: unknown[];
  rules?: unknown[];
  eqSets?: unknown[];
  products?: unknown[];
  updated_at?: string;
};

export const EMPTY_PROJE_AKIS: ProjeAkisData = {
  questions: [],
  shopTypes: [],
  rules: [],
  eqSets: [],
  products: [],
};

export function rowHasImage(row: EkipmanRow): boolean {
  return Array.isArray(row.images) && !!String(row.images[0] || "").trim();
}

/** Katalog satırı için fiyat anahtarları (eq-fiyatlar-bridge ile uyumlu). */
export function resolveEkipmanPriceKeys(row: EkipmanRow): string[] {
  const keys: string[] = [];
  const tip = row.urun_kodu || row.sku || row.model;
  if (tip) keys.push(String(tip).trim());
  if (row.category) keys.push(String(row.category).trim());
  if (row.id) keys.push(String(row.id).trim());
  return keys;
}

export function ekipmanHasFiyat(
  row: EkipmanRow,
  map: Record<string, number>,
): boolean {
  for (const k of resolveEkipmanPriceKeys(row)) {
    const v = map[k];
    if (Number.isFinite(v) && v > 0) return true;
  }
  const brand = String(row.brand || "").toLowerCase();
  if (/öztiryaki|oztiryaki|ozti/.test(brand)) {
    const raw = row as EkipmanRow & {
      satis_fiyati_eur?: number;
      liste_fiyati_eur?: number;
      bayi_iskonto?: number;
    };
    if (
      Number(raw.satis_fiyati_eur) > 0 ||
      (Number(raw.liste_fiyati_eur) > 0 &&
        Number(raw.bayi_iskonto) > 0 &&
        Number(raw.bayi_iskonto) < 1)
    ) {
      return true;
    }
  }
  return false;
}

/** Öztiryakiler web yolu veya sku → ax-images önizleme URL. */
export function ekipmanPreviewSrc(row: EkipmanRow): string {
  const rel = String((row.images || [])[0] || "")
    .trim()
    .replace(/\\/g, "/");
  if (!rel) return "";
  if (/^https?:\/\//i.test(rel)) return rel;
  const web = rel.replace(/^\//, "");
  const m = /^images\/catalog\/ozti\/web\/ozti-([a-z0-9-]+)\.(jpe?g|png|webp)$/i.exec(
    web,
  );
  if (m) {
    const kod = m[1]
      .split("-")
      .filter(Boolean)
      .map((p) => p.toUpperCase())
      .join(".");
    return `https://oztiryakiler.com.tr/ax-images/images/${encodeURIComponent(kod)}.jpg`;
  }
  const sku = String(row.urun_kodu || row.sku || row.model || "").trim();
  if (/^[0-9]{2,4}[A-Z0-9]*\.[A-Z0-9.\-]{2,}$/i.test(sku)) {
    return `https://oztiryakiler.com.tr/ax-images/images/${encodeURIComponent(sku)}.jpg`;
  }
  return rel.startsWith("/") ? rel : `/${rel}`;
}

export async function fetchEkipmanlarCatalog(): Promise<EkipmanRow[]> {
  const res = await fetch("/data/ekipmanlar.json?v=20260527ozti-pricing", {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("ekipmanlar.json yüklenemedi");
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

export async function fetchCatalogStats(): Promise<CatalogStats> {
  const rows = await fetchEkipmanlarCatalog();
  const brands = new Set<string>();
  let withImage = 0;
  for (const r of rows) {
    if (r.brand) brands.add(r.brand);
    if (rowHasImage(r)) withImage++;
  }
  return { ekipmanlar: rows.length, withImage, brands: brands.size };
}

export type PfosKategoriBantMeta = {
  listeDosya: string;
  kalemSayisi: number;
  toplamAdet: number;
  kaynakDosya?: string;
  yukleme?: string;
};

export type PfosKategorilerManifest = {
  version: string;
  updated_at?: string;
  kategoriler: Array<{
    id: string;
    label: string;
    ustKategori: string;
    bantlar: Array<{
      id: string;
      label: string;
      referansM2: number;
      meta?: PfosKategoriBantMeta;
    }>;
  }>;
};

export async function fetchPfosKategoriler(): Promise<{
  manifest: PfosKategorilerManifest | null;
  error?: string;
}> {
  const token = getProToken();
  const res = await fetch("/api/pfos/kategoriler", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const body = await parseJson<{
    success?: boolean;
    manifest?: PfosKategorilerManifest;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { manifest: null, error: body.error || `HTTP ${res.status}` };
  }
  return { manifest: body.manifest ?? null };
}

export async function uploadPfosKategoriListe(
  kategoriId: string,
  bantId: string,
  file: File,
): Promise<{
  kalemSayisi?: number;
  manifest?: PfosKategorilerManifest;
  error?: string;
}> {
  const token = getProToken();
  const fd = new FormData();
  fd.append("kategoriId", kategoriId);
  fd.append("bantId", bantId);
  fd.append("file", file);
  const res = await fetch("/api/pfos/kategoriler", {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const body = await parseJson<{
    success?: boolean;
    kalemSayisi?: number;
    manifest?: PfosKategorilerManifest;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { kalemSayisi: body.kalemSayisi, manifest: body.manifest };
}

export async function deletePfosKategoriListe(
  kategoriId: string,
  bantId: string,
): Promise<{ manifest?: PfosKategorilerManifest; error?: string }> {
  const token = getProToken();
  const q = new URLSearchParams({ kategori: kategoriId, bant: bantId });
  const res = await fetch(`/api/pfos/kategoriler?${q}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<{
    success?: boolean;
    manifest?: PfosKategorilerManifest;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { manifest: body.manifest };
}

export async function saveProjeAkis(
  payload: ProjeAkisData,
): Promise<{ data?: ProjeAkisData; error?: string }> {
  const token = getProToken();
  const res = await fetch("/api/cms?kind=proje-akis", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{
    success?: boolean;
    data?: ProjeAkisData;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { data: body.data ?? payload };
}

async function fetchProjeAkisStatic(): Promise<{
  data: ProjeAkisData | null;
  error?: string;
}> {
  const { unwrapProjeAkisPayload, isProjeAkisEmpty } = await import(
    "@/lib/pfos/proje-akis/unwrap"
  );
  try {
    const res = await fetch("/data/proje-akis.json", { cache: "no-store" });
    if (!res.ok) {
      return {
        data: { ...EMPTY_PROJE_AKIS },
        error: `Statik proje-akis.json: HTTP ${res.status}`,
      };
    }
    const raw = await res.json();
    const data = unwrapProjeAkisPayload(raw);
    if (!data || isProjeAkisEmpty(data)) {
      return {
        data: { ...EMPTY_PROJE_AKIS },
        error: "proje-akis.json boş veya tanınmayan biçim",
      };
    }
    return { data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Statik dosya okunamadı";
    return { data: { ...EMPTY_PROJE_AKIS }, error: msg };
  }
}

/** API (Vercel’de yavaş/boş olabilir) → CDN /data/proje-akis.json yedek */
export async function fetchProjeAkis(): Promise<{
  data: ProjeAkisData | null;
  error?: string;
}> {
  const { unwrapProjeAkisPayload, isProjeAkisEmpty } = await import(
    "@/lib/pfos/proje-akis/unwrap"
  );
  const token = getProToken();
  try {
    const res = await fetch("/api/cms?kind=proje-akis", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    const body = await parseJson<{
      success?: boolean;
      data?: ProjeAkisData;
      error?: string;
    }>(res);
    if (res.ok && !body.error && body.success !== false) {
      const fromApi = body.data
        ? { ...EMPTY_PROJE_AKIS, ...body.data }
        : unwrapProjeAkisPayload(body);
      if (fromApi && !isProjeAkisEmpty(fromApi)) {
        return { data: fromApi };
      }
    }
  } catch {
    /* API zaman aşımı / ağ — statik yedek */
  }
  return fetchProjeAkisStatic();
}

export type TipSozlukEntry = {
  tip_kodu: string;
  aciklama: string;
  kategori: string;
  kaynak?: string;
  frekans?: number;
  alt_kategori?: string | null;
};

export async function fetchTipSozlugu(): Promise<{
  entries: TipSozlukEntry[];
  error?: string;
}> {
  try {
    const res = await fetch("/data/tip-sozlugu.json", { cache: "no-store" });
    if (!res.ok) return { entries: [], error: `HTTP ${res.status}` };
    const raw = await parseJson<{ entries?: TipSozlukEntry[] } | TipSozlukEntry[]>(
      res,
    );
    const entries = Array.isArray(raw) ? raw : raw.entries ?? [];
    return { entries };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "tip-sozlugu.json okunamadı";
    return { entries: [], error: msg };
  }
}

export type ImportAnalizItem = {
  ham_isim: string;
  tip_kodu: string;
  kategori: string;
  adet?: number;
  durum?: "eslesti" | "yeni" | "belirsiz";
  sozlukte_var?: boolean;
};

export async function analyzeImportFile(payload: {
  dosya_base64: string;
  dosya_tip: string;
  system_prompt: string;
  user_prompt: string;
}): Promise<{ data?: ImportAnalizItem[]; error?: string }> {
  const token = getProToken();
  try {
    const res = await fetch("/api/import/analiz", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20 * 60 * 1000),
    });
    const text = await res.text();
    let body: { success?: boolean; data?: ImportAnalizItem[]; error?: string };
    try {
      body = JSON.parse(text) as typeof body;
    } catch {
      return { error: `HTTP ${res.status}: ${text.slice(0, 400)}` };
    }
    if (!res.ok || body.success === false) {
      return { error: body.error || `HTTP ${res.status}` };
    }
    return { data: body.data ?? [] };
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return { error: "İstek 20 dakikada tamamlanmadı (zaman aşımı)" };
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/fetch/i.test(msg)) {
      return {
        error:
          "Sunucuya ulaşılamadı. npm run dev:all veya npm run api (port 3001) çalıştırın.",
      };
    }
    return { error: msg };
  }
}

export async function saveImportItems(
  ekipmanlar: Array<{ tip_kodu: string; ham_isim: string; kategori: string }>,
): Promise<{ eklendi?: number; guncellendi?: number; error?: string }> {
  const token = getProToken();
  const res = await fetch("/api/import/kaydet", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ekipmanlar }),
  });
  const body = await parseJson<{
    success?: boolean;
    eklendi?: number;
    guncellendi?: number;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { error: body.error || `HTTP ${res.status}` };
  }
  return { eklendi: body.eklendi, guncellendi: body.guncellendi };
}

// ── İşletme: sipariş, teklif, müşteri, rapor ──

export type SiparisAdminRow = {
  id: string;
  siparis_no: string;
  musteri_ad: string;
  musteri_tel: string;
  musteri_mail: string;
  not_: string | null;
  kalemler: unknown[];
  toplam_kalem: number;
  toplam_adet: number;
  toplam_tl: number;
  durum: string;
  kaynak: string | null;
  kupon_kod: string | null;
  indirim_tl: number | null;
  created_at: string;
};

export type TeklifAdminRow = {
  id: string;
  ref_no: string;
  musteri_ad: string;
  konsept: string;
  toplam_tl: number;
  gecerlilik_bitis: string | null;
  durum: string;
  not_: string | null;
  kaynak: string | null;
  created_at: string;
};

export type MusteriAdminRow = {
  id: string;
  firma: string;
  yetkili: string;
  tel: string;
  mail: string;
  sehir: string;
  tip: string;
  not: string;
  kaynak: string | null;
  sayfa: string | null;
  mesaj: string | null;
  created_at: string;
};

export type MagazaAyarlari = {
  whatsapp_e164: string;
  whatsapp_prefill: string;
  ucretsiz_kargo: boolean;
  ucretsiz_kargo_limit_tl: number;
  kargo_bolgeleri: string[];
  kdv_gosterim: "dahil" | "haric";
  kdv_oran: number;
  i18n_overrides: Record<string, Record<string, string>>;
};

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const token = getProToken();
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
  return parseJson<T>(res);
}

export async function fetchSiparisler(): Promise<{
  rows: SiparisAdminRow[];
  error?: string;
}> {
  const body = await adminFetch<{ success?: boolean; data?: SiparisAdminRow[]; error?: string }>(
    "/api/siparisler",
  );
  if (body.error || body.success === false) {
    return { rows: [], error: body.error || "Liste alınamadı" };
  }
  return { rows: body.data || [] };
}

export async function fetchSiparis(id: string): Promise<{
  row?: SiparisAdminRow;
  error?: string;
}> {
  const body = await adminFetch<{ success?: boolean; data?: SiparisAdminRow; error?: string }>(
    `/api/siparisler/${encodeURIComponent(id)}`,
  );
  if (body.error || body.success === false) {
    return { error: body.error || "Detay alınamadı" };
  }
  return { row: body.data };
}

export async function updateSiparisDurum(
  id: string,
  durum: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken();
  const res = await fetch(`/api/siparisler/${encodeURIComponent(id)}/durum`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ durum }),
  });
  const body = await parseJson<{ success?: boolean; error?: string }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function fetchTeklifler(): Promise<{
  rows: TeklifAdminRow[];
  error?: string;
}> {
  const body = await adminFetch<{ success?: boolean; data?: TeklifAdminRow[]; error?: string }>(
    "/api/teklifler",
  );
  if (body.error || body.success === false) {
    return { rows: [], error: body.error || "Liste alınamadı" };
  }
  return { rows: body.data || [] };
}

export async function updateTeklifDurum(
  id: string,
  durum: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken();
  const res = await fetch(`/api/teklifler/${encodeURIComponent(id)}/durum`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ durum }),
  });
  const body = await parseJson<{ success?: boolean; error?: string }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function fetchMusteriler(): Promise<{
  rows: MusteriAdminRow[];
  error?: string;
}> {
  const body = await adminFetch<{ success?: boolean; data?: MusteriAdminRow[]; error?: string }>(
    "/api/musteriler",
  );
  if (body.error || body.success === false) {
    return { rows: [], error: body.error || "Liste alınamadı" };
  }
  return { rows: body.data || [] };
}

export async function saveMusteri(
  payload: Partial<MusteriAdminRow> & { firma?: string; yetkili?: string },
  id?: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken();
  const url = id ? `/api/musteriler/${encodeURIComponent(id)}` : "/api/musteriler";
  const res = await fetch(url, {
    method: id ? "PUT" : "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson<{ success?: boolean; error?: string }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export async function deleteMusteri(id: string): Promise<{ ok: boolean; error?: string }> {
  const token = getProToken();
  const res = await fetch(`/api/musteriler/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<{ success?: boolean; error?: string }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { ok: false, error: body.error || `HTTP ${res.status}` };
  }
  return { ok: true };
}

export type RaporOzet = {
  siparis: { toplam: number; durum: Record<string, number>; ciro_tl: number };
  teklif: { toplam: number; onaylandi: number; gonderildi: number };
  birlikte_sepet: Array<{ a: string; b: string; count: number }>;
  marka_kategori: Array<{ marka: string; kategori: string; adet: number; tutar: number }>;
  arama: Array<{ query: string; count: number; avg_hits: number }>;
};

export async function fetchRaporlar(kind?: string): Promise<{
  data?: RaporOzet | unknown;
  error?: string;
}> {
  const qs = kind ? `?kind=${encodeURIComponent(kind)}` : "";
  const body = await adminFetch<{ success?: boolean; data?: RaporOzet; error?: string }>(
    `/api/raporlar${qs}`,
  );
  if (body.error) return { error: body.error };
  return { data: body.data };
}

export function magazaAyarlariFromEticaret(a: Record<string, unknown>): MagazaAyarlari {
  const i18nRaw = a.i18n_overrides;
  let i18n: Record<string, Record<string, string>> = {};
  if (i18nRaw && typeof i18nRaw === "object" && !Array.isArray(i18nRaw)) {
    for (const [locale, vals] of Object.entries(i18nRaw)) {
      if (vals && typeof vals === "object") {
        i18n[locale] = Object.fromEntries(
          Object.entries(vals as Record<string, unknown>).filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        );
      }
    }
  }
  return {
    whatsapp_e164: String(a.whatsapp_e164 ?? "905326840152"),
    whatsapp_prefill: String(a.whatsapp_prefill ?? "Merhaba, equsto.com üzerinden yazıyorum."),
    ucretsiz_kargo: a.ucretsiz_kargo !== false,
    ucretsiz_kargo_limit_tl: Number(a.ucretsiz_kargo_limit_tl ?? 0) || 0,
    kargo_bolgeleri: Array.isArray(a.kargo_bolgeleri)
      ? a.kargo_bolgeleri.map(String)
      : ["Türkiye geneli"],
    kdv_gosterim: String(a.kdv_gosterim) === "haric" ? "haric" : "dahil",
    kdv_oran: Number(a.kdv_oran ?? 20) || 20,
    i18n_overrides: i18n,
  };
}
