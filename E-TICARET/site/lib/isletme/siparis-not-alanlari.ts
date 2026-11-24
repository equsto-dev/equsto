import { mapsHref } from "@/lib/isletme/iletisim-link";
import type { ParsedSiparisNot } from "@/lib/isletme/parse-siparis-not";

export type IslemTon = "wa" | "call" | "mail" | "map" | "copy";

export type IslemAksiyon = {
  label: string;
  href?: string;
  copyText?: string;
  tone: IslemTon;
};

export type IslemBilgi = {
  label: string;
  value: string;
  copyText?: string;
};

export type IslemKarti = {
  title: string;
  headline?: string;
  body?: string;
  /** Mesaj balonu. Adres ve fatura düz metin kalır. */
  bubble?: boolean;
  facts?: IslemBilgi[];
  actions: IslemAksiyon[];
};

function adresKart(title: string, adres: string, headline?: string | null): IslemKarti {
  return {
    title,
    headline: headline || undefined,
    body: adres,
    actions: [
      { label: "Adresi kopyala", copyText: adres, tone: "copy" },
      { label: "Haritada aç", href: mapsHref(adres), tone: "map" },
    ],
  };
}

/** Teslimat, fatura ve serbest notu işlem kartlarına çevirir. */
export function siparisNotBolumleri(
  parsed: ParsedSiparisNot,
  opts?: { mesajBaslik?: string; replyHref?: string },
): IslemKarti[] {
  const sections: IslemKarti[] = [];

  if (parsed.teslimat) {
    sections.push(adresKart("Teslimat", parsed.teslimat, parsed.adresBaslik));
  } else if (parsed.adresBaslik) {
    sections.push({
      title: "Teslimat",
      headline: parsed.adresBaslik,
      actions: [{ label: "Başlığı kopyala", copyText: parsed.adresBaslik, tone: "copy" }],
    });
  }

  if (parsed.fatura) {
    const f = parsed.fatura;
    const facts: IslemBilgi[] = [];
    if (f.tip === "kurumsal") {
      if (f.unvan) facts.push({ label: "Ünvan", value: f.unvan, copyText: f.unvan });
      if (f.vergiDairesi) facts.push({ label: "Vergi dairesi", value: f.vergiDairesi, copyText: f.vergiDairesi });
      if (f.vkn) facts.push({ label: "Vergi no", value: f.vkn, copyText: f.vkn });
    } else {
      if (f.ad) facts.push({ label: "Ad soyad", value: f.ad, copyText: f.ad });
      if (f.tckn) facts.push({ label: "TCKN", value: f.tckn, copyText: f.tckn });
    }
    const actions: IslemAksiyon[] = [];
    if (f.tckn) actions.push({ label: "TCKN kopyala", copyText: f.tckn, tone: "copy" });
    if (f.vkn) actions.push({ label: "Vergi no kopyala", copyText: f.vkn, tone: "copy" });
    if (f.adres) {
      actions.push({ label: "Fatura adresini kopyala", copyText: f.adres, tone: "copy" });
      actions.push({ label: "Haritada aç", href: mapsHref(f.adres), tone: "map" });
    }
    sections.push({
      title: f.tip === "kurumsal" ? "Fatura · Kurumsal" : "Fatura · Bireysel",
      body: f.adres || undefined,
      facts,
      actions,
    });
  }

  if (parsed.mesaj) {
    const title = opts?.mesajBaslik || (parsed.structured ? "Ek not" : "Not");
    const actions: IslemAksiyon[] = [
      { label: "Metni kopyala", copyText: parsed.mesaj, tone: "copy" },
    ];
    if (opts?.replyHref) {
      actions.unshift({ label: "WhatsApp'ta yanıtla", href: opts.replyHref, tone: "wa" });
    }
    sections.push({
      title,
      body: parsed.mesaj,
      bubble: true,
      actions,
    });
  }

  return sections;
}
