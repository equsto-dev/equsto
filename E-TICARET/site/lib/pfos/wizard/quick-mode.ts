import type { Konsept } from "@/lib/pfos/schemas/pfos.schema";
import { TEKLIF_DEFAULT_FIYAT_STRATEJISI } from "@/lib/pfos/teklif/teklif-policy";
import { dagitM2Toplam, zonesForKonsept } from "./profiles";
import type { PfosWizardState } from "./types";

/**
 * Geçici — PFOS hızlı deneme: 1. Adres + 2. Konsept atlanır.
 * Kapatmak için `false` yapın.
 */
export const PFOS_QUICK_MODE = true;

export const PFOS_QUICK_DEFAULTS = {
  konsept: "coffee-shop" as Konsept,
  m2: 120,
  il: "İstanbul",
  lokasyon: "cadde" as const,
  fiyatStratejisi: TEKLIF_DEFAULT_FIYAT_STRATEJISI,
};

export function pfosQuickInitialState(): PfosWizardState {
  const { konsept, m2, il, lokasyon, fiyatStratejisi } = PFOS_QUICK_DEFAULTS;
  const zones = zonesForKonsept(konsept);
  return {
    adim: 2,
    adres: { il, ilce: "", mahalle: "", cadde: "" },
    lokasyon,
    konsept,
    projeAdi: "Coffee Shop — PFOS taslak",
    musteri: "",
    m2Toplam: m2,
    bolumM2: zones.length ? dagitM2Toplam(zones, m2) : {},
    referansProjeId: null,
    referansZoneSecimi: [],
    referansBolumM2: {},
    fiyatStratejisi,
    detaySeviyesi: "standart",
    teshirVitrinleriDahil: true,
    bulasikKapasitesiYuksek: false,
  };
}

export function pfosWizardInitialState(): PfosWizardState {
  if (PFOS_QUICK_MODE) return pfosQuickInitialState();
  return {
    adim: 0,
    adres: { il: "İstanbul", ilce: "", mahalle: "", cadde: "" },
    lokasyon: "cadde",
    konsept: null,
    projeAdi: "",
    musteri: "",
    m2Toplam: "",
    bolumM2: {},
    referansProjeId: null,
    referansZoneSecimi: [],
    referansBolumM2: {},
    fiyatStratejisi: TEKLIF_DEFAULT_FIYAT_STRATEJISI,
    detaySeviyesi: "standart",
    teshirVitrinleriDahil: true,
    bulasikKapasitesiYuksek: false,
  };
}
