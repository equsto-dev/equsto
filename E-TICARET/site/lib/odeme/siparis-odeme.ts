import type { OdemeDurum, Prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { notifyNewSiparis } from "@/lib/notify";
import {
  createSiparis,
  siparisToAdmin,
  type SiparisAdminRow,
} from "@/lib/siparis";
import {
  buyerIdentityFallback,
  capturePostAuth,
  formatTlPrice,
  initializeCheckoutPreAuth,
  iyzicoConfigured,
  odemeCallbackUrl,
  retrieveCheckoutForm,
  splitName,
  voidCancel,
  type IyzicoResult,
  type OdemeAddress,
  type OdemeBasketItem,
  type OdemeBuyer,
} from "@/lib/odeme/iyzico";

export type OdemeInitResult = {
  siparis: SiparisAdminRow;
  paymentPageUrl: string;
  token: string;
};

function dec(v: Prisma.Decimal | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

function gsmToE164Like(tel: string): string {
  const d = String(tel || "").replace(/\D/g, "");
  if (!d) return "+905350000000";
  if (d.startsWith("90") && d.length >= 12) return `+${d}`;
  if (d.startsWith("0") && d.length >= 11) return `+9${d}`;
  if (d.length === 10) return `+90${d}`;
  return `+${d}`;
}

function buildBasketItems(
  kalemler: unknown[],
  paidPrice: string,
): OdemeBasketItem[] {
  const items: OdemeBasketItem[] = [];
  let sum = 0;
  for (let i = 0; i < kalemler.length; i++) {
    const row = (kalemler[i] || {}) as Record<string, unknown>;
    const adet = Math.max(1, Number(row.adet ?? 1) || 1);
    const birim = Number(row.birim_fiyat_tl ?? row.fiyat ?? 0) || 0;
    let line = Number(row.ara_toplam_tl);
    if (!Number.isFinite(line) || line <= 0) line = birim * adet;
    line = Math.round(line * 100) / 100;
    if (line <= 0) continue;
    sum += line;
    const name = String(row.ad || row.name || `Kalem ${i + 1}`).slice(0, 120);
    items.push({
      id: String(row.sku || row.id || `BI-${i + 1}`).slice(0, 64),
      name,
      category1: String(row.kategori || row.marka || "Mutfak").slice(0, 64) || "Mutfak",
      itemType: "PHYSICAL",
      price: formatTlPrice(line),
    });
  }
  if (!items.length) {
    items.push({
      id: "BI-1",
      name: "Equsto siparis",
      category1: "Mutfak",
      itemType: "PHYSICAL",
      price: paidPrice,
    });
    return items;
  }
  const paid = Number(paidPrice);
  const diff = Math.round((paid - sum) * 100) / 100;
  if (Math.abs(diff) >= 0.01) {
    const last = items[items.length - 1];
    last.price = formatTlPrice(Number(last.price) + diff);
  }
  return items;
}

function buildBuyer(input: {
  id: string;
  ad: string;
  mail: string;
  tel: string;
  ip: string;
  address: string;
  city: string;
}): OdemeBuyer {
  const { name, surname } = splitName(input.ad);
  return {
    id: input.id.slice(0, 64) || "guest",
    name,
    surname,
    identityNumber: buyerIdentityFallback(),
    email: input.mail || "siparis@equsto.com",
    gsmNumber: gsmToE164Like(input.tel),
    registrationAddress: input.address,
    city: input.city,
    country: "Turkey",
    ip: input.ip || "85.34.78.112",
  };
}

function buildAddress(contactName: string, address: string, city: string): OdemeAddress {
  return {
    contactName: contactName || "Musteri",
    city: city || "Istanbul",
    country: "Turkey",
    address: address || "Turkiye",
  };
}

function assertIyzicoOk(result: IyzicoResult, action: string): void {
  if (String(result.status || "").toLowerCase() === "success") return;
  const msg = result.errorMessage || result.errorCode || `${action} başarısız`;
  throw new Error(String(msg));
}

export async function initKartProvizyon(
  body: Record<string, unknown>,
  opts: { ip: string },
): Promise<OdemeInitResult> {
  if (!iyzicoConfigured()) {
    throw new Error(
      "Kart ödemesi henüz aktif değil. IYZICO_API_KEY / IYZICO_SECRET_KEY tanımlayın.",
    );
  }

  const row = await createSiparis(
    {
      ...body,
      kaynak: String(body.kaynak || "web-sepet-kart"),
      durum: "beklemede",
    },
    {
      notify: false,
      odemeDurum: "bekliyor",
      odemeGateway: "iyzico",
    },
  );

  const siparis = await db.siparis.findUniqueOrThrow({ where: { id: row.id } });
  const paid = formatTlPrice(dec(siparis.toplamTl));
  if (Number(paid) < 1) {
    await db.siparis.update({
      where: { id: siparis.id },
      data: { odemeDurum: "basarisiz" },
    });
    throw new Error("Ödeme tutarı geçersiz");
  }

  const kalemler = Array.isArray(siparis.kalemler) ? (siparis.kalemler as unknown[]) : [];
  const basketItems = buildBasketItems(kalemler, paid);
  const addr = String(
    (body.adres as string) ||
      (body.teslimat_adres as string) ||
      "Equsto online siparis",
  ).slice(0, 200);
  const city = String(body.sehir || "Istanbul").slice(0, 64);
  const buyer = buildBuyer({
    id: siparis.musteriId || siparis.id,
    ad: siparis.musteriAd,
    mail: siparis.musteriMail,
    tel: siparis.musteriTel,
    ip: opts.ip,
    address: addr,
    city,
  });
  const shipping = buildAddress(siparis.musteriAd, addr, city);

  let init: IyzicoResult;
  try {
    init = await initializeCheckoutPreAuth({
      conversationId: siparis.siparisNo,
      basketId: siparis.siparisNo,
      price: paid,
      paidPrice: paid,
      callbackUrl: odemeCallbackUrl(),
      buyer,
      shippingAddress: shipping,
      billingAddress: shipping,
      basketItems,
    });
    assertIyzicoOk(init, "Provizyon başlatma");
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

  const paymentPageUrl = String(init.paymentPageUrl || "").trim();
  const token = String(init.token || "").trim();
  if (!paymentPageUrl || !token) {
    await db.siparis.update({
      where: { id: siparis.id },
      data: {
        odemeDurum: "basarisiz",
        odemePayload: { init } as Prisma.InputJsonValue,
      },
    });
    throw new Error("iyzico ödeme sayfası alınamadı");
  }

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemeToken: token,
      odemeConversationId: siparis.siparisNo,
      odemePaidTl: siparis.toplamTl,
      odemePayload: { init } as Prisma.InputJsonValue,
    },
  });

  return {
    siparis: siparisToAdmin(updated),
    paymentPageUrl,
    token,
  };
}

