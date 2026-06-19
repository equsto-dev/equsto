export type TrProvince = {
  id: number;
  plate: number;
  name: string;
  population: number;
  districts: TrDistrict[];
};

export type TrDistrict = {
  id: string;
  name: string;
  neighborhoods: string[];
};

type TrAdresBundle = {
  version?: number;
  provinces: TrProvince[];
};

let loadPromise: Promise<boolean> | null = null;
let provinces: TrProvince[] = [];
const districtsByProvince = new Map<number, TrDistrict[]>();
const neighborhoodsByDistrict = new Map<string, string[]>();

export function normAdresKey(s: string): string {
  return String(s || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFKC");
}

export async function loadTrAdres(): Promise<boolean> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      const res = await fetch("/data/tr-adres.json", { cache: "force-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as TrAdresBundle;
      provinces = Array.isArray(j.provinces) ? j.provinces : [];
      provinces.sort(
        (a, b) => (Number(b.population) || 0) - (Number(a.population) || 0),
      );
      districtsByProvince.clear();
      neighborhoodsByDistrict.clear();
      for (const p of provinces) {
        const dists = Array.isArray(p.districts) ? p.districts : [];
        districtsByProvince.set(p.id, dists);
        for (const d of dists) {
          neighborhoodsByDistrict.set(
            d.id,
            Array.isArray(d.neighborhoods) ? d.neighborhoods : [],
          );
        }
      }
      return provinces.length > 0;
    } catch {
      provinces = [];
      districtsByProvince.clear();
      neighborhoodsByDistrict.clear();
      return false;
    }
  })();
  return loadPromise;
}

export function getProvinces(): TrProvince[] {
  return provinces;
}

export function findProvinceByName(name: string): TrProvince | null {
  if (!name || !provinces.length) return null;
  const t = String(name).trim();
  let p = provinces.find((x) => x.name === t);
  if (p) return p;
  const tl = normAdresKey(t);
  p = provinces.find((x) => normAdresKey(x.name) === tl);
  return p ?? null;
}

export function getDistricts(provinceId: number): TrDistrict[] {
  return districtsByProvince.get(provinceId) ?? [];
}

export function findDistrictByName(
  provinceId: number,
  districtName: string,
): TrDistrict | null {
  const rows = getDistricts(provinceId);
  if (!rows.length || !districtName) return null;
  const t = String(districtName).trim();
  let d = rows.find((x) => x.name === t);
  if (d) return d;
  const tl = normAdresKey(t);
  d = rows.find((x) => normAdresKey(x.name) === tl);
  return d ?? null;
}

export function getNeighborhoodNames(districtId: string): string[] {
  return neighborhoodsByDistrict.get(districtId) ?? [];
}

function provinceMatches(p: TrProvince, q: string): boolean {
  const name = normAdresKey(p.name);
  const digits = q.replace(/\D/g, "");
  if (name.includes(q)) return true;
  if (digits.length > 0 && String(p.plate).startsWith(digits)) return true;
  return false;
}

function provinceSearchRank(p: TrProvince, q: string): number {
  const name = normAdresKey(p.name);
  const pop = Number(p.population) || 0;
  if (name === q) return 1_000_000_000 + pop;
  if (name.startsWith(q)) return 100_000_000 + pop;
  if (name.includes(q)) return 10_000_000 + pop;
  return pop;
}

export function filterProvinces(query: string, limit?: number): TrProvince[] {
  const q = normAdresKey(query);
  let list: TrProvince[];
  if (!q) {
    list = provinces;
  } else {
    list = provinces
      .filter((p) => provinceMatches(p, q))
      .sort((a, b) => provinceSearchRank(b, q) - provinceSearchRank(a, q));
  }
  if (limit != null && limit > 0) return list.slice(0, limit);
  return list;
}

function districtMatches(d: TrDistrict, q: string): boolean {
  return normAdresKey(d.name).includes(q);
}

function districtSearchRank(d: TrDistrict, q: string): number {
  const name = normAdresKey(d.name);
  if (name === q) return 1_000_000;
  if (name.startsWith(q)) return 100_000;
  if (name.includes(q)) return 10_000;
  return 0;
}

export function filterDistricts(
  provinceId: number,
  query: string,
  limit?: number,
): TrDistrict[] {
  const rows = getDistricts(provinceId);
  const q = normAdresKey(query);
  let list: TrDistrict[];
  if (!q) {
    list = [...rows].sort((a, b) =>
      a.name.localeCompare(b.name, "tr-TR"),
    );
  } else {
    list = rows
      .filter((d) => districtMatches(d, q))
      .sort((a, b) => districtSearchRank(b, q) - districtSearchRank(a, q));
  }
  if (limit != null && limit > 0) return list.slice(0, limit);
  return list;
}

export function filterNeighborhoods(
  districtId: string,
  query: string,
  limit = 16,
): string[] {
  const rows = getNeighborhoodNames(districtId);
  const q = normAdresKey(query);
  if (!q) return rows.slice(0, limit);
  return rows.filter((n) => normAdresKey(n).includes(q)).slice(0, limit);
}

export type PfosAdresFormValue = {
  il: string;
  ilce: string;
  mahalle: string;
};

export function adresFormToAnswers(v: PfosAdresFormValue): {
  q_lokasyon: string;
  q_acik_adres: string;
} {
  return {
    q_lokasyon: v.il.trim(),
    q_acik_adres: v.ilce.trim(),
  };
}

export function answersToAdresForm(answers: {
  q_lokasyon?: string;
  q_acik_adres?: string;
}): PfosAdresFormValue {
  const il = String(answers.q_lokasyon ?? "").trim();
  const not = String(answers.q_acik_adres ?? "").trim();
  if (!not) return { il, ilce: "", mahalle: "" };
  const ilce = not.split(" · ")[0]?.trim() ?? not;
  return {
    il,
    ilce,
    mahalle: "",
  };
}

export function isAdresFormValid(v: PfosAdresFormValue): boolean {
  return Boolean(v.il.trim() && v.ilce.trim());
}
