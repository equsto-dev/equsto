/**
 * Yeni EQUSTO_ADMIN_BEARER üretir (Vercel + .env.local + giriş aynı değer).
 *   node scripts/generate-admin-bearer.mjs
 */
import { randomBytes } from "node:crypto";

const token = `equsto-pro-${randomBytes(24).toString("hex")}`;
console.log("\nYeni admin Bearer (tırnaksız, Vercel + giriş + .env.local):\n");
console.log(token);
console.log(`\nUzunluk: ${token.length} karakter\n`);
