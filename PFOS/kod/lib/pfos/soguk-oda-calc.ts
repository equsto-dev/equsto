/** Soğuk oda hesap motoru — admin.html hesaplaSogukOda ile aynı mantık */

export const SO_PARAMETRELER = {
  serin_10: { label: "Serin (+10°C)", panel_kalin: 6, sogutma_wm3: 65, tip: "SO" },
  soguk_5: { label: "Soğuk (+5°C)", panel_kalin: 8, sogutma_wm3: 80, tip: "SO" },
  soguk_0: { label: "Soğuk (0°C)", panel_kalin: 8, sogutma_wm3: 95, tip: "SO" },
  soguk_m5: { label: "Soğuk (-5°C)", panel_kalin: 8, sogutma_wm3: 115, tip: "SO" },
  donmus_m18: { label: "Donmuş (-18°C)", panel_kalin: 10, sogutma_wm3: 145, tip: "DO" },
  donmus_m25: { label: "Donmuş (-25°C)", panel_kalin: 12, sogutma_wm3: 175, tip: "DO" },
} as const;

export type SoTipKey = keyof typeof SO_PARAMETRELER;

/** Panel tip soğuk oda (+5°C) ve derin dondurucu oda (-18°C) */
export const TIP_SOGUK_ODA: SoTipKey = "soguk_5";
export const TIP_DERIN_DONDURUCU_ODA: SoTipKey = "donmus_m18";

/** Öztiryakiler panel-split katalog medyanı — TL/m² toplam panel (KDV dahil) */
export const SO_PANEL_TL_M2 = {
  SO: 7888,
  DO: 9741,
} as const;

export const SO_CIHAZ_TABLOSU = [
  { min: 0, max: 800, model: "S-100", kapasite: 750, guc_hp: 0.75, elk_w: 550 },
  { min: 800, max: 1500, model: "S-150", kapasite: 1400, guc_hp: 1.0, elk_w: 950 },
  { min: 1500, max: 2500, model: "S-200", kapasite: 2200, guc_hp: 1.5, elk_w: 1500 },
  { min: 2500, max: 4000, model: "S-300", kapasite: 3441, guc_hp: 2.0, elk_w: 2706 },
  { min: 4000, max: 6000, model: "S-400", kapasite: 5200, guc_hp: 3.0, elk_w: 3800 },
  { min: 6000, max: 9000, model: "S-600", kapasite: 7500, guc_hp: 4.0, elk_w: 5500 },
  { min: 9000, max: 999999, model: "S-800", kapasite: 10000, guc_hp: 5.5, elk_w: 7200 },
] as const;

export type SogukOdaInput = {
  en: number;
  boy: number;
  yuk: number;
  tip: SoTipKey;
  zemin: "plywood" | "styropor" | "yok";
  kapiTip: string;
  kapiOlcu: string;
  kapiAdet: number;
  cihazTip: "split" | "monoblok" | "yok";
  cihazAdet: number;
};

export type SogukOdaSonuc = {
  en: number;
  boy: number;
  yuk: number;
  tipLabel: string;
  panelKalin: number;
  duvarAlan: number;
  tavanAlan: number;
  zeminAlan: number;
  toplamPanel: number;
  hacim: number;
  sogutmaIhtiyacW: number;
  maxSogutmaHacim: number;
  zeminLabel: string;
  kapiAdet: number;
  kapiTip: string;
  kapiOlcu: string;
  cihazTip: string;
  cihazAdet: number;
  cihaz: (typeof SO_CIHAZ_TABLOSU)[number] | null;
};

const ZEMIN_LABELS: Record<SogukOdaInput["zemin"], string> = {
  plywood: "Panel + Plywood",
  styropor: "Styropor (Müşteri)",
  yok: "Yok",
};

