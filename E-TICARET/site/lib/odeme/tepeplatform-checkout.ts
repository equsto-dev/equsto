import type { Prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { notifyNewSiparis } from "@/lib/notify";
import {
  createSiparis,
  siparisToAdmin,
  type SiparisAdminRow,
} from "@/lib/siparis";
import {
  gsmToE164,
  odemeBasariliUrl,
  odemeHataUrl,
  tepeplatformConfigured,
  tepeplatformInitPayment,
  tepeplatformPartnerSlug,
  tlToMinor,
} from "@/lib/odeme/tepeplatform";

export type CheckoutInitResult = {
  siparis: SiparisAdminRow;
  checkoutUrl: string;
  sessionId: string;
  orderRef: string;
};

function dec(v: Prisma.Decimal | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

/** İstemci tutarına güvenme — kalemlerden yeniden hesapla */
export function recomputeToplamTl(
  kalemler: unknown[],
  indirimTl = 0,
): { linesTotal: number; finalTotal: number; lineMinors: Array<{
  sku: string;
  name: string;
  qty: number;
  grossMinor: number;
}> } {
  let linesTotal = 0;
  const lineMinors: Array<{
    sku: string;
    name: string;
    qty: number;
    grossMinor: number;
  }> = [];

  for (let i = 0; i < kalemler.length; i++) {
    const row = (kalemler[i] || {}) as Record<string, unknown>;
    const adet = Math.max(1, Number(row.adet ?? 1) || 1);
    const birim = Number(row.birim_fiyat_tl ?? row.fiyat ?? 0) || 0;
    let line = Number(row.ara_toplam_tl);
    if (!Number.isFinite(line) || line <= 0) line = birim * adet;
    line = Math.round(line * 100) / 100;
    if (line <= 0) continue;
    linesTotal += line;
    lineMinors.push({
      sku: String(row.sku || row.urun_kodu || row.id || `L${i + 1}`).slice(0, 64),
      name: String(row.ad || row.name || `Kalem ${i + 1}`).slice(0, 120),
      qty: adet,
      grossMinor: tlToMinor(line),
    });
  }

  linesTotal = Math.round(linesTotal * 100) / 100;
  const ind = Math.max(0, Number(indirimTl) || 0);
  const finalTotal = Math.max(0, Math.round((linesTotal - ind) * 100) / 100);
  return { linesTotal, finalTotal, lineMinors };
}

export async function initTepeplatformCheckout(
  body: Record<string, unknown>,
): Promise<CheckoutInitResult> {
  if (!tepeplatformConfigured()) {
    throw new Error(
      "Kart ödemesi henüz aktif değil. TEPEPLATFORM_* ortam değişkenlerini tanımlayın.",
    );
  }

  const kalemler = Array.isArray(body.kalemler) ? body.kalemler : [];
  if (!kalemler.length) throw new Error("Sepet boş");

  const clientIndirim = Number(body.indirim_tl ?? 0) || 0;
  const { finalTotal, lineMinors } = recomputeToplamTl(kalemler, clientIndirim);
  if (finalTotal < 1) throw new Error("Ödeme tutarı geçersiz (min 1 TL)");

  const amountMinor = tlToMinor(finalTotal);
  if (amountMinor < 100) throw new Error("Ödeme tutarı geçersiz (min 1 TL)");

  // Sunucu tutarını kullan — istemci toplam_tl yok sayılır
  const orderBody: Record<string, unknown> = {
    ...body,
    toplam_tl: finalTotal,
    kaynak: String(body.kaynak || "web-sepet-kart"),
    durum: "beklemede",
  };

  const row = await createSiparis(orderBody, {
    notify: false,
    odemeDurum: "bekliyor",
    odemeGateway: "tepeplatform",
  });

  const siparis = await db.siparis.findUniqueOrThrow({ where: { id: row.id } });
  const orderRef = siparis.siparisNo;
  const musteri =
    body.musteri && typeof body.musteri === "object"
      ? (body.musteri as Record<string, unknown>)
      : {};
  const name = String(siparis.musteriAd || musteri.ad || "").trim() || "Musteri";
  const email =
    String(siparis.musteriMail || musteri.eposta || "").trim() ||
    "siparis@equsto.com";
  const phone = gsmToE164(
    String(siparis.musteriTel || musteri.telefon || "").trim(),
  );
  const address = String(
    body.adres || body.teslimat_adres || musteri.adres || "Turkiye",
  ).slice(0, 400);

  const vatRateBps = 2000;
  const vatMinor = Math.round((amountMinor * vatRateBps) / (10000 + vatRateBps));

  let init;
  try {
    init = await tepeplatformInitPayment({
      orderRef,
      amountMinor,
      currency: "TRY",
      description: `Equsto Siparis ${orderRef}`,
      customer: { name, email, phone, address },
      redirectSuccess: odemeBasariliUrl(orderRef),
      redirectFailure: odemeHataUrl(orderRef),
      expiresInSec: 1800,
      metadata: {
        brandSlug: tepeplatformPartnerSlug(),
        vatRateBps,
        vatMinor,
        extra: {
          orderId: siparis.id,
          lines: lineMinors,
        },
      },
    });
  } catch (e) {
    await db.siparis.update({
      where: { id: siparis.id },
      data: {
        odemeDurum: "basarisiz",
        odemePayload: {
          initError: e instanceof Error ? e.message : String(e),
        } as Prisma.InputJsonValue,
      },
    });
    throw e;
  }

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemePaymentId: init.sessionId || null,
      odemeConversationId: orderRef,
      odemePaidTl: finalTotal,
      odemePayload: {
        init,
        amountMinor,
      } as Prisma.InputJsonValue,
    },
  });

  return {
    siparis: siparisToAdmin(updated),
    checkoutUrl: String(init.checkoutUrl),
    sessionId: String(init.sessionId),
    orderRef,
  };
}

