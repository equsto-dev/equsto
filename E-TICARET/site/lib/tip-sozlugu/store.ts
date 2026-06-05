import fs from "node:fs/promises";
import path from "node:path";
import { readJsonFile } from "@/lib/legacy-data";
import { dataPath, writeJsonFile } from "@/lib/legacy-data-fs";
import type { TipSozlukEntry, TipSozlukFile } from "./types";

const FILE = () => dataPath("tip-sozlugu.json");

export async function loadTipSozluguEntries(): Promise<TipSozlukEntry[]> {
  const raw = await readJsonFile<TipSozlukFile | TipSozlukEntry[]>("tip-sozlugu.json");
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return Array.isArray(raw.entries) ? raw.entries : [];
}

export async function saveTipSozluguEntries(entries: TipSozlukEntry[]): Promise<TipSozlukFile> {
  const sorted = [...entries].sort((a, b) => a.tip_kodu.localeCompare(b.tip_kodu, "tr"));
  const out: TipSozlukFile = {
    version: 1,
    updated: new Date().toISOString(),
    count: sorted.length,
    entries: sorted,
  };
  await writeJsonFile(FILE(), out);
  return out;
}

export async function upsertTipEntry(
  tipKodu: string,
  patch: Partial<TipSozlukEntry>,
): Promise<TipSozlukEntry[]> {
  const entries = await loadTipSozluguEntries();
  const key = String(tipKodu || "").trim();
  if (!key) return entries;
  const idx = entries.findIndex((t) => t.tip_kodu === key);
  if (idx >= 0) {
    entries[idx] = { ...entries[idx], ...patch, tip_kodu: key };
  } else {
    entries.push({
      tip_kodu: key,
      aciklama: patch.aciklama || key,
      kategori: patch.kategori || "diger",
      kaynak: patch.kaynak || "api",
      frekans: patch.frekans ?? 0,
      alt_kategori: patch.alt_kategori ?? null,
    });
  }
  await saveTipSozluguEntries(entries);
  return entries;
}

/** admin.html içindeki TIP_SOZLUGU sabit listesi */
export async function parseAdminHtmlSeed(): Promise<TipSozlukEntry[]> {
  const adminPath = path.join(process.cwd(), "public", "admin.html");
  let html: string;
  try {
    html = await fs.readFile(adminPath, "utf8");
  } catch {
    return [];
  }
  const re = /\{k:"([^"]+)",a:"([^"]*)",c:"([^"]+)",s:"([^"]*)"\}/g;
  const out: TipSozlukEntry[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({
      tip_kodu: m[1],
      aciklama: m[2],
      kategori: m[3],
      kaynak: m[4] || "P1",
      frekans: 0,
    });
  }
  return out;
}
