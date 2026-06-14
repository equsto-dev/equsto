#!/usr/bin/env node
/**
 * Green API instance → equsto.com webhook (Mr. Equsto modal)
 *   node --import ./scripts/load-env.mjs scripts/configure-green-api-webhook.mjs
 *   node --import ./scripts/load-env.mjs scripts/configure-green-api-webhook.mjs --dry-run
 */
const WEBHOOK_URL = "https://equsto.com/api/whatsapp/webhook";
const dryRun = process.argv.includes("--dry-run");

const id = process.env.GREEN_API_INSTANCE_ID?.trim();
const token = process.env.GREEN_API_TOKEN?.trim();
const mode = process.env.EQUSTO_WHATSAPP_MODE?.trim() || "link";

if (mode !== "green-api" || !id || !token) {
  console.error("[green-api-webhook] Eksik: EQUSTO_WHATSAPP_MODE=green-api, GREEN_API_*");
  process.exit(1);
}

const base = `https://api.green-api.com/waInstance${id}`;

const desired = {
  webhookUrl: WEBHOOK_URL,
  webhookUrlToken: "",
  incomingWebhook: "yes",
  outgoingMessageWebhook: "yes",
  outgoingAPIMessageWebhook: "yes",
  outgoingWebhook: "yes",
};

async function getSettings() {
  const r = await fetch(`${base}/getSettings/${token}`);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || `getSettings HTTP ${r.status}`);
  return j;
}

async function setSettings(body) {
  if (dryRun) {
    console.log("[green-api-webhook] dry-run setSettings:", body);
    return { saveSettings: true };
  }
  const r = await fetch(`${base}/setSettings/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  console.log("[green-api-webhook] setSettings response:", j);
  if (!r.ok || j.saveSettings !== true) {
    throw new Error(j.message || JSON.stringify(j) || `setSettings HTTP ${r.status}`);
  }
  return j;
}

async function getState() {
  const r = await fetch(`${base}/getStateInstance/${token}`);
  return r.json().catch(() => ({}));
}

async function main() {
  const state = await getState();
  console.log("[green-api-webhook] instance state:", state.stateInstance || state);

  const before = await getSettings();
  console.log("[green-api-webhook] önce:", {
    webhookUrl: before.webhookUrl || "(boş)",
    incomingWebhook: before.incomingWebhook,
    outgoingMessageWebhook: before.outgoingMessageWebhook,
    outgoingAPIMessageWebhook: before.outgoingAPIMessageWebhook,
  });

  await setSettings(desired);

  const after = dryRun ? { ...before, ...desired } : await getSettings();
  console.log("[green-api-webhook] sonra:", {
    webhookUrl: after.webhookUrl,
    incomingWebhook: after.incomingWebhook,
    outgoingMessageWebhook: after.outgoingMessageWebhook,
    outgoingAPIMessageWebhook: after.outgoingAPIMessageWebhook,
  });

  const probe = await fetch(WEBHOOK_URL, { method: "GET" });
  const probeText = (await probe.text()).slice(0, 120);
  console.log(`[green-api-webhook] GET probe ${probe.status}: ${probeText}`);
}

main().catch((e) => {
  console.error("[green-api-webhook]", e.message || e);
  process.exit(1);
});
