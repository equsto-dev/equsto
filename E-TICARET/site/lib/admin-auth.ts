import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DEV_ADMIN_BEARER, normalizeAdminBearer } from "@/lib/auth";
import { getSiteOrigin } from "@/lib/site-origin";

/** Sabit yol — legacy-data dataPath() trace genişlemesini admin route'lara taşımaz */
const ADMIN_AUTH_FILE = path.join(process.cwd(), "public", "data", "admin-auth.json");

export function sha256AdminPassword(pw: string): string {
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

type AdminAuthJson = { pw_sha256?: string; updated_at?: string };

async function readAdminAuthJson(): Promise<AdminAuthJson | null> {
  try {
    return JSON.parse(await fs.readFile(ADMIN_AUTH_FILE, "utf8")) as AdminAuthJson;
  } catch {
    /* Vercel: dosya trace dışı — canlıda CDN */
  }

  try {
    const res = await fetch(`${getSiteOrigin()}/data/admin-auth.json`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminAuthJson;
  } catch {
    return null;
  }
}

async function writeAdminAuthJson(payload: AdminAuthJson): Promise<void> {
  const tmp = `${ADMIN_AUTH_FILE}.tmp`;
  await fs.mkdir(path.dirname(ADMIN_AUTH_FILE), { recursive: true });
  await fs.writeFile(tmp, JSON.stringify(payload, null, 2), "utf8");
  await fs.rename(tmp, ADMIN_AUTH_FILE);
}

export async function readAdminPwHash(): Promise<string | null> {
  const fromEnv = normalizeAdminBearer(process.env.EQUSTO_ADMIN_PW_SHA256 || "");
  if (fromEnv) return fromEnv;

  const file = await readAdminAuthJson();
  if (file?.pw_sha256) return String(file.pw_sha256);
  return null;
}

export async function verifyAdminPassword(pw: string): Promise<boolean> {
  const plain = String(pw || "").trim();
  if (!plain) return false;

  const hash = await readAdminPwHash();
  if (hash) return sha256AdminPassword(plain) === hash;

  const envPw = String(process.env.EQUSTO_ADMIN_PASSWORD || "").trim();
  if (envPw) return plain === envPw;

  if (process.env.NODE_ENV !== "production") return plain === DEV_ADMIN_BEARER;
  return false;
}

export async function writeAdminPwHash(hash: string): Promise<void> {
  const payload: AdminAuthJson = {
    pw_sha256: String(hash),
    updated_at: new Date().toISOString(),
  };
  await writeAdminAuthJson(payload);
}

export function adminLoginToken(): string {
  return normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "") || DEV_ADMIN_BEARER;
}

export function adminRecoveryCode(): string {
  return String(process.env.EQUSTO_ADMIN_RECOVERY_CODE || "").trim();
}
