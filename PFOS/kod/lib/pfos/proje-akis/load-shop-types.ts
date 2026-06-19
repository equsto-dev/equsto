import { readJsonFile } from "@/lib/legacy-data";
import {
  enrichShopTypesFromFile,
  type ShopTypeKayit,
} from "@/lib/pfos/proje-akis/konsept-tanimlari";
import { kiremitDukkanFromRestoranAlt } from "@/lib/pfos/proje-akis/soru-motor-mapping";
import { unwrapProjeAkisPayload } from "@/lib/pfos/proje-akis/unwrap";

let cache: ShopTypeKayit[] | null = null;
let cacheAt = 0;
const TTL_MS = 60_000;

/** proje-akis.json → normalize shopTypes (admin kayıtları + kod tanımları) */
export async function loadProjeAkisShopTypes(): Promise<ShopTypeKayit[]> {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache;
  const raw = await readJsonFile<unknown>("proje-akis.json");
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
  const byDukkan = shopTypes.find((t) => t.pfos.dukkanSecim === d);
  if (byDukkan) return byDukkan;
  if (motorSlug) {
    const slug = motorSlug.trim();
    return shopTypes.find((t) => t.pfos.motorSlug === slug) ?? null;
  }
  return null;
}

/** Teklif API — esnaf lokanta alt tipi ile Kiremit shop type çözümü */
export function findShopTypeForQuote(
  shopTypes: ShopTypeKayit[],
  dukkanSecim: string,
  motorSlug?: string | null,
  altTip?: string | null,
): ShopTypeKayit | null {
  const d = dukkanSecim.trim();
  const kiremitDukkan = kiremitDukkanFromRestoranAlt(altTip);
  if (kiremitDukkan) {
    const hit = shopTypes.find((t) => t.pfos.dukkanSecim === kiremitDukkan);
    if (hit) return hit;
  }
  return findShopTypeByDukkanSecim(shopTypes, d, motorSlug);
}
