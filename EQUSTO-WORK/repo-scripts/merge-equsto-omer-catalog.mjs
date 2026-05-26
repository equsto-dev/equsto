/**
 * Equsto-ömer kaynak JSON → public/data/ekipmanlar.json
 *
 *   Equsto-ömer/Öztiryakiler/ekipmanlar.json
 *   Equsto-ömer/Kariyer Mutfak/kariyer_mutfak.json
 *
 * Kullanım (proje kökü):
 *   node scripts/merge-equsto-omer-catalog.mjs
 *   node scripts/merge-equsto-omer-catalog.mjs --dry-run
 *   npm run data:merge-omer
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugifyEq } from "./eq-seo-lib.mjs";
import { fetchEurTryRate } from "./lib/eur-try-rate.mjs";
import { sanitizeCatalogProduct } from "./lib/sanitize-vendor-leaks.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

const DEFAULT_OZTI = path.join(ROOT, "Equsto-ömer", "Öztiryakiler", "ekipmanlar.json");
const DEFAULT_KM = path.join(ROOT, "Equsto-ömer", "Kariyer Mutfak", "kariyer_mutfak.json");
const CATALOG = path.join(ROOT, "public", "data", "ekipmanlar.json");
const REMOVED_IDS_PATH = path.join(ROOT, "public", "data", "catalog-removed-ids.json");

function loadRemovedIds() {
  try {
    if (!fs.existsSync(REMOVED_IDS_PATH)) return new Set();
    const j = JSON.parse(fs.readFileSync(REMOVED_IDS_PATH, "utf8"));
    return new Set((j.ids || []).map((id) => String(id).trim()).filter(Boolean));
  } catch (_) {
    return new Set();
  }
}

let EUR_TRY = 52.8159;
let EUR_TRY_META = null;
const KDV = 1.2;

const DRY_RUN = process.argv.includes("--dry-run");

/** Üst kategori (Türkçe) → ekipmanlar.json category slug */
const TOP_CATEGORY_SLUG = {
  "soğutma ekipmanları": "sogutma-ekipmanlari",
  "sogutma ekipmanlari": "sogutma-ekipmanlari",
  "buz makineleri": "icecek-berrak-buz-makineleri",
  "fırınlar": "sanayi-ocaklari",
  "firinlar": "sanayi-ocaklari",
  "kahve makineleri": "kahve-makineleri",
  "et hazırlık makineleri": "et-hazirlik-makineleri",
  "et hazirlik makineleri": "et-hazirlik-makineleri",
  "sanayi tipi izgaralar": "sanayi-tipi-izgaralar",
  "sanayi tipi i̇zgaralar": "sanayi-tipi-izgaralar",
  "ocakbaşı & ızgara": "ocakbasi-izgara",
  "ocakbasi & ızgara": "ocakbasi-izgara",
  "piliç çevirme makineleri": "pilic-cevirme-makineleri",
  "pilic cevirme makineleri": "pilic-cevirme-makineleri",
  "bulaşıkhane ekipmanları": "bulasik-makineleri",
  "bulasikhane ekipmanlari": "bulasik-makineleri",
  "hazırlık makineleri": "hamur-hazirlik-makineleri",
  "hazirlik makineleri": "hamur-hazirlik-makineleri",
  "ana mutfak ekipmanları": "sanayi-ocaklari",
  "ana mutfak ekipmanlari": "sanayi-ocaklari",
  "soğuk üniteler": "sogutma-ekipmanlari",
  "soguk uniteler": "sogutma-ekipmanlari",
  "modüler mutfaklar": "sanayi-ocaklari",
  "nötr üniteler": "sanayi-ocaklari",
  "setüstü mutfak ekipmanları": "sanayi-ocaklari",
  "yardımcı mutfak ekipmanları": "sanayi-ocaklari",
  "masaüstü ve sunum ekipmanları": "yiyecek-ve-icecek-otomatlari-",
  "pastane ekipmanları": "hamur-hazirlik-makineleri",
  "kahve makineleri": "kahve-makineleri",
  "içecek ve bar ekipmanları": "yiyecek-ve-icecek-otomatlari-",
  "açık büfe ve servis üniteleri": "yiyecek-ve-icecek-otomatlari-",
  "hijyen ve sanitasyon ekipmanları": "yikama-ekipmanlari",
  "çikolata temperleme makineleri": "cikolata-temperleme-makinesi-",
  "cikolata temperleme makinesi": "cikolata-temperleme-makinesi-",
  "çay kazanları çay makineleri çay otomatları": "cay-kazanlari-cay-makineleri-cay-otomatlari",
  "endüstriyel mutfak": "sanayi-ocaklari",
  "kampanyalı ürünler": "sanayi-ocaklari",
};

function argPath(flag, def) {
  const a = process.argv.find((x) => x.startsWith(flag + "="));
  return a ? a.slice(flag.length + 1) : def;
}

function normKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeKey(row) {
  const sku = row.sku || row.ürün_kodu;
  if (sku) return "sku:" + normKey(sku);
  const brand = normKey(row.brand || row.ürün_markası);
  const name = normKey(row.name || row.ürün_adı);
  return "nm:" + brand + "|" + name;
}

function fmtTry(n) {
  return Number(n).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function priceFromEur(netEur) {
  if (netEur == null || !Number.isFinite(netEur) || netEur <= 0) {
    return "Teklif için iletişim";
  }
  const netTry = netEur * EUR_TRY;
  const grossTry = netTry * KDV;
  return `₺${fmtTry(netTry)} + KDV\nKDV Dahil ₺${fmtTry(grossTry)}`;
}

function netEurFromRow(row) {
  const para = String(row.para_birimi || "EUR").toUpperCase();
  if (row.iskontolu_fiyat != null && Number(row.iskontolu_fiyat) > 0) {
    return Number(row.iskontolu_fiyat);
  }
  if (row.fiyat != null && Number(row.fiyat) > 0) {
    const f = Number(row.fiyat);
    if (row.bayi_iskonto != null && row.bayi_iskonto > 0 && row.bayi_iskonto < 1) {
      return f * (1 - Number(row.bayi_iskonto));
    }
    return f;
  }
  if (row.fiyat_kdv_dahil != null && Number(row.fiyat_kdv_dahil) > 0) {
    return Number(row.fiyat_kdv_dahil) / KDV;
  }
  if (row.fiyat_kdv_hariç != null && Number(row.fiyat_kdv_hariç) > 0) {
    return Number(row.fiyat_kdv_hariç);
  }
  if (para === "TRY" && row.fiyat != null) return null;
  return null;
}

function categorySlugFromKategori(kategori) {
  const parts = String(kategori || "")
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
  const top = parts[0] || "";
  const leaf = parts[parts.length - 1] || "";
  const tl = top.toLocaleLowerCase("tr");
  const ll = leaf.toLocaleLowerCase("tr");

  if (ll.includes("izgara") || ll.includes("ızgara") || ll.includes("ocakbaşı") || ll.includes("ocakbasi")) {
    if (ll.includes("ocakbaşı") || ll.includes("ocakbasi")) return "ocakbasi-izgara";
    return "sanayi-tipi-izgaralar";
  }
  if (ll.includes("kuzine")) return "kuzineler";
  if (ll.includes("fritöz") || ll.includes("fritoz")) return "fritozler";
  if (ll.includes("döner") || ll.includes("doner")) return "doner-ocaklari-";
  if (ll.includes("piliç") && ll.includes("çevir")) return "pilic-cevirme-makineleri";
  if (ll.includes("tost")) return "tost-makineleri";
  if (ll.includes("bulaşık") || ll.includes("bulasik")) return "bulasik-makineleri";
  if (ll.includes("hamur")) return "hamur-hazirlik-makineleri";
  if (ll.includes("et ") && (ll.includes("hazır") || ll.includes("hazir") || ll.includes("kıyma") || ll.includes("kiyma"))) {
    return "et-hazirlik-makineleri";
  }
  if (ll.includes("kahve") || ll.includes("espresso")) return "kahve-makineleri";
  if (ll.includes("buz")) {
    if (ll.includes("berrak") || ll.includes("küp") || ll.includes("kup")) return "icecek-berrak-buz-makineleri";
    return "sogutma-ekipmanlari";
  }
  if (ll.includes("soğut") || ll.includes("sogut") || ll.includes("buzdolab") || ll.includes("derin dondur")) {
    return "sogutma-ekipmanlari";
  }
  if (ll.includes("çay") || ll.includes("cay")) return "cay-kazanlari-cay-makineleri-cay-otomatlari";
  if (ll.includes("çikolata") || ll.includes("cikolata")) return "cikolata-temperleme-makinesi-";

  if (TOP_CATEGORY_SLUG[tl]) return TOP_CATEGORY_SLUG[tl];

  const slug = slugifyEq(top);
  if (slug && slug.length > 2) return slug;
  return "sanayi-ocaklari";
}

function normalizeImages(resimler) {
  if (!Array.isArray(resimler)) return [];
  return resimler
    .map((r) => String(r || "").replace(/\//g, "\\").trim())
    .filter(Boolean);
}

function convertRow(row, source) {
  const name = String(row.ürün_adı || row.name || "").trim();
  const brand = String(row.ürün_markası || row.brand || "").trim();
  if (!name) return null;

  const out = {
    category: categorySlugFromKategori(row.kategori || row.category),
    brand,
    name,
    price: priceFromEur(netEurFromRow(row)),
    specs: String(row.açıklamalar_site || row.açıklamalar || row.specs || "").trim(),
    images: normalizeImages(row.resimler || row.images),
  };

  const sku = row.ürün_kodu || row.sku;
  if (sku) out.sku = String(sku).trim();
  if (row.model_numarası) out.model = String(row.model_numarası).trim();
  if (row.barkod) out.barcode = String(row.barkod).trim();
  if (row.ürün_linki) out.sourceUrl = String(row.ürün_linki).trim();
  out._importSource = source;

  return sanitizeCatalogProduct(out);
}

function loadJson(p) {
  if (!fs.existsSync(p)) throw new Error("Dosya yok: " + p);
  const raw = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!Array.isArray(raw)) throw new Error("Dizi bekleniyor: " + p);
  return raw;
}

async function main() {
  EUR_TRY_META = await fetchEurTryRate();
  EUR_TRY = EUR_TRY_META.rate;
  if (EUR_TRY_META.warnings && EUR_TRY_META.warnings.length) {
    console.warn("[merge-omer] Kur uyarıları:");
    EUR_TRY_META.warnings.forEach((w) => console.warn("  -", w));
  }

  const ozPath = argPath("--ozti", DEFAULT_OZTI);
  const kmPath = argPath("--kariyer", DEFAULT_KM);

  const ozti = loadJson(ozPath);
  const kariyer = loadJson(kmPath);
  const current = fs.existsSync(CATALOG) ? loadJson(CATALOG) : [];

  const map = new Map();
  let keptSpecial = 0;

  for (const p of current) {
    if (p.equstoPage || p.vendor) {
      map.set(dedupeKey(p), { ...p });
      keptSpecial++;
    } else {
      map.set(dedupeKey(p), { ...p });
    }
  }

  const stats = { kariyer: { ok: 0, skip: 0 }, ozti: { ok: 0, skip: 0 }, replaced: 0, added: 0 };

  function applyBatch(rows, source) {
    const st = stats[source === "kariyer" ? "kariyer" : "ozti"];
    for (const row of rows) {
      const item = convertRow(row, source);
      if (!item) {
        st.skip++;
        continue;
      }
      const key = dedupeKey(item);
      const had = map.has(key);
      map.set(key, item);
      st.ok++;
      if (had) stats.replaced++;
      else stats.added++;
    }
  }

  applyBatch(kariyer, "kariyer");
  applyBatch(ozti, "ozti");

  const removedIds = loadRemovedIds();
  const merged = Array.from(map.values())
    .filter((p) => !removedIds.has(String(p.id || "").trim()))
    .map((p) => {
      const copy = { ...p };
      delete copy._importSource;
      return copy;
    });
  if (removedIds.size) {
    console.log("[merge-omer] Kalıcı çıkarılan id filtresi:", removedIds.size);
  }

  merged.sort((a, b) => {
    const ba = (a.brand || "").localeCompare(b.brand || "", "tr");
    if (ba) return ba;
    return (a.name || "").localeCompare(b.name || "", "tr");
  });

  console.log("[merge-omer] Kaynaklar:");
  console.log("  Öztiryakiler:", ozPath, "→", ozti.length, "kayıt");
  console.log("  Kariyer:", kmPath, "→", kariyer.length, "kayıt");
  console.log("  Mevcut katalog:", current.length);
  console.log(
    "[merge-omer] EUR/TRY:",
    EUR_TRY,
    "—",
    EUR_TRY_META.label || EUR_TRY_META.source,
    "(" + (EUR_TRY_META.fetchedAt || "").slice(0, 10) + ")",
  );
  console.log("[merge-omer] Kur kaydı: public/data/equsto-eur-try-rate.json");
  console.log("[merge-omer] Sonuç:", merged.length, "ürün");
  console.log("  Kariyer işlendi:", stats.kariyer.ok, "atlanan:", stats.kariyer.skip);
  console.log("  Öztiryakiler işlendi:", stats.ozti.ok, "atlanan:", stats.ozti.skip);
  console.log("  Yeni anahtar:", stats.added, "güncellenen:", stats.replaced);
  console.log("  equstoPage/vendor korunan:", keptSpecial);

  if (DRY_RUN) {
    console.log("[merge-omer] --dry-run: dosya yazılmadı.");
    return;
  }

  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const backup = CATALOG + ".backup-" + stamp;
  if (fs.existsSync(CATALOG)) {
    fs.copyFileSync(CATALOG, backup);
    console.log("[merge-omer] Yedek:", backup);
  }

  fs.writeFileSync(CATALOG, JSON.stringify(merged, null, 4) + "\n", "utf8");
  console.log("[merge-omer] Yazıldı:", CATALOG);
  console.log("[merge-omer] Sonraki adım: npm run data:fallback");
}

main().catch((e) => {
  console.error("[merge-omer] Hata:", e && e.message ? e.message : e);
  process.exit(1);
});
