#!/usr/bin/env node
/**
 * PFOS/veri/electrolux-professional → public/data/dept/*.json + görseller
 *
 *   node scripts/import-electrolux-professional.mjs
 *   node scripts/import-electrolux-professional.mjs --dry-run
 */
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { foldTr, slugify } from "./lib/ozti-enrich.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional/products-tr.json");
const SRC_PAGES = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional/urun-sayfalari");
const SRC_MEDIA_IMG = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional/media/images");
const SRC_MEDIA_DOC = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional/media/documents");
const DEPT_DIR = path.join(ROOT, "public/data/dept");
const OUT_IMG = path.join(ROOT, "public/images/catalog/electrolux");
const OUT_DOC = path.join(ROOT, "public/data/electrolux-professional/docs");
const MANIFEST = path.join(ROOT, "public/data/electrolux-professional/manifest.json");

const BRAND = "Electrolux Professional";
const OEM_BRAND = "Electrolux";
const BRAND_ID = "electrolux-professional";
const KAYNAK = "electrolux-professional";
const dryRun = process.argv.includes("--dry-run");

function mapDept(p) {
  const rawUrl = String(p.url || "").toLowerCase();
  if (rawUrl.includes("/dinamik-haz") || rawUrl.includes("dinamik-hazirlik")) return "hazirlik";
  if (
    rawUrl.includes("pisirme-ekipman") ||
    rawUrl.includes("pi%C5%9Firme") ||
    /\/900xp\/|\/700xp\/|\/800xp\//.test(rawUrl)
  )
    return "pisirme";
  const h = foldTr(
    [p.category, p.title, p.description, p.listing || "", p.url || ""].join(" "),
  );
  if (
    /moduler pisirme|\b700xp\b|\b900xp\b|\b800xp\b|powergrill|combioven|konveksiyonlu firin|tristar|speedelight|touchline|induksiyon ocak|gazli izgara|elektrikli izgara|barbek|lavatas izgara|fritoz|kaynatma|brattop|wok|kuzine|moduler ocak/.test(
      h,
    )
  )
    return "pisirme";
  if (/bulasik|bardak yikama|green.?clean|neoblue|giyotin tip|konveyor|hygiene|yikama mak/.test(h))
    return "yikama";
  if (/buzdolab|sogutucu|dondurucu|buz mak|soguk oda|ecostore|blast|sok sogut|saladet|sarap dolap|tezgah tipi sogut|vitrin/.test(h))
    return "sogutma";
  if (/espresso|kahve mak|nuova|appia/.test(h)) return "kahve";
  if (
    /dograyici|blender|vakum|hamur|planet|sebze hazirlik|sebze kes|sebze yikama|trinity|kesme diski|yogur|dilimleme|turbo|mikser|tbx|el mikser|dinamik hazirlik|et hazirlik|balik hazirlik|parcalayici|ricer|cutter|kesme mak|sivi lastirici/.test(
      h,
    )
  )
    return "hazirlik";
  if (/dispenser|icecek|soft serve|slush|ayran/.test(h)) return "icecek";
  if (/havalandirma|davlumbaz|aspirasyon|hood system/.test(h)) return "davlumbaz";
  if (/servis arab|tepsi araba|tabak araba|mutfak araba|termobox|flexy|teshir/.test(h)) return "servis";
  if (/araba|tekerlekli tasima|platemate/.test(h)) return "araba";
  if (/calisma tezgah|paslanmaz celik imal|ara tezgah|evye|lavabo/.test(h)) return "tezgah";
  if (/dolap|alt dolap|ust dolap|depolama/.test(h) && !/buzdolab|sogutucu|dolapli/.test(h))
    return "dolap";
  return "pisirme";
}

function mapCategory(p, dept) {
  const base = slugify(p.category || p.title || "electrolux");
  if (base && base.length > 2) return base.slice(0, 72);
  return `${dept}-electrolux`;
}