export async function completeCheckoutCallback(token: string): Promise<{
  ok: boolean;
  siparisNo: string;
  odemeDurum: OdemeDurum;
  message: string;
}> {
  const result = await retrieveCheckoutForm(token);
  const statusOk = String(result.status || "").toLowerCase() === "success";
  const paymentStatus = String(result.paymentStatus || "").toLowerCase();
  const paymentId = String(result.paymentId || "").trim();
  const conversationId = String(result.conversationId || "").trim();

  let siparis =
    (conversationId
      ? await db.siparis.findFirst({ where: { siparisNo: conversationId } })
      : null) ||
    (await db.siparis.findFirst({ where: { odemeToken: token } }));

  if (!siparis) {
    return {
      ok: false,
      siparisNo: conversationId || "",
      odemeDurum: "basarisiz",
      message: "Sipariş bulunamadı",
    };
  }

  // Zaten işlenmişse tekrar bildirimsiz dön
  if (siparis.odemeDurum === "provizyon" || siparis.odemeDurum === "tahsil") {
    return {
      ok: true,
      siparisNo: siparis.siparisNo,
      odemeDurum: siparis.odemeDurum,
      message: "Provizyon kayıtlı",
    };
  }

  const failed =
    !statusOk ||
    paymentStatus === "failure" ||
    paymentStatus === "failed" ||
    !paymentId;

  if (failed) {
    const updated = await db.siparis.update({
      where: { id: siparis.id },
      data: {
        odemeDurum: "basarisiz",
        odemePaymentId: paymentId || siparis.odemePaymentId,
        odemePayload: {
          ...(typeof siparis.odemePayload === "object" && siparis.odemePayload
            ? (siparis.odemePayload as object)
            : {}),
          callback: result,
        } as Prisma.InputJsonValue,
      },
    });
    return {
      ok: false,
      siparisNo: updated.siparisNo,
      odemeDurum: "basarisiz",
      message: String(result.errorMessage || "Ödeme / provizyon başarısız"),
    };
  }

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemeDurum: "provizyon",
      odemePaymentId: paymentId,
      odemeConversationId: conversationId || siparis.odemeConversationId,
      odemeToken: token,
      odemePaidTl: result.paidPrice != null ? Number(result.paidPrice) : siparis.toplamTl,
      odemePayload: {
        ...(typeof siparis.odemePayload === "object" && siparis.odemePayload
          ? (siparis.odemePayload as object)
          : {}),
        callback: result,
      } as Prisma.InputJsonValue,
    },
  });

  void notifyNewSiparis(updated).catch((e) => {
    console.error("[notify] siparis provizyon", e);
  });

  return {
    ok: true,
    siparisNo: updated.siparisNo,
    odemeDurum: "provizyon",
    message: "Kart provizyonu alındı",
  };
}

