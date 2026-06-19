import { Meilisearch } from "meilisearch";

/** Self-hosted Meilisearch — Hetzner Docker veya yerel (bkz. docs/MEILISEARCH.md). */

/** Vercel’de tırnaklı yapıştırma ve build-time inlining riskine karşı. */
function readEnv(name: string): string {
  const raw = process.env[name];
  if (raw == null || typeof raw !== "string") return "";
  let v = raw.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function getMeiliConfigStatus() {
  const host = readEnv("MEILISEARCH_HOST");
  const key = readEnv("MEILISEARCH_MASTER_KEY");
  const index = readEnv("MEILISEARCH_INDEX") || "equsto_products";
  const missing: string[] = [];
  if (!host) missing.push("MEILISEARCH_HOST");
  if (!key) missing.push("MEILISEARCH_MASTER_KEY");
  return {
    ok: missing.length === 0,
    missing,
    index,
    hostPreview: host ? host.replace(/\/+$/, "").slice(0, 48) + "…" : "",
  };
}

export function getMeiliAdmin() {
  const { ok, missing } = getMeiliConfigStatus();
  if (!ok) return null;
  const host = readEnv("MEILISEARCH_HOST");
  const key = readEnv("MEILISEARCH_MASTER_KEY");
  return new Meilisearch({ host, apiKey: key });
}

/** Varsayılan indeks adı — `MEILISEARCH_INDEX` ile değiştirilebilir */
export const PRODUCTS_INDEX = readEnv("MEILISEARCH_INDEX") || "equsto_products";
