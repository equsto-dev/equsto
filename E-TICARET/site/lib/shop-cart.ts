import type { Prisma } from "@/lib/prisma";

export type ShopCartLine = {
  id?: string;
  n?: string;
  b?: string;
  c?: string;
  p?: string;
  img?: string;
  q?: number;
  quote?: boolean;
};

const MAX_LINES = 250;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function resolveShopCartKey(syncToken?: string | null, memberEmail?: string | null): string | null {
  const email = String(memberEmail ?? "")
    .trim()
    .toLowerCase();
  if (email && EMAIL_RE.test(email) && email.length <= 200) {
    return `email:${email}`;
  }
  const tok = String(syncToken ?? "").trim().toLowerCase();
  if (UUID_RE.test(tok)) return `guest:${tok}`;
  return null;
}

function lineId(it: ShopCartLine): string {
  const c = String(it.c ?? "").trim();
  const b = String(it.b ?? "").trim();
  const n = String(it.n ?? "").trim();
  const s = `${c}\t${b}\t${n}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `eq${(h >>> 0).toString(36)}`;
}

function isQuotePriceLabel(p: unknown): boolean {
  const s = String(p ?? "").trim();
  if (!s) return false;
  if (/€|eur|teklif/i.test(s)) return true;
  const num = Number(String(s).replace(/[^\d.,]/g, "").replace(",", "."));
  return num === 0 && /\d/.test(s);
}

export function normalizeShopCartLine(x: unknown): ShopCartLine | null {
  if (!x || typeof x !== "object") return null;
  const o = x as ShopCartLine;
  const n = String(o.n ?? "").trim();
  const b = String(o.b ?? "").trim();
  const c = String(o.c ?? "").trim();
  if (!n && !b) return null;
  const p = String(o.p ?? "").trim();
  const quote = !!(o.quote || isQuotePriceLabel(p));
  const id = String(o.id ?? "").trim() || lineId({ n, b, c });
  return {
    id,
    n,
    b,
    c,
    p,
    img: String(o.img ?? "").trim(),
    q: quote ? 1 : Math.max(1, Math.min(99, Math.round(Number(o.q) || 1))),
    quote,
  };
}

/** Aynı ürün satırını tekilleştirir; adet = max (çift sayım önlenir). */
export function normalizeShopCartItems(raw: unknown): ShopCartLine[] {
  const map: Record<string, ShopCartLine> = {};
  const arr = Array.isArray(raw) ? raw : [];
  for (const x of arr) {
    const it = normalizeShopCartLine(x);
    if (!it) continue;
    const id = it.id!;
    if (map[id]) {
      map[id].q = it.quote ? 1 : Math.max(map[id].q ?? 1, it.q ?? 1);
      if (it.p) map[id].p = it.p;
      if (it.img && !map[id].img) map[id].img = it.img;
      if (it.quote) map[id].quote = true;
    } else {
      map[id] = it;
    }
  }
  const out = Object.values(map);
  return out.length > MAX_LINES ? out.slice(0, MAX_LINES) : out;
}

export function shopCartItemsToJson(items: ShopCartLine[]): Prisma.InputJsonValue {
  return normalizeShopCartItems(items) as unknown as Prisma.InputJsonValue;
}

export function guestTokenFromCartKey(cartKey: string): string | null {
  if (cartKey.startsWith("guest:")) return cartKey.slice(6);
  return null;
}

export function randomLinkCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
