/**
 * WhatsApp modal sohbet senkronu kilit doğrulama.
 * Kilit: public/whatsapp-modal-chat-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WEBHOOK_URL = "https://equsto.com/api/whatsapp/webhook";
const WA_MODAL_BUILD = 25;
const POLL_MS = 4000;
let err = 0;

function fail(msg) {
  console.error("[verify-whatsapp-modal-chat-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/whatsapp-modal-chat-KILIT.txt");
mustExist("lib/wa-chat.ts");
mustExist("app/api/whatsapp/chat/route.ts");
mustExist("lib/whatsapp/green-api.ts");
mustExist("lib/whatsapp/api-handlers.ts");
mustExist("app/api/musteriler/[[...id]]/route.ts");
mustExist("lib/notify.ts");
mustExist("public/contact.js");
mustExist("prisma/schema.prisma");
mustExist("prisma/migrations/20260614170000_wa_chat_message/migration.sql");
mustExist("scripts/configure-green-api-webhook.mjs");

const kilit = read("public/whatsapp-modal-chat-KILIT.txt");
if (!kilit.includes(WEBHOOK_URL)) fail("KILIT.txt: webhook URL yok");
if (!kilit.includes("syncWaChatFromServer")) fail("KILIT.txt: syncWaChatFromServer referansı yok");

const waChat = read("lib/wa-chat.ts");
if (!waChat.includes("appendWaChatMessage")) fail("wa-chat.ts: appendWaChatMessage yok");
if (!waChat.includes("listWaChatMessages")) fail("wa-chat.ts: listWaChatMessages yok");
if (!waChat.includes("isInternalWhatsAppPhone")) fail("wa-chat.ts: isInternalWhatsAppPhone yok");
if (!waChat.includes("waMessageId")) fail("wa-chat.ts: waMessageId dedupe yok");

const chatRoute = read("app/api/whatsapp/chat/route.ts");
if (!chatRoute.includes("requireMemberSession")) fail("chat/route.ts: requireMemberSession yok");
if (!chatRoute.includes("listWaChatMessages")) fail("chat/route.ts: listWaChatMessages yok");

const greenApi = read("lib/whatsapp/green-api.ts");
if (!greenApi.includes("parseGreenApiOutboundMessages")) {
  fail("green-api.ts: parseGreenApiOutboundMessages yok");
}

const handlers = read("lib/whatsapp/api-handlers.ts");
if (!handlers.includes("parseGreenApiOutboundMessages")) {
  fail("api-handlers.ts: parseGreenApiOutboundMessages kullanımı yok");
}
if (!handlers.includes("for (const msg of outbound)")) {
  fail("api-handlers.ts: outbound döngüsü yok");
}
if (!/for \(const msg of outbound\)[\s\S]{0,280}appendWaChatMessage[\s\S]{0,80}role:\s*"team"/.test(handlers)) {
  fail("api-handlers.ts: outbound → team appendWaChatMessage yok");
}
if (!handlers.includes("waWebhookGet")) fail("api-handlers.ts: waWebhookGet yok");
if (!/whatsAppMode\(\)\s*===\s*"green-api"[\s\S]{0,120}Response\.json/.test(handlers)) {
  fail("api-handlers.ts: Green API GET webhook 200 JSON yok");
}

const musteriler = read("app/api/musteriler/[[...id]]/route.ts");
if (!musteriler.includes('kaynak === "whatsapp-modal"')) {
  fail("musteriler route: whatsapp-modal kaynağı yok");
}
if (!musteriler.includes("appendWaChatMessage")) fail("musteriler route: appendWaChatMessage yok");

const notify = read("lib/notify.ts");
if (!/notifyCustomerLeadAck[\s\S]{0,800}appendWaChatMessage[\s\S]{0,120}role:\s*"team"/.test(notify)) {
  fail("notify.ts: customer ack → team appendWaChatMessage yok");
}

const contact = read("public/contact.js");
if (!contact.includes(`WA_MODAL_BUILD = ${WA_MODAL_BUILD}`)) {
  fail(`contact.js: WA_MODAL_BUILD=${WA_MODAL_BUILD} yok`);
}
if (!contact.includes("function syncWaChatFromServer")) fail("contact.js: syncWaChatFromServer yok");
if (!contact.includes("function startWaChatPoll")) fail("contact.js: startWaChatPoll yok");
if (!contact.includes("function stopWaChatPoll")) fail("contact.js: stopWaChatPoll yok");
if (!contact.includes('eqMsgApiBase() + "/whatsapp/chat"')) {
  fail("contact.js: /whatsapp/chat endpoint yok");
}
if (!contact.includes("mergeServerWaMessages")) fail("contact.js: mergeServerWaMessages yok");
if (!new RegExp(`setInterval\\([\\s\\S]{0,120}${POLL_MS}\\)`).test(contact)) {
  fail(`contact.js: ${POLL_MS} ms polling yok`);
}
if (!contact.includes("data-eq-wa-chat-kilit")) fail("contact.js: data-eq-wa-chat-kilit işareti yok");

const schema = read("prisma/schema.prisma");
if (!schema.includes("model WaChatMessage")) fail("schema.prisma: WaChatMessage modeli yok");

const cfg = read("scripts/configure-green-api-webhook.mjs");
if (!cfg.includes(WEBHOOK_URL)) fail("configure-green-api-webhook.mjs: WEBHOOK_URL yok");
if (!cfg.includes("outgoingMessageWebhook")) fail("configure script: outgoingMessageWebhook yok");

if (err) {
  console.error("[verify-whatsapp-modal-chat-kilit] Kilit ihlali");
  process.exit(1);
}
console.log("[verify-whatsapp-modal-chat-kilit] OK — modal ↔ telefon sohbet senkronu");
