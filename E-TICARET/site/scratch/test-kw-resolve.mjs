import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isPasifPfosEkipman,
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
});
