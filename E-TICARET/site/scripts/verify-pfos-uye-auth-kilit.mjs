/**
 * PFOS halk teklifi + üye oturumu + giriş/kayıt + Hesabım kilit doğrulama.
 * Kilit: public/pfos-uye-auth-KILIT.txt
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SHOP_ASSET_V = "20260602wa-no-handoff-link";
const WA_MODAL_BUILD = 23;
let err = 0;

function fail(msg) {
  console.error("[verify-pfos-uye-auth-kilit] HATA:", msg);
  err = 1;
}

function read(rel) {
  return fs.readFileSync(path.join(siteDir, rel), "utf8");
}

function mustExist(rel) {
  if (!fs.existsSync(path.join(siteDir, rel))) fail(`eksik dosya: ${rel}`);
}

mustExist("public/pfos-uye-auth-KILIT.txt");

const kilit = read("public/pfos-uye-auth-KILIT.txt");
if (!kilit.includes("88a02ad9")) fail("pfos-uye-auth-KILIT.txt: onay commit referansı yok");
if (!kilit.includes(SHOP_ASSET_V)) fail("pfos-uye-auth-KILIT.txt: SHOP_ASSET_V kilidi yok");
if (!kilit.includes("WA_MODAL_BUILD = 23")) fail("pfos-uye-auth-KILIT.txt: WA_MODAL_BUILD kilidi yok");

[
  "components/pfos/public/PfosPublicWizard.tsx",
  "components/pfos/public/pfos-public.module.css",
  "components/pfos/TeklifV14Proforma.tsx",
  "lib/pfos/member-session.client.ts",
  "lib/member-auth.ts",
  "lib/vitrin/bodies/login.ts",
  "lib/account/account-hub.ts",
  "components/account/MemberAccountHub.tsx",
  "components/auth/AuthVitrinChrome.tsx",
  "app/(auth)/layout.tsx",
  "app/(vitrin)/hesabim/page.tsx",
  "app/api/teklifler/[[...id]]/route.ts",
  "app/api/musteriler/[[...id]]/route.ts",
  "public/contact.js",
  "public/contact.css",
  "public/equsto-auth-client.js",
  "public/auth-social.js",
  "public/auth.css",
  "public/equsto-member.js",
  "public/eq-site-urls.js",
  "lib/shop/assets.ts",
  "next.config.ts",
  "prisma/schema.prisma",
  "prisma/migrations/20260608150000_shop_member_telefon/migration.sql",
].forEach(mustExist);

/* PFOS wizard — üye kapısı başta, sakin geçişler */
const pfosWizard = read("components/pfos/public/PfosPublicWizard.tsx");
if (!pfosWizard.includes("memberReady")) fail("PfosPublicWizard: memberReady yok");
if (!pfosWizard.includes("renderMemberGate")) fail("PfosPublicWizard: memberGate yok");
if (!pfosWizard.includes("pfosLoginHref")) fail("PfosPublicWizard: pfosLoginHref yok");
if (!pfosWizard.includes("pfosRegisterHref")) fail("PfosPublicWizard: pfosRegisterHref yok");
if (!pfosWizard.includes("deliveryOnly")) fail("PfosPublicWizard: deliveryOnly proforma yok");
if (!pfosWizard.includes("PFOS_PANEL_FADE_MS = 580")) {
  fail("PfosPublicWizard: PFOS_PANEL_FADE_MS=580 kilidi yok");
}
if (!/if \(!memberLoggedIn\)[\s\S]{0,80}renderMemberGate/.test(pfosWizard)) {
  fail("PfosPublicWizard: üye kapısı giriş kontrolünde — sihirbaz başında olmalı");
}

const pfosCss = read("components/pfos/public/pfos-public.module.css");
if (!pfosCss.includes(".secPending")) fail("pfos-public.module.css: secPending yok");
if (!pfosCss.includes(".secReveal")) fail("pfos-public.module.css: secReveal yok");
if (pfosCss.includes("clip-path")) fail("pfos-public.module.css: clip-path geri gelmiş — sakin geçiş bozuldu");

const proforma = read("components/pfos/TeklifV14Proforma.tsx");
if (!proforma.includes("deliveryOnly")) fail("TeklifV14Proforma: deliveryOnly yok");
if (!proforma.includes("memberLoggedInNow")) fail("TeklifV14Proforma: memberLoggedInNow yok");
if (!/deliveryOnly \?/.test(proforma)) fail("TeklifV14Proforma: deliveryOnly dalı yok");

const memberSession = read("lib/pfos/member-session.client.ts");
if (!memberSession.includes("pfosLoginHref")) fail("member-session.client: pfosLoginHref yok");
if (!memberSession.includes("?next=")) fail("member-session.client: ?next= geri dönüş yok");

