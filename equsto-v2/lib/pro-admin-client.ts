/** Yönetim paneli — /api istekleri (Bearer) */

export const PRO_TOKEN_KEY = "equsto_pro_admin_token";

export type AdminUrunApiRow = {
  id: string;
  ad: string;
  tip_kodu: string | null;
  kategori: string;
  marka_ad: string;
  fiyat_tl: number;
  gorsel_url: string | null;
  durum: "aktif" | "pasif";
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

export async function fetchUrunler(tokenOverride?: string): Promise<{
  rows: AdminUrunApiRow[];
  source: string;
  error?: string;
  status?: number;
}> {
  const token = (tokenOverride ?? getProToken()).trim();
  const res = await fetch("/api/urunler", {
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
  return parseJson<{ rate?: number; success?: boolean }>(res);
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

export function rowHasImage(row: EkipmanRow): boolean {
  return Array.isArray(row.images) && !!String(row.images[0] || "").trim();
}

export async function fetchEkipmanlarCatalog(): Promise<EkipmanRow[]> {
  const res = await fetch("/data/ekipmanlar.json?v=20260523catalog", {
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

export async function fetchProjeAkis(): Promise<{
  data: ProjeAkisData | null;
  error?: string;
}> {
  const token = getProToken();
  const res = await fetch("/api/proje-akis", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await parseJson<{
    success?: boolean;
    data?: ProjeAkisData;
    error?: string;
  }>(res);
  if (!res.ok || body.error || body.success === false) {
    return { data: null, error: body.error || `HTTP ${res.status}` };
  }
  return { data: body.data || null };
}
