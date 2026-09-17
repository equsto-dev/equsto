import { db } from "@/lib/db";
import { pfosDisplayText } from "@/lib/pfos/format-display";
import {
  TEKLIF_V14_FORM_NO,
  TEKLIF_V14_SARTLAR,
} from "@/lib/pfos/teklif/constants";
import type {
  TeklifModelV14,
  TeklifV14Satir,
} from "@/lib/pfos/teklif/teklif-v14.types";
import { sanitizeTeklifV14ModelForExport } from "@/lib/pfos/teklif/sanitize-teklif-v14-export";
import { parseTeklifV14 } from "@/lib/teklif/parse-v14";

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function parseStoredV14(raw: unknown): TeklifModelV14 | null {
  const rec = asRecord(raw);
  if (!rec) return null;
  const fromWrap = parseTeklifV14(rec);
  if (fromWrap) return fromWrap;
  const nested = asRecord(rec.model) ?? asRecord(rec.teklif_v14);
  if (nested) {
    const wrapped = parseTeklifV14({ teklif_v14: nested });
    if (wrapped) return wrapped;
  }
  if (rec.version === "v14" && rec.ust && Array.isArray(rec.satirlar)) {
    return sanitizeTeklifV14ModelForExport(rec as unknown as TeklifModelV14);
  }
  return null;
}

function num(v: unknown, fallback: number | null = null): number | null {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function satirFromUnknown(item: unknown, index: number): TeklifV14Satir | null {
  const o = asRecord(item);
  if (!o) return null;
  const tanim = pfosDisplayText(o.tanim ?? o.isim ?? o.ad ?? o.name, "");
  const poz = pfosDisplayText(o.poz ?? o.referansPoz, String(index + 1));
  if (!tanim && !poz) return null;
  const bolumNo = pfosDisplayText(o.bolumNo, "01") || "01";
  const bolumBaslik =
    pfosDisplayText(o.bolumBaslik, "") || `${bolumNo}. LİSTE`;
  const adet = Math.max(1, Math.round(num(o.adet, 1) ?? 1));
  const birim = num(o.birimSatis ?? o.birim_satis);
  const toplam =
    num(o.toplamSatis ?? o.toplam_satis) ??
    (birim != null ? Math.round(birim * adet * 100) / 100 : null);
  const dovizRaw = String(o.doviz ?? "EUR").toUpperCase();
  const doviz: TeklifV14Satir["doviz"] =
    dovizRaw === "TRY" || dovizRaw === "USD" ? dovizRaw : "EUR";
  return {
    bolumNo,
    bolumBaslik,
    poz,
    stokNo: pfosDisplayText(o.stokNo ?? o.sku, ""),
    tanim: tanim || poz,
    marka: pfosDisplayText(o.marka, ""),
    olcu: pfosDisplayText(o.olcu, "—") || "—",
    elkKw: num(o.elkKw),
    gazKw: num(o.gazKw),
    adet,
    birimSatis: birim,
    toplamSatis: toplam,
    doviz,
    aciklama: pfosDisplayText(o.aciklama, "") || undefined,
    fotoUrl: pfosDisplayText(o.fotoUrl ?? o.gorselUrl, "") || undefined,
    fotoNot: pfosDisplayText(o.fotoNot, "") || undefined,
  };
}

function modelFromKalemler(
  kalemler: unknown,
  meta: {
    sayi: string;
    projeAdi: string;
    konsept: string;
    konseptLabel: string;
    m2: number;
    sehir: string;
    tarih: string;
    toplamEur: number | null;
  },
): TeklifModelV14 | null {
  const list = Array.isArray(kalemler) ? kalemler : [];
  const satirlar = list
    .map((item, i) => satirFromUnknown(item, i))
    .filter((s): s is TeklifV14Satir => s != null);
  if (!satirlar.length) return null;

  const genelFromRows = satirlar.reduce((s, r) => s + (r.toplamSatis ?? 0), 0);
  const genelToplam =
    genelFromRows > 0
      ? genelFromRows
      : meta.toplamEur != null && meta.toplamEur > 0
        ? meta.toplamEur
        : null;

  return sanitizeTeklifV14ModelForExport({
    version: "v14",
    formNo: TEKLIF_V14_FORM_NO,
    ust: {
      projeAdi: meta.projeAdi || meta.konseptLabel || meta.sayi,
      musteri: "",
      sayi: meta.sayi,
      tarih: meta.tarih,
      eurTry: null,
    },
    satirlar,
    ozet: {
      toplamElektrikKw: satirlar.reduce((s, r) => s + (r.elkKw ?? 0), 0),
      toplamGazKw: satirlar.reduce((s, r) => s + (r.gazKw ?? 0), 0),
      genelToplam,
      doviz: "EUR",
    },
    sartlar: [...TEKLIF_V14_SARTLAR],
    meta: {
      konsept: meta.konsept,
      konseptLabel: meta.konseptLabel || meta.projeAdi,
      sehir: meta.sehir,
      m2Toplam: meta.m2,
      bolumM2: {},
      teslimatAdresi: meta.sehir,
    },
  });
}

/** Kullanım satırındaki teklif no → v14 model. */
export async function resolveTeklifV14ForUsageSayi(
  teklifSayi: string,
): Promise<TeklifModelV14 | null> {
  const sayi = teklifSayi.trim();
  if (!sayi) return null;

  const [snapshot, usage] = await Promise.all([
    db.pfosTeklifSnapshot.findFirst({
      where: { projeRef: sayi },
      orderBy: { createdAt: "desc" },
    }),
    db.pfosUsageEvent.findFirst({
      where: { teklifSayi: sayi },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const fromSnapshotJson = parseStoredV14(snapshot?.requestJson);
  if (fromSnapshotJson) {
    return {
      ...fromSnapshotJson,
      ust: { ...fromSnapshotJson.ust, sayi: fromSnapshotJson.ust.sayi || sayi },
    };
  }

  try {
    const sent = await db.teklif.findFirst({
      where: {
        OR: [
          { payload: { path: ["teklif_sayi"], equals: sayi } },
          { payload: { path: ["teklif_v14", "ust", "sayi"], equals: sayi } },
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    const fromTeklif = parseStoredV14(sent?.payload);
    if (fromTeklif) return fromTeklif;
  } catch {
    /* JSON path yoksa yoksay */
  }

  const tarih = (usage?.createdAt ?? snapshot?.createdAt ?? new Date())
    .toISOString()
    .slice(0, 10);
  const konsept = pfosDisplayText(usage?.konsept ?? snapshot?.konsept, "");
  const konseptLabel = pfosDisplayText(
    usage?.konseptLabel,
    konsept === "yuklenen-liste" ? "Yüklenen ekipman listesi" : konsept,
  );

  return modelFromKalemler(snapshot?.kalemler, {
    sayi,
    projeAdi: konseptLabel,
    konsept,
    konseptLabel,
    m2: usage?.m2 ?? snapshot?.m2 ?? 0,
    sehir: usage?.sehir ?? "",
    tarih,
    toplamEur: usage?.toplamEur != null ? Number(usage.toplamEur) : null,
  });
}