function formatSpecs(p, docRels) {
  const lines = [p.title, "", p.description || ""].filter(Boolean);
  for (const g of p.specifications || []) {
    lines.push("", `=== ${g.group} ===`);
    for (const it of g.items || []) {
      if (it.label && it.value && it.label !== it.value) lines.push(`${it.label}: ${it.value}`);
      else lines.push(it.value || it.label);
    }
  }
  for (const g of p.features || []) {
    lines.push("", `=== ${g.group} ===`);
    for (const t of g.items || []) lines.push(`• ${t}`);
  }
  if ((p.accessories || []).length) {
    lines.push("", "=== Dahil aksesuarlar ===");
    for (const a of p.accessories) {
      lines.push(`${a.code} × ${a.quantity || 1} — ${a.description || ""}`.trim());
    }
  }
  if (docRels.length) {
    lines.push("", "=== Dökümanlar ===");
    for (const d of docRels) lines.push(`${d.category}: ${d.title} (${d.type})`);
  }
  lines.push("", `Kaynak: Electrolux Professional (COD ${p.cod})`, `Ürün sayfası: ${p.url || ""}`);
  return lines.join("\n");
}

function teknikLines(p) {
  const out = [];
  for (const g of p.specifications || []) {
    for (const it of g.items || []) {
      if (it.label && it.value && it.label !== it.value) out.push(`${it.label}: ${it.value}`);
      else if (it.value) out.push(String(it.value));
    }
  }
  return out;
}

function copyTree(src, dest) {
  if (!fs.existsSync(src)) return 0;
  if (!dryRun) fs.mkdirSync(dest, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(src)) {
    const from = path.join(src, f);
    if (!fs.statSync(from).isFile()) continue;
    const to = path.join(dest, f);
    if (!dryRun) fs.copyFileSync(from, to);
    n++;
  }
  return n;
}

function copyProductMedia(p) {
  const cod = p.cod;
  const imgRel = [];
  const docRel = [];
  const imgN = copyTree(path.join(SRC_MEDIA_IMG, cod), path.join(OUT_IMG, cod));
  if (imgN) {
    for (const f of fs.readdirSync(path.join(OUT_IMG, cod))) {
      if (/\.(jpe?g|png|webp|gif)$/i.test(f)) imgRel.push(`images/catalog/electrolux/${cod}/${f}`);
    }
  }
  if (!imgRel.length && p.images?.length) {
    for (let i = 0; i < p.images.length; i++) {
      const im = p.images[i];
      if (im.local) {
        const src = path.resolve(ROOT, "../../PFOS/veri/electrolux-professional", im.local);
        if (fs.existsSync(src)) {
          const destDir = path.join(OUT_IMG, cod);
          const dest = path.join(destDir, path.basename(src));
          if (!dryRun) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(src, dest);
          }
          imgRel.push(`images/catalog/electrolux/${cod}/${path.basename(dest)}`);
        }
      } else if (im.full) {
        imgRel.push(im.full);
      }
    }
  }
  const docN = copyTree(path.join(SRC_MEDIA_DOC, cod), path.join(OUT_DOC, cod));
  if (docN) {
    for (const f of fs.readdirSync(path.join(OUT_DOC, cod))) {
      docRel.push({
        category: "",
        type: path.extname(f).slice(1).toUpperCase(),
        title: f,
        local: `data/electrolux-professional/docs/${cod}/${f}`,
      });
    }
  }
  for (const d of p.documents || []) {
    if (d.local && !docRel.some((x) => x.title === path.basename(d.local))) {
      docRel.push({
        category: d.category,
        type: d.type,
        title: d.title,
        url: d.url,
        local: d.local.replace(/^media\/documents/, "data/electrolux-professional/docs"),
      });
    } else if (d.url && !docRel.some((x) => x.url === d.url)) {
      docRel.push({ category: d.category, type: d.type, title: d.title, url: d.url });
    }
  }
  const codDir = path.join(OUT_DOC, cod);
  if (fs.existsSync(codDir)) {
    for (const row of docRel) {
      if (row.size != null) continue;
      const localName = row.local ? path.basename(row.local) : "";
      const diskPath = localName ? path.join(codDir, localName) : "";
      if (diskPath && fs.existsSync(diskPath)) {
        try {
          row.size = fs.statSync(diskPath).size;
        } catch (_) {}
      }
    }
  }
  return { images: imgRel, documents: docRel };
}

