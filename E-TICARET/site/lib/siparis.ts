import type { OdemeDurum, Prisma, Siparis, SiparisDurum } from "@/lib/prisma";
import { db } from "@/lib/db";
import { notifyNewSiparis } from "@/lib/notify";

export type SiparisAdminRow = {
  id: string;
  siparis_no: string;
  musteri_ad: string;
  musteri_tel: string;
  musteri_mail: string;
  not_: string | null;
  kalemler: unknown[];
  toplam_kalem: number;
  toplam_adet: number;
  toplam_tl: number;
  durum: string;
  kaynak: string | null;
  kupon_kod: string | null;
  indirim_tl: number | null;
  musteri_id: string | null;
  odeme_durum: string;
  odeme_gateway: string | null;
  odeme_payment_id: string | null;
  odeme_paid_tl: number | null;
  created_at: string;
  updated_at: string;
};

const SIPARIS_DURUM = new Set<string>([
  "beklemede",
  "hazirlaniyor",
  "kargoda",
  "teslim",
  "iptal",
]);

export function isSiparisDurum(v: string): v is SiparisDurum {
  return SIPARIS_DURUM.has(v);
}

function dec(v: Prisma.Decimal | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

export function siparisToAdmin(s: Siparis): SiparisAdminRow {
  const kalemler = Array.isArray(s.kalemler) ? s.kalemler : [];
  return {
    id: s.id,
    siparis_no: s.siparisNo,
    musteri_ad: s.musteriAd,
    musteri_tel: s.musteriTel,
    musteri_mail: s.musteriMail,
    not_: s.not,
    kalemler,
    toplam_kalem: s.toplamKalem,
    toplam_adet: s.toplamAdet,
    toplam_tl: dec(s.toplamTl),
    durum: s.durum,
    kaynak: s.kaynak,
    kupon_kod: s.kuponKod,
    indirim_tl: s.indirimTl != null ? dec(s.indirimTl) : null,
    musteri_id: s.musteriId,
    odeme_durum: s.odemeDurum ?? "yok",
    odeme_gateway: s.odemeGateway ?? null,
    odeme_payment_id: s.odemePaymentId ?? null,
    odeme_paid_tl: s.odemePaidTl != null ? dec(s.odemePaidTl) : null,
    created_at: s.createdAt.toISOString(),
    updated_at: s.updatedAt.toISOString(),
  };
}

function genSiparisNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `EQ-${y}${m}${day}-${rnd}`;
}

export type SiparisCreateInput = {
  musteri_ad?: string;
  musteri?: { ad?: string; telefon?: string; eposta?: string };
  not?: string;
  kalemler?: unknown[];
  toplam_kalem?: number;
  toplam_adet?: number;
  toplam_tl?: number;
  kaynak?: string;
  kupon_kod?: string;
  indirim_tl?: number;
  durum?: string;
};

export function normalizeSiparisPayload(body: Record<string, unknown>): SiparisCreateInput {
  const musteri =
    body.musteri && typeof body.musteri === "object"
      ? (body.musteri as Record<string, unknown>)
      : {};
  const musteriAd =
    String(body.musteri_ad ?? musteri.ad ?? "").trim() ||
    String(musteri.yetkili ?? "").trim();
  return {
    musteri_ad: musteriAd,
    musteri: {
      ad: musteriAd,
      telefon: String(musteri.telefon ?? body.telefon ?? "").trim(),
      eposta: String(musteri.eposta ?? musteri.mail ?? body.eposta ?? "").trim(),
    },
    not: String(body.not ?? body.not_ ?? "").trim() || undefined,
    kalemler: Array.isArray(body.kalemler) ? body.kalemler : [],
    toplam_kalem: Number(body.toplam_kalem ?? 0) || 0,
    toplam_adet: Number(body.toplam_adet ?? 0) || 0,
    toplam_tl: Number(body.toplam_tl ?? 0) || 0,
    kaynak: String(body.kaynak ?? "web").trim() || "web",
    kupon_kod: String(body.kupon_kod ?? "").trim().toUpperCase() || undefined,
    indirim_tl: Number(body.indirim_tl ?? 0) || undefined,
    durum: String(body.durum ?? "beklemede").trim(),
  };
}

export function validateSiparisCreate(data: SiparisCreateInput): string | null {
  if (!data.musteri_ad && !data.musteri?.telefon) {
    return "Müşteri adı veya telefon gerekli";
  }
  return null;
}

async function linkMusteriId(tel: string, ad: string, mail: string): Promise<string | null> {
  const t = tel.trim();
  if (t) {
    const found = await db.musteri.findFirst({
      where: { tel: t },
      orderBy: { createdAt: "desc" },
    });
    if (found) return found.id;
  }
  if (!ad && !t && !mail) return null;
  const row = await db.musteri.create({
    data: {
      firma: "",
      yetkili: ad || "Müşteri",
      tel: t,
      mail: mail.trim(),
      tip: "musteri",
      kaynak: "siparis",
    },
  });
  return row.id;
}

export async function createSiparis(
  body: Record<string, unknown>,
  opts?: {
    notify?: boolean;
    odemeDurum?: OdemeDurum;
    odemeGateway?: string | null;
  },
) {
  const data = normalizeSiparisPayload(body);
  const err = validateSiparisCreate(data);
  if (err) throw new Error(err);

  const musteriAd = data.musteri_ad || data.musteri?.ad || "";
  const musteriTel = data.musteri?.telefon || "";
  const musteriMail = data.musteri?.eposta || "";
  const musteriId = await linkMusteriId(musteriTel, musteriAd, musteriMail);

  let siparisNo = genSiparisNo();
  for (let i = 0; i < 5; i++) {
    const exists = await db.siparis.findUnique({ where: { siparisNo } });
    if (!exists) break;
    siparisNo = genSiparisNo();
  }

  const durum: SiparisDurum = isSiparisDurum(data.durum || "")
    ? (data.durum as SiparisDurum)
    : "beklemede";

  const row = await db.siparis.create({
    data: {
      siparisNo,
      musteriAd,
      musteriTel,
      musteriMail,
      not: data.not ?? null,
      kalemler: (data.kalemler ?? []) as Prisma.InputJsonValue,
      toplamKalem: data.toplam_kalem ?? (data.kalemler?.length || 0),
      toplamAdet: data.toplam_adet ?? 0,
      toplamTl: data.toplam_tl ?? 0,
      durum,
      kaynak: data.kaynak ?? "web-sepet",
      kuponKod: data.kupon_kod ?? null,
      indirimTl: data.indirim_tl ?? null,
      musteriId,
      payload: body as Prisma.InputJsonValue,
      odemeDurum: opts?.odemeDurum ?? "yok",
      odemeGateway: opts?.odemeGateway ?? null,
    },
  });

  if (opts?.notify !== false) {
    void notifyNewSiparis(row).catch((e) => {
      console.error("[notify] siparis", e);
    });
  }

  return siparisToAdmin(row);
}
