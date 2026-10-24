import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isAtalayPisirmePfosKalem,
  isIzgaraTablaIstifIsim,
  isPisirmeReferansIsim,
} from "./atalay-marka";
import { isIstifRafiReferansIsim } from "./portashelf-marka";
import { findPortashelfByOlcu } from "./portashelf-fiyat";
import { isPisirmeReferans } from "../referans/pisirme-match";

const LISTE_ISTIF_137 =
  "ISTIF RAFI IZGARA TABLA 53*137*183 PASLANMAZ 4 KATLI";
const LISTE_ISTIF_152 =
  "İSTİF RAFI IZGARA TABLA PASLANMAZ 4 KATLI";

describe("ızgara tabla ≠ pişirme ızgarası", () => {
  it("sınıflandırır: istif / ızgara tabla", () => {
    assert.equal(isIstifRafiReferansIsim(LISTE_ISTIF_137), true);
    assert.equal(isIzgaraTablaIstifIsim(LISTE_ISTIF_137), true);
    assert.equal(isIzgaraTablaIstifIsim(LISTE_ISTIF_152), true);
    assert.equal(isPisirmeReferansIsim(LISTE_ISTIF_137), false);
    assert.equal(isPisirmeReferans(LISTE_ISTIF_137), false);
    assert.equal(
      isAtalayPisirmePfosKalem({ isim: LISTE_ISTIF_137, urunTipi: "istif-rafi" }),
      false,
    );
  });

  it("gerçek döküm ızgarayı pişirme sayar", () => {
    const dokum = "700 SERİ SET ÜSTÜ DÖKÜM IZGARA GAZLI 80*70*30";
    assert.equal(isPisirmeReferansIsim(dokum), true);
    assert.equal(isIzgaraTablaIstifIsim(dokum), false);
    assert.equal(isIstifRafiReferansIsim(dokum), false);
  });

  it("Portashelf ölçü eşlemesi — 53×137×183 ve 137×53×183", () => {
    const a = findPortashelfByOlcu("137*53*183", LISTE_ISTIF_137);
    const b = findPortashelfByOlcu("53*137*183", LISTE_ISTIF_137);
    assert.ok(a, "137*53*183 bulunmalı");
    assert.ok(b, "53*137*183 bulunmalı");
    assert.equal(a!.depthCm, 53);
    assert.equal(a!.widthCm, 137);
    assert.equal(a!.heightCm, 183);
    assert.equal(b!.sku, a!.sku);
    assert.match(a!.sku, /^53-X-137-X-183/i);
  });

  it("Portashelf ölçü eşlemesi — 53×152×183", () => {
    const hit = findPortashelfByOlcu("152*53*183", "portashelf paslanmaz 4 katlı");
    assert.ok(hit);
    assert.equal(hit!.depthCm, 53);
    assert.equal(hit!.widthCm, 152);
    assert.match(hit!.sku, /^53-X-152-X-183/i);
  });
});