export async function captureSiparisOdeme(
  siparisId: string,
  opts: { ip: string },
): Promise<SiparisAdminRow> {
  const siparis = await db.siparis.findUnique({ where: { id: siparisId } });
  if (!siparis) throw new Error("Sipariş bulunamadı");
  if (siparis.odemeDurum === "tahsil") return siparisToAdmin(siparis);
  if (siparis.odemeDurum !== "provizyon") {
    throw new Error("Yalnızca provizyonlu siparişlerde tahsilat yapılabilir");
  }
  const paymentId = String(siparis.odemePaymentId || "").trim();
  if (!paymentId) throw new Error("paymentId yok — provizyon tamamlanmamış olabilir");

  const paidPrice = formatTlPrice(dec(siparis.odemePaidTl ?? siparis.toplamTl));
  const result = await capturePostAuth({
    paymentId,
    ip: opts.ip,
    paidPrice,
    conversationId: siparis.siparisNo,
  });
  assertIyzicoOk(result, "Tahsilat (postAuth)");

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemeDurum: "tahsil",
      durum: siparis.durum === "beklemede" ? "hazirlaniyor" : siparis.durum,
      odemePayload: {
        ...(typeof siparis.odemePayload === "object" && siparis.odemePayload
          ? (siparis.odemePayload as object)
          : {}),
        capture: result,
      } as Prisma.InputJsonValue,
    },
  });
  return siparisToAdmin(updated);
}

export async function voidSiparisOdeme(
  siparisId: string,
  opts: { ip: string; setIptal?: boolean },
): Promise<SiparisAdminRow> {
  const siparis = await db.siparis.findUnique({ where: { id: siparisId } });
  if (!siparis) throw new Error("Sipariş bulunamadı");
  if (siparis.odemeDurum === "iptal") return siparisToAdmin(siparis);
  if (siparis.odemeDurum === "tahsil") {
    throw new Error("Tahsil edilmiş ödemeyi void edemezsiniz; iade gerekir");
  }
  if (siparis.odemeDurum !== "provizyon") {
    throw new Error("Yalnızca provizyonlu siparişlerde iptal (void) yapılabilir");
  }
  const paymentId = String(siparis.odemePaymentId || "").trim();
  if (!paymentId) throw new Error("paymentId yok");

  const result = await voidCancel({
    paymentId,
    ip: opts.ip,
    conversationId: siparis.siparisNo,
  });
  assertIyzicoOk(result, "Provizyon iptali");

  const updated = await db.siparis.update({
    where: { id: siparis.id },
    data: {
      odemeDurum: "iptal",
      durum: opts.setIptal === false ? siparis.durum : "iptal",
      odemePayload: {
        ...(typeof siparis.odemePayload === "object" && siparis.odemePayload
          ? (siparis.odemePayload as object)
          : {}),
        void: result,
      } as Prisma.InputJsonValue,
    },
  });
  return siparisToAdmin(updated);
}

export function clientIpFromHeaders(h: Headers): string {
  const xf = h.get("x-forwarded-for") || "";
  const first = xf.split(",")[0]?.trim();
  if (first) return first;
  const real = h.get("x-real-ip")?.trim();
  if (real) return real;
  return "85.34.78.112";
}
