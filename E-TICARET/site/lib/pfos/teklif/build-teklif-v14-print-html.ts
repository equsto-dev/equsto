import type { TeklifModelV14 } from "./teklif-v14.types";
import { groupTeklifV14Satirlar } from "./group-v14-bolumler";
import { formatTarihTr, formatKwHucre, formatEurHucre, formatTeklifDovizHucre } from "./format-v14";
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
    tbody += `<tr class="sec"><td colspan="11">${esc(block.bolumBaslik)}</td></tr>`;
    for (const row of block.satirlar) {
      const birim = formatEurHucre(row.birimSatis, 2);
      const toplam = formatEurHucre(row.toplamSatis, 2);
      tbody += `<tr>
        <td class="bol">${esc(row.bolumNo)}</td>
        <td class="poz">${esc(row.poz)}</td>
        <td class="stok">${esc(row.stokNo)}</td>
        <td class="tanim">${esc(sanitizeTeklifV14SatirTanim(row.tanim))}</td>
        <td class="olcu">${esc(row.olcu || "—")}</td>
        <td class="marka">${esc(row.marka)}</td>
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
          <td class="foto-cell" colspan="2">${fotoCell}</td>
          <td class="spec-gap"></td>
          <td class="spec-acik" colspan="8"><pre>${acikHtml}</pre></td>
        </tr>`;
      }
    }
  }

  const genel = formatTeklifDovizHucre(ozet.genelToplam, ozet.doviz, 2);

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
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  col.c-bol { width: 3%; }
  col.c-poz { width: 4%; }
  col.c-stok { width: 9%; }
  col.c-tanim { width: 34%; }
  col.c-olcu { width: 10%; }
  col.c-marka { width: 9%; }
  col.c-kw { width: 5%; }
  col.c-adet { width: 4%; }
  col.c-fiyat { width: 7%; }
  col.c-toplam { width: 8%; }
  th { text-align: center; font-size: 9px; padding: 5px 3px; border-bottom: 1px solid #999; }
  td { padding: 4px 3px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.bol, td.poz { text-align: center; white-space: nowrap; }
  td.stok { text-align: left; overflow: hidden; overflow-wrap: anywhere; word-break: break-all; max-width: 0; }
  td.tanim { word-break: break-word; overflow: hidden; max-width: 0; }
  td.marka, td.olcu { text-align: center; font-size: 9px; padding: 4px 2px; }
  td.num { text-align: center; white-space: nowrap; }
  tr.sec td { font-weight: 700; background: ${TEKLIF_BOLUM_ROW_FILL}; color: #1e4620; padding: 7px 4px; border-bottom: 1px solid #b7dfc5; }
  tr.spec td { background: #fafafa; }
  tr.spec td.foto-cell { padding: 4px 0 4px 0; text-align: left; vertical-align: top; }
  tr.spec td.spec-gap { padding: 0; background: #fafafa; }
  .foto { max-width: 150px; max-height: 125px; object-fit: contain; display: block; margin: 0; }
  .foto-ph { color: #999; }
  td.spec-acik pre { margin: 0; white-space: pre-wrap; font-family: inherit; font-size: 9px; line-height: 1.45; word-break: break-word; }
  td.spec-acik { word-break: break-word; vertical-align: top; padding: 4px 3px 4px 4px; }
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
    <colgroup>
      <col class="c-bol"><col class="c-poz"><col class="c-stok"><col class="c-tanim">
      <col class="c-olcu"><col class="c-marka">
      <col class="c-kw"><col class="c-kw"><col class="c-adet"><col class="c-fiyat"><col class="c-toplam">
    </colgroup>
    <thead><tr>
      <th>Böl.</th><th>Poz</th><th>Stok no</th><th>Tanımı</th><th>Ölçü</th><th>Marka</th>
      <th>Elk. kW</th><th>Gaz kW</th><th>Adet</th><th>Satış</th><th>Toplam</th>
    </tr></thead>
    <tbody>${tbody}
      <tr class="total">
        <td colspan="2"></td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
        <td class="num">${esc(formatKwHucre(ozet.toplamElektrikKw))}</td>
        <td class="num">${esc(formatKwHucre(ozet.toplamGazKw))}</td>
        <td></td>
        <td style="font-weight:700;text-align:center">GENEL TOPLAM</td>
        <td class="num" style="font-weight:700">${esc(genel)}</td>
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