type WebhookBody = {
  event?: string;
  sessionId?: string;
  orderRef?: string;
  status?: string;
  amountMinor?: number;
  currency?: string;
  iyzicoPaymentId?: string;
  cardLast4?: string;
  completedAt?: string;
  [key: string]: unknown;
};

function eventKey(sessionId: string, event: string): string {
  return `${sessionId}::${event}`;
}

export async function applyTepeplatformWebhook(
  event: string,
  body: WebhookBody,
): Promise<{ ok: boolean; duplicate?: boolean; siparisNo?: string }> {
  const sessionId = String(body.sessionId || "").trim();
  const orderRef = String(body.orderRef || "").trim();

  let siparis =
    (orderRef
      ? await db.siparis.findFirst({ where: { siparisNo: orderRef } })
      : null) ||
    (sessionId
      ? await db.siparis.findFirst({ where: { odemePaymentId: sessionId } })
      : null);

  if (!siparis) {
    return { ok: false };
  }

  const prev =
    typeof siparis.odemePayload === "object" && siparis.odemePayload
      ? (siparis.odemePayload as Record<string, unknown>)
      : {};
  const seen = Array.isArray(prev.webhookEvents)
    ? (prev.webhookEvents as string[])
    : [];
  const key = eventKey(sessionId || siparis.odemePaymentId || "", event);
  if (key && seen.includes(key)) {
    return { ok: true, duplicate: true, siparisNo: siparis.siparisNo };
  }

  let odemeDurum = siparis.odemeDurum;
  let durum = siparis.durum;
  let shouldNotify = false;

  switch (event) {
    case "payment.success":
      odemeDurum = "tahsil";
      if (durum === "beklemede") durum = "hazirlaniyor";
      shouldNotify = siparis.odemeDurum !== "tahsil";
      break;
    case "payment.failed":
      odemeDurum = "basarisiz";
      break;
    case "payment.cancelled":
      odemeDurum = "iptal";
      durum = "iptal";
      break;
    case "payment.expired":
      odemeDurum = "basarisiz";
      break;
    case "payment.refunded":
      odemeDurum = "iade";
      break;
    default:
      break;
  }

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemeDurum,
      durum,
      odemePaymentId: sessionId || siparis.odemePaymentId,
      odemePaidTl:
        body.amountMinor != null
          ? Math.round(Number(body.amountMinor)) / 100
          : siparis.odemePaidTl ?? siparis.toplamTl,
      odemePayload: {
        ...prev,
        webhookEvents: key ? [...seen, key] : seen,
        lastWebhook: body,
        iyzicoPaymentId: body.iyzicoPaymentId,
        cardLast4: body.cardLast4,
      } as Prisma.InputJsonValue,
    },
  });

  if (shouldNotify) {
    void notifyNewSiparis(updated).catch((e) => {
      console.error("[notify] siparis tepeplatform paid", e);
    });
  }

  return { ok: true, siparisNo: updated.siparisNo };
}

export function clientIpFromHeaders(h: Headers): string {
  const xf = h.get("x-forwarded-for") || "";
  const first = xf.split(",")[0]?.trim();
  if (first) return first;
  return h.get("x-real-ip")?.trim() || "127.0.0.1";
}
