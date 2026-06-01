/**
 * Faz 1 — Tek PFOS motoru: profil + bolumM2 + zone-catalog + konsept template
 */

import type { ConceptTemplate } from "./engine-types";
import { calcAdet } from "./engine-types";
import { loadZoneCatalog, zoneM2FromShare } from "./zone-catalog-loader";
import { buildZoneCatalogKalemler } from "./build-zone-kalemler";
import { matchProductForMotor } from "./match-product";
import { resolveTipKodu } from "./tip-kodu";
import { zonesForKonsept, dagitM2Toplam } from "../wizard/profiles";
import type {
  PFOSRequest,
  PFOSResponse,
  PFOSKalemi,
  FiyatStratejisi,
} from "../schemas/pfos.schema";
import { KONSEPT_LABELS, type Konsept } from "../schemas/pfos.schema";
import { finalizeKalemlerForTeklif } from "../teklif/assign-poz";
import type { KategoriKodu } from "../schemas/pfos.schema";

const YIKAMA_TIP_KODU = new Set([
  "bulasik_giyotin_1000",
  "bulasik_makinesi_giyotin",
  "bardak_yikama",
  "cop_siyirma_tez",
  "bym_cikis_tez",
  "bulasik_cikis_tezgahi",
  "yag_tutucu",
  "on_yikama_dusu",
]);

function normalizeKategoriKodu(k: PFOSKalemi): PFOSKalemi {
  const tip = resolveTipKodu(k.urunTipi);
  const isim = String(k.isim || "").toLocaleLowerCase("tr");
  if (
    YIKAMA_TIP_KODU.has(tip) ||
    /bulaşık|bulasik|giyotin|bym |sıyırma|yıkama|yikama|yağ tutucu|yag tutucu/.test(isim)
  ) {
    if (k.kategoriKodu !== "H") return { ...k, kategoriKodu: "H" as KategoriKodu };
  }
  if (/^davlumbaz/.test(k.urunTipi.replace(/_/g, "-")) && k.kategoriKodu === "G") {
    return { ...k, kategoriKodu: "B" as KategoriKodu };
  }
  return k;
}

export function resolveBolumM2(
  konsept: Konsept,
  m2Toplam: number,
  input?: Record<string, number>,
): { bolumM2: Record<string, number>; zonesUsed: string[] } {
  const profileZones = zonesForKonsept(konsept);
  const zonesUsed: string[] = [];

  if (input && Object.keys(input).length > 0) {
    const bolumM2: Record<string, number> = {};
    for (const z of profileZones) {
      const v = Number(input[z]);
      if (Number.isFinite(v) && v > 0) {
        bolumM2[z] = Math.round(v);
        zonesUsed.push(z);
      }
    }
    if (zonesUsed.length) {
      return { bolumM2, zonesUsed };
    }
  }

  if (m2Toplam > 0 && profileZones.length) {
    const bolumM2 = dagitM2Toplam(profileZones, m2Toplam);
    return { bolumM2, zonesUsed: profileZones.filter((z) => bolumM2[z] > 0) };
  }

  return { bolumM2: {}, zonesUsed: [] };
}

