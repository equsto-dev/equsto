/**
 * Öztiryakiler 2025 — bayi net alış + %8 Equsto kar (deneme)
 *
 *   node scripts/trial-ozti-equsto-margin.mjs
 *   node scripts/trial-ozti-equsto-margin.mjs --fresh   # xlsx'ten yeniden oku (python)
 *
 * Çıktı:
 *   scripts/data/trial/ozti-equsto-margin-deneme.json
 *   public/trial-ozti-fiyat.html  (yerel önizleme)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import {
  isOztiListeTl,
  oztiFmtTry,
  oztiIskontoYuzde,
  oztiOdemeCarpani,
  oztiSatisEur,
  OZTI_KDV_ORAN,
} from "./lib/ozti-enrich.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const XLSX = String.raw`c:\D Disk\FİYAT LİSTELERİ\Öztiryakiler Fiyat Listesi 2025-3 (5) (2).xlsx`;
const FIYAT_JSON = path.join(ROOT, "scripts/data/ozti-fiyat-2025.json");
const KUR_JSON = path.join(ROOT, "scripts/data/tcmb-kur-snapshot.json");
const EKIPMAN = path.join(ROOT, "public/data/ekipmanlar.json");
const OUT_JSON = path.join(ROOT, "scripts/data/trial/ozti-equsto-margin-deneme.json");
const OUT_HTML = path.join(ROOT, "public/trial-ozti-fiyat.html");

const EQUSTO_KAR_ORAN = 0.08;

function loadKur() {
  try {
    const j = JSON.parse(fs.readFileSync(KUR_JSON, "utf8"));
    if (j.rate > 0) return j.rate;
  } catch {
    /* */
  }
  return 53.2979;
}

function bayiNetAlis(row) {
  const liste = Number(row.liste_fiyati ?? row.liste_fiyati_eur) || 0;
  const bayi = Number(row.bayi_iskonto);
  if (liste <= 0) return null;
  const net = oztiSatisEur(liste, bayi);
  if (net != null) return net;
  return Number(row.satis_fiyati_eur ?? row.satis_fiyati_tl) || null;
}

/** Equsto net satış (KDV hariç) = bayi net × (1 + %8) */
function equstoNetSatis(bayiNet, para, kur) {
  if (!(bayiNet > 0)) return null;
  const net = Math.round(bayiNet * (1 + EQUSTO_KAR_ORAN) * 100) / 100;
  if (para === "TL") {
    return {
      equsto_net_tl: net,
      equsto_kdv_dahil_tl: Math.round(net * (1 + OZTI_KDV_ORAN / 100)),
      equsto_net_eur: null,
      equsto_kdv_dahil_eur: null,
    };
  }
  const kdvDahilEur = Math.round(net * (1 + OZTI_KDV_ORAN / 100) * 100) / 100;
  return {
    equsto_net_eur: net,
    equsto_kdv_dahil_eur: kdvDahilEur,
    equsto_net_tl: Math.round(net * kur),
    equsto_kdv_dahil_tl: Math.round(net * kur * (1 + OZTI_KDV_ORAN / 100)),
  };
}

/** Eski yanlış okuma: 0,73’ü ödeme çarpanı sanıp liste×0,73 */
function eskiYanlisBayiNet(liste, bayi) {
  if (!(liste > 0) || !(bayi > 0 && bayi < 1)) return null;
  return Math.round(liste * bayi * 100) / 100;
}

function rowToTrial(row, kur) {
  const para = isOztiListeTl(row) ? "TL" : "EUR";
  const liste = Number(row.liste_fiyati ?? row.liste_fiyati_eur) || null;
  const bayiNet = bayiNetAlis(row);
  const eq = equstoNetSatis(bayiNet, para, kur);
  const yanlisNet = eskiYanlisBayiNet(liste, Number(row.bayi_iskonto));

  return {
    urun_kodu: row.urun_kodu,
    urun_tanimi: (row.urun_tanimi || "").slice(0, 120),
    para_birimi: para,
    liste_fiyati: liste,
    kalan_oran: oztiOdemeCarpani(row.bayi_iskonto),
    bayi_iskonto_yuzde: oztiIskontoYuzde(row.bayi_iskonto),
    bayi_net_alis: bayiNet,
    equsto_kar_yuzde: EQUSTO_KAR_ORAN * 100,
    ...eq,
    eski_yanlis_net_eur: yanlisNet,
    eski_yanlis_iskonto_yuzde:
      yanlisNet != null && liste
        ? Math.round((1 - yanlisNet / liste) * 10000) / 100
        : null,
    site_katalog_tl: null,
  };
}

