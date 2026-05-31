import crypto from "node:crypto";
import { DEV_ADMIN_BEARER, normalizeAdminBearer } from "@/lib/auth";
import { dataPath, readJsonFile, writeJsonFile } from "@/lib/legacy-data";

const ADMIN_AUTH_FILE = () => dataPath("admin-auth.json");

export function sha256AdminPassword(pw: string): string {
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

type AdminAuthJson = { pw_sha256?: string; updated_at?: string };

export async function readAdminPwHash(): Promise<string | null> {
  const fromEnv = normalizeAdminBearer(process.env.EQUSTO_ADMIN_PW_SHA256 || "");
  if (fromEnv) return fromEnv;

  const file = await readJsonFile<AdminAuthJson>(ADMIN_AUTH_FILE());
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
  await writeJsonFile(ADMIN_AUTH_FILE(), payload);
}

export function adminLoginToken(): string {
  return normalizeAdminBearer(process.env.EQUSTO_ADMIN_BEARER || "") || DEV_ADMIN_BEARER;
}

export function adminRecoveryCode(): string {
  return String(process.env.EQUSTO_ADMIN_RECOVERY_CODE || "").trim();
}
