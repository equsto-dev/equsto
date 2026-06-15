import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPasifPfosEkipman,
  parseBrulorToplamKwFromText,
  parseKwFromText,
  resolveKwFromSources,
  resolveTeklifKw,
} from "../lib/catalog/kw-resolve.ts";

describe("kw-resolve", () => {
  it("parses Güç from specs", () => {
    const r = parseKwFromText("Teknik Özellikler\nGüç: 0.21 kW\nKapasite: 700 lt");
    assert.equal(r.elektrikGucuKw, 0.21);
  });

  it("parses guc_w as kW", () => {
    const r = resolveKwFromSources({
      olculer: { guc_w: 3000 },
      aciklama: null,
    });
    assert.equal(r.elektrikGucuKw, 3);
  });

  it("clears passive duvar rafi", () => {
    assert.equal(
      resolveTeklifKw({
        isim: "DUVAR RAFI",
        urun: { sku: "7897.14030.30", elektrikGucuKw: 3, gazGucuKw: 70 },
      }).elektrikGucuKw,
      null,
    );
    assert.equal(
      resolveTeklifKw({
        isim: "DUVAR RAFI",
        urun: { sku: "7897.14030.30", elektrikGucuKw: 3, gazGucuKw: 70 },
      }).gazGucuKw,
      null,
    );
  });

  it("keeps rational firin kW", () => {
    const r = resolveTeklifKw({
      isim: "YEMEKÇİLİK FIRINI rational",
      urun: { sku: "9890.X1011.E1", elektrikGucuKw: 9.3, ad: "UNOX" },
    });
    assert.equal(r.elektrikGucuKw, 9.3);
  });

  it("marks istif raf passive", () => {
    assert.ok(
      isPasifPfosEkipman({ isim: "İSTİF RAFI 4 KATLI", sku: "53-X-152-X-183" }),
    );
  });

  it("parses 230 watt and 1.0 HP bar blender", () => {
    const r = parseKwFromText("230 watt *1.0 HP *17 sn");
    assert.equal(r.elektrikGucuKw, 0.746);
  });

  it("parses Güç Tüketimi without Maks prefix", () => {
    const r = parseKwFromText("Güç Tüketimi: 3,15 kW");
    assert.equal(r.elektrikGucuKw, 3.15);
  });

  it("parses Maks. Güç Tüketimi for giyotin bulaşık makinesi", () => {
    const r = parseKwFromText(
      "Teknik Özellikler\nMaks. Güç Tüketimi(kW): 11,3\nElektrik Girişi: 380-400V 3N 50Hz",
    );
    assert.equal(r.elektrikGucuKw, 11.3);
  });

  it("parses Max. Elektrik Gücü sum expression", () => {
    const r = parseKwFromText("Max. Elektrik Gücü: 25+1 kW");
    assert.equal(r.elektrikGucuKw, 26);
  });

  it("parses 1100 W trifaze as 1.1 kW", () => {
    const r = parseKwFromText(
      "* 1100 W trifaze Asenkron sanayi motoru, 2 hız 375-750 rpm",
    );
    assert.equal(r.elektrikGucuKw, 1.1);
  });

  it("CL50 sebze doğrama — specs metninden elk kW", () => {
    const r = resolveKwFromSources({
      aciklama:
        "ROBOT COUPE SEBZE DOGRAMA MAKINASI CL50 BICAKSIZ\n* 1100 W trifaze Asenkron sanayi motoru",
      teknik_ozellikler: ["Elektrik Gücü: 0,5500", "Elektrik Volt: 230 V NPE"],
    });
    assert.equal(r.elektrikGucuKw, 1.1);
  });

  it("parses Elektrik Gücü kW line", () => {
    const r = parseKwFromText("Elektrik Gücü: 2,15 kW");
    assert.equal(r.elektrikGucuKw, 2.15);
  });

  it("gazli ozti ocak — Güç yalnızca gaz sütunu", () => {
    const specs =
      "700 SERİ SET ÜSTÜ DÖRTLÜ OCAK GAZLI 80*70*30\nGüç: 6 kW";
    const r = parseKwFromText(specs);
    assert.equal(r.elektrikGucuKw, null);
    assert.equal(r.gazGucuKw, 6);
  });

  it("gazli ozti izgara — Güç yalnızca gaz sütunu", () => {
    const specs =
      "700 SERİ SET ÜSTÜ GRİLL PLATE DÜZ GAZLI 80*70*30\nGüç: 14 kW";
    const r = parseKwFromText(specs);
    assert.equal(r.elektrikGucuKw, null);
    assert.equal(r.gazGucuKw, 14);
  });

  it("resolveTeklifKw moves misassigned gaz power off elk column", () => {
    const r = resolveTeklifKw({
      isim: "DÖKÜM IZGARA, GAZLI, SETÜSTÜ",
      urun: {
        sku: "7864.N1.80703.72",
        ad: "700 SERİ SET ÜSTÜ DOKUM IZGARA GAZLI",
        elektrikGucuKw: 14,
        gazGucuKw: 14,
      },
    });
    assert.equal(r.elektrikGucuKw, null);
    assert.equal(r.gazGucuKw, 14);
  });

  it("gazli konveksiyon firin — elk fan + gaz brulor ayri", () => {
    const r = resolveKwFromSources({
      urunAd: "Crosswise Konveksiyon Fırın Gazlı Konveksiyon Fırın, 6 GN1/1",
      aciklama: "Konveksiyon Fırın 6 GN 1/1, gazlı",
      teknik_ozellikler: [
        "Elektrik gücü max: 0.35 kW",
        "Gaz Gücü: 8.35 kW",
      ],
    });
    assert.equal(r.elektrikGucuKw, 0.35);
    assert.equal(r.gazGucuKw, 8.35);
  });

  it("parses brulor toplam from 4x6 kW", () => {
    assert.equal(parseBrulorToplamKwFromText("DÖRTLÜ OCAK (L)-4x6 kW"), 24);
    assert.equal(parseBrulorToplamKwFromText("2x6kW+2x7,5kW"), 27);
    assert.equal(parseBrulorToplamKwFromText("4x7,5kW"), 30);
  });

  it("ozti dortlu ocak — katalog 6 kW brulor basi, toplam 24 kW", () => {
    const r = resolveKwFromSources({
      urunAd: "700 SERİ SET ÜSTÜ DÖRTLÜ OCAK GAZLI 80*70*30 (L)-4x6 kW",
      aciklama: "700 SERİ SET ÜSTÜ DÖRTLÜ OCAK GAZLI",
      teknik_ozellikler: ["Güç: 6 kW"],
      olculer: { guc_kw: "6" },
    });
    assert.equal(r.elektrikGucuKw, null);
    assert.equal(r.gazGucuKw, 24);
  });

  it("resolveTeklifKw keeps mixed gas oven kW columns", () => {
    const r = resolveTeklifKw({
      isim: "KONVEKSİYONLU FIRIN, GAZLI",
      urun: {
        sku: "260813",
        ad: "Crosswise Konveksiyon Fırın Gazlı Konveksiyon Fırın, 6 GN1/1",
        elektrikGucuKw: 0.35,
        gazGucuKw: 8.35,
      },
    });
    assert.equal(r.elektrikGucuKw, 0.35);
    assert.equal(r.gazGucuKw, 8.35);
  });

  it("resolveTeklifKw merges partial urun kW with teklifAciklama", () => {
    const r = resolveTeklifKw({
      isim: "KONVEKSİYONLU FIRIN, GAZLI",
      urun: {
        sku: "260813",
        ad: "Crosswise Konveksiyon Fırın Gazlı",
        elektrikGucuKw: 0.35,
        gazGucuKw: null,
        teklifAciklama:
          "Elektrik gücü max: 0.35 kW\nGaz Gücü: 8.35 kW",
      },
    });
    assert.equal(r.elektrikGucuKw, 0.35);
    assert.equal(r.gazGucuKw, 8.35);
  });

  it("estimates Çağlayan teşhir reyonu kW from length when catalog has none", () => {
    const r = resolveKwFromSources({
      sku: "EQ-AÇELYA-EQ26",
      urunAd: "EQ-AÇELYA EQ26 · ML (3M1) — 2812×1050×1200 mm",
      aciklama: "YÜKLEME ALANI / LOADING AREA (m²)",
      olculer: { genislik_mm: 2812, derinlik_mm: 1050, yukseklik_mm: 1200 },
    });
    assert.equal(r.elektrikGucuKw, 0.37);
    assert.equal(r.gazGucuKw, null);
  });
});
