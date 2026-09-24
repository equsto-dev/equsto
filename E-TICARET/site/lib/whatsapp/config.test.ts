import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  greenApiInstancePhone,
  isOwnerSelfWhatsAppNotifyBlocked,
  ownerWhatsAppNotifyPhones,
  whatsAppMode,
  whatsAppWebhookConfigured,
} from "./config";

const KEYS = [
  "EQUSTO_WHATSAPP_MODE",
  "GREEN_API_INSTANCE_ID",
  "GREEN_API_TOKEN",
  "GREEN_API_INSTANCE_WID",
  "GREEN_API_INSTANCE_PHONE",
  "EQUSTO_WHATSAPP_E164",
  "WHATSAPP_NOTIFY_TO",
  "WHATSAPP_NOTIFY_ALT_TO",
  "EQUSTO_NOTIFY_SMS_E164",
] as const;

const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

function setEnv(map: Record<string, string | undefined>) {
  for (const k of KEYS) {
    const v = map[k];
    if (v == null || v === "") delete process.env[k];
    else process.env[k] = v;
  }
}

afterEach(() => {
  for (const k of KEYS) {
    const v = saved[k];
    if (v == null) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("whatsAppMode — empty/link MODE + Green API credentials", () => {
  it("uses green-api when MODE is empty but GREEN_API_* are set", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
    });
    assert.equal(whatsAppMode(), "green-api");
    assert.equal(whatsAppWebhookConfigured(), true);
  });

  it("uses green-api when MODE is link but GREEN_API_* are set", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "link",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
    });
    assert.equal(whatsAppMode(), "green-api");
    assert.equal(whatsAppWebhookConfigured(), true);
  });

  it("stays meta when MODE is meta", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "meta",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
    });
    assert.equal(whatsAppMode(), "meta");
  });
});

describe("owner WhatsApp notify — missing INSTANCE_WID", () => {
  it("does not treat vitrin E164 as the Green API line", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "green-api",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
      GREEN_API_INSTANCE_WID: "",
      EQUSTO_WHATSAPP_E164: "905326840152",
      WHATSAPP_NOTIFY_TO: "905326840152",
    });
    assert.equal(greenApiInstancePhone(), "");
    assert.equal(isOwnerSelfWhatsAppNotifyBlocked(), false);
    assert.deepEqual(ownerWhatsAppNotifyPhones(), ["905326840152"]);
  });

  it("blocks only when INSTANCE_WID equals notify number", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "green-api",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
      GREEN_API_INSTANCE_WID: "905326840152",
      EQUSTO_WHATSAPP_E164: "905326840152",
      WHATSAPP_NOTIFY_TO: "905326840152",
      WHATSAPP_NOTIFY_ALT_TO: "905542378532",
    });
    assert.equal(isOwnerSelfWhatsAppNotifyBlocked(), true);
    assert.deepEqual(ownerWhatsAppNotifyPhones(), ["905542378532"]);
  });
});
