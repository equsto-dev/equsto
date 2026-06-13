import type { TeklifModelV14 } from "./teklif-v14.types";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import { formatTarihTr, formatKwHucre } from "./format-v14";
import { TEKLIF_V14_FORM_NO, TEKLIF_BOLUM_ROW_FILL } from "./constants";
import {
  sanitizeTeklifV14SatirAciklama,
  sanitizeTeklifV14SatirTanim,
} from "./sanitize-teklif-v14-export";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absImageUrl(url: string, origin: string): string {
  const u = url.trim();
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = origin.replace(/\/$/, "");
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export type BuildTeklifPrintHtmlOpts = {
  /** Site kökü — görseller için (ör. https://equsto.com) */
  siteOrigin: string;
  /** Tarayıcı yazdır penceresi için otomatik print() */
  autoPrint?: boolean;
};

/** PFOS v14 teklif — yazdırma / PDF HTML */
export function buildTeklifV14PrintHtml(
  model: TeklifModelV14,
  opts: BuildTeklifPrintHtmlOpts,
): string {
  const { siteOrigin, autoPrint = false } = opts;
  const { ust, ozet, meta } = model;
  const tarih = formatTarihTr(ust.tarih);
  const blocks = groupTeklifV14Satirlar(model.satirlar);
  const kur =
    ust.eurTry != null
      ? ust.eurTry.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
      : "—";
  const logoUrl = absImageUrl("/images/equsto-logo.png", siteOrigin);

  let tbody = "";
  for (const block of blocks) {
    tbody += `<tr class="sec"><td colspan="12">${esc(block.bolumBaslik)}</td></tr>`;
    for (const row of block.satirlar) {
      const birim =
        row.birimSatis != null
          ? row.birimSatis.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
          : "—";
      const toplam =
        row.toplamSatis != null
          ? row.toplamSatis.toLocaleString("tr-TR", { minimumFractionDigits: 2 })
          : "—";
      tbody += `<tr>
        <td>${esc(row.bolumNo)}</td>
        <td>${esc(row.poz)}</td>
        <td>${esc(row.ek || "")}</td>
        <td>${esc(row.stokNo)}</td>
        <td>${esc(sanitizeTeklifV14SatirTanim(row.tanim))}</td>
        <td>${esc(row.marka)}</td>
        <td>${esc(row.olcu || "—")}</td>
        <td class="num">${esc(formatKwHucre(row.elkKw))}</td>
        <td class="num">${esc(formatKwHucre(row.gazKw))}</td>
        <td class="num">${row.adet}</td>
        <td class="num">${birim}</td>
        <td class="num">${toplam}</td>
      </tr>`;

      const imgUrl = row.fotoUrl ? absImageUrl(row.fotoUrl, siteOrigin) : "";
      const fotoCell = imgUrl
        ? `<img src="${esc(imgUrl)}" alt="" class="foto">`
        : `<span class="foto-ph">—</span>`;
      const acik = sanitizeTeklifV14SatirAciklama(row.aciklama);
      const acikHtml = acik ? esc(acik) : "";
      if (imgUrl || acikHtml) {
        tbody += `<tr class="spec">
          <td colspan="3"></td>
          <td class="foto-cell">${fotoCell}</td>
          <td colspan="8" class="spec-cell"><pre>${acikHtml}</pre></td>
        </tr>`;
      }
    }
  }

  const genel =
    ozet.genelToplam != null
      ? `${ozet.genelToplam.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${ozet.doviz}`
      : "—";

  const sartlar = model.sartlar
    .map((s) => `<div class="sart">${esc(s)}</div>`)
    .join("");

  const printScript = autoPrint
    ? `<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},400);};</script>`
    : "";

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<title>Teklif ${esc(ust.sayi)}</title>
<style>
  @page { margin: 12mm; size: A4 landscape; }
  body { margin: 0; font-family: Arial, system-ui, sans-serif; font-size: 10px; color: #111; }
  .head { display: flex; justify-content: space-between; gap: 16px; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 12px; }
  .head h1 { margin: 0 0 8px; font-size: 13px; letter-spacing: 0.06em; }
  .meta { font-size: 10px; line-height: 1.5; }
  .meta-r { text-align: right; min-width: 180px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: center; font-size: 9px; padding: 5px 3px; border-bottom: 1px solid #999; }
  td { padding: 4px 3px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.num { text-align: right; white-space: nowrap; }
  tr.sec td { font-weight: 700; background: ${TEKLIF_BOLUM_ROW_FILL}; color: #1e4620; padding: 7px 4px; border-bottom: 1px solid #b7dfc5; }
  tr.spec td { background: #fafafa; }
  .foto-cell { text-align: left; vertical-align: middle; }
  .foto { max-width: 120px; max-height: 100px; object-fit: contain; display: block; }
  .foto-ph { color: #999; }
  .spec-cell pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 9px; line-height: 1.45; }
  tr.total td { font-weight: 700; }
  .foot { margin-top: 14px; font-size: 9px; color: #555; display: flex; justify-content: space-between; }
  .sartlar { margin-top: 16px; font-size: 9px; line-height: 1.5; page-break-inside: avoid; }
  .logo { height: 28px; margin-bottom: 6px; }
</style>
</head>
<body>
  <div class="head">
    <div>
      <img class="logo" src="${esc(logoUrl)}" alt="EQUSTO">
      <h1>PROFORMA FATURA</h1>
      <div class="meta"><strong>Proje:</strong> ${esc(ust.projeAdi)}</div>
      <div class="meta"><strong>Müşteri:</strong> ${esc(ust.musteri || "—")}</div>
      <div class="meta" style="color:#666;margin-top:4px">${esc(meta.konseptLabel)} · ${meta.m2Toplam} m² · ${esc(meta.teslimatAdresi)}</div>
    </div>
    <div class="meta meta-r">
      <div><strong>Sayı:</strong> ${esc(ust.sayi)}</div>
      <div><strong>Tarih:</strong> ${esc(tarih)}</div>
      <div><strong>EUR/TRY:</strong> ${kur}</div>
      <div style="margin-top:4px;color:#666">TCMB Efektif Satış Kuru – ${esc(tarih)}</div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th>Böl.</th><th>Poz</th><th>EK</th><th>Stok no</th><th>Tanımı</th><th>Marka</th>
      <th>Ölçü</th><th>Elk. kW</th><th>Gaz kW</th><th>Adet</th><th>Satış</th><th>Toplam</th>
    </tr></thead>
    <tbody>${tbody}
      <tr class="total">
        <td colspan="4"></td>
        <td colspan="2" style="text-align:right">Sütun toplamları →</td>
        <td class="num">${esc(formatKwHucre(ozet.toplamElektrikKw))}</td>
        <td class="num">${esc(formatKwHucre(ozet.toplamGazKw))}</td>
        <td></td>
        <td colspan="2">GENEL TOPLAM</td>
        <td class="num">${esc(genel)}</td>
      </tr>
    </tbody>
  </table>
  <div class="sartlar">${sartlar}</div>
  <div class="foot">
    <span>Form No: ${esc(TEKLIF_V14_FORM_NO)}</span>
    <span>EQUSTO</span>
  </div>
  ${printScript}
</body>
</html>`;
}