async function buildTemplateKalemler(
  template: ConceptTemplate,
  m2: number,
  fiyatStratejisi: FiyatStratejisi,
  existingTips: Set<string>,
): Promise<PFOSKalemi[]> {
  const eligibleItems = template.items.filter((item) => {
    if (item.minM2 !== undefined && m2 < item.minM2) return false;
    if (item.maxM2 !== undefined && m2 >= item.maxM2) return false;
    return true;
  });

  const kalemler: PFOSKalemi[] = [];

  for (let i = 0; i < eligibleItems.length; i++) {
    const item = eligibleItems[i];
    const tipResolved = resolveTipKodu(item.urunTipi);
    const tipKey = item.referansPoz
      ? `${tipResolved}|${item.referansPoz}`
      : tipResolved;
    if (existingTips.has(tipKey)) continue;

    const adet = calcAdet(item.scale, m2, template.seatDensity);
    const urun = await matchProductForMotor(
      item.urunTipi,
      item.kategoriKodu,
      fiyatStratejisi,
      item.isim,
      item.notlar,
    );

    kalemler.push({
      poz: item.referansPoz ?? "",
      referansPoz: item.referansPoz,
      kategoriKodu: item.kategoriKodu,
      altKategori: item.altKategori,
      referansBolumSira: item.referansBolumSira,
      referansBolumKey: item.referansBolumKey,
      urunTipi: item.urunTipi,
      isim: item.isim,
      tip: item.tip,
      opsiyonelSebep: item.opsiyonelSebep,
      adet,
      elektrikGucuKwHint: item.elektrikGucuKwHint,
      gazGucuKwHint: item.gazGucuKwHint,
      notlar: item.notlar,
      urun,
      kaynak: "template",
      sablonSira: item.sablonSira ?? i,
    });
    existingTips.add(tipKey);
  }

  return kalemler;
}

function kalemOncelik(k: PFOSKalemi): number {
  let s = 0;
  if (k.tip === "zorunlu") s += 100;
  else if (k.tip === "tavsiye") s += 50;
  if (k.kaynak === "template") s += 20;
  return s;
}

/** Aynı tip_kodu veya aynı e-ticaret ürünü iki kez listelenmesin */
function dedupeKalemler(kalemler: PFOSKalemi[]): PFOSKalemi[] {
  const byTip = new Map<string, PFOSKalemi>();
  for (const k of kalemler) {
    const tip = resolveTipKodu(k.urunTipi);
    const tipKey = k.referansPoz ? `${tip}|${k.referansPoz}` : tip;
    const prev = byTip.get(tipKey);
    if (!prev || kalemOncelik(k) > kalemOncelik(prev)) {
      byTip.set(tipKey, k);
    }
  }

  const byProduct = new Map<string, PFOSKalemi>();
  for (const k of byTip.values()) {
    const pid = k.urun?.id;
    const suffix = k.referansPoz ?? String(k.sablonSira ?? "");
    const key = pid ? `${pid}|${suffix}` : `__${k.urunTipi}__${suffix}`;
    const prev = byProduct.get(key);
    if (!prev || kalemOncelik(k) > kalemOncelik(prev)) {
      byProduct.set(key, k);
    }
  }

  return [...byProduct.values()];
}

