import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { enrichEslesmisUrunKw } from "../lib/pfos/core/enrich-eslesmis-kw.ts";

describe("enrich-eslesmis-kw", () => {
  it("fills missing gaz kW from catalog when elk already set", async () => {
    const urun = await enrichEslesmisUrunKw(
      {
        id: "x",
        sku: "260813",
        ad: "Crosswise Konveksiyon Fırın Gazlı",
        marka: "Crosswise",
        model: null,
        olcu: null,
        elektrikGucuKw: 0.35,
        gazGucuKw: null,
        fiyat: 1000,
        doviz: "TRY",
        gorselUrl: null,
      },
      { isim: "KONVEKSİYONLU FIRIN, GAZLI", urunTipi: "konveksiyon-firin-gazli" },
    );
    assert.equal(urun?.elektrikGucuKw, 0.35);
    assert.equal(urun?.gazGucuKw, 8.35);
    assert.ok(urun?.teklifAciklama?.includes("Gaz"));
  });
});
