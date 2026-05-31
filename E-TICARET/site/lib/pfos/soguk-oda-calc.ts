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
