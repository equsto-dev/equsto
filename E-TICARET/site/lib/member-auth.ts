import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  mergeShopCartItems,
  normalizeShopCartItems,
  resolveShopCartKey,
  shopCartItemsToJson,
  type ShopCartLine,
} from "@/lib/shop-cart";
const SESSION_DAYS = 90;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type MemberUser = {
  email: string;
  name: string;
  provider: string;
  picture: string;
};

export type MemberSessionPayload = {
  token: string;
  expiresAt: number;
  user: MemberUser;
  items: ShopCartLine[];
};

function sessionExpiry() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export function normalizeEmail(email: string): string {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith("scrypt:")) return false;
  const parts = stored.split(":");
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = scryptSync(password, salt, 32);
  return timingSafeEqual(actual, expected);
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function readBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7).trim();
  const alt = req.headers.get("x-equsto-authorization");
  if (alt) return alt.trim();
  const q = req.nextUrl.searchParams.get("access_token");
  return q ? q.trim() : "";
}

export function readTokenFromBody(body: Record<string, unknown> | null | undefined): string {
  if (!body) return "";
  const t = body.token;
  return typeof t === "string" ? t.trim() : "";
}

export function googleClientId(): string {
  return (
    process.env.EQUSTO_GOOGLE_CLIENT_ID?.trim() ||
    process.env.GOOGLE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
    ""
  );
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  email: string;
  name: string;
  picture: string;
  sub: string;
}> {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error("Google token geçersiz");
  const data = (await res.json()) as Record<string, string>;
  const clientId = googleClientId();
  if (clientId && data.aud !== clientId) {
    throw new Error("Google istemci kimliği uyuşmuyor");
  }
  const email = normalizeEmail(data.email || "");
  if (!email || data.email_verified === "false") {
    throw new Error("Google e-posta doğrulanamadı");
  }
  return {
    email,
    name: data.name || email.split("@")[0] || "",
    picture: data.picture || "",
    sub: data.sub || "",
  };
}

function memberToUser(m: {
  email: string;
  name: string;
  provider: string;
  picture: string | null;
}): MemberUser {
  return {
    email: m.email,
    name: m.name || "",
    provider: m.provider || "email",
    picture: m.picture || "",
  };
}

export async function createSessionForMember(memberId: string): Promise<MemberSessionPayload> {
  const member = await db.shopMember.findUnique({ where: { id: memberId } });
  if (!member) throw new Error("Üye bulunamadı");
  const token = newSessionToken();
  const expiresAt = sessionExpiry();
  await db.shopMemberSession.create({
    data: { token, memberId, expiresAt },
  });
  const items = await loadUnifiedShopCart({
    memberEmail: member.email,
    memberId: member.id,
  });
  return {
    token,
    expiresAt: expiresAt.getTime(),
    user: memberToUser(member),
    items,
  };
}

