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
