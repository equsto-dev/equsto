import type { Musteri } from "@prisma/client";

export type MusteriAdminRow = {
  _id: string;
  id: string;
  firma: string;
  yetkili: string;
  tel: string;
  mail: string;
  sehir: string;
  tip: string;
  not: string;
  not_: string;
  kaynak: string | null;
  sayfa: string | null;
  mesaj: string | null;
  created_at: string;
};

export function musteriToAdmin(m: Musteri): MusteriAdminRow {
  const not = m.not ?? "";
  return {
    _id: m.id,
    id: m.id,
    firma: m.firma,
    yetkili: m.yetkili,
    tel: m.tel,
    mail: m.mail,
    sehir: m.sehir,
    tip: m.tip,
    not,
    not_: not,
    kaynak: m.kaynak,
    sayfa: m.sayfa,
    mesaj: m.mesaj,
    created_at: m.createdAt.toISOString(),
  };
}

/** contact.js / WhatsApp modal POST gövdesi */
export function normalizeMusteriPayload(body: Record<string, unknown>) {
  const mesaj = String(body.mesaj ?? "").trim();
  const kaynak = String(body.kaynak ?? "web").trim();
  const sayfa = String(body.sayfa ?? "").trim();
  const tel = String(body.telefon ?? body.tel ?? "").trim();
  const yetkili = String(body.ad ?? body.yetkili ?? "").trim() || "Ziyaretçi";
  const firma = String(body.firma ?? "").trim();
  const mail = String(body.eposta ?? body.mail ?? "").trim();
  const sehir = String(body.sehir ?? "").trim();
  const tip = String(body.tip ?? "lead").trim() || "lead";
  const notFromForm = String(body.not ?? body.not_ ?? "").trim();

  const notLines = [
    mesaj || notFromForm,
    kaynak ? `kaynak: ${kaynak}` : "",
    sayfa ? `sayfa: ${sayfa}` : "",
  ].filter(Boolean);

  return {
    firma,
    yetkili,
    tel,
    mail,
    sehir,
    tip,
    not: notLines.join("\n") || null,
    kaynak: kaynak || null,
    sayfa: sayfa || null,
    mesaj: mesaj || notFromForm || null,
  };
}

export function validatePublicMusteriPayload(data: ReturnType<typeof normalizeMusteriPayload>) {
  if (!data.mesaj && !data.tel && !data.yetkili) {
    return "Mesaj veya telefon gerekli";
  }
  return null;
}

export function normalizeAdminMusteriPayload(body: Record<string, unknown>) {
  return {
    firma: String(body.firma ?? "").trim(),
    yetkili: String(body.yetkili ?? "").trim(),
    tel: String(body.tel ?? "").trim(),
    mail: String(body.mail ?? "").trim(),
    sehir: String(body.sehir ?? "").trim(),
    tip: String(body.tip ?? "lead").trim() || "lead",
    not: String(body.not ?? body.not_ ?? "").trim() || null,
  };
}
