import type { Metadata } from "next";
import Link from "next/link";
import VitrinShell from "@/components/vitrin/VitrinShell";
import { EXPORT_PAGE_CSS } from "@/lib/vitrin/page-css";

export const metadata: Metadata = {
  title: "Export · Equsto",
  description:
    "Equsto ihracat: Türkiye merkezli endüstriyel mutfak ekipmanı; AE, QA, SA, AZ, KZ, UZ, AL, RO ve BG pazarlarına USD hesabı ve uluslararası sevkiyat ile.",
  alternates: {
    canonical: "https://equsto.com/export",
    languages: { tr: "https://equsto.com/export", en: "https://equsto.com/en/export" },
  },
};

export default function ExportPage() {
  return (
    <VitrinShell bodyClass="eq-shop eq-export" extraCss={EXPORT_PAGE_CSS}>
      <main className="ex-main" id="export">
        <h1 data-i18n="export.title">Export — İhracat</h1>
        <p className="ex-lead" data-i18n="export.lead">
          Türkiye merkezli üretim ve tedarik ağımızla Körfez, Orta Asya ve Balkan pazarlarına endüstriyel mutfak
          ekipmanı ihracatı yapıyoruz. Tekliften sevkiyata kadar süreci tek ekip yürütür.
        </p>
        <h2 data-i18n="export.markets_h2">Pazarlarımız</h2>
        <ul className="ex-markets">
          <li data-i18n="export.market_ae">AE — Birleşik Arap Emirlikleri</li>
          <li data-i18n="export.market_qa">QA — Katar</li>
          <li data-i18n="export.market_sa">SA — Suudi Arabistan</li>
          <li data-i18n="export.market_az">AZ — Azerbaycan</li>
          <li data-i18n="export.market_kz">KZ — Kazakistan</li>
          <li data-i18n="export.market_uz">UZ — Özbekistan</li>
          <li data-i18n="export.market_al">AL — Arnavutluk</li>
          <li data-i18n="export.market_ro">RO — Romanya</li>
          <li data-i18n="export.market_bg">BG — Bulgaristan</li>
        </ul>
        <h2 data-i18n="export.process_h2">Nasıl çalışır?</h2>
        <ol className="ex-steps">
          <li data-i18n="export.step_1">
            Teklif — ekipman listenizi ve teslim koşullarını paylaşırsınız; satış mühendisimiz fiyatlanmış teklifi
            hazırlar.
          </li>
          <li data-i18n="export.step_2">
            Sipariş — teklif onayı ve ödeme sonrası üretim ve kalite kontrol süreci başlar.
          </li>
          <li data-i18n="export.step_3">
            Sevkiyat — deniz, karayolu veya havayolu ile adresinize veya limana teslim.
          </li>
          <li data-i18n="export.step_4">
            Evrak — fatura, menşe belgesi ve ihracat evrakları siparişle birlikte iletilir.
          </li>
        </ol>
        <div className="ex-pay">
          <h2 data-i18n="export.pay_h2">Uluslararası ödeme</h2>
          <p data-i18n="export.pay_p">İhracat ödemeleri USD hesabımıza yapılır:</p>
          <table className="ex-pay-table">
            <tbody>
              <tr>
                <th scope="row" data-i18n="export.pay_bank_l">
                  Banka
                </th>
                <td data-i18n-skip>QNB FİNANS BANK</td>
              </tr>
              <tr>
                <th scope="row" data-i18n="export.pay_iban_l">
                  IBAN (USD)
                </th>
                <td data-i18n-skip>TR73 0011 1000 0000 0107 8048 97</td>
              </tr>
              <tr>
                <th scope="row" data-i18n="export.pay_swift_l">
                  SWIFT
                </th>
                <td data-i18n-skip>FNNBTRISXXX</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="ex-actions">
          <Link className="ex-a-primary" href="/iletisim" data-i18n="export.cta_contact">
            Teklif ve ihracat talebi
          </Link>
        </div>
      </main>
    </VitrinShell>
  );
}
