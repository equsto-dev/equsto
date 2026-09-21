import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  greenApiConfigured,
  whatsAppMode,
  whatsAppWebhookConfigured,
} from "./config";

const KEYS = [
  "EQUSTO_WHATSAPP_MODE",
  "GREEN_API_INSTANCE_ID",
  "GREEN_API_TOKEN",
  "GREEN_API_WEBHOOK_TOKEN",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "WHATSAPP_VERIFY_TOKEN",
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

describe("whatsAppMode — empty MODE + Green API credentials", () => {
  it("uses green-api when MODE is empty and GREEN_API_* are set", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
    });
    assert.equal(greenApiConfigured(), true);
    assert.equal(whatsAppMode(), "green-api");
    assert.equal(whatsAppWebhookConfigured(), true);
  });

  it("stays link when MODE is explicitly link even with Green API keys", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "link",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
    });
    assert.equal(whatsAppMode(), "link");
    assert.equal(whatsAppWebhookConfigured(), false);
  });

  it("stays meta when MODE is meta", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "meta",
      GREEN_API_INSTANCE_ID: "1101234567",
      GREEN_API_TOKEN: "token-abc-12345678",
      WHATSAPP_ACCESS_TOKEN: "meta-token",
      WHATSAPP_PHONE_NUMBER_ID: "123",
      WHATSAPP_VERIFY_TOKEN: "verify",
    });
    assert.equal(whatsAppMode(), "meta");
  });

  it("falls back to link when MODE is empty and Green API is missing", () => {
    setEnv({
      EQUSTO_WHATSAPP_MODE: "",
      GREEN_API_INSTANCE_ID: "",
      GREEN_API_TOKEN: "",
    });
    assert.equal(greenApiConfigured(), false);
    assert.equal(whatsAppMode(), "link");
    assert.equal(whatsAppWebhookConfigured(), false);
  });
});
