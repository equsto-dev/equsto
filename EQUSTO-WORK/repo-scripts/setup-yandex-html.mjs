/**
 * Yandex HTML dosyası doğrulama: yandex_{code}.html
 * npm run seo:yandex-html -- VERIFICATION_CODE
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const code = String(process.argv[2] || process.env.YANDEX_SITE_VERIFICATION || "").trim();
if (!code) {
  console.error("Kullanim: npm run seo:yandex-html -- DOGRULAMA_KODU");
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const name = code.includes(".html") ? code : `yandex_${code}.html`;
const rel = name.replace(/^\//, "");
const out = path.join(root, "public", rel);
const html = `<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body>Verification: ${code.replace(/^yandex_/i, "").replace(/\.html$/i, "")}</body>
</html>
`;

fs.writeFileSync(out, html, "utf8");
console.log("[seo:yandex-html] Olusturuldu:", path.relative(root, out));
console.log("[seo:yandex-html] Canli:", `https://equsto.com/${rel}`);
console.log("[seo:yandex-html] Deploy: node scripts/deploy-cpanel-sftp.mjs --files", rel);
