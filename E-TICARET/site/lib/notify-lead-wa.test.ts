import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { leadBodyForWhatsApp } from "./notify-lead-format";

describe("leadBodyForWhatsApp", () => {
  it("always includes sender phone and email lines", () => {
    const text = leadBodyForWhatsApp({
      yetkili: "Ayşe Yılmaz",
      tel: "05321234567",
      mail: "ayse@example.com",
      mesaj: "Makine fiyatı?",
      kaynak: "whatsapp-modal",
      sayfa: "https://equsto.com/kahve",
    });
    assert.match(text, /\*Gönderen:\* Ayşe Yılmaz/);
    assert.match(text, /\*Telefon:\* 05321234567/);
    assert.match(text, /\*E-posta:\* ayse@example.com/);
    assert.match(text, /\*Mesaj:\*\nMakine fiyatı\?/);
    assert.doesNotMatch(text, /Hazır mesaj:/);
    assert.doesNotMatch(text, /wa\.me\//);
  });

  it("shows placeholders when sender fields are empty", () => {
    const text = leadBodyForWhatsApp({ mesaj: "Merhaba" });
    assert.match(text, /\*Gönderen:\* Ziyaretçi/);
    assert.match(text, /\*Telefon:\* —/);
    assert.match(text, /\*E-posta:\* —/);
    assert.match(text, /\*Mesaj:\*\nMerhaba/);
  });
});
