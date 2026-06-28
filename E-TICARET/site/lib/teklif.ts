import type { Prisma, Teklif, TeklifDurum } from "@/lib/prisma";
import { db } from "@/lib/db";
import { notifyNewTeklif } from "@/lib/notify";
import { recordPfosUsageEvent } from "@/lib/pfos/usage-log";
import {
  sendTeklifCustomerEmail,
  type TeklifDeliveryResult,
} from "@/lib/teklif/customer-email";
import { sendTeklifCustomerWhatsApp } from "@/lib/teklif/customer-whatsapp";

export type TeklifAdminRow = {
  id: string;
  ref_no: string;
  musteri_ad: string;
  musteri_tel: string;
  musteri_mail: string;
  konsept: string;
  toplam_tl: number;
  gecerlilik_bitis: string | null;
  durum: string;
  not_: string | null;
  kalemler: unknown[] | null;
  kaynak: string | null;
  musteri_id: string | null;
  created_at: string;
  updated_at: string;
};

const TEKLIF_DURUM = new Set<string>([
  "taslak",
  "gonderildi",
  "onaylandi",
  "reddedildi",
  "revize",
  "iptal",
]);

export function isTeklifDurum(v: string): v is TeklifDurum {
  return TEKLIF_DURUM.has(v);
}

