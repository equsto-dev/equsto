/**
 * WhatsApp yüzen kedi FAB kilit doğrulama.
 * Kilit: public/whatsapp-cat-fab-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = process.env.AGENT_REPO_ROOT?.trim() || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WA_IMG = "/equsto-bize-ulasin-isimlik.png";
let err = 0;

function fail(msg) {
  console.error("[verify-whatsapp-cat-fab-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/whatsapp-cat-fab-KILIT.txt");
mustExist("public/contact.js");
mustExist("public/contact.css");
mustExist("public/nav.js");
mustExist("public/equsto-bize-ulasin-isimlik.png");
mustExist("components/shop/ShopCoreScripts.tsx");
mustExist("components/shop/ShopStyles.tsx");

const contact = read("public/contact.js");
if (!contact.includes('WA_FAB_IMG = "' + WA_IMG + '"')) {
  fail("contact.js: WA_FAB_IMG kilit yolu eşleşmiyor");
}
if (!/function mountFabInTabbar\(\)[\s\S]{0,220}max-width: 768px/.test(contact)) {
  fail("contact.js: mountFabInTabbar mobil guard yok");
}
if (contact.includes("if (mountFabInTabbar() || ++tries")) {
  fail("contact.js: waitTabbar mountFabInTabbar() kullanıyor — syncFabPlacement olmalı");
}
if (!/waitTabbar[\s\S]{0,120}syncFabPlacement\(\)[\s\S]{0,80}\+\+tries\s*>\s*48/.test(contact)) {
  fail("contact.js: waitTabbar syncFabPlacement döngüsü yok");
}
if (!contact.includes("window.equstoSyncContactFab = syncFabPlacement")) {
  fail("contact.js: equstoSyncContactFab export yok");
}
if (!contact.includes('wrap.id = "equsto-contact-fab"')) {
  fail("contact.js: equsto-contact-fab mount yok");
}
if (!contact.includes('data-eq-wa-cat-kilit')) {
  fail("contact.js: data-eq-wa-cat-kilit işareti yok");
}

const nav = read("public/nav.js");
if (!/function eqEnforceMobileChrome\(\)[\s\S]{0,180}max-width: 768px/.test(nav)) {
  fail("nav.js: eqEnforceMobileChrome mobil guard yok");
}
if (!nav.includes('getElementById("equsto-contact-fab")')) {
  fail("nav.js: mobilde equsto-contact-fab kaldırma yok");
}

const theme = read("public/theme.css");
if (!theme.includes("#equsto-contact-fab")) {
  fail("theme.css: equsto-contact-fab yedek stili yok");
}

const core = read("components/shop/ShopCoreScripts.tsx");
if (!core.includes("contact.js")) fail("ShopCoreScripts.tsx: contact.js yüklenmiyor");
if (!core.includes("equstoSyncContactFab")) fail("ShopCoreScripts.tsx: equstoSyncContactFab onReady yok");

const styles = read("components/shop/ShopStyles.tsx");
if (!styles.includes("contact.css")) fail("ShopStyles.tsx: contact.css yok");

const sync = read("scripts/sync-legacy-assets.mjs");
if (!sync.includes("equsto-bize-ulasin-isimlik.png")) {
  fail("sync-legacy-assets.mjs: kedi PNG senkron listesinde yok");
}

if (err) {
  console.error("[verify-whatsapp-cat-fab-kilit] Kilit ihlali");
  process.exit(1);
}
console.log("[verify-whatsapp-cat-fab-kilit] OK — masaüstü kedi FAB + mobil guard");
