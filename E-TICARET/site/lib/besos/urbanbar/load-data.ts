import { readJsonFile } from "@/lib/legacy-data";
import type { BesosUrbanBarCatalog } from "./types";

const CATALOG_FILE = "urbanbar-besos-catalog.json";

export async function loadBesosUrbanBarCatalog(): Promise<BesosUrbanBarCatalog> {
  const raw = await readJsonFile<BesosUrbanBarCatalog>(CATALOG_FILE);
  if (!raw?.products?.length) {
    throw new Error(`${CATALOG_FILE} unavailable — run: npm run catalog:urbanbar:besos`);
  }
  return raw;
}

export async function loadBesosUrbanBarPageData() {
  const catalog = await loadBesosUrbanBarCatalog();
  return { catalog };
}