export function fmtTr(v: number, digits = 2): string {
  return v.toFixed(digits).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function panelOdaTipKey(derinDondurucu: boolean): SoTipKey {
  return derinDondurucu ? TIP_DERIN_DONDURUCU_ODA : TIP_SOGUK_ODA;
}

export type OlcuCm = { en: number; boy: number; yuk: number };

/** Proforma ölçüsü (cm): 340*270*240 → en×boy×yükseklik */
export function parseOlcuCm(raw: string): OlcuCm | null {
  const nums = [...String(raw).matchAll(/(\d+(?:[.,]\d+)?)/g)]
    .map((m) => Number(m[1].replace(",", ".")))
    .filter((n) => Number.isFinite(n) && n >= 50);
  if (nums.length < 3) return null;
  const [a, b, c] = nums;
  const sorted = [a, b, c].sort((x, y) => y - x);
  return { en: sorted[0], boy: sorted[1], yuk: sorted[2] };
}

export function olcuCmToMetre(cm: OlcuCm): { en: number; boy: number; yuk: number } {
  return { en: cm.en / 100, boy: cm.boy / 100, yuk: cm.yuk / 100 };
}

export function formatOlcuCm(cm: OlcuCm): string {
  return `${Math.round(cm.en)}×${Math.round(cm.boy)}×${Math.round(cm.yuk)} cm`;
}

export function formatOlcuMetre(m: { en: number; boy: number; yuk: number }): string {
  return `${fmtTr(m.en, 1)}×${fmtTr(m.boy, 1)}×${fmtTr(m.yuk, 1)} m`;
}

export function defaultPanelOdaInput(
  metre: { en: number; boy: number; yuk: number },
  derinDondurucu: boolean,
): SogukOdaInput {
  return {
    en: metre.en,
    boy: metre.boy,
    yuk: metre.yuk,
    tip: panelOdaTipKey(derinDondurucu),
    zemin: "plywood",
    kapiTip: "menteseli_ithal",
    kapiOlcu: "90x190",
    kapiAdet: 1,
    cihazTip: "split",
    cihazAdet: 1,
  };
}

export type SogukOdaFiyatSonuc = {
  fiyatTl: number;
  panelTl: number;
  birimTlM2: number;
};

/** Panel + split cihaz — katalog medyan m² birim fiyatı ile özel ölçü */
export function hesaplaSogukOdaFiyat(
  input: SogukOdaInput,
  sonuc: SogukOdaSonuc,
): SogukOdaFiyatSonuc {
  const rejim = SO_PARAMETRELER[input.tip].tip;
  const birimTlM2 = SO_PANEL_TL_M2[rejim];
  const panelTl = Math.round(sonuc.toplamPanel * birimTlM2);
  const ekKapi =
    input.kapiAdet > 1 ? (input.kapiAdet - 1) * 18_000 : 0;
  const fiyatTl = panelTl + ekKapi;
  return { fiyatTl, panelTl, birimTlM2 };
}

export function hesaplaPanelOda(
  metre: { en: number; boy: number; yuk: number },
  derinDondurucu: boolean,
): { input: SogukOdaInput; sonuc: SogukOdaSonuc; fiyat: SogukOdaFiyatSonuc } | null {
  const input = defaultPanelOdaInput(metre, derinDondurucu);
  const sonuc = hesaplaSogukOda(input);
  if (!sonuc) return null;
  return { input, sonuc, fiyat: hesaplaSogukOdaFiyat(input, sonuc) };
}

export function teknikModelFromSonuc(sonuc: SogukOdaSonuc): string {
  const cihaz = sonuc.cihaz?.model ?? "—";
  return `${sonuc.cihazAdet}× ${cihaz} ${sonuc.cihazTip} — ${sonuc.sogutmaIhtiyacW.toLocaleString("tr-TR")} W`;
}

export function hesaplaSogukOda(input: SogukOdaInput): SogukOdaSonuc | null {
  const { en, boy, yuk } = input;
  if (!en || !boy || !yuk) return null;

  const p = SO_PARAMETRELER[input.tip];
  const duvarAlan = 2 * (en * yuk + boy * yuk);
  const tavanAlan = en * boy;
  const zeminAlan = en * boy;
  const toplamPanel =
    duvarAlan + tavanAlan + (input.zemin === "plywood" ? zeminAlan : 0);
  const hacim = en * boy * yuk;
  const sogutmaIhtiyacW = Math.round(hacim * p.sogutma_wm3);
  const maxSogutmaHacim = Math.round(hacim * 1.03);

  let cihaz: (typeof SO_CIHAZ_TABLOSU)[number] | null = null;
  if (input.cihazTip !== "yok") {
    cihaz =
      SO_CIHAZ_TABLOSU.find(
        (c) => sogutmaIhtiyacW >= c.min && sogutmaIhtiyacW < c.max,
      ) ?? SO_CIHAZ_TABLOSU[SO_CIHAZ_TABLOSU.length - 1];
  }

  return {
    en,
    boy,
    yuk,
    tipLabel: p.label,
    panelKalin: p.panel_kalin,
    duvarAlan,
    tavanAlan,
    zeminAlan,
    toplamPanel,
    hacim,
    sogutmaIhtiyacW,
    maxSogutmaHacim,
    zeminLabel: ZEMIN_LABELS[input.zemin],
    kapiAdet: input.kapiAdet,
    kapiTip: input.kapiTip.replace("_", " "),
    kapiOlcu: input.kapiOlcu,
    cihazTip: input.cihazTip,
    cihazAdet: input.cihazAdet,
    cihaz,
  };
}