export async function getSessionByToken(token: string): Promise<MemberSessionPayload | null> {
  if (!token) return null;
  const row = await db.shopMemberSession.findUnique({
    where: { token },
    include: { member: true },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    if (row) await db.shopMemberSession.delete({ where: { token } }).catch(() => {});
    return null;
  }
  const items = await loadUnifiedShopCart({
    memberEmail: row.member.email,
    memberId: row.member.id,
  });
  return {
    token: row.token,
    expiresAt: row.expiresAt.getTime(),
    user: memberToUser(row.member),
    items,
  };
}

export async function getMemberIdByToken(token: string): Promise<string | null> {
  const row = await db.shopMemberSession.findUnique({
    where: { token },
    select: { memberId: true, expiresAt: true },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) return null;
  return row.memberId;
}

export async function revokeSession(token: string): Promise<void> {
  if (!token) return;
  await db.shopMemberSession.delete({ where: { token } }).catch(() => {});
}

export async function loginWithEmail(
  email: string,
  password: string,
  syncToken?: string | null,
): Promise<MemberSessionPayload> {
  const norm = normalizeEmail(email);
  if (!EMAIL_RE.test(norm)) throw new Error("Geçerli e-posta girin");
  const member = await db.shopMember.findUnique({ where: { email: norm } });
  if (!member || !member.passwordHash) throw new Error("E-posta veya şifre hatalı");
  if (!verifyPassword(password, member.passwordHash)) throw new Error("E-posta veya şifre hatalı");
  await mergeGuestShopCartIntoMember(syncToken, norm);
  await syncMemberCartFromShopEmail(member.id, norm);
  return createSessionForMember(member.id);
}

export async function registerWithEmail(
  email: string,
  password: string,
  name: string,
  syncToken?: string | null,
): Promise<MemberSessionPayload> {
  const norm = normalizeEmail(email);
  if (!EMAIL_RE.test(norm)) throw new Error("Geçerli e-posta girin");
  if (String(password || "").length < 8) throw new Error("Şifre en az 8 karakter olmalı");
  const existing = await db.shopMember.findUnique({ where: { email: norm } });
  if (existing) throw new Error("Bu e-posta ile kayıt zaten var");
  const member = await db.shopMember.create({
    data: {
      email: norm,
      passwordHash: hashPassword(password),
      name: String(name || "").trim() || norm.split("@")[0] || "",
      provider: "email",
    },
  });
  await mergeGuestShopCartIntoMember(syncToken, norm);
  await syncMemberCartFromShopEmail(member.id, norm);
  return createSessionForMember(member.id);
}

export async function loginWithGoogle(
  idToken: string,
  syncToken?: string | null,
): Promise<MemberSessionPayload> {
  const g = await verifyGoogleIdToken(idToken);
  let member = await db.shopMember.findUnique({ where: { email: g.email } });
  if (!member) {
    member = await db.shopMember.create({
      data: {
        email: g.email,
        name: g.name,
        provider: "google",
        picture: g.picture,
      },
    });
  } else {
    member = await db.shopMember.update({
      where: { id: member.id },
      data: {
        name: member.name || g.name,
        provider: "google",
        picture: g.picture || member.picture,
      },
    });
  }
  await mergeGuestShopCartIntoMember(syncToken, g.email);
  await syncMemberCartFromShopEmail(member.id, g.email);
  return createSessionForMember(member.id);
}

export async function updateMemberCart(
  memberId: string,
  items: ShopCartLine[],
  replace = false,
) {
  const member = await db.shopMember.findUnique({ where: { id: memberId } });
  const merged = replace
    ? normalizeShopCartItems(items)
    : mergeShopCartItems(member?.cartItems ?? [], items);
  await db.shopMember.update({
    where: { id: memberId },
    data: { cartItems: shopCartItemsToJson(merged) },
  });
  return merged;
}

/** Misafir sepetini üye e-posta anahtarına taşır (cihazlar arası). */
export async function mergeGuestShopCartIntoMember(
  syncToken: string | null | undefined,
  memberEmail: string,
): Promise<void> {
  const guestKey = resolveShopCartKey(syncToken, null);
  const emailKey = resolveShopCartKey(null, memberEmail);
  if (!guestKey || !emailKey || guestKey === emailKey || !guestKey.startsWith("guest:")) {
    return;
  }
  const guest = await db.shopCart.findUnique({ where: { cartKey: guestKey } });
  if (!guest) return;
  const emailRow = await db.shopCart.findUnique({ where: { cartKey: emailKey } });
  const merged = mergeShopCartItems(emailRow?.items ?? [], guest.items);
  await db.shopCart.upsert({
    where: { cartKey: emailKey },
    create: { cartKey: emailKey, items: shopCartItemsToJson(merged) },
    update: { items: shopCartItemsToJson(merged) },
  });
}

async function syncMemberCartFromShopEmail(memberId: string, email: string): Promise<void> {
  const merged = await loadUnifiedShopCart({ memberEmail: email, memberId });
  await persistUnifiedShopCart({ memberId, memberEmail: email, items: merged });
}

/** Üye + e-posta ShopCart + misafir token — tek birleşik sepet (cihazlar arası). */
export async function loadUnifiedShopCart(opts: {
  syncToken?: string | null;
  memberEmail?: string | null;
  memberId?: string | null;
}): Promise<ShopCartLine[]> {
  const { syncToken, memberEmail, memberId } = opts;
  let merged: ShopCartLine[] = [];

  if (memberId) {
    const member = await db.shopMember.findUnique({ where: { id: memberId } });
    merged = mergeShopCartItems(merged, member?.cartItems ?? []);
  }

  const emailKey = resolveShopCartKey(null, memberEmail);
  if (emailKey) {
    const row = await db.shopCart.findUnique({ where: { cartKey: emailKey } });
    merged = mergeShopCartItems(merged, row?.items ?? []);
  }

  const guestKey = resolveShopCartKey(syncToken, null);
  if (guestKey?.startsWith("guest:") && guestKey !== emailKey) {
    const guest = await db.shopCart.findUnique({ where: { cartKey: guestKey } });
    merged = mergeShopCartItems(merged, guest?.items ?? []);
  }

  return normalizeShopCartItems(merged);
}

/** Üye kaydı ve e-posta ShopCart satırını aynı içerikle günceller. */
export async function persistUnifiedShopCart(opts: {
  memberId?: string | null;
  memberEmail?: string | null;
  items: ShopCartLine[];
}): Promise<ShopCartLine[]> {
  const items = normalizeShopCartItems(opts.items);
  const emailKey = resolveShopCartKey(null, opts.memberEmail);
  if (emailKey) {
    await db.shopCart.upsert({
      where: { cartKey: emailKey },
      create: { cartKey: emailKey, items: shopCartItemsToJson(items) },
      update: { items: shopCartItemsToJson(items) },
    });
  }
  if (opts.memberId) {
    await db.shopMember.update({
      where: { id: opts.memberId },
      data: { cartItems: shopCartItemsToJson(items) },
    });
  }
  return items;
}

export function sessionResponse(payload: MemberSessionPayload) {
  return {
    success: true,
    token: payload.token,
    expiresAt: payload.expiresAt,
    user: payload.user,
    items: payload.items,
  };
}

export function tokenFingerprint(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 16);
}
