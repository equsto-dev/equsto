import type { PfosEkipmanSatir } from "@/lib/pfos/kategoriler/types";
import type { ListePdfKalem } from "@/lib/pfos/liste-pdf-analiz";
import type { FiyatStratejisi } from "@/lib/pfos/schemas/pfos.schema";

export const LISTE_KONSEPT = "yuklenen-liste";
export const LISTE_KONSEPT_LABEL = "Yüklenen ekipman listesi";

export type ListeFiyatInput = {
  satirlar?: PfosEkipmanSatir[];
  importKalemler?: ListePdfKalem[];
  kaynakDosya?: string;
  kaynakTip?: "excel" | "pdf";
  projeAdi?: string;
  sehir?: string;
  fiyatStratejisi?: FiyatStratejisi;
};
