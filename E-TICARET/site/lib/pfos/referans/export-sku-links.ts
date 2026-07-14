import fs from "node:fs";
import path from "node:path";
import {
  invalidateDbReferansSkuLinksCache,
  listReferansSkuLinks,
} from "./sku-link-db";

export type ExportSkuLinksResult = {
  dbLinkCount: number;
  totalKeys: number;
  outPath: string;
  version: number;
};

export function defaultSkuLinksJsonPath(siteRoot?: string): string {
  const root = siteRoot ?? path.join(process.cwd());
  return path.join(root, "public", "data", "pfos-referans-sku-links.json");
}

/** DB onaylı linkleri JSON dosyasına yazar (atomik). DB kayıtları mevcut JSON üzerine yazılır. */
export async function exportReferansSkuLinksToJson(
  outPath = defaultSkuLinksJsonPath(),
): Promise<ExportSkuLinksResult> {
  let existing: {
    version?: number;
    note?: string;
    links?: Record<string, unknown>;
  } = { version: 1, links: {} };

  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
  }

  const rows = await listReferansSkuLinks(5000);
  const links: Record<string, { sku: string; name?: string; marka?: string }> =
    { ...(existing.links as Record<string, { sku: string; name?: string; marka?: string }>) };

  for (const row of rows) {
    const entry: { sku: string; name?: string; marka?: string } = { sku: row.sku };
    if (row.name) entry.name = row.name;
    if (row.marka) entry.marka = row.marka;
    links[row.linkKey] = entry;
  }

  const version =
    typeof existing.version === "number" ? existing.version + (rows.length > 0 ? 1 : 0) : 1;

  const out = {
    version,
    note:
      existing.note ||
      "Doğrulanmış referans poz → katalog SKU. Anahtar: {listeKey}|{poz}. DB export ile güncellenir.",
    exportedAt: new Date().toISOString(),
    dbLinkCount: rows.length,
    links,
  };

  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${outPath}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  fs.renameSync(tmp, outPath);

  // Dosya cache (referans-eslestirme) ayrı process'te mtime ile yenilenir.
  // Oraya dinamik import CLI+tsx altında data: URL ile ERR_UNSUPPORTED_RESOLVE_REQUEST verir.
  invalidateDbReferansSkuLinksCache();

  return {
    dbLinkCount: rows.length,
    totalKeys: Object.keys(links).length,
    outPath,
    version,
  };
}