function loadFiyatRowsFromXlsx() {
  const py = path.join(ROOT, "scripts/trial-ozti-parse-xlsx.py");
  console.log("[trial] xlsx okunuyor:", XLSX);
  const r = spawnSync("python", [py], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 80 * 1024 * 1024,
    timeout: 180000,
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || "xlsx parse failed");
  }
  return JSON.parse(r.stdout);
}

function loadFiyatRows(fresh) {
  if (fresh || !fs.existsSync(FIYAT_JSON)) {
    return loadFiyatRowsFromXlsx();
  }
  try {
    return JSON.parse(fs.readFileSync(FIYAT_JSON, "utf8"));
  } catch {
    console.warn("[trial] ozti-fiyat-2025.json bozuk — xlsx okunuyor");
    return loadFiyatRowsFromXlsx();
  }
}

function buildHtml(meta, samples) {
  const rows = samples
    .map(
      (r) => `<tr>
      <td><code>${r.urun_kodu}</code></td>
      <td>${r.urun_tanimi}</td>
      <td class="num">${r.liste_fiyati ?? "—"}</td>
      <td class="num">%${r.bayi_iskonto_yuzde ?? "—"} (kalan ${r.kalan_oran ?? "—"})</td>
      <td class="num">${r.bayi_net_alis ?? "—"}</td>
      <td class="num">${r.equsto_kdv_dahil_tl ? oztiFmtTry(r.equsto_kdv_dahil_tl) : "—"}</td>
      <td class="num">${r.eski_yanlis_net_eur ?? "—"}</td>
      <td class="num">${r.site_katalog_tl ? oztiFmtTry(r.site_katalog_tl) : "—"}</td>
    </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8"/>
  <title>Öztiryakiler — Equsto %8 kar denemesi</title>
  <style>
    body{font-family:system-ui,sans-serif;margin:24px;color:#0f172a}
    h1{font-size:1.25rem}
    .meta{background:#f1f5f9;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:14px}
    table{border-collapse:collapse;width:100%;font-size:13px}
    th,td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left;vertical-align:top}
    th{background:#001e50;color:#fff}
    .num{text-align:right;font-variant-numeric:tabular-nums}
    .up{color:#b45309;font-weight:600}
    code{font-size:11px}
  </style>
</head>
<body>
  <h1>Öztiryakiler fiyat denemesi — bayi net alış + %8 Equsto kar</h1>
  <div class="meta">
    <p><strong>Kaynak:</strong> ${meta.xlsx}</p>
    <p><strong>Formül:</strong> Excel BAYİ İSKONTO = iskonto oranı (0,73 = %73) → bayi net = liste × (1−iskonto) · Equsto = bayi net × 1,08 · KDV dahil TL = Equsto × 1,20 × kur ${meta.kur}</p>
    <p><strong>Ürün sayısı:</strong> ${meta.toplam} · <strong>Ortalama fark (yeni − mevcut):</strong> ${meta.ortalama_fark_tl} TL</p>
    <p><em>Bu sayfa yalnızca deneme; equsto.com canlı fiyatları henüz güncellenmedi.</em></p>
  </div>
  <table>
    <thead>
      <tr>
        <th>Stok</th><th>Tanım</th><th>Liste</th><th>Bayi isk.</th><th>Bayi net</th>
        <th>Yeni +%8 KDV dahil</th><th>Eski yanlış net EUR</th><th>Canlı katalog TL</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;
}

async function main() {
  const fresh = process.argv.includes("--fresh") || process.argv.includes("--xlsx");
  const kur = loadKur();
  const rows = loadFiyatRows(fresh);

  let bySku = new Map();
  if (fs.existsSync(EKIPMAN)) {
    const cat = JSON.parse(fs.readFileSync(EKIPMAN, "utf8"));
    for (const p of cat) {
      if (p.sku && /öztiryaki|oztiryaki/i.test(String(p.brand || ""))) {
        bySku.set(String(p.sku).replace(/\s+/g, "").toUpperCase(), p.fiyat_tl);
      }
    }
  }

  const trials = [];
  let farkSum = 0;
  let farkN = 0;

  for (const row of rows) {
    const t = rowToTrial(row, kur);
    const skuKey = String(row.urun_kodu || "").replace(/\s+/g, "").toUpperCase();
    if (bySku.has(skuKey)) {
      t.site_katalog_tl = bySku.get(skuKey);
    }
    if (t.equsto_kdv_dahil_tl && t.site_katalog_tl) {
      const d = t.equsto_kdv_dahil_tl - t.site_katalog_tl;
      farkSum += d;
      farkN++;
    }
    trials.push(t);
  }

  // Örnek: farkı büyük + bilinen kodlar
  const pick = new Set([
    "7890.60400.3T",
    "9885.EECHC.00",
    "7865.N1.80908.10",
    "9563.HBB90.80",
    "9580.APPIA.CVG",
  ]);
  const samples = trials
    .filter((t) => pick.has(t.urun_kodu))
    .slice(0, 40);
  if (samples.length < 15) {
    samples.push(...trials.filter((t) => t.equsto_kdv_dahil_tl > 0).slice(0, 20));
  }

  const meta = {
    generated: new Date().toISOString(),
    xlsx: XLSX,
    kur_eur_try: kur,
    equsto_kar_yuzde: EQUSTO_KAR_ORAN * 100,
    kdv_yuzde: OZTI_KDV_ORAN,
    toplam: trials.length,
    ortalama_fark_tl: farkN ? Math.round(farkSum / farkN) : 0,
    formül:
      "bayi_net=liste×(1−iskonto); equsto_net=bayi_net×1.08; fiyat_tl_kdv_dahil=equsto_net×kur×1.20",
    not:
      "Excel BAYİ İSKONTO = indirim oranı (0,73 → %73 iskonto, bayi net listenin %27'si).",
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(
    OUT_JSON,
    JSON.stringify({ meta, samples: samples.slice(0, 50), stats: { farkN, farkSum } }, null, 2),
    "utf8",
  );
  fs.writeFileSync(OUT_HTML, buildHtml(meta, samples.slice(0, 25)), "utf8");

  console.log("\n=== Öztiryakiler Equsto %8 kar DENEME ===\n");
  console.log("Ürün:", trials.length, "| Kur:", kur, "TRY/EUR");
  console.log("Ortalama fark (yeni − katalog):", meta.ortalama_fark_tl, "TL\n");
  console.log("Örnek satırlar:\n");
  for (const s of samples.slice(0, 12)) {
    console.log(
      s.urun_kodu,
      "| liste:",
      s.liste_fiyati,
      s.para_birimi,
      "| kalan:",
      s.kalan_oran,
      "iskonto %",
      s.bayi_iskonto_yuzde,
      "| bayi net EUR:",
      s.bayi_net_alis,
      "| eski yanlış net:",
      s.eski_yanlis_net_eur,
      "(isk%",
      s.eski_yanlis_iskonto_yuzde + ")",
      "| +8% KDV dahil:",
      s.equsto_kdv_dahil_tl ? oztiFmtTry(s.equsto_kdv_dahil_tl) : "—",
      "| katalog:",
      s.site_katalog_tl ? oztiFmtTry(s.site_katalog_tl) : "—",
    );
  }
  console.log("\nDosyalar:");
  console.log(" ", OUT_JSON);
  console.log(" ", OUT_HTML);
  console.log("\nÖnizleme: http://localhost:3099/trial-ozti-fiyat.html (dev server açıksa)\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