function toRow(p) {
  const dept = mapDept(p);
  const category = mapCategory(p, dept);
  const { images, documents } = copyProductMedia(p);
  const cod = String(p.cod || "").trim();
  const id = `${BRAND_ID}__${cod}`;
  return {
    id,
    dept,
    category,
    brand: BRAND,
    oem_brand: OEM_BRAND,
    name: p.title || `Electrolux ${cod}`,
    price: "Teklif için iletişim",
    fiyat_bekleniyor: true,
    specs: formatSpecs(p, documents),
    aciklama: [p.description, ...(p.features || []).flatMap((g) => g.items || [])].filter(Boolean).join("\n\n"),
    teknik_ozellikler: teknikLines(p),
    images: images.length ? images : undefined,
    sku: cod,
    model: cod,
    urun_kodu: cod,
    kaynak: KAYNAK,
    kaynak_url: p.url || "",
    electrolux_cod: cod,
    electrolux_category: p.category || "",
    electrolux_listing: p.listing || "",
    electrolux_documents: documents,
    linkKaynak: p.url || "",
  };
}

function isElectroluxRow(r) {
  return r && (r.kaynak === KAYNAK || r.brand === BRAND);
}

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Kaynak yok:", SRC);
    process.exit(1);
  }
  let products = JSON.parse(fs.readFileSync(SRC, "utf8"));
  if (!Array.isArray(products) || !products.length) {
    console.error("Boş kaynak");
    process.exit(1);
  }

  const byDept = new Map();
  let imgTotal = 0;
  let docTotal = 0;
  for (const p of products) {
    if (!p.cod) continue;
    const row = toRow(p);
    if (row.images?.length) imgTotal++;
    if (row.electrolux_documents?.length) docTotal++;
    if (!byDept.has(row.dept)) byDept.set(row.dept, []);
    byDept.get(row.dept).push(row);
  }

  const stats = {};
  for (const [dept, rows] of byDept) {
    const file = path.join(DEPT_DIR, `${dept}.json`);
    let kept = [];
    if (fs.existsSync(file)) {
      kept = JSON.parse(fs.readFileSync(file, "utf8")).filter((r) => !isElectroluxRow(r));
    }
    const merged = [...kept, ...rows];
    if (!dryRun) {
      fs.mkdirSync(DEPT_DIR, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(merged), "utf8");
    }
    stats[dept] = { added: rows.length, kept: kept.length, total: merged.length };
  }

  const manifest = {
    generated: new Date().toISOString(),
    brand: BRAND,
    count: products.length,
    depts: Object.fromEntries([...byDept.entries()].map(([d, r]) => [d, r.length])),
    imagesWithFile: imgTotal,
    docsLinked: docTotal,
  };
  if (!dryRun) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
  }

  console.log("[electrolux-import]", dryRun ? "DRY-RUN" : "OK", products.length, "ürün");
  for (const [d, s] of Object.entries(stats).sort((a, b) => b[1].added - a[1].added)) {
    console.log(`  ${d}: +${s.added} (toplam ${s.total})`);
  }
  console.log("  görselli:", imgTotal, "| dökümanlı:", docTotal);

  if (!dryRun) {
    execFileSync(process.execPath, ["scripts/rebuild-ekipmanlar-from-dept.mjs"], {
      cwd: ROOT,
      stdio: "inherit",
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
