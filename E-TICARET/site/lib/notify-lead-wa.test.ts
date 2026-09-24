import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { leadBodyForWhatsApp, ownerWhatsAppAlertText } from "./notify-lead-format";

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
    assert.match(text, /^Gönderen: Ayşe Yılmaz$/m);
    assert.match(text, /^Telefon: 05321234567$/m);
    assert.match(text, /^E-posta: ayse@example.com$/m);
    assert.match(text, /^Mesaj:\nMakine fiyatı\?$/m);
    assert.doesNotMatch(text, /Hazır mesaj:/);
    assert.doesNotMatch(text, /wa\.me\//);
  });

  it("shows placeholders when sender fields are empty", () => {
    const text = leadBodyForWhatsApp({ mesaj: "Merhaba" });
    assert.match(text, /^Gönderen: Ziyaretçi$/m);
    assert.match(text, /^Telefon: —$/m);
    assert.match(text, /^E-posta: —$/m);
  });

  it("puts name and phone in the alert headline", () => {
    const text = ownerWhatsAppAlertText("Equsto — WhatsApp modal mesajı", {
      yetkili: "Ayşe Yılmaz",
      tel: "05321234567",
      mesaj: "Merhaba",
    });
    assert.match(
      text,
      /^Equsto — WhatsApp modal mesajı — Ayşe Yılmaz · 05321234567\n/,
    );
    assert.match(text, /^Gönderen: Ayşe Yılmaz$/m);
  });
});
