import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  evaluatePriceTrust,
  havaleFromKdvDahil,
  isUntrustedPublishedPrice,
  marketsAgree,
  netFromKdvDahil,
  normSku,
  suggestedSaleTl,
} from "./price-trust.mjs";

describe("normSku", () => {
  it("strips Mutbex/Cafemarkt prefixes", () => {
    assert.equal(normSku("1M.0830.03216.01"), "0830.03216.01");
    assert.equal(normSku("083.0830.03216.01"), "0830.03216.01");
    assert.equal(normSku("0830.03216.01"), "0830.03216.01");
  });
});

describe("evaluatePriceTrust — 0830.03216.01", () => {
  const markets = { cafemarkt: 148054.8, mutbex: 166119 };

  it("rejects the live ₺11.416-class price as too cheap", () => {
    const r = evaluatePriceTrust({ siteTl: 11416, markets });
    assert.equal(r.reason, "too_cheap");
    assert.equal(r.trusted, false);
    assert.equal(r.publishable, false);
    assert.equal(r.severity, "critical");
    assert.ok(r.ratio != null && r.ratio < 0.1);
  });

  it("suggests Cafemarkt −%7", () => {
    assert.equal(suggestedSaleTl(markets), 137691);
    const r = evaluatePriceTrust({ siteTl: 137691, markets, locked: true });
    assert.equal(r.trusted, true);
    assert.equal(r.publishable, true);
    assert.equal(r.reason, "locked_ok");
  });

  it("keeps a near-market price publishable", () => {
    const r = evaluatePriceTrust({ siteTl: 148055, markets });
    assert.equal(r.trusted, true);
    assert.equal(r.publishable, true);
  });

  it("does not hide a too-expensive price (yanlış eşleşme riski)", () => {
    const r = evaluatePriceTrust({ siteTl: 400000, markets });
    assert.equal(r.reason, "too_expensive");
    assert.equal(r.publishable, true);
    assert.equal(r.trusted, false);
  });
});

describe("isUntrustedPublishedPrice", () => {
  it("blocks a cheap unlocked row that still carries a market ref", () => {
    assert.equal(
      isUntrustedPublishedPrice({
        fiyat_tl: 11448,
        piyasa_ref_tl: 148055,
        fiyat_kilit: false,
      }),
      true,
    );
  });

  it("allows a locked corrected price", () => {
    assert.equal(
      isUntrustedPublishedPrice({
        fiyat_tl: 137691,
        piyasa_ref_tl: 148055,
        fiyat_kilit: true,
        fiyat_guven: true,
      }),
      false,
    );
  });

  it("honors explicit fiyat_guven=false", () => {
    assert.equal(
      isUntrustedPublishedPrice({
        fiyat_tl: 137691,
        fiyat_guven: false,
      }),
      true,
    );
  });
});

describe("çakışan piyasa kaynakları", () => {
  it("Cafemarkt 37.894 vs Mutbex 545 TL — Mutbex kazanır, 677 TL güvenilir kalır", () => {
    const markets = { cafemarkt: 37894, mutbex: 545 };
    assert.equal(marketsAgree(markets), false);
    const r = evaluatePriceTrust({ siteTl: 677, markets });
    assert.equal(r.trusted, true);
    assert.equal(r.marketSource, "mutbex");
    assert.ok(r.ratio > 1 && r.ratio < 1.5);
  });
});

describe("KDV / havale helpers", () => {
  it("derives net and havale from KDV dahil", () => {
    assert.equal(netFromKdvDahil(137691), 114743);
    assert.equal(havaleFromKdvDahil(137691), 134937);
  });
});
