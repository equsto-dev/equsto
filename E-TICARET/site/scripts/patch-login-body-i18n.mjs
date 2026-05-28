import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../lib/vitrin/bodies/login.ts");
let raw = fs.readFileSync(file, "utf8");

const pairs = [
  ['id=\\"auth-title\\">Üye girişi<', 'id=\\"auth-title\\" data-i18n=\\"login.title\\">Üye girişi<'],
  ['id=\\"auth-sub\\">E-posta ve şifrenizle giriş yapın veya Google ile devam edin.<', 'id=\\"auth-sub\\" data-i18n=\\"login.sub\\">E-posta ve şifrenizle giriş yapın veya Google ile devam edin.<'],
  ['onclick=\\"eqGo(\'home\')\\">Alışverişe devam et<', 'onclick=\\"eqGo(\'home\')\\" data-i18n=\\"login.continue_shopping\\">Alışverişe devam et<'],
  ['id=\\"auth-logout-btn\\">Çıkış yap<', 'id=\\"auth-logout-btn\\" data-i18n=\\"login.logout\\">Çıkış yap<'],
  ['data-mode=\\"login\\">Giriş<', 'data-mode=\\"login\\" data-i18n=\\"login.tab_login\\">Giriş<'],
  ['data-mode=\\"register\\">Kayıt ol<', 'data-mode=\\"register\\" data-i18n=\\"login.tab_register\\">Kayıt ol<'],
  ['for=\\"auth-name\\">Ad Soyad<', 'for=\\"auth-name\\" data-i18n=\\"login.name_label\\">Ad Soyad<'],
  ['placeholder=\\"Adınız Soyadınız\\"', 'placeholder=\\"Adınız Soyadınız\\" data-i18n-attr=\\"placeholder:login.name_ph\\"'],
  ['for=\\"auth-email\\">E-posta<', 'for=\\"auth-email\\" data-i18n=\\"login.email_label\\">E-posta<'],
  ['placeholder=\\"ornek@firma.com\\"', 'placeholder=\\"ornek@firma.com\\" data-i18n-attr=\\"placeholder:login.email_ph\\"'],
  ['for=\\"auth-password\\">Şifre<', 'for=\\"auth-password\\" data-i18n=\\"login.password_label\\">Şifre<'],
  ['placeholder=\\"En az 8 karakter\\"', 'placeholder=\\"En az 8 karakter\\" data-i18n-attr=\\"placeholder:login.password_ph\\"'],
  ['id=\\"auth-submit-btn\\">E-posta ile giriş yap<', 'id=\\"auth-submit-btn\\" data-i18n=\\"login.submit_login\\">E-posta ile giriş yap<'],
  ['class=\\"auth-divider\\">veya<', 'class=\\"auth-divider\\" data-i18n=\\"login.divider_or\\">veya<'],
  ['aria-label=\\"Google ile giriş\\"', 'aria-label=\\"Google ile giriş\\" data-i18n-attr=\\"aria-label:login.google_aria\\"'],
  ['Google ile devam et\\r\\n        </button>', 'Google ile devam et\\r\\n        </button>'.replace('Google ile devam et', '')],
];

// fix google button - simpler replace
raw = raw.replace(
  'Google ile devam et\\r\\n        </button>',
  '<span data-i18n=\\"login.google_continue\\">Google ile devam et</span>\\r\\n        </button>'
);
raw = raw.replace(
  '<a onclick=\\"eqGo(\'home\')\\">← Ana sayfaya dön</a>',
  '<a onclick=\\"eqGo(\'home\')\\" data-i18n=\\"login.back_home\\">← Ana sayfaya dön</a>'
);
raw = raw.replace(
  '<span class=\\"theme-legend\\">Sistem · Açık · Koyu</span>',
  '<span class=\\"theme-legend\\" data-i18n=\\"common.theme_label\\">Sistem · Açık · Koyu</span>'
);

let n = 0;
for (const [from, to] of pairs.slice(0, -1)) {
  if (raw.includes(to)) continue;
  if (!raw.includes(from)) continue;
  raw = raw.replace(from, to);
  n++;
}
fs.writeFileSync(file, raw, "utf8");
console.log("[patch-login-body-i18n]", n, "ok");