export async function calculateUnifiedQuote(
  req: PFOSRequest,
  template: ConceptTemplate,
): Promise<PFOSResponse> {
  const { konsept, sehir } = req;
  const fiyatStratejisi: FiyatStratejisi =
    req.fiyatStratejisi ?? "orta";
  const konseptKey = konsept as Konsept;

  const { bolumM2, zonesUsed } = resolveBolumM2(
    konseptKey,
    req.m2,
    req.bolumM2,
  );

  const hasUserBolum =
    !!req.bolumM2 && Object.keys(req.bolumM2).length > 0;
  const bundle = await loadZoneCatalog();
  const bolumM2Effective = { ...bolumM2 };
  if (!hasUserBolum) {
    for (const z of zonesForKonsept(konseptKey)) {
      if (!bolumM2Effective[z] && req.m2 > 0) {
        bolumM2Effective[z] = zoneM2FromShare(req.m2, z, bundle.categories);
      }
    }
  }

  const zoneKeys =
    zonesUsed.length > 0
      ? zonesUsed
      : zonesForKonsept(konseptKey).filter(
          (z) => (bolumM2Effective[z] ?? 0) > 0,
        );

  /** Zone katalog (ZRN) + konsept şablonu birleşimi */
  const zoneKalemler = await buildZoneCatalogKalemler({
    zoneKeys,
    bolumM2: bolumM2Effective,
    fiyatStratejisi,
  });

  const existingTips = new Set(
    zoneKalemler.map((k) => resolveTipKodu(k.urunTipi)),
  );
  const templateKalemler = await buildTemplateKalemler(
    template,
    req.m2,
    fiyatStratejisi,
    existingTips,
  );

  const kalemler = finalizeKalemlerForTeklif(
    dedupeKalemler([...zoneKalemler, ...templateKalemler]).map(normalizeKategoriKodu),
    template.teklifPozModu || template.teklifBolum
      ? {
          pozModu: template.teklifPozModu ?? "kategori",
          bolum: template.teklifBolum,
        }
      : undefined,
  );

  const zorunluKalemler = kalemler.filter((k) => k.tip === "zorunlu");
  const eslesmisZorunlu = zorunluKalemler.filter((k) => k.urun !== null);
  const eslesmeToplam = kalemler.filter((k) => k.urun !== null).length;

  const toplamElektrikKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.elektrikGucuKw ?? k.elektrikGucuKwHint ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const toplamGazKw = kalemler.reduce((sum, k) => {
    const kw = k.urun?.gazGucuKw ?? k.gazGucuKwHint ?? 0;
    return sum + kw * k.adet;
  }, 0);

  const eksikZorunlu = zorunluKalemler.filter((k) => k.urun === null);
  const toplamFiyatEslesen = kalemler.reduce((sum, k) => {
    if (!k.urun) return sum;
    return sum + k.urun.fiyat * k.adet;
  }, 0);
  const toplamFiyat =
    toplamFiyatEslesen > 0 ? Math.round(toplamFiyatEslesen) : null;

  const guvenSkoru =
    zorunluKalemler.length > 0
      ? Math.round(
          (eslesmisZorunlu.length / zorunluKalemler.length) * 0.8 * 100,
        ) / 100
      : 0.8;

  const uyarilar: string[] = [];
  if (zoneKalemler.length === 0 && zoneKeys.length > 0) {
    uyarilar.push(
      "Mutfak bölümü seçildi ancak zone kataloğundan kalem üretilemedi — yalnızca konsept şablonu uygulandı.",
    );
  } else if (zoneKalemler.length === 0) {
    uyarilar.push(
      "Mutfak bölümü seçilmedi veya katalog boş — yalnızca konsept şablonu uygulandı.",
    );
  }
  if (eksikZorunlu.length > 0) {
    uyarilar.push(
      `${eksikZorunlu.length} zorunlu kalem için ürün kataloğunda eşleşme bulunamadı: ` +
        eksikZorunlu.slice(0, 8).map((k) => k.isim).join(", ") +
        (eksikZorunlu.length > 8 ? "…" : ""),
    );
  }
  if (guvenSkoru < 0.5) {
    uyarilar.push(
      "Güven skoru düşük — ürün kataloğunun bu konsept için genişletilmesi önerilir.",
    );
  }
  uyarilar.push(
    "PFOS yapay zekadan yardım alır; hata yapabilir. Teklif öncesi uzmanla doğrulayınız.",
  );

  return {
    konsept,
    konseptLabel: KONSEPT_LABELS[konseptKey] ?? template.label,
    m2: req.m2,
    sehir,
    guvenSkoru,
    kalemler,
    bolumM2: bolumM2Effective,
    zonesUsed: zoneKeys,
    teklifLayout:
      template.teklifPozModu || template.teklifBolum
        ? {
            pozModu: template.teklifPozModu ?? "kategori",
            bolum: template.teklifBolum,
          }
        : undefined,
    ozet: {
      toplamElektrikKw: Math.round(toplamElektrikKw * 10) / 10,
      toplamGazKw: Math.round(toplamGazKw * 10) / 10,
      toplamFiyat: toplamFiyat != null ? Math.round(toplamFiyat) : null,
      doviz: "TRY",
      eslesmeSayisi: eslesmeToplam,
      toplamKalemSayisi: kalemler.length,
      zorunluKalemSayisi: zorunluKalemler.length,
      eslesmisZorunluSayisi: eslesmisZorunlu.length,
    },
    uyarilar,
  };
}
