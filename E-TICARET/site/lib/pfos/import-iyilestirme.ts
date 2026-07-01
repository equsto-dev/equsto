import { db } from "@/lib/db";
import { referansLinkKey } from "@/lib/pfos/referans/sku-link-key";
import { createPfosFiyatKurali } from "@/lib/pfos/fiyat-kurali-admin";
import {
  parseIyilestirmeMarkdown,
  type IyilestirmeParsedEntry,
} from "@/lib/pfos/import-iyilestirme-parse";

export type ImportIyilestirmeOpts = {
  content: string;
  listeKey: string;
  teklifSayi?: string;
  dryRun?: boolean;
};

export type ImportIyilestirmeResult = {
  parsed: number;
  skuOneriCreated: number;
  skuOneriSkipped: number;
  fiyatKuraliCreated: number;
  fiyatKuraliSkipped: number;
  entries: Array<{
    poz: string;
    sorunTipi: string;
    action: "sku_oneri" | "fiyat_kurali" | "skipped";
    reason?: string;
  }>;
};

function onayNotu(entry: IyilestirmeParsedEntry, teklifSayi?: string): string {
  const parts = [`iyileştirme.md:${entry.lineNo}`, entry.rawLine];
  if (teklifSayi?.trim()) parts.push(`teklif:${teklifSayi.trim()}`);
  return parts.join(" | ");
}

/** Eski Prisma client veya migrate eksikse anlamlı hata */
export function assertPfosImportDbReady(): void {
  const missing: string[] = [];
  if (!db.pfosSkuLinkOneri) missing.push("pfosSkuLinkOneri");
  if (!db.pfosFiyatKurali) missing.push("pfosFiyatKurali");
  if (missing.length === 0) return;
  throw new Error(
    `Prisma client güncel değil (eksik: ${missing.join(", ")}). ` +
      "Çalıştırın: npm run db:generate && npm run db:migrate:deploy",
  );
}

async function hasPendingOneri(linkKey: string, notu: string): Promise<boolean> {
  const row = await db.pfosSkuLinkOneri.findFirst({
    where: { linkKey, durum: "pending", onayNotu: notu },
    select: { id: true },
  });
  return !!row;
}

async function hasFiyatKurali(
  listeKey: string,
  poz: string,
  carpan: number,
): Promise<boolean> {
  const row = await db.pfosFiyatKurali.findFirst({
    where: {
      listeKey,
      poz,
      kuralTipi: "carp",
      carpan,
      aktif: true,
    },
    select: { id: true },
  });
  return !!row;
}

export async function importIyilestirmeMarkdown(
  opts: ImportIyilestirmeOpts,
): Promise<ImportIyilestirmeResult> {
  const listeKey = opts.listeKey.trim().toLowerCase();
  if (!listeKey) throw new Error("listeKey zorunlu");

  if (!opts.dryRun) {
    assertPfosImportDbReady();
  }

  const parsed = parseIyilestirmeMarkdown(opts.content);
  const result: ImportIyilestirmeResult = {
    parsed: parsed.length,
    skuOneriCreated: 0,
    skuOneriSkipped: 0,
    fiyatKuraliCreated: 0,
    fiyatKuraliSkipped: 0,
    entries: [],
  };

  for (const entry of parsed) {
    if (entry.sorunTipi === "fiyat_kurali") {
      const carpan = entry.fiyatCarpan ?? 4;
      const exists = opts.dryRun
        ? false
        : await hasFiyatKurali(listeKey, entry.poz, carpan);
      if (exists) {
        result.fiyatKuraliSkipped += 1;
        result.entries.push({
          poz: entry.poz,
          sorunTipi: entry.sorunTipi,
          action: "skipped",
          reason: "fiyat_kurali_mevcut",
        });
        continue;
      }
      if (!opts.dryRun) {
        await createPfosFiyatKurali({
          kapsam: "liste_key",
          listeKey,
          poz: entry.poz,
          isimKalibi: entry.isimKalibi ?? "tava",
          kuralTipi: "carp",
          carpan,
          aciklama: entry.rawLine,
          kaynak: "iyilestirme_import",
          aktif: true,
        });
      }
      result.fiyatKuraliCreated += 1;
      result.entries.push({
        poz: entry.poz,
        sorunTipi: entry.sorunTipi,
        action: "fiyat_kurali",
      });
      continue;
    }

    const linkKey = referansLinkKey(listeKey, entry.poz);
    const notu = onayNotu(entry, opts.teklifSayi);
    const pending = opts.dryRun
      ? false
      : await hasPendingOneri(linkKey, notu);
    if (pending) {
      result.skuOneriSkipped += 1;
      result.entries.push({
        poz: entry.poz,
        sorunTipi: entry.sorunTipi,
        action: "skipped",
        reason: "pending_oneri_mevcut",
      });
      continue;
    }

    if (!opts.dryRun) {
      await db.pfosSkuLinkOneri.create({
        data: {
          feedbackId: null,
          linkKey,
          listeKey,
          poz: entry.poz,
          yeniSku: "",
          yeniMarka: entry.marka ?? null,
          sorunTipi: entry.sorunTipi,
          onayNotu: notu,
          durum: "pending",
        },
      });
    }
    result.skuOneriCreated += 1;
    result.entries.push({
      poz: entry.poz,
      sorunTipi: entry.sorunTipi,
      action: "sku_oneri",
    });
  }

  return result;
}
