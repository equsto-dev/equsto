const WA_GIRIS = "Merhaba equsto.com Adem ben, talebiniz için yazıyorum";
const CUTOFF_KEY = "equsto_wa_giris_baslangic";
const CLICKED_KEY = "equsto_wa_yazildi";

export type WaGirisState = {
  cutoff: number;
  clicked: Set<string>;
};

function readClicked(): Set<string> {
  try {
    const raw = localStorage.getItem(CLICKED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

/** İlk açılış anı. Bu andan önce gelen mesajlara giriş cümlesi yazılmaz. */
export function loadWaGirisState(): WaGirisState {
  let cutoff = Date.now();
  try {
    const saved = localStorage.getItem(CUTOFF_KEY);
    const parsed = saved ? Date.parse(saved) : NaN;
    if (Number.isFinite(parsed)) {
      cutoff = parsed;
    } else {
      const now = new Date().toISOString();
      localStorage.setItem(CUTOFF_KEY, now);
      cutoff = Date.parse(now);
    }
  } catch {
    /* tarayıcı saklayamazsa giriş cümlesi kapalı kalır */
  }
  return { cutoff, clicked: readClicked() };
}

export function markWaYazildi(id: string) {
  const clicked = readClicked();
  clicked.add(id);
  try {
    localStorage.setItem(CLICKED_KEY, JSON.stringify([...clicked]));
  } catch {
    /* yok */
  }
}

export function waGirisMetni(
  createdAt: string,
  id: string,
  state: WaGirisState | null,
): string | undefined {
  if (!state || !id) return undefined;
  const created = Date.parse(createdAt || "");
  if (!Number.isFinite(created) || created <= state.cutoff) return undefined;
  if (state.clicked.has(id)) return undefined;
  return WA_GIRIS;
}
