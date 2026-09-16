/**
 * Prisma migrate deploy PgBouncer üzerinden çalışmaz.
 * DATABASE_URL (6543 + pgbouncer) → DIRECT_URL (5432, pooling yok).
 */
export function deriveDirectUrl(databaseUrl) {
  const raw = String(databaseUrl || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    if (u.port === "6543") u.port = "5432";
    u.searchParams.delete("pgbouncer");
    u.search = u.searchParams.toString();
    return u.toString();
  } catch {
    return raw
      .replace(":6543/", ":5432/")
      .replace("?pgbouncer=true", "")
      .replace("&pgbouncer=true", "");
  }
}

export function ensureDirectUrl(env = process.env) {
  const direct = String(env.DIRECT_URL || "").trim();
  const db = String(env.DATABASE_URL || "").trim();
  if (direct) return direct;
  if (!db) return "";
  env.DIRECT_URL = deriveDirectUrl(db);
  return env.DIRECT_URL;
}
