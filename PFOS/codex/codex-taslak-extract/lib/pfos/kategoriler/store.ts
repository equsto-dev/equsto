import path from "node:path";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";
import {
  findBantTanim,
  findKategoriTanim,
  listeDosyaAdi,
  PFOS_KATEGORI_TANIMLARI,
} from "./registry";
import type {
  PfosKategoriListeKayit,
  PfosKategorilerManifest,
} from "./types";

const MANIFEST = () => dataPath("pfos-kategoriler.json");
const REF_DIR = () => dataPath("pfos-referans");

export function referansListePath(kategoriId: string, bantId: string) {
  return path.join(REF_DIR(), listeDosyaAdi(kategoriId, bantId));
}

export async function readListeKayit(
  kategoriId: string,
  bantId: string,
): Promise<PfosKategoriListeKayit | null> {
  return readJsonFile<PfosKategoriListeKayit>(
    referansListePath(kategoriId, bantId),
  );
}

export async function writeListeKayit(kayit: PfosKategoriListeKayit) {
  await writeJsonFile(referansListePath(kayit.kategoriId, kayit.bantId), kayit);
}

export async function buildManifest(): Promise<PfosKategorilerManifest> {
  const kategoriler = [];
  for (const t of PFOS_KATEGORI_TANIMLARI) {
    const bantlar = [];
    for (const b of t.bantlar) {
      const liste = await readListeKayit(t.id, b.id);
      bantlar.push({
        id: b.id,
        label: b.label,
        referansM2: b.referansM2,
        meta: liste
          ? {
              listeDosya: listeDosyaAdi(t.id, b.id),
              kalemSayisi: liste.kalemSayisi,
              toplamAdet: liste.toplamAdet,
              kaynakDosya: liste.kaynakDosya,
              yukleme: liste.yukleme,
            }
          : undefined,
      });
    }
    kategoriler.push({
      id: t.id,
      label: t.label,
      ustKategori: t.ustKategori,
      bantlar,
    });
  }
  return { version: "1", kategoriler };
}

export async function refreshManifestFile() {
  const manifest = await buildManifest();
  manifest.updated_at = new Date().toISOString();
  await writeJsonFile(MANIFEST(), manifest);
  return manifest;
}

export async function readManifest(): Promise<PfosKategorilerManifest> {
  const stored = await readJsonFile<PfosKategorilerManifest>(MANIFEST());
  if (stored?.kategoriler?.length) return stored;
  return refreshManifestFile();
}

export async function saveUploadedListe(
  kategoriId: string,
  bantId: string,
  kalemler: PfosKategoriListeKayit["kalemler"],
  kaynakDosya: string,
) {
  const kat = findKategoriTanim(kategoriId);
  const bant = findBantTanim(kategoriId, bantId);
  if (!kat || !bant) {
    throw new Error("Geçersiz kategori veya m² bantı");
  }
  const kalemSayisi = kalemler.length;
  const toplamAdet = kalemler.reduce(
    (t, r) => (typeof r.adet === "number" ? t + r.adet : t),
    0,
  );
  const kayit: PfosKategoriListeKayit = {
    kategoriId,
    bantId,
    label: `${kat.label} ${bant.label}`,
    referansM2: bant.referansM2,
    kaynakDosya,
    yukleme: new Date().toISOString(),
    kalemSayisi,
    toplamAdet,
    kalemler,
  };
  await writeListeKayit(kayit);
  return refreshManifestFile();
}
