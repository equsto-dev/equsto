/**
 * Çağlayan ürün JSON → katalog PDF yolu (public/data/caglayan-market/…)
 */
import fs from "node:fs";
import path from "node:path";

/**
 * @param {Record<string, unknown>} urun
 * @param {string} srcRoot PFOS …/caglayan-refrigeration
 * @returns {{ rel: string, url: string, fileName: string } | null}
 */
export function extractCaglayanCatalogPdf(urun, srcRoot) {
  const slug = String(urun.slug || "").trim();
  if (!slug) return null;

  const tum = urun.gorseller?.tum;
  const list = Array.isArray(tum) ? tum : [];
  for (const g of list) {
    const dosya = String(g.dosya || "").replace(/\\/g, "/");
    const url = String(g.url || "");
    if (!/\.pdf$/i.test(dosya) && !/\.pdf$/i.test(url)) continue;
    if (/pdf-icon/i.test(dosya) || /pdf-icon/i.test(url)) continue;
    const fileName = path.basename(dosya || url).split("?")[0];
    if (!fileName) continue;
    return {
      rel: `caglayan-market/${slug}/${fileName}`,
      url: url || "",
      fileName,
    };
  }

  const title = String(urun.baslik || slug).trim();
  const guess =
    title.length >= 2
      ? title.charAt(0).toLocaleUpperCase("tr") + title.slice(1).toLocaleLowerCase("tr")
      : "";
  const candidates = guess
    ? [`${guess}.pdf`, `${title.toUpperCase()}.pdf`, `${slug}.pdf`]
    : [`${slug}.pdf`];

  for (const fileName of candidates) {
    const abs = path.join(srcRoot, "gorseller", slug, fileName);
    if (fs.existsSync(abs)) {
      return { rel: `caglayan-market/${slug}/${fileName}`, url: "", fileName };
    }
  }
  return null;
}

/** @param {Record<string, unknown>} urun */
export function extractCaglayanOzellikler(urun) {
  return (urun.ozellikler || [])
    .map((o) => {
      const b = String(o.baslik || "").trim();
      const a = String(o.aciklama || "").trim();
      if (b && a) return `${b}: ${a}`;
      return a || b;
    })
    .filter(Boolean);
}

/** @param {Record<string, unknown>} urun */
export function buildCaglayanTeknikAkordeon(urun) {
  const blocks = [];
  const ak = urun.teknik?.akordeon;
  if (Array.isArray(ak)) {
    for (const block of ak) {
      const tablolar = [];
      for (const sek of block.sekmeler || []) {
        for (const tab of sek.tablolar || []) {
          if ((tab.basliklar && tab.basliklar.length) || (tab.satirlar && tab.satirlar.length)) {
            tablolar.push({
              altBaslik: sek.baslik || "",
              basliklar: tab.basliklar || [],
              satirlar: tab.satirlar || [],
            });
          }
        }
      }
      for (const tab of block.tablolar || []) {
        if ((tab.basliklar && tab.basliklar.length) || (tab.satirlar && tab.satirlar.length)) {
          tablolar.push({ altBaslik: "", basliklar: tab.basliklar || [], satirlar: tab.satirlar || [] });
        }
      }
      if (!tablolar.length) {
        for (const tab of urun.teknik?.tablolar || []) {
          if ((tab.basliklar && tab.basliklar.length) || (tab.satirlar && tab.satirlar.length)) {
            tablolar.push({ altBaslik: "", basliklar: tab.basliklar || [], satirlar: tab.satirlar || [] });
          }
        }
      }
      if (tablolar.length) {
        blocks.push({ baslik: String(block.baslik || urun.baslik || "Teknik detaylar"), tablolar });
      }
    }
  }
  if (!blocks.length && urun.teknik?.tablolar?.length) {
    blocks.push({
      baslik: "Teknik detaylar",
      tablolar: urun.teknik.tablolar.map((tab) => ({
        altBaslik: "",
        basliklar: tab.basliklar || [],
        satirlar: tab.satirlar || [],
      })),
    });
  }
  return blocks.slice(0, 12);
}