/* API — üye oturumu zorunlu */
for (const rel of [
  "app/api/teklifler/[[...id]]/route.ts",
  "app/api/musteriler/[[...id]]/route.ts",
]) {
  const api = read(rel);
  if (!api.includes("requireMemberSession")) fail(`${rel}: requireMemberSession yok`);
}

const memberAuth = read("lib/member-auth.ts");
if (!memberAuth.includes("requireValidTrMemberPhone")) {
  fail("member-auth.ts: requireValidTrMemberPhone yok");
}
if (!memberAuth.includes('telefon: string')) fail("member-auth.ts: telefon alanı yok");

const schema = read("prisma/schema.prisma");
if (!schema.includes("telefon      String")) fail("schema.prisma: ShopMember.telefon yok");

/* WhatsApp modal üye kapısı */
const contact = read("public/contact.js");
if (!contact.includes(`WA_MODAL_BUILD = ${WA_MODAL_BUILD}`)) {
  fail(`contact.js: WA_MODAL_BUILD=${WA_MODAL_BUILD} kilidi yok`);
}
if (!contact.includes("equsto-wa-login-gate")) fail("contact.js: WA üye kapısı yok");
if (!contact.includes("equstoLoginHref")) fail("contact.js: equstoLoginHref yok");
if (!contact.includes("equstoRegisterHref")) fail("contact.js: equstoRegisterHref yok");
if (!contact.includes("applyWaModalView")) fail("contact.js: applyWaModalView yok");

const contactCss = read("public/contact.css");
if (!contactCss.includes(".equsto-wa-login-gate__btn")) {
  fail("contact.css: equsto-wa-login-gate__btn stili yok");
}
if (!contactCss.includes(".equsto-wa-login-gate__register")) {
  fail("contact.css: equsto-wa-login-gate__register stili yok");
}

/* Giriş / kayıt */
const authLayout = read("app/(auth)/layout.tsx");
if (!authLayout.includes("AuthVitrinChrome")) fail("auth layout: AuthVitrinChrome yok");

const authChrome = read("components/auth/AuthVitrinChrome.tsx");
if (!authChrome.includes("ShopEqustoChrome")) fail("AuthVitrinChrome: ShopEqustoChrome yok");

const authCss = read("public/auth.css");
if (!authCss.includes("--eq-shop-chrome-h")) fail("auth.css: vitrin chrome padding yok");
if (!authCss.includes("body.eq-auth .auth-topbar")) fail("auth.css: auth-topbar gizleme yok");

const loginHtml = read("lib/vitrin/bodies/login.ts");
if (!loginHtml.includes("auth-phone")) fail("login.ts: auth-phone alanı yok");
if (!loginHtml.includes("auth-password2")) fail("login.ts: auth-password2 alanı yok");

const authClient = read("public/equsto-auth-client.js");
if (!authClient.includes("redirectAfterAuth")) fail("equsto-auth-client: redirectAfterAuth yok");
if (!authClient.includes("Cep telefonu zorunludur")) fail("equsto-auth-client: telefon zorunluluğu yok");
if (!authClient.includes("password !== password2")) fail("equsto-auth-client: şifre eşleşme yok");

const authSocial = read("public/auth-social.js");
if (!authSocial.includes("auth-password2-wrap")) fail("auth-social.js: password2 wrap yok");
if (!authSocial.includes("auth-phone-wrap")) fail("auth-social.js: phone wrap yok");

/* Hesabım merkezi */
const hesabim = read("app/(vitrin)/hesabim/page.tsx");
if (!hesabim.includes("MemberAccountHub")) fail("hesabim/page: MemberAccountHub yok");

const hub = read("lib/account/account-hub.ts");
if (!hub.includes("ACCOUNT_CARDS")) fail("account-hub.ts: ACCOUNT_CARDS yok");

const eqUrls = read("public/eq-site-urls.js");
if (!eqUrls.includes('account: "/hesabim"')) fail("eq-site-urls.js: account → /hesabim yok");

const eqMember = read("public/equsto-member.js");
if (!eqMember.includes('equstoUrl("account")')) fail("equsto-member.js: account linki yok");

const nextCfg = read("next.config.ts");
if (!nextCfg.includes('["hesabim.html", "/hesabim"]')) {
  fail("next.config.ts: hesabim.html yönlendirmesi yok");
}

const assets = read("lib/shop/assets.ts");
if (!assets.includes(`SHOP_ASSET_V = "${SHOP_ASSET_V}"`)) {
  fail(`assets.ts: SHOP_ASSET_V=${SHOP_ASSET_V} kilidi yok`);
}

if (err) {
  console.error("[verify-pfos-uye-auth-kilit] Kilit ihlali — public/pfos-uye-auth-KILIT.txt");
  process.exit(1);
}
console.log(
  "[verify-pfos-uye-auth-kilit] OK — PFOS üye kapısı · PDF teslim · WA modal · giriş/kayıt · /hesabim",
);
