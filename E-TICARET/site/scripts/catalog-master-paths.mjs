/**
 * Ana besleyici: PFOS/ÜRÜN KATEGORİZASYONU-DOLU.xlsx
 * Tüm catalog:master:* scriptleri bu yolları kullanır.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPO_ROOT = path.join(SITE_ROOT, "..", "..");

/** Onaylı ana besleyici Excel dosya adı */
export const MASTER_XLSX_FILENAME = "ÜRÜN KATEGORİZASYONU-DOLU.xlsx";
export const MASTER_XLSX_TEMPLATE = "ÜRÜN KATEGORİZASYONU.xlsx";

export const MASTER_XLSX_PATH = path.join(REPO_ROOT, "PFOS", MASTER_XLSX_FILENAME);
export const MASTER_XLSX_TEMPLATE_PATH = path.join(
  REPO_ROOT,
  "PFOS",
  MASTER_XLSX_TEMPLATE,
);
export const MASTER_JSON_PATH = path.join(
  SITE_ROOT,
  "public/data/equsto-katalog-master.json",
);
export const EKIPMANLAR_PATH = path.join(SITE_ROOT, "public/data/ekipmanlar.json");
export const DEPT_DIR = path.join(SITE_ROOT, "public/data/dept");

export { SITE_ROOT, REPO_ROOT };