function dec(v: Prisma.Decimal | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

export function teklifToAdmin(t: Teklif): TeklifAdminRow {
  const kalemler = t.kalemler != null && Array.isArray(t.kalemler) ? t.kalemler : null;
  return {
    id: t.id,
    ref_no: t.refNo,
    musteri_ad: t.musteriAd,
    musteri_tel: t.musteriTel,
    musteri_mail: t.musteriMail,
    konsept: t.konsept,
    toplam_tl: dec(t.toplamTl),
    gecerlilik_bitis: t.gecerlilikBitis?.toISOString() ?? null,
    durum: t.durum,
    not_: t.not,
    kalemler,
    kaynak: t.kaynak,
    musteri_id: t.musteriId,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
  };
}

function genRefNo(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rnd = Math.floor(Math.random() * 9000 + 1000);
  return `TK-${y}${m}${day}-${rnd}`;
}

export type TeklifCreateInput = {
  musteri_ad?: string;
  musteri?: { ad?: string; telefon?: string; eposta?: string };
  konsept?: string;
  toplam_tl?: number;
  tahmini_toplam_tl?: number;
  durum?: string;
  not?: string;
  kaynak?: string;
  kalemler?: unknown[];
  gecerlilik_bitis?: string;
};

export function normalizeTeklifPayload(body: Record<string, unknown>): TeklifCreateInput {
  const musteri =
    body.musteri && typeof body.musteri === "object"
      ? (body.musteri as Record<string, unknown>)
      : {};
  const proje =
    body.proje && typeof body.proje === "object"
      ? (body.proje as Record<string, unknown>)
      : {};
  const konsept =
    String(body.konsept ?? proje.konsept ?? proje.dukkan ?? "").trim() ||
    String(proje.meslek ?? "").trim();
  const toplam =
    Number(body.toplam_tl ?? body.tahmini_toplam_tl ?? 0) ||
    Number(body.tahmini_toplam_tl ?? 0);

  const kalemler = Array.isArray(body.ekipman_satirlari)
    ? body.ekipman_satirlari
    : Array.isArray(body.kalemler)
      ? body.kalemler
      : undefined;

  return {
    musteri_ad: String(body.musteri_ad ?? musteri.ad ?? "").trim(),
    musteri: {
      ad: String(musteri.ad ?? body.musteri_ad ?? "").trim(),
      telefon: String(musteri.telefon ?? "").trim(),
      eposta: String(musteri.eposta ?? "").trim(),
    },
    konsept,
    toplam_tl: toplam,
    tahmini_toplam_tl: Number(body.tahmini_toplam_tl ?? toplam) || toplam,
    durum: String(body.durum ?? "gonderildi").trim(),
    not: String(body.not ?? body.not_ ?? "").trim() || undefined,
    kaynak: String(body.kaynak ?? "pfos").trim() || "pfos",
    kalemler,
    gecerlilik_bitis: String(body.gecerlilik_bitis ?? "").trim() || undefined,
  };
}

export function validateTeklifCreate(
  data: TeklifCreateInput,
  opts?: { requireEmail?: boolean; requirePhone?: boolean },
): string | null {
  if (!data.musteri_ad && !data.musteri?.ad) {
    return "Müşteri adı gerekli";
  }
  if (opts?.requireEmail && !data.musteri?.eposta?.trim()) {
    return "E-posta gerekli";
  }
  if (opts?.requirePhone && !data.musteri?.telefon?.trim()) {
    return "Telefon gerekli";
  }
  return null;
}

export type CreateTeklifResult = {
  teklif: TeklifAdminRow;
  customerEmail: TeklifDeliveryResult;
  customerWhatsApp: TeklifDeliveryResult;
};

async function linkMusteriId(tel: string, ad: string, mail: string): Promise<string | null> {
  const t = tel.trim();
  if (t) {
    const found = await db.musteri.findFirst({
      where: { tel: t },
      orderBy: { createdAt: "desc" },
    });
    if (found) return found.id;
  }
  if (!ad && !t) return null;
  const row = await db.musteri.create({
    data: {
      firma: "",
      yetkili: ad || "Müşteri",
      tel: t,
      mail: mail.trim(),
      tip: "lead",
      kaynak: "teklif",
    },
  });
  return row.id;
}

export async function createTeklif(
  body: Record<string, unknown>,
): Promise<CreateTeklifResult> {
  const data = normalizeTeklifPayload(body);
  const kaynak = String(body.kaynak ?? data.kaynak ?? "");
  const kanal = String(body.gonderim_kanali ?? body.kanal ?? "email")
    .trim()
    .toLowerCase();
  const err = validateTeklifCreate(data, {
    requireEmail: kaynak.includes("pfos") && kanal === "email",
    requirePhone: kaynak.includes("pfos") && kanal === "whatsapp",
  });
  if (err) throw new Error(err);

  const musteriAd = data.musteri_ad || data.musteri?.ad || "";
  const musteriTel = data.musteri?.telefon || "";
  const musteriMail = data.musteri?.eposta || "";
  const musteriId = await linkMusteriId(musteriTel, musteriAd, musteriMail);

  let refNo = genRefNo();
  for (let i = 0; i < 5; i++) {
    const exists = await db.teklif.findUnique({ where: { refNo } });
    if (!exists) break;
    refNo = genRefNo();
  }

  const durum: TeklifDurum = isTeklifDurum(data.durum || "")
    ? (data.durum as TeklifDurum)
    : "gonderildi";
  const gecerlilik = data.gecerlilik_bitis
    ? new Date(data.gecerlilik_bitis)
    : new Date(Date.now() + 30 * 86400000);

  const row = await db.teklif.create({
    data: {
      refNo,
      musteriAd,
      musteriTel,
      musteriMail,
      konsept: data.konsept || "",
      toplamTl: data.toplam_tl ?? data.tahmini_toplam_tl ?? 0,
      gecerlilikBitis: gecerlilik,
      durum,
      not: data.not ?? null,
      kalemler: data.kalemler ? (data.kalemler as Prisma.InputJsonValue) : undefined,
      kaynak: data.kaynak ?? "pfos",
      musteriId,
      payload: body as Prisma.InputJsonValue,
    },
  });

  const admin = teklifToAdmin(row);
  void notifyNewTeklif(admin).catch((e) =>
    console.error("[teklif] notify", e),
  );

  let customerEmail: TeklifDeliveryResult = { attempted: false, sent: false };
  let customerWhatsApp: TeklifDeliveryResult = { attempted: false, sent: false };

  if (kanal === "whatsapp") {
    customerWhatsApp = await sendTeklifCustomerWhatsApp(admin, body);
  } else {
    customerEmail = await sendTeklifCustomerEmail(admin, body);
  }

  if (String(data.kaynak ?? "").includes("pfos")) {
    const proje =
      body.proje && typeof body.proje === "object"
        ? (body.proje as Record<string, unknown>)
        : {};
    void recordPfosUsageEvent({
      event: "quote_sent",
      source:
        String(body.pfos_source ?? "") === "liste"
          ? "liste"
          : "wizard",
      konsept: String(body.konsept ?? proje.konsept ?? data.konsept ?? ""),
      konseptLabel: String(data.konsept ?? proje.konsept ?? ""),
      m2: proje.alan_m2 != null ? Number(proje.alan_m2) : null,
      teklifSayi: String(body.teklif_sayi ?? ""),
      teklifRef: refNo,
      kalemSayisi: Array.isArray(data.kalemler) ? data.kalemler.length : 0,
      toplamTry: Number(data.toplam_tl ?? data.tahmini_toplam_tl ?? 0) || null,
      sehir: String(proje.sehir ?? ""),
      memberLoggedIn: true,
      memberId: musteriId,
      gonderimKanal: kanal,
    }).catch((e) => console.error("[pfos-usage] quote_sent", e));
  }

  return { teklif: admin, customerEmail, customerWhatsApp };
}
