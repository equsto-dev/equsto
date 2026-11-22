import { recomputeToplamTl } from "@/lib/odeme/tepeplatform-checkout";

/**
 * Web checkout (havale ve kart) için ortak sunucu sınırı.
 * Tutar kalemlerden yeniden yazılır. Sözleşme, fatura ve adres burada reddedilir.
 */
export function assertWebCheckout(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const kaynak = str(body.kaynak);
  if (!kaynak.startsWith("web-sepet")) return body;

  if (body.sozlesme_onay !== true) {
    throw new Error("Sipariş için şartlar ve koşullar onayı gerekli.");
  }

  const fatura = rec(body.fatura);
  const teslimat = rec(body.teslimat);
  const musteri = rec(body.musteri);
  const tip = str(fatura.tip) === "kurumsal" ? "kurumsal" : "bireysel";

  if (tip === "kurumsal") {
    if (!str(fatura.unvan)) throw new Error("Firma ünvanı gerekli.");
    if (!str(fatura.vergi_dairesi)) throw new Error("Vergi dairesi gerekli.");
    if (!/^\d{10}$/.test(digits(fatura.vkn))) {
      throw new Error("Vergi numarası 10 haneli olmalı.");
    }
  } else if (fatura.yabanci !== true && !/^\d{11}$/.test(digits(fatura.tckn))) {
    throw new Error("T.C. kimlik no 11 haneli olmalı.");
  }

  const email = str(fatura.eposta || musteri.eposta);
  if (email.indexOf("@") < 1) throw new Error("Geçerli bir e-posta girin.");
  if (digits(fatura.telefon || musteri.telefon).length < 10) {
    throw new Error("Telefon gerekli.");
  }

  const il = str(teslimat.il || fatura.il || body.sehir);
  const ilce = str(teslimat.ilce || fatura.ilce);
  const adres = str(teslimat.adres || body.adres || fatura.adres);
  if (!il || !ilce) throw new Error("İl ve ilçe seçin.");
  if (adres.length < 8) throw new Error("Açık adresi yazın.");

  const kalemler = Array.isArray(body.kalemler) ? body.kalemler : [];
  if (!kalemler.length) throw new Error("Sepet boş");

  const { finalTotal } = recomputeToplamTl(
    kalemler,
    Number(body.indirim_tl ?? 0) || 0,
  );
  const client = Number(body.toplam_tl ?? 0) || 0;
  if (client > 0 && Math.abs(client - finalTotal) > 1) {
    throw new Error("Tutar sunucuda yeniden hesaplandı. Sayfayı yenileyip tekrar deneyin.");
  }

  return {
    ...body,
    toplam_tl: finalTotal,
    tutar_kaynagi: "sunucu-kalem",
  };
}

function rec(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function str(v: unknown): string {
  return String(v ?? "").trim();
}

function digits(v: unknown): string {
  return str(v).replace(/\D/g, "");
}
