/**
 * Meilisearch erişim testi (Cloud UI yerine)
 *   npm run search:health
 */
import "./load-env.mjs";
import { Meilisearch } from "meilisearch";
import { printMeiliConnectionHint } from "./lib/meili-error-hint.mjs";

const host = process.env.MEILISEARCH_HOST?.trim();
const key = process.env.MEILISEARCH_MASTER_KEY?.trim();
const indexUid = process.env.MEILISEARCH_INDEX?.trim() || "equsto_products";

if (!host || !key) {
  if (!host) console.error("[meili-health] MEILISEARCH_HOST boş — Cloud Project Settings → Host URL");
  if (!key) console.error("[meili-health] MEILISEARCH_MASTER_KEY boş — Admin API Key");
  console.error("Dosya: equsto-v2/.env.local");
  process.exit(1);
}

const client = new Meilisearch({ host, apiKey: key });

try {
  const h = await client.health();
  console.log("[meili-health] OK", host, h);
  const indexes = await client.getIndexes({ limit: 20 });
  const list = indexes.results?.map((i) => i.uid) || [];
  console.log("[meili-health] indeksler:", list.length ? list.join(", ") : "(yok)");
  if (!list.includes(indexUid)) {
    console.log("[meili-health] '" + indexUid + "' yok → npm run search:index çalıştırın");
  } else {
    const st = await client.index(indexUid).getStats();
    console.log("[meili-health]", indexUid, "belge:", st.numberOfDocuments);
  }
} catch (e) {
  const msg = e?.message || e;
  console.error("[meili-health] HATA — instance hazır değil veya anahtar yanlış:");
  console.error(msg);
  printMeiliConnectionHint(host, msg);
  process.exit(1);
}
