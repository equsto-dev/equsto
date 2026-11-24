import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSiparisNot } from "./parse-siparis-not";

const SCREEN =
  "Teslimat: Caferağa mah. Safa sok. Safa apt. no:1 daire 6, kadıköy Kadıköy/İstanbul/Türkiye. Kadıköy, İstanbul Fatura (bireysel): Gülşin Gümüş · TCKN: 19054027958 Caferağa mah. Safa sok. Safa apt. no:1 daire 6, kadıköy Kadıköy/İstanbul/Türkiye. Kadıköy, İstanbul";

describe("parseSiparisNot", () => {
  it("splits a single-line delivery and individual invoice note", () => {
    const parsed = parseSiparisNot(SCREEN);
    assert.equal(parsed.structured, true);
    assert.match(parsed.teslimat || "", /^Caferağa mah\./);
    assert.match(parsed.teslimat || "", /Kadıköy, İstanbul$/);
    assert.equal(parsed.fatura?.tip, "bireysel");
    assert.equal(parsed.fatura?.ad, "Gülşin Gümüş");
    assert.equal(parsed.fatura?.tckn, "19054027958");
    assert.match(parsed.fatura?.adres || "", /^Caferağa mah\./);
    assert.equal(parsed.mesaj, null);
  });

  it("reads multiline corporate invoice notes", () => {
    const parsed = parseSiparisNot(
      [
        "Adres: Depo",
        "Teslimat: Atölye sok. no 4, Kadıköy, İstanbul, 34710",
        "Fatura (kurumsal): Equsto Ltd · VD: Kadıköy · VN: 1234567890",
        "Atölye sok. no 4, Kadıköy, İstanbul",
      ].join("\n"),
    );
    assert.equal(parsed.adresBaslik, "Depo");
    assert.equal(parsed.teslimat, "Atölye sok. no 4, Kadıköy, İstanbul, 34710");
    assert.equal(parsed.fatura?.tip, "kurumsal");
    assert.equal(parsed.fatura?.unvan, "Equsto Ltd");
    assert.equal(parsed.fatura?.vergiDairesi, "Kadıköy");
    assert.equal(parsed.fatura?.vkn, "1234567890");
    assert.equal(parsed.fatura?.adres, "Atölye sok. no 4, Kadıköy, İstanbul");
  });

  it("keeps a free-text note as the message", () => {
    const parsed = parseSiparisNot("Kapıda arayın, zili çalmayın.");
    assert.equal(parsed.structured, false);
    assert.equal(parsed.teslimat, null);
    assert.equal(parsed.fatura, null);
    assert.equal(parsed.mesaj, "Kapıda arayın, zili çalmayın.");
  });

  it("keeps the product text and pulls the invoice out of a WhatsApp message", () => {
    const parsed = parseSiparisNot(
      [
        "Merhaba, equsto.com sepetimden yazıyorum:",
        "",
        "Ürünler:",
        "1. Vesco shaker",
        "Fatura (bireysel): Ayşe Yılmaz · TCKN: 10000000146",
        "Bağdat cad. no 1, Kadıköy, İstanbul",
      ].join("\n"),
    );
    assert.equal(parsed.structured, true);
    assert.match(parsed.mesaj || "", /Vesco shaker/);
    assert.equal(parsed.fatura?.ad, "Ayşe Yılmaz");
    assert.equal(parsed.fatura?.tckn, "10000000146");
    assert.equal(parsed.fatura?.adres, "Bağdat cad. no 1, Kadıköy, İstanbul");
  });

  it("returns an empty parse for blank input", () => {
    const parsed = parseSiparisNot("  ");
    assert.equal(parsed.structured, false);
    assert.equal(parsed.mesaj, null);
  });
});
