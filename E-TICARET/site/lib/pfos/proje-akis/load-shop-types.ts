import { readJsonFile, dataPath } from "@/lib/legacy-data";
import {
  enrichShopTypesFromFile,
  type ShopTypeKayit,
} from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { unwrapProjeAkisPayload } from "@/lib/pfos/proje-akis/unwrap";

let cache: ShopTypeKayit[] | null = null;
let cacheAt = 0;
const TTL_MS = 60_000;

/** proje-akis.json → normalize shopTypes (admin kayıtları + kod tanımları) */
export async function loadProjeAkisShopTypes(): Promise<ShopTypeKayit[]> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const raw = await readJsonFile<unknown>(dataPath("proje-akis.json"));
  const data = unwrapProjeAkisPayload(raw);
  const list = Array.isArray(data?.shopTypes) ? data!.shopTypes : [];
  cache = enrichShopTypesFromFile(list);
  cacheAt = Date.now();
  return cache;
}

export function findShopTypeByDukkanSecim(
  shopTypes: ShopTypeKayit[],
  dukkanSecim: string,
  motorSlug?: string | null,
): ShopTypeKayit | null {
  const d = dukkanSecim.trim();
  if (!d) return null;
  const aktif = shopTypes.filter((t) => t.pfos.durum !== "planlanan");
  const byDukkan = aktif.find((t) => t.pfos.dukkanSecim === d);
  if (byDukkan) return byDukkan;
  if (motorSlug) {
    const slug = motorSlug.trim();
    return aktif.find((t) => t.pfos.motorSlug === slug) ?? null;
  }
  return null;
}
